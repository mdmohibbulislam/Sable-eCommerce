from django.contrib import admin
from django.utils.html import format_html

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = [
        "product",
        "product_name",
        "unit_price",
        "quantity",
        "line_total",
    ]
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "number",
        "user",
        "status",
        "total",
        "item_count",
        "payment_method",
        "created_at",
    ]
    list_filter = ["status", "payment_method", "created_at"]
    search_fields = ["number", "email", "shipping_name"]
    date_hierarchy = "created_at"
    readonly_fields = [
        "number",
        "subtotal",
        "shipping_cost",
        "tax",
        "total",
        "payment_reference",
        "created_at",
        "updated_at",
    ]
    inlines = [OrderItemInline]
    fieldsets = (
        ("Order", {"fields": ("number", "user", "email", "status", "created_at", "updated_at")}),
        ("Totals", {"fields": ("subtotal", "shipping_cost", "tax", "total")}),
        (
            "Shipping",
            {
                "fields": (
                    "shipping_name",
                    "shipping_phone",
                    "shipping_line1",
                    "shipping_line2",
                    "shipping_city",
                    "shipping_state",
                    "shipping_postal_code",
                    "shipping_country",
                )
            },
        ),
        ("Payment and notes", {"fields": ("payment_method", "payment_reference", "notes")}),
    )

    @admin.display(description="Items")
    def item_count(self, obj):
        return obj.items.count()

    def has_add_permission(self, request):
        return False
