"""Orders hold a snapshot of what was bought, so history survives catalog edits."""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending payment"
        PAID = "paid", "Paid"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentMethod(models.TextChoices):
        CARD = "card", "Card"
        CASH_ON_DELIVERY = "cod", "Cash on delivery"

    number = models.CharField(max_length=24, unique=True, editable=False, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="orders", on_delete=models.CASCADE
    )
    email = models.EmailField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    shipping_name = models.CharField(max_length=120)
    shipping_phone = models.CharField(max_length=32, blank=True)
    shipping_line1 = models.CharField(max_length=200)
    shipping_line2 = models.CharField(max_length=200, blank=True)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100, blank=True)
    shipping_postal_code = models.CharField(max_length=24)
    shipping_country = models.CharField(max_length=80, default="United States")

    payment_method = models.CharField(
        max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CARD
    )
    payment_reference = models.CharField(max_length=64, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = self.generate_number()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_number() -> str:
        stamp = timezone.now().strftime("%y%m%d")
        return f"SB-{stamp}-{uuid.uuid4().hex[:5].upper()}"

    @property
    def item_count(self) -> int:
        return sum(item.quantity for item in self.items.all())

    @property
    def shipping_address(self) -> dict:
        return {
            "full_name": self.shipping_name,
            "phone": self.shipping_phone,
            "line1": self.shipping_line1,
            "line2": self.shipping_line2,
            "city": self.shipping_city,
            "state": self.shipping_state,
            "postal_code": self.shipping_postal_code,
            "country": self.shipping_country,
        }

    def __str__(self) -> str:
        return self.number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(
        "catalog.Product",
        related_name="order_items",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    product_name = models.CharField(max_length=160)
    product_slug = models.CharField(max_length=180, blank=True)
    image_url = models.CharField(max_length=300, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.quantity} x {self.product_name}"
