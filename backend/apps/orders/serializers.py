from django.conf import settings
from rest_framework import serializers

from .models import Order, OrderItem
from .services import CheckoutError, OutOfStock, UnknownProduct, create_order

SHIPPING_FIELD_MAP = {
    "full_name": "shipping_name",
    "phone": "shipping_phone",
    "line1": "shipping_line1",
    "line2": "shipping_line2",
    "city": "shipping_city",
    "state": "shipping_state",
    "postal_code": "shipping_postal_code",
    "country": "shipping_country",
}


class OrderItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    unit_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True
    )
    line_total = serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_slug",
            "image_url",
            "unit_price",
            "quantity",
            "line_total",
        ]
        read_only_fields = fields

    def get_image_url(self, obj) -> str:
        if not obj.image_url:
            return ""
        path = f"{settings.MEDIA_URL}{obj.image_url.lstrip('/')}"
        request = self.context.get("request")
        return request.build_absolute_uri(path) if request else path


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    shipping_address = serializers.DictField(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True
    )
    shipping_cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True
    )
    tax = serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True
    )
    total = serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "number",
            "status",
            "status_label",
            "email",
            "items",
            "item_count",
            "subtotal",
            "shipping_cost",
            "tax",
            "total",
            "shipping_address",
            "payment_method",
            "payment_reference",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class ShippingSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True, default="")
    line1 = serializers.CharField(max_length=200)
    line2 = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    postal_code = serializers.CharField(max_length=24)
    country = serializers.CharField(max_length=80, default="United States")


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=50)


class CheckoutSerializer(serializers.Serializer):
    """Validates the whole checkout payload and delegates to the order service."""

    items = CheckoutItemSerializer(many=True, allow_empty=False)
    shipping = ShippingSerializer()
    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices, default=Order.PaymentMethod.CARD
    )
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500, default="")

    def create(self, validated_data):
        request = self.context["request"]
        shipping = {
            model_field: validated_data["shipping"].get(api_field, "")
            for api_field, model_field in SHIPPING_FIELD_MAP.items()
        }
        try:
            return create_order(
                user=request.user,
                items=validated_data["items"],
                shipping=shipping,
                payment_method=validated_data["payment_method"],
                notes=validated_data.get("notes", ""),
            )
        except UnknownProduct as exc:
            raise serializers.ValidationError({"items": [str(exc)]}) from exc
        except OutOfStock as exc:
            raise serializers.ValidationError(
                {
                    "items": [
                        {
                            "product": exc.name,
                            "detail": str(exc),
                            "available": exc.available,
                        }
                    ]
                }
            ) from exc
        except CheckoutError as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc


class AdminOrderSerializer(OrderSerializer):
    customer_name = serializers.CharField(source="user.display_name", read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = [*OrderSerializer.Meta.fields, "customer_name"]
        read_only_fields = fields
