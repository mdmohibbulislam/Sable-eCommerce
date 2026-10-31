from django.conf import settings
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import CheckoutItemSerializer, CheckoutSerializer, OrderSerializer
from .services import UnknownProduct, cancel_order, quote_cart


class QuoteView(APIView):
    """Price a guest or member cart without creating an order."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CheckoutItemSerializer(
            data=request.data.get("items", []), many=True
        )
        serializer.is_valid(raise_exception=True)
        try:
            payload = quote_cart(serializer.validated_data)
        except UnknownProduct as exc:
            return Response(
                {"items": [str(exc)]}, status=status.HTTP_400_BAD_REQUEST
            )

        for line in payload["items"]:
            if line["image_url"]:
                line["image_url"] = request.build_absolute_uri(
                    f"{settings.MEDIA_URL}{line['image_url'].lstrip('/')}"
                )
        return Response(payload)


class MyOrdersViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Checkout plus the signed-in customer's order history."""

    permission_classes = [IsAuthenticated]
    lookup_field = "number"

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .select_related("user")
            .prefetch_related("items")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return CheckoutSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        output = OrderSerializer(order, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def cancel(self, request, number=None):
        order = self.get_object()
        if not cancel_order(order):
            return Response(
                {"detail": "This order can no longer be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            OrderSerializer(order, context=self.get_serializer_context()).data
        )
