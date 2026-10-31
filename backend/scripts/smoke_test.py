"""End-to-end smoke test for the Sable API.

Exercises the public catalog, authentication, checkout, order history and the
staff dashboard against a running development server.

Usage:
    python scripts/smoke_test.py [base_url]

Exit code 0 means every check passed.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
import uuid

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")
API = f"{BASE}/api"

# Windows consoles often default to a legacy code page; keep output readable.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

failures: list[str] = []
checks = 0


def check(label: str, condition: bool, detail: str = "") -> None:
    global checks
    checks += 1
    if condition:
        print(f"  PASS  {label}")
    else:
        print(f"  FAIL  {label}{f' — {detail}' if detail else ''}")
        failures.append(label)


def call(
    method: str,
    path: str,
    body: dict | None = None,
    token: str | None = None,
) -> tuple[int, object]:
    url = path if path.startswith("http") else f"{API}{path}"
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Accept", "application/json")
    if data:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode()
            return response.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as error:
        raw = error.read().decode()
        try:
            return error.code, json.loads(raw) if raw else None
        except json.JSONDecodeError:
            return error.code, raw


def login(email: str, password: str) -> str:
    status, data = call("POST", "/auth/token/", {"email": email, "password": password})
    if status != 200 or not isinstance(data, dict):
        raise SystemExit(f"login failed for {email}: {status} {data}")
    return data["access"]


def main() -> int:
    print(f"\nSable API smoke test → {API}\n")

    # --- catalog -----------------------------------------------------------
    print("Catalog")
    status, categories = call("GET", "/categories/")
    check("categories respond", status == 200 and isinstance(categories, list))
    check("six seeded categories", len(categories) == 6, f"got {len(categories)}")

    status, products = call("GET", "/products/")
    check("product list responds", status == 200 and isinstance(products, dict))
    check("24 seeded products", products.get("count") == 24, str(products.get("count")))
    check("pagination metadata", "num_pages" in products and "results" in products)

    first = products["results"][0]
    status, detail = call("GET", f"/products/{first['slug']}/")
    check("product detail responds", status == 200)
    check("detail includes gallery", isinstance(detail.get("gallery"), list))
    check("price is numeric", isinstance(detail.get("price"), (int, float)))

    status, featured = call("GET", "/products/featured/?limit=4")
    check("featured endpoint", status == 200 and len(featured) <= 4, str(status))

    status, searched = call("GET", "/products/?search=headphones")
    check("search narrows results", status == 200 and searched["count"] >= 1)

    status, filtered = call("GET", "/products/?category=audio&max_price=200")
    check(
        "category + price filter",
        status == 200 and all(p["price"] <= 200 for p in filtered["results"]),
    )

    status, sorted_low = call("GET", "/products/?ordering=price&page_size=5")
    prices = [p["price"] for p in sorted_low["results"]]
    check("price ordering", prices == sorted(prices), str(prices))

    status, related = call("GET", f"/products/{first['slug']}/related/")
    check("related products", status == 200 and isinstance(related, list))

    # --- auth --------------------------------------------------------------
    print("\nAuthentication")
    email = f"smoke+{uuid.uuid4().hex[:8]}@example.com"
    status, registered = call(
        "POST",
        "/auth/register/",
        {
            "email": email,
            "password": "SmokeTest123!",
            "password_confirm": "SmokeTest123!",
            "first_name": "Smoke",
            "last_name": "Tester",
        },
    )
    check("register new customer", status == 201, f"{status} {registered}")
    token = registered["access"] if status == 201 else ""
    check("register returns tokens", bool(registered.get("access")) if status == 201 else False)

    status, weak = call(
        "POST",
        "/auth/register/",
        {"email": f"weak+{uuid.uuid4().hex[:6]}@example.com", "password": "123"},
    )
    check("reject weak password", status == 400, str(status))

    status, me = call("GET", "/auth/me/", token=token)
    check("profile endpoint", status == 200 and me.get("email") == email)

    status, unauth = call("GET", "/orders/")
    check("orders require auth", status == 401, str(status))

    status, bad = call("POST", "/auth/token/", {"email": email, "password": "wrong"})
    check("reject bad credentials", status == 401, str(status))

    # --- checkout ----------------------------------------------------------
    print("\nCheckout")
    in_stock = [p for p in products["results"] if p["stock"] >= 5][:2]
    check("found in-stock products", len(in_stock) == 2)

    cart = [{"product_id": p["id"], "quantity": 1} for p in in_stock]
    status, quote = call("POST", "/orders/quote/", {"items": cart})
    check("quote responds", status == 200, str(status))
    check("quote has totals", all(k in quote for k in ("subtotal", "shipping_cost", "tax", "total")))
    expected_total = round(quote["subtotal"] + quote["shipping_cost"] + quote["tax"], 2)
    check("quote total is consistent", abs(quote["total"] - expected_total) < 0.02)

    stock_before = {p["id"]: p["stock"] for p in in_stock}
    status, order = call(
        "POST",
        "/orders/",
        {
            "items": cart,
            "shipping": {
                "full_name": "Smoke Tester",
                "line1": "1 Test Way",
                "city": "Portland",
                "state": "OR",
                "postal_code": "97209",
                "country": "United States",
            },
            "payment_method": "card",
            "notes": "Created by smoke_test.py",
        },
        token=token,
    )
    check("place order", status == 201, f"{status} {order}")
    order_number = order.get("number", "") if status == 201 else ""
    check("order is paid (demo card)", order.get("status") == "paid", str(order.get("status")))
    check("order total matches quote", abs(order.get("total", 0) - quote["total"]) < 0.02)

    for product in in_stock:
        status, after = call("GET", f"/products/{product['slug']}/")
        check(
            f"stock decremented for {product['name'][:28]}",
            after["stock"] == stock_before[product["id"]] - 1,
            f"{stock_before[product['id']]} -> {after['stock']}",
        )

    status, too_many = call(
        "POST",
        "/orders/",
        {
            "items": [{"product_id": in_stock[0]["id"], "quantity": 999}],
            "shipping": {
                "full_name": "Smoke Tester",
                "line1": "1 Test Way",
                "city": "Portland",
                "postal_code": "97209",
                "country": "United States",
            },
            "payment_method": "card",
        },
        token=token,
    )
    check("reject quantity above stock", status == 400, str(status))

    status, empty = call(
        "POST", "/orders/", {"items": [], "shipping": {}}, token=token
    )
    check("reject empty cart", status == 400, str(status))

    # --- order history -----------------------------------------------------
    print("\nOrder history")
    status, orders = call("GET", "/orders/", token=token)
    check("list own orders", status == 200 and orders["count"] == 1, str(orders.get("count")))

    status, fetched = call("GET", f"/orders/{order_number}/", token=token)
    check("retrieve order detail", status == 200 and fetched["number"] == order_number)
    check("order has items", len(fetched.get("items", [])) == 2)

    status, cancelled = call("POST", f"/orders/{order_number}/cancel/", token=token)
    check("cancel order", status == 200 and cancelled["status"] == "cancelled")

    restored = all(
        call("GET", f"/products/{p['slug']}/")[1]["stock"] == stock_before[p["id"]]
        for p in in_stock
    )
    check("stock restored on cancel", restored)

    status, again = call("POST", f"/orders/{order_number}/cancel/", token=token)
    check("cannot cancel twice", status == 400, str(status))

    # --- staff dashboard ---------------------------------------------------
    print("\nStaff dashboard")
    admin_token = login("admin@sable.shop", "Admin12345!")
    status, stats = call("GET", "/admin/stats/", token=admin_token)
    check("stats respond", status == 200, str(status))
    if not isinstance(stats, dict):
        stats = {}
    for field in (
        "revenue_total",
        "orders_total",
        "customers_total",
        "products_total",
        "sales_series",
        "status_breakdown",
        "recent_orders",
    ):
        check(f"stats include {field}", field in stats)
    check("sales series has 14 points", len(stats.get("sales_series", [])) == 14)

    status, admin_products = call("GET", "/admin/products/", token=admin_token)
    check("staff product list", status == 200 and admin_products["count"] == 24)

    status, forbidden = call("GET", "/admin/stats/", token=token)
    check("non-staff blocked from admin", status == 403, str(status))

    status, admin_orders = call("GET", "/admin/orders/", token=admin_token)
    check("staff order list", status == 200 and admin_orders["count"] >= 8)

    # A cancelled order cannot be reopened, so exercise the transition on a live one.
    live_order = next(
        (o for o in admin_orders["results"] if o["status"] == "paid"), None
    )
    check("found a live order to advance", live_order is not None)
    if live_order:
        status, patched = call(
            "PATCH",
            f"/admin/orders/{live_order['number']}/",
            {"status": "processing"},
            token=admin_token,
        )
        check(
            "staff updates order status",
            status == 200 and patched["status"] == "processing",
            str(status),
        )
        call(
            "PATCH",
            f"/admin/orders/{live_order['number']}/",
            {"status": "paid"},
            token=admin_token,
        )

    status, reopen = call(
        "PATCH",
        f"/admin/orders/{order_number}/",
        {"status": "paid"},
        token=admin_token,
    )
    check("cancelled order cannot be reopened", status == 400, str(status))

    status, invalid = call(
        "PATCH", f"/admin/orders/{order_number}/", {"status": "teleported"}, token=admin_token
    )
    check("reject unknown status", status == 400, str(status))

    # --- summary -----------------------------------------------------------
    print(f"\n{checks - len(failures)}/{checks} checks passed")
    if failures:
        print("\nFailures:")
        for item in failures:
            print(f"  - {item}")
        return 1
    print("All checks passed.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
