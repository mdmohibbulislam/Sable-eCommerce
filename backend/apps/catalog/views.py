from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .filters import ProductFilter
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        return Category.objects.annotate(
            product_count=Count("products", filter=Q(products__is_active=True))
        )


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_class = ProductFilter
    search_fields = ["name", "summary", "description", "sku", "category__name"]
    ordering_fields = ["price", "name", "created_at", "stock", "rating"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("gallery")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductSerializer

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=["get"], pagination_class=None)
    def featured(self, request):
        """A short curated list for the home page hero row."""
        limit = min(int(request.query_params.get("limit", 8)), 12)
        products = (
            self.get_queryset()
            .filter(is_featured=True)
            .order_by("-rating", "-created_at")[:limit]
        )
        serializer = ProductListSerializer(
            products, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="related")
    def related(self, request, slug=None):
        product = self.get_object()
        products = (
            self.get_queryset()
            .filter(category=product.category)
            .exclude(pk=product.pk)
            .order_by("-rating")[:4]
        )
        serializer = ProductListSerializer(
            products, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data)
