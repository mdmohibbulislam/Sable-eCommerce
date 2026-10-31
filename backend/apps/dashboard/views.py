from datetime import timedelta

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product
from apps.catalog.serializers import AdminProductSerializer
from apps.orders.models import Order, OrderItem
from apps.orders.serializers import AdminOrderSerializer
from apps.orders.services import cancel_order

REVENUE_STATUSES = [
    Order.Status.PAID,
    Order.Status.PROCESSING,
    Order.Status.SHIPPED,
    Order.Status.DELIVERED,
]


class AdminProductViewSet(viewsets.ModelViewSet):
    """Full product CRUD for staff, including image upload."""

    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    lookup_field = "slug"
    search_fields = ["name", "sku", "summary"]
    ordering_fields = ["price", "stock", "created_at", "name"]
    ordering = ["-created_at"]
    filterset_fields = ["category__slug", "is_active", "is_featured"]

    def get_queryset(self):
        return Product.objects.select_related("category").prefetch_related("gallery")


class AdminOrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Order oversight: list, inspect and advance status."""

    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "number"
    search_fields = ["number", "email", "shipping_name"]
    ordering_fields = ["created_at", "total"]
    ordering = ["-created_at"]
    filterset_fields = ["status"]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return Order.objects.select_related("user").prefetch_related("items")

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        new_status = request.data.get("status")
        valid = dict(Order.Status.choices)
        if new_status not in valid:
            return Response(
                {"status": [f"Choose one of: {', '.join(valid)}"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status == Order.Status.CANCELLED and new_status != Order.Status.CANCELLED:
            return Response(
                {"detail": "Cancelled orders cannot be reopened."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == Order.Status.CANCELLED and order.status != Order.Status.CANCELLED:
            if not cancel_order(order):
                return Response(
                    {"detail": "This order can no longer be cancelled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            order.status = new_status
            order.save(update_fields=["status", "updated_at"])

        return Response(self.get_serializer(order).data)


class AdminStatsView(APIView):
    """Store-wide numbers for the dashboard overview."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        revenue_all = (
            Order.objects.filter(status__in=REVENUE_STATUSES).aggregate(v=Sum("total"))["v"]
            or 0
        )
        revenue_30d = (
            Order.objects.filter(
                status__in=REVENUE_STATUSES, created_at__gte=thirty_days_ago
            ).aggregate(v=Sum("total"))["v"]
            or 0
        )
        paid_orders = Order.objects.filter(status__in=REVENUE_STATUSES).count()
        average_order_value = round(float(revenue_all) / paid_orders, 2) if paid_orders else 0

        status_breakdown = [
            {
                "status": row["status"],
                "label": dict(Order.Status.choices)[row["status"]],
                "count": row["count"],
            }
            for row in Order.objects.values("status")
            .annotate(count=Count("id"))
            .order_by("-count")
        ]

        series_start = (now - timedelta(days=13)).date()
        daily = {
            row["day"]: row
            for row in Order.objects.filter(
                created_at__date__gte=series_start, status__in=REVENUE_STATUSES
            )
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Sum("total"), orders=Count("id"))
        }
        sales_series = []
        for offset in range(14):
            day = series_start + timedelta(days=offset)
            row = daily.get(day)
            sales_series.append(
                {
                    "date": day.isoformat(),
                    "revenue": round(float(row["total"]), 2) if row else 0.0,
                    "orders": row["orders"] if row else 0,
                }
            )

        top_products = [
            {
                "name": row["product_name"],
                "slug": row["product_slug"],
                "units": row["units"] or 0,
                "revenue": round(float(row["revenue"] or 0), 2),
            }
            for row in OrderItem.objects.filter(order__status__in=REVENUE_STATUSES)
            .values("product_name", "product_slug")
            .annotate(units=Sum("quantity"), revenue=Sum("line_total"))
            .order_by("-revenue")[:5]
        ]

        low_stock = [
            {"id": p.id, "name": p.name, "slug": p.slug, "stock": p.stock}
            for p in Product.objects.filter(is_active=True, stock__lt=5).order_by("stock")[:6]
        ]

        recent_orders = AdminOrderSerializer(
            Order.objects.select_related("user").prefetch_related("items")[:6],
            many=True,
            context={"request": request},
        ).data

        return Response(
            {
                "revenue_total": round(float(revenue_all), 2),
                "revenue_30d": round(float(revenue_30d), 2),
                "average_order_value": average_order_value,
                "orders_total": Order.objects.count(),
                "orders_open": Order.objects.filter(
                    status__in=[Order.Status.PENDING, Order.Status.PROCESSING, Order.Status.PAID]
                ).count(),
                "customers_total": Order.objects.values("user").distinct().count(),
                "products_total": Product.objects.count(),
                "products_active": Product.objects.filter(is_active=True).count(),
                "low_stock_count": Product.objects.filter(
                    is_active=True, stock__lt=5
                ).count(),
                "status_breakdown": status_breakdown,
                "sales_series": sales_series,
                "top_products": top_products,
                "low_stock": low_stock,
                "recent_orders": recent_orders,
            }
        )
