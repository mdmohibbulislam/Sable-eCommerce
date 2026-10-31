"""Unit tests for the checkout and cancellation services."""

from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User
from apps.catalog.models import Category, Product
from apps.orders.models import Order
from apps.orders.services import (
    OutOfStock,
    cancel_order,
    create_order,
    quote_totals,
)

SHIPPING = {
    "shipping_name": "Test Buyer",
    "shipping_phone": "",
    "shipping_line1": "1 Test Way",
    "shipping_line2": "",
    "shipping_city": "Portland",
    "shipping_state": "OR",
    "shipping_postal_code": "97209",
    "shipping_country": "United States",
}


class QuoteTotalsTests(TestCase):
    def test_small_order_pays_shipping(self):
        totals = quote_totals(Decimal("20.00"))
        self.assertEqual(totals["shipping_cost"], Decimal("6.99"))
        self.assertEqual(totals["tax"], Decimal("1.60"))
        self.assertEqual(totals["total"], Decimal("28.59"))

    def test_free_shipping_threshold(self):
        totals = quote_totals(Decimal("75.00"))
        self.assertEqual(totals["shipping_cost"], Decimal("0.00"))
        self.assertEqual(totals["amount_to_free_shipping"], 0.0)

    def test_amount_to_free_shipping_is_reported(self):
        totals = quote_totals(Decimal("50.00"))
        self.assertEqual(totals["amount_to_free_shipping"], 25.0)


class CheckoutServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="buyer@example.com", password="TestPass123!"
        )
        self.category = Category.objects.create(name="Audio", slug="audio")
        self.product = Product.objects.create(
            category=self.category,
            name="Test Headphones",
            slug="test-headphones",
            price=Decimal("100.00"),
            stock=5,
        )

    def _order(self, quantity=2, payment_method=Order.PaymentMethod.CARD):
        return create_order(
            user=self.user,
            items=[{"product_id": self.product.id, "quantity": quantity}],
            shipping=SHIPPING,
            payment_method=payment_method,
        )

    def test_order_decrements_stock_and_sets_totals(self):
        order = self._order(quantity=2)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)
        self.assertEqual(order.subtotal, Decimal("200.00"))
        self.assertEqual(order.shipping_cost, Decimal("0.00"))
        self.assertEqual(order.tax, Decimal("16.00"))
        self.assertEqual(order.total, Decimal("216.00"))
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.items.first().quantity, 2)

    def test_card_payment_marks_order_paid(self):
        order = self._order()
        self.assertEqual(order.status, Order.Status.PAID)
        self.assertTrue(order.payment_reference.startswith("mock_"))

    def test_cash_on_delivery_stays_pending(self):
        order = self._order(payment_method=Order.PaymentMethod.CASH_ON_DELIVERY)
        self.assertEqual(order.status, Order.Status.PENDING)

    def test_rejects_quantity_above_stock(self):
        with self.assertRaises(OutOfStock):
            self._order(quantity=99)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
        self.assertEqual(Order.objects.count(), 0)

    def test_duplicate_lines_are_merged(self):
        order = create_order(
            user=self.user,
            items=[
                {"product_id": self.product.id, "quantity": 1},
                {"product_id": self.product.id, "quantity": 2},
            ],
            shipping=SHIPPING,
        )
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.items.first().quantity, 3)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 2)

    def test_cancel_restores_stock(self):
        order = self._order(quantity=2)
        self.assertTrue(cancel_order(order))

        self.product.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
        self.assertEqual(order.status, Order.Status.CANCELLED)

    def test_delivered_order_cannot_be_cancelled(self):
        order = self._order()
        order.status = Order.Status.DELIVERED
        order.save(update_fields=["status"])

        self.assertFalse(cancel_order(order))
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.DELIVERED)
