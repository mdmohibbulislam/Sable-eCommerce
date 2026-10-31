from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "product_total", "sort_order", "accent"]
    list_editable = ["sort_order"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]

    @admin.display(description="Products")
    def product_total(self, obj):
        return obj.products.count()


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "category",
        "price",
        "stock",
        "is_active",
        "is_featured",
        "thumbnail",
    ]
    list_filter = ["category", "is_active", "is_featured"]
    list_editable = ["price", "stock", "is_active", "is_featured"]
    search_fields = ["name", "sku", "summary"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline]
    readonly_fields = ["created_at", "updated_at", "preview"]
    fieldsets = (
        (None, {"fields": ("name", "slug", "category", "sku", "summary")}),
        ("Content", {"fields": ("description", "highlights", "image", "preview")}),
        ("Pricing", {"fields": ("price", "compare_at_price")}),
        ("Inventory", {"fields": ("stock", "is_active", "is_featured")}),
        ("Merchandising", {"fields": ("rating", "review_count")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    @admin.display(description="Image")
    def thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:40px;border-radius:6px" />', obj.image.url
            )
        return "—"

    @admin.display(description="Preview")
    def preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height:220px;border-radius:12px" />',
                obj.image.url,
            )
        return "No image yet."
