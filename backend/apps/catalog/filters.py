import django_filters
from django.db.models import F, Q

from .models import Product


class ProductFilter(django_filters.FilterSet):
    """Storefront facets: slug, price band, availability and sale status."""

    category = django_filters.CharFilter(
        field_name="category__slug", lookup_expr="iexact"
    )
    categories = django_filters.BaseInFilter(
        field_name="category__slug", lookup_expr="in"
    )
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")
    on_sale = django_filters.BooleanFilter(method="filter_on_sale")
    featured = django_filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Product
        fields = ["category", "categories", "min_price", "max_price", "in_stock", "on_sale", "featured"]

    def filter_in_stock(self, queryset, name, value):
        if value is None:
            return queryset
        return queryset.filter(stock__gt=0) if value else queryset.filter(stock=0)

    def filter_on_sale(self, queryset, name, value):
        if value is None:
            return queryset
        on_sale = Q(compare_at_price__isnull=False, compare_at_price__gt=F("price"))
        return queryset.filter(on_sale) if value else queryset.exclude(on_sale)
