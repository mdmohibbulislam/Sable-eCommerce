"""Checkout logic: price, stock and totals are all decided server-side."""

from __future__ import annotations

import uuid
from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.db import transaction

from apps.catalog.models import Product

from .models import Order, OrderItem


class CheckoutError(Exception):
    """Raised when a cart cannot be turned into an order."""


class UnknownProduct(CheckoutError):
    def __init__(self, product_id):
        self.product_id = product_id
        super().__init__(f"Product {product_id} is no longer available.")


class OutOfStock(CheckoutError):
    def __init__(self, name: str, available: int):
        self.name = name
        self.available = available
        if available:
            message = f"Only {available} of {name} left in stock."
        else:
            message = f"{name} is out of stock."
        super().__init__(message)


def money(value) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def quote_totals(subtotal: Decimal) -> dict:
    """Shipping and tax rules live here so the API and the UI agree."""
    threshold = Decimal(str(settings.FREE_SHIPPING_THRESHOLD))
    if subtotal >= threshold:
        shipping = Decimal("0.00")
    else:
        shipping = money(settings.SHIPPING_FLAT_RATE)
    tax = money(subtotal * Decimal(str(settings.TAX_RATE)))
    return {
        "subtotal": money(subtotal),
        "shipping_cost": shipping,
        "tax": tax,
        "total": money(subtotal + shipping + tax),
        "free_shipping_threshold": float(threshold),
        "amount_to_free_shipping": float(max(Decimal("0"), threshold - subtotal)),
    }


@transaction.atomic
def create_order(
    *,
    user,
    items: list[dict],
    shipping: dict,
    payment_method: str = Order.PaymentMethod.CARD,
    notes: str = "",
) -> Order:
    """Validate a cart, reserve stock and persist the order in one transaction."""
    merged: dict[int, int] = {}
    for item in items:
        product_id = int(item["product_id"])
        merged[product_id] = merged.get(product_id, 0) + int(item["quantity"])

    if not merged:
        raise CheckoutError("Your cart is empty.")

    locked = Product.objects.select_for_update().filter(
        id__in=merged.keys(), is_active=True
    )
    products = {product.id: product for product in locked}

    missing = set(merged) - set(products)
    if missing:
        raise UnknownProduct(sorted(missing)[0])

    subtotal = Decimal("0.00")
    lines: list[tuple[Product, int]] = []
    for product_id, quantity in merged.items():
        product = products[product_id]
        if product.stock < quantity:
            raise OutOfStock(product.name, product.stock)
        subtotal += product.price * quantity
        lines.append((product, quantity))

    totals = quote_totals(money(subtotal))

    order = Order.objects.create(
        user=user,
        email=user.email,
        subtotal=totals["subtotal"],
        shipping_cost=totals["shipping_cost"],
        tax=totals["tax"],
        total=totals["total"],
        payment_method=payment_method,
        notes=notes or "",
        status=Order.Status.PENDING,
        **shipping,
    )

    for product, quantity in lines:
        OrderItem.objects.create(
            order=order,
            product=product,
            product_name=product.name,
            product_slug=product.slug,
            image_url=product.image.name if product.image else "",
            unit_price=product.price,
            quantity=quantity,
            line_total=money(product.price * quantity),
        )
        product.stock -= quantity
        product.save(update_fields=["stock", "updated_at"])

    if payment_method == Order.PaymentMethod.CARD:
        # Demo gateway: cards always succeed. Swap in a real provider here.
        order.status = Order.Status.PAID
        order.payment_reference = f"mock_{uuid.uuid4().hex[:18]}"
        order.save(update_fields=["status", "payment_reference", "updated_at"])

    return order


CANCELLABLE_STATUSES = {
    Order.Status.PENDING,
    Order.Status.PAID,
    Order.Status.PROCESSING,
}


def quote_cart(items: list[dict]) -> dict:
    """Price a cart without creating an order, so the UI shows server totals."""
    merged: dict[int, int] = {}
    for item in items:
        product_id = int(item["product_id"])
        merged[product_id] = merged.get(product_id, 0) + int(item["quantity"])

    if not merged:
        return {**quote_totals(Decimal("0.00")), "items": [], "item_count": 0}

    products = {
        product.id: product
        for product in Product.objects.filter(id__in=merged.keys(), is_active=True)
    }
    missing = set(merged) - set(products)
    if missing:
        raise UnknownProduct(sorted(missing)[0])

    lines = []
    subtotal = Decimal("0.00")
    for product_id, quantity in merged.items():
        product = products[product_id]
        line_total = money(product.price * quantity)
        subtotal += line_total
        lines.append(
            {
                "product_id": product.id,
                "name": product.name,
                "slug": product.slug,
                "unit_price": float(product.price),
                "quantity": quantity,
                "line_total": float(line_total),
                "available": product.stock,
                "in_stock": product.stock >= quantity,
                "image_url": product.image.name if product.image else "",
            }
        )

    totals = quote_totals(money(subtotal))
    return {**totals, "items": lines, "item_count": sum(merged.values())}


@transaction.atomic
def cancel_order(order: Order) -> bool:
    """Cancel an order and return its stock. Returns False when not allowed."""
    locked = Order.objects.select_for_update().get(pk=order.pk)
    if locked.status not in CANCELLABLE_STATUSES:
        return False

    for item in locked.items.select_related("product"):
        if item.product_id is None:
            continue
        product = Product.objects.select_for_update().get(pk=item.product_id)
        product.stock += item.quantity
        product.save(update_fields=["stock", "updated_at"])

    locked.status = Order.Status.CANCELLED
    locked.save(update_fields=["status", "updated_at"])
    order.refresh_from_db()
    return True
