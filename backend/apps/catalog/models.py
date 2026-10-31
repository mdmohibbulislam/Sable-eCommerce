"""Catalog models: categories, products and gallery images."""

from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    tagline = models.CharField(max_length=160, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(
        max_length=40,
        blank=True,
        help_text="Glyph key used by the storefront, e.g. headphones, watch, laptop.",
    )
    accent = models.CharField(
        max_length=7, default="#c2410c", help_text="Hex colour used for category art."
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    category = models.ForeignKey(
        Category, related_name="products", on_delete=models.PROTECT
    )
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    sku = models.CharField(max_length=40, unique=True, blank=True)
    summary = models.CharField(
        max_length=240, blank=True, help_text="One-line pitch shown on cards."
    )
    description = models.TextField(blank=True)
    highlights = models.JSONField(
        default=list, blank=True, help_text="Short bullet points."
    )
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    compare_at_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    # Demo-only merchandising fields, populated by the seed command.
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal("4.60"))
    review_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["category", "is_active"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            suffix = 2
            while (
                Product.objects.filter(slug=slug).exclude(pk=self.pk).exists()
            ):
                slug = f"{base}-{suffix}"
                suffix += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def in_stock(self) -> bool:
        return self.stock > 0

    @property
    def is_on_sale(self) -> bool:
        return (
            self.compare_at_price is not None
            and self.compare_at_price > self.price
        )

    @property
    def discount_percent(self) -> int:
        if not self.is_on_sale or not self.compare_at_price:
            return 0
        return int(round((1 - (self.price / self.compare_at_price)) * 100))

    @property
    def stock_status(self) -> str:
        if self.stock <= 0:
            return "out_of_stock"
        if self.stock <= 5:
            return "low_stock"
        return "in_stock"

    def __str__(self) -> str:
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, related_name="gallery", on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to="products/gallery/")
    alt = models.CharField(max_length=160, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return f"{self.product.name} image {self.pk}"
