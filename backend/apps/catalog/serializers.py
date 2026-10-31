from rest_framework import serializers

from .models import Category, Product, ProductImage


def absolute_media_url(request, field) -> str:
    """Return a fully qualified media URL so the SPA can render it directly."""
    if not field:
        return ""
    try:
        url = field.url
    except ValueError:
        return ""
    return request.build_absolute_uri(url) if request else url


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "description",
            "icon",
            "accent",
            "product_count",
        ]


class CategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon", "accent"]


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt", "sort_order"]

    def get_url(self, obj) -> str:
        return absolute_media_url(self.context.get("request"), obj.image)


class ProductSerializer(serializers.ModelSerializer):
    category = CategoryBriefSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    gallery = ProductImageSerializer(many=True, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    stock_status = serializers.CharField(read_only=True)
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False
    )
    compare_at_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, allow_null=True
    )
    rating = serializers.DecimalField(
        max_digits=3, decimal_places=2, coerce_to_string=False, read_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "summary",
            "description",
            "highlights",
            "price",
            "compare_at_price",
            "discount_percent",
            "is_on_sale",
            "in_stock",
            "stock",
            "stock_status",
            "is_featured",
            "image_url",
            "gallery",
            "rating",
            "review_count",
            "category",
            "created_at",
        ]

    def get_image_url(self, obj) -> str:
        return absolute_media_url(self.context.get("request"), obj.image)


class ProductListSerializer(ProductSerializer):
    """Lighter payload for grid pages."""

    class Meta(ProductSerializer.Meta):
        fields = [
            "id",
            "name",
            "slug",
            "summary",
            "price",
            "compare_at_price",
            "discount_percent",
            "is_on_sale",
            "in_stock",
            "stock",
            "stock_status",
            "is_featured",
            "image_url",
            "rating",
            "review_count",
            "category",
        ]


class AdminProductSerializer(serializers.ModelSerializer):
    """Create/update payload for the staff dashboard."""

    image = serializers.ImageField(write_only=True, required=False, allow_null=True)
    image_url = serializers.SerializerMethodField(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
        write_only=True,
    )
    category = CategoryBriefSerializer(read_only=True)
    highlights = serializers.ListField(
        child=serializers.CharField(max_length=200), required=False
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "summary",
            "description",
            "highlights",
            "price",
            "compare_at_price",
            "stock",
            "is_active",
            "is_featured",
            "image",
            "image_url",
            "category",
            "category_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]
        extra_kwargs = {"sku": {"required": False, "allow_blank": True}}

    def get_image_url(self, obj) -> str:
        return absolute_media_url(self.context.get("request"), obj.image)
