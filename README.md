# Sable — E-Commerce Web Application

A full-stack storefront: **Django + Django REST Framework** on the back end, **React + TypeScript + Tailwind** on the front, backed by SQL (SQLite by default, PostgreSQL ready).

The catalog ships with a seeded demo store — six categories, 24 products, eight orders — so the app is presentable the moment it starts. Product photography is generated as SVG at seed time, so the repository carries no binary assets and the storefront looks complete offline.

---

## Features

**Storefront**
- Editorial home page with a featured hero, category tiles and curated rows
- Catalog with category facets, price bands, availability/sale filters, search, five sort orders and pagination — all URL-driven, so any view is linkable
- Product detail with an image gallery, highlights, stock state and related products
- Cart persisted in `localStorage`, works for guests, price-checked by the server
- Checkout with a shipping form, card (demo gateway) or cash-on-delivery, live totals and an order confirmation
- Order history and order detail with a status timeline and self-service cancellation (stock restored)
- Email-first authentication on JWT with silent access-token refresh
- Responsive throughout, with keyboard-accessible controls and empty/loading/error states

**Staff dashboard** (`/admin` in the storefront — separate from Django's own `/admin/`)
- Revenue, orders, AOV, catalog and low-stock KPIs
- A 14-day revenue chart and an orders-by-status breakdown
- Recent orders, top sellers, low-stock alerts
- Product CRUD with image upload and inline active/featured toggles
- Order oversight with status transitions (cancelling returns stock)

**Back end**
- Custom email-first user model with a purpose-built manager
- Server-authoritative pricing: the API recomputes every subtotal, shipping and tax figure
- Atomic checkout: row-locked stock checks, stock decrement and order creation in one transaction
- Ownership-scoped order queries — customers only ever see their own orders
- Sale-price, discount and stock-status logic exposed by the model, not duplicated in the UI
- Django admin configured for both catalog and orders

---

## Stack

| Layer | Choice |
| --- | --- |
| API | Django 5.2, Django REST Framework 3.18 |
| Auth | `djangorestframework-simplejwt` (Bearer tokens, rotating refresh) |
| Database | SQLite by default, PostgreSQL via `DATABASE_URL` |
| Frontend | React 18, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS 3 (custom design tokens) |
| State | Zustand (cart persisted, auth, toasts) |
| Routing | React Router 6 |

---

## Project layout

```
ecommerce/
├─ backend/
│  ├─ config/                 # settings, URL wiring, WSGI/ASGI
│  ├─ apps/
│  │  ├─ accounts/            # custom User model, JWT auth endpoints
│  │  ├─ catalog/             # categories, products, gallery, SVG artwork
│  │  │  └─ management/commands/seed_demo.py
│  │  ├─ orders/              # checkout service, orders, cancellation, tests
│  │  ├─ dashboard/           # staff stats and product/order management API
│  │  └─ common/              # shared pagination
│  ├─ scripts/smoke_test.py   # end-to-end API checks
│  ├─ media/                  # generated product artwork (git-ignored)
│  └─ requirements.txt
└─ frontend/
   ├─ src/
   │  ├─ components/          # layout, cards, controls, feedback, guards
   │  ├─ pages/               # storefront pages
   │  ├─ pages/admin/         # staff dashboard
   │  ├─ store/               # zustand stores (auth, cart, toasts)
   │  ├─ lib/                 # API client, JWT storage, formatting
   │  └─ hooks/
   └─ vite.config.ts
```

---

## Quick start

### 1. Back end

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
copy .env.example .env          # cp on macOS/Linux

python manage.py migrate
python manage.py seed_demo      # catalog, artwork, users, demo orders
python manage.py runserver 127.0.0.1:8000
```

API root: <http://127.0.0.1:8000/api/> · Django admin: <http://127.0.0.1:8000/admin/>

### 2. Front end

```bash
cd frontend
pnpm install
pnpm dev                        # http://127.0.0.1:5173
```

`VITE_API_URL` defaults to `http://127.0.0.1:8000/api`; copy `.env.example` to `.env` to point elsewhere.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Staff / admin | `admin@sable.shop` | `Admin12345!` |
| Customer | `demo@sable.shop` | `Demo12345!` |

The sign-in page has a one-click "Use demo customer account" button.

---

## API

Base URL `/api/`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `auth/register/` | public | Create an account, returns tokens + user |
| POST | `auth/token/` | public | Email/password login |
| POST | `auth/token/refresh/` | public | Rotate the access token |
| GET/PATCH | `auth/me/` | customer | Read or update the profile |
| POST | `auth/password/` | customer | Change password |
| GET | `categories/` | public | Categories with live product counts |
| GET | `products/` | public | Paginated catalog |
| GET | `products/{slug}/` | public | Product detail with gallery |
| GET | `products/featured/` | public | Curated list for the home page |
| GET | `products/{slug}/related/` | public | Same-category suggestions |
| POST | `orders/quote/` | public | Price a cart without ordering |
| POST | `orders/` | customer | Checkout |
| GET | `orders/` | customer | Own order history |
| GET | `orders/{number}/` | customer | Own order detail |
| POST | `orders/{number}/cancel/` | customer | Cancel and restock |
| GET | `admin/stats/` | staff | Dashboard metrics |
| GET/POST/PATCH/DELETE | `admin/products/` | staff | Product CRUD (JSON or multipart) |
| GET/PATCH | `admin/orders/` | staff | Order list and status updates |

Catalog query parameters: `category`, `categories`, `min_price`, `max_price`, `in_stock`, `on_sale`, `featured`, `search`, `ordering` (`price`, `-price`, `name`, `created_at`, `-rating`), `page`, `page_size`.

### Business rules

Kept in `config/settings.py` so the API and UI cannot drift:

- Free shipping at or above **$75**, otherwise **$6.99**
- Sales tax **8%** of subtotal
- Card payments are a demo gateway — every charge succeeds and the order is marked paid
- Cash on delivery leaves the order pending
- Quantities are capped at 50 per line and validated against live stock

---

## Testing

```bash
cd backend
.venv\Scripts\python manage.py test apps.orders     # 10 service tests
.venv\Scripts\python scripts\smoke_test.py          # 52 end-to-end API checks
```

The smoke test drives the real HTTP API: catalog, filters, auth, quoting, checkout, stock decrement and restore, order history, staff permissions and status transitions. Point it at another server with `python scripts/smoke_test.py http://host:port`.

Front end:

```bash
cd frontend
pnpm typecheck     # tsc --noEmit
pnpm build         # production bundle
```

---

## Design notes

- **Stock is only ever touched inside a transaction.** Checkout locks the affected product rows with `select_for_update`, verifies availability, then decrements. Cancellation restores exactly what was taken.
- **Orders are snapshots.** Line items copy the product name, price and image at purchase time, so later catalog edits never rewrite history.
- **The cart is client-owned, the price is not.** The client keeps a local cart for instant feedback, but `/orders/quote/` and checkout both reprice it server-side.
- **Artwork is generated, not vendored.** `seed_demo` writes deterministic SVGs per product and two gallery variants, keeping the repo small. Replace a product's image through the dashboard or Django admin to use real photography.
- **Ratings are seeded demo values.** There is no review system yet; `rating` and `review_count` are merchandising fields populated by the seed command.

## Not built (deliberately)

Real payment processing, email delivery, product reviews, saved addresses, coupon codes, returns workflow, and multi-currency pricing. The checkout service and settings are the intended seams for the first three.
