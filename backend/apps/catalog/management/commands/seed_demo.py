"""Seed the storefront with a demo catalog, artwork, users and orders.

Usage:
    python manage.py seed_demo            # create anything missing
    python manage.py seed_demo --reset    # wipe catalog/orders/demo users first
"""

from __future__ import annotations

import random
import uuid
from datetime import timedelta
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.catalog.artwork import product_art
from apps.catalog.models import Category, Product, ProductImage
from apps.orders.models import Order, OrderItem
from apps.orders.services import money, quote_totals

CATEGORIES = [
    {
        "name": "Audio",
        "slug": "audio",
        "tagline": "Quietly excellent sound",
        "description": "Headphones, earbuds and speakers tuned for long listening sessions.",
        "icon": "headphones",
        "accent": "#2f6f8f",
        "deep": "#0b1b2b",
        "sort_order": 1,
    },
    {
        "name": "Wearables",
        "slug": "wearables",
        "tagline": "On your wrist, out of the way",
        "description": "Watches and rings that track the basics without demanding attention.",
        "icon": "watch",
        "accent": "#5b34a0",
        "deep": "#1a1230",
        "sort_order": 2,
    },
    {
        "name": "Computing",
        "slug": "computing",
        "tagline": "Tools for focused work",
        "description": "Laptops, displays and peripherals built to stay out of your way.",
        "icon": "laptop",
        "accent": "#33568c",
        "deep": "#0f1a2e",
        "sort_order": 3,
    },
    {
        "name": "Home & Living",
        "slug": "home-living",
        "tagline": "Objects worth keeping",
        "description": "Warm, tactile pieces for the rooms you actually live in.",
        "icon": "lamp",
        "accent": "#8a5428",
        "deep": "#2a1a10",
        "sort_order": 4,
    },
    {
        "name": "Fitness",
        "slug": "fitness",
        "tagline": "Built for the long haul",
        "description": "Durable training gear for small spaces and slow progress.",
        "icon": "dumbbell",
        "accent": "#237454",
        "deep": "#0d2018",
        "sort_order": 5,
    },
    {
        "name": "Accessories",
        "slug": "accessories",
        "tagline": "Carry less, carry better",
        "description": "Leather, canvas and hardware that age gracefully.",
        "icon": "bag",
        "accent": "#7e3150",
        "deep": "#2a1320",
        "sort_order": 6,
    },
]

PRODUCTS = [
    # Audio
    {
        "category": "audio",
        "name": "Halden Over-Ear Headphones",
        "slug": "halden-over-ear-headphones",
        "sku": "SB-AUD-001",
        "summary": "Studio-grade sound with adaptive noise cancelling.",
        "description": "A closed-back design with 40 mm beryllium-coated drivers, "
        "tuned flat enough to trust while mixing and forgiving enough for a long flight. "
        "Memory-foam cushions and a magnesium frame keep the weight down.",
        "highlights": ["40 mm beryllium drivers", "38-hour battery life", "Adaptive ANC"],
        "price": "289.00",
        "compare_at_price": "340.00",
        "stock": 18,
        "featured": True,
        "rating": "4.80",
        "review_count": 412,
    },
    {
        "category": "audio",
        "name": "Marlowe Wireless Earbuds",
        "slug": "marlowe-wireless-earbuds",
        "sku": "SB-AUD-002",
        "summary": "Pocketable buds with a genuinely comfortable fit.",
        "description": "Six hours per charge, twenty-eight with the case, and a shape that "
        "stays put through a run. Transparency mode is one tap away.",
        "highlights": ["6 h + 22 h with case", "IPX5 splash resistance", "USB-C and Qi charging"],
        "price": "149.00",
        "compare_at_price": None,
        "stock": 42,
        "featured": True,
        "rating": "4.60",
        "review_count": 289,
    },
    {
        "category": "audio",
        "name": "Cove Portable Speaker",
        "slug": "cove-portable-speaker",
        "sku": "SB-AUD-003",
        "summary": "A small speaker with an unreasonable amount of low end.",
        "description": "Passive radiators on both sides give it weight without a subwoofer. "
        "Splash-proof, strap-compatible and happy at the beach.",
        "highlights": ["24-hour battery", "IP67 waterproof", "Stereo pairing"],
        "price": "99.00",
        "compare_at_price": "129.00",
        "stock": 30,
        "featured": False,
        "rating": "4.50",
        "review_count": 176,
    },
    {
        "category": "audio",
        "name": "Ridge Belt-Drive Turntable",
        "slug": "ridge-belt-drive-turntable",
        "sku": "SB-AUD-004",
        "summary": "Belt-driven, factory-aligned, and quiet.",
        "description": "A solid MDF plinth, pre-mounted cartridge and a felt mat. Plug it into "
        "a pair of powered speakers and it just works.",
        "highlights": ["Pre-mounted cartridge", "Built-in phono preamp", "33/45 rpm"],
        "price": "429.00",
        "compare_at_price": None,
        "stock": 6,
        "featured": False,
        "rating": "4.70",
        "review_count": 94,
    },
    # Wearables
    {
        "category": "wearables",
        "name": "Vela Smartwatch Series 4",
        "slug": "vela-smartwatch-series-4",
        "sku": "SB-WEA-001",
        "summary": "A week of battery and a screen you can read outdoors.",
        "description": "Titanium case, sapphire crystal, and a transflective display that gets "
        "clearer in direct sun. Tracks sleep, heart rate and workouts without a phone.",
        "highlights": ["7-day battery", "Sapphire crystal", "Dual-band GPS"],
        "price": "349.00",
        "compare_at_price": None,
        "stock": 24,
        "featured": True,
        "rating": "4.90",
        "review_count": 531,
    },
    {
        "category": "wearables",
        "name": "Orbit Fitness Band",
        "slug": "orbit-fitness-band",
        "sku": "SB-WEA-002",
        "summary": "Steps, sleep and heart rate for less than a dinner out.",
        "description": "Light enough to forget you are wearing it. Charges in twenty minutes "
        "and runs for two weeks.",
        "highlights": ["14-day battery", "5 ATM water resistance", "20-minute charge"],
        "price": "89.00",
        "compare_at_price": "110.00",
        "stock": 60,
        "featured": False,
        "rating": "4.40",
        "review_count": 803,
    },
    {
        "category": "wearables",
        "name": "Tempo Sleep Ring",
        "slug": "tempo-sleep-ring",
        "sku": "SB-WEA-003",
        "summary": "Sleep and recovery tracking that stays off your screen.",
        "description": "A titanium ring with sensors on the inner surface. Four days per "
        "charge, no display, no notifications.",
        "highlights": ["Titanium shell", "4-day battery", "No screen, no alerts"],
        "price": "199.00",
        "compare_at_price": None,
        "stock": 3,
        "featured": False,
        "rating": "4.30",
        "review_count": 148,
    },
    {
        "category": "wearables",
        "name": "Crest Solar Watch",
        "slug": "crest-solar-watch",
        "sku": "SB-WEA-004",
        "summary": "Solar quartz movement that never needs a battery.",
        "description": "A 38 mm steel case, domed crystal and a movement that charges from "
        "ambient light. Set it once and forget it.",
        "highlights": ["Solar quartz", "38 mm steel case", "10 ATM water resistance"],
        "price": "129.00",
        "compare_at_price": None,
        "stock": 0,
        "featured": False,
        "rating": "4.50",
        "review_count": 212,
    },
    # Computing
    {
        "category": "computing",
        "name": "Atlas 14 Ultrabook",
        "slug": "atlas-14-ultrabook",
        "sku": "SB-COM-001",
        "summary": "A 14-inch laptop that actually lasts a full day.",
        "description": "16 GB of memory, a 1 TB drive and a silent keyboard. The aluminium "
        "chassis is 14 mm thick and the display is colour-accurate at 400 nits.",
        "highlights": ["16 GB / 1 TB", "18-hour rated battery", "400-nit colour-accurate display"],
        "price": "1299.00",
        "compare_at_price": None,
        "stock": 9,
        "featured": True,
        "rating": "4.80",
        "review_count": 167,
    },
    {
        "category": "computing",
        "name": "Nimbus Mechanical Keyboard",
        "slug": "nimbus-mechanical-keyboard",
        "sku": "SB-COM-002",
        "summary": "75% layout, hot-swappable, quietly thocky.",
        "description": "Gasket-mounted with a foam and silicone stack, so it sounds deep "
        "without waking anyone. Switches are hot-swappable and the firmware is open.",
        "highlights": ["75% layout", "Hot-swappable switches", "Open firmware"],
        "price": "179.00",
        "compare_at_price": "210.00",
        "stock": 35,
        "featured": False,
        "rating": "4.70",
        "review_count": 356,
    },
    {
        "category": "computing",
        "name": "Vector Wireless Mouse",
        "slug": "vector-wireless-mouse",
        "sku": "SB-COM-003",
        "summary": "Silent clicks, eight weeks on a charge.",
        "description": "A sculpted right-handed shape with a metal scroll wheel and no "
        "software required.",
        "highlights": ["Silent switches", "8-week battery", "USB-C charging"],
        "price": "69.00",
        "compare_at_price": None,
        "stock": 80,
        "featured": False,
        "rating": "4.40",
        "review_count": 622,
    },
    {
        "category": "computing",
        "name": "Lumen 27 4K Monitor",
        "slug": "lumen-27-4k-monitor",
        "sku": "SB-COM-004",
        "summary": "27 inches of calm, pixel-dense workspace.",
        "description": "4K IPS panel with a single-cable USB-C connection that also charges "
        "a laptop at 90 W. The stand adjusts without tools.",
        "highlights": ["4K IPS, 99% sRGB", "90 W USB-C power delivery", "Tool-free height adjustment"],
        "price": "549.00",
        "compare_at_price": None,
        "stock": 12,
        "featured": False,
        "rating": "4.60",
        "review_count": 203,
    },
    # Home & Living
    {
        "category": "home-living",
        "name": "Ember Ceramic Table Lamp",
        "slug": "ember-ceramic-table-lamp",
        "sku": "SB-HOM-001",
        "summary": "Hand-thrown stoneware with a linen shade.",
        "description": "A warm 2700 K bulb behind a linen shade, on a hand-thrown base where "
        "every glaze pools a little differently. Dimmer inline on the cord.",
        "highlights": ["Hand-thrown stoneware", "Warm 2700 K light", "Inline dimmer"],
        "price": "129.00",
        "compare_at_price": None,
        "stock": 22,
        "featured": True,
        "rating": "4.70",
        "review_count": 88,
    },
    {
        "category": "home-living",
        "name": "Terrace Oak Side Table",
        "slug": "terrace-oak-side-table",
        "sku": "SB-HOM-002",
        "summary": "Solid white oak, mortise-and-tenon joints.",
        "description": "Built without screws or brackets and finished with hardwax oil. It "
        "arrives assembled and lands at exactly sofa height.",
        "highlights": ["Solid white oak", "Hardwax oil finish", "Arrives assembled"],
        "price": "289.00",
        "compare_at_price": None,
        "stock": 4,
        "featured": False,
        "rating": "4.80",
        "review_count": 61,
    },
    {
        "category": "home-living",
        "name": "Willow Linen Throw",
        "slug": "willow-linen-throw",
        "sku": "SB-HOM-003",
        "summary": "Stonewashed linen that softens with every wash.",
        "description": "Woven from long-staple European flax with a hand-knotted fringe. "
        "Breathable in summer, surprisingly warm in winter.",
        "highlights": ["100% European flax", "Stonewashed finish", "Hand-knotted fringe"],
        "price": "79.00",
        "compare_at_price": "95.00",
        "stock": 40,
        "featured": False,
        "rating": "4.50",
        "review_count": 134,
    },
    {
        "category": "home-living",
        "name": "Clay Pour-Over Coffee Set",
        "slug": "clay-pour-over-coffee-set",
        "sku": "SB-HOM-004",
        "summary": "Dripper, carafe and scoop in one box.",
        "description": "A stoneware cone dripper sized for a single cup, a 600 ml glass "
        "carafe and a measuring scoop. Makes a decent cup on the first try.",
        "highlights": ["Stoneware dripper", "600 ml glass carafe", "Scoop included"],
        "price": "64.00",
        "compare_at_price": None,
        "stock": 25,
        "featured": False,
        "rating": "4.60",
        "review_count": 245,
    },
    # Fitness
    {
        "category": "fitness",
        "name": "Ridge Adjustable Dumbbell Pair",
        "slug": "ridge-adjustable-dumbbell-pair",
        "sku": "SB-FIT-001",
        "summary": "2.5 to 24 kg per hand in one dial.",
        "description": "A steel dial moves through fifteen weight steps so a single pair "
        "replaces a rack. The cradle keeps them tidy between sessions.",
        "highlights": ["2.5–24 kg per dumbbell", "15 weight steps", "Compact storage cradle"],
        "price": "319.00",
        "compare_at_price": "380.00",
        "stock": 11,
        "featured": True,
        "rating": "4.70",
        "review_count": 198,
    },
    {
        "category": "fitness",
        "name": "Trail Grip Yoga Mat",
        "slug": "trail-grip-yoga-mat",
        "sku": "SB-FIT-002",
        "summary": "Natural rubber with a grip that survives sweat.",
        "description": "Five millimetres of natural tree rubber with a polyurethane top layer "
        "that gets grippier as it gets wet.",
        "highlights": ["5 mm natural rubber", "Sweat-friendly surface", "Carry strap included"],
        "price": "68.00",
        "compare_at_price": None,
        "stock": 55,
        "featured": False,
        "rating": "4.60",
        "review_count": 377,
    },
    {
        "category": "fitness",
        "name": "Kettle Cast Iron 12kg",
        "slug": "kettle-cast-iron-12kg",
        "sku": "SB-FIT-003",
        "summary": "A single-piece casting with a machined handle.",
        "description": "Smooth enamel on the bell so the clean is quick, and a wide handle "
        "that stays comfortable during long sets.",
        "highlights": ["Single-piece casting", "Enamel finish", "Wide machined handle"],
        "price": "79.00",
        "compare_at_price": None,
        "stock": 20,
        "featured": False,
        "rating": "4.40",
        "review_count": 156,
    },
    {
        "category": "fitness",
        "name": "Stride Recovery Roller",
        "slug": "stride-recovery-roller",
        "sku": "SB-FIT-004",
        "summary": "Firm foam that holds its shape.",
        "description": "High-density EVA with a hollow core. Firm enough to be useful, not so "
        "firm it is unpleasant.",
        "highlights": ["High-density EVA", "Hollow core", "45 cm length"],
        "price": "45.00",
        "compare_at_price": None,
        "stock": 0,
        "featured": False,
        "rating": "4.30",
        "review_count": 289,
    },
    # Accessories
    {
        "category": "accessories",
        "name": "Carry Leather Weekender",
        "slug": "carry-leather-weekender",
        "sku": "SB-ACC-001",
        "summary": "Full-grain leather that will look better in five years.",
        "description": "Vegetable-tanned full-grain leather over a canvas lining, with solid "
        "brass hardware and a detachable shoulder strap. Cabin-friendly dimensions.",
        "highlights": ["Full-grain vegetable-tanned leather", "Solid brass hardware", "Cabin-friendly size"],
        "price": "249.00",
        "compare_at_price": None,
        "stock": 15,
        "featured": True,
        "rating": "4.90",
        "review_count": 143,
    },
    {
        "category": "accessories",
        "name": "Field Canvas Backpack",
        "slug": "field-canvas-backpack",
        "sku": "SB-ACC-002",
        "summary": "Waxed canvas, twenty-two litres, one good pocket layout.",
        "description": "Waxed cotton canvas with a padded sixteen-inch laptop sleeve and two "
        "external pockets sized for a bottle and a notebook.",
        "highlights": ["22 L capacity", "Fits a 16-inch laptop", "Water-resistant waxed canvas"],
        "price": "139.00",
        "compare_at_price": "165.00",
        "stock": 28,
        "featured": False,
        "rating": "4.60",
        "review_count": 264,
    },
    {
        "category": "accessories",
        "name": "Slate Card Wallet",
        "slug": "slate-card-wallet",
        "sku": "SB-ACC-003",
        "summary": "Six cards, no bulk.",
        "description": "Two panels of full-grain leather and a pull tab. Holds six cards and "
        "a couple of folded notes.",
        "highlights": ["Holds 6 cards", "RFID blocking", "Pull-tab access"],
        "price": "59.00",
        "compare_at_price": None,
        "stock": 70,
        "featured": False,
        "rating": "4.50",
        "review_count": 512,
    },
    {
        "category": "accessories",
        "name": "Nomad Travel Pouch",
        "slug": "nomad-travel-pouch",
        "sku": "SB-ACC-004",
        "summary": "For the small things that get lost in a bag.",
        "description": "Water-resistant ripstop with a YKK zip and a loop that clips to a "
        "backpack strap. Cables, cards, adapters, receipts.",
        "highlights": ["Water-resistant ripstop", "YKK zip", "Clip loop"],
        "price": "39.00",
        "compare_at_price": None,
        "stock": 33,
        "featured": False,
        "rating": "4.30",
        "review_count": 331,
    },
]

CUSTOMERS = [
    ("demo@sable.shop", "Demo12345!", "Devon", "Marlowe"),
    ("maya@example.com", "Demo12345!", "Maya", "Okafor"),
    ("jonas@example.com", "Demo12345!", "Jonas", "Weber"),
    ("priya@example.com", "Demo12345!", "Priya", "Raman"),
]

DEMO_ORDERS = [
    ("demo@sable.shop", "delivered", 13, ["halden-over-ear-headphones", "slate-card-wallet"]),
    ("maya@example.com", "delivered", 11, ["vela-smartwatch-series-4"]),
    ("jonas@example.com", "shipped", 8, ["atlas-14-ultrabook", "vector-wireless-mouse"]),
    ("priya@example.com", "delivered", 7, ["ember-ceramic-table-lamp", "willow-linen-throw"]),
    ("demo@sable.shop", "processing", 4, ["ridge-adjustable-dumbbell-pair"]),
    ("maya@example.com", "paid", 3, ["carry-leather-weekender", "nomad-travel-pouch"]),
    ("jonas@example.com", "paid", 2, ["nimbus-mechanical-keyboard", "lumen-27-4k-monitor"]),
    ("priya@example.com", "cancelled", 1, ["cove-portable-speaker"]),
]

ADDRESSES = [
    ("214 Maple Avenue", "Apt 5", "Portland", "OR", "97209"),
    ("18 Harbour Road", "", "Boston", "MA", "02110"),
    ("77 Calder Street", "Unit 2", "Austin", "TX", "78702"),
    ("5 Larkspur Lane", "", "Denver", "CO", "80204"),
]


class Command(BaseCommand):
    help = "Populate the storefront with demo categories, products, users and orders."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete catalog, orders and demo customers before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(20240517)

        if options["reset"]:
            self._reset()

        categories = self._seed_categories()
        products = self._seed_products(categories)
        self._seed_users()
        self._seed_orders(products)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {Category.objects.count()} categories, "
                f"{Product.objects.count()} products and {Order.objects.count()} orders."
            )
        )
        self.stdout.write("  Admin:    admin@sable.shop / Admin12345!")
        self.stdout.write("  Customer: demo@sable.shop / Demo12345!")

    # -- steps -------------------------------------------------------------
    def _reset(self):
        self.stdout.write("Resetting demo data…")
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        ProductImage.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        User.objects.filter(is_staff=False).delete()

    def _seed_categories(self) -> dict[str, dict]:
        result = {}
        for payload in CATEGORIES:
            data = dict(payload)
            deep = data.pop("deep")
            category, created = Category.objects.update_or_create(
                slug=data["slug"], defaults=data
            )
            result[category.slug] = {"category": category, "deep": deep}
            if created:
                self.stdout.write(f"  + category {category.name}")
        return result

    def _seed_products(self, categories: dict[str, dict]) -> dict[str, Product]:
        products: dict[str, Product] = {}
        for payload in PRODUCTS:
            data = dict(payload)
            category_slug = data.pop("category")
            slug = data["slug"]
            defaults = {
                "category": categories[category_slug]["category"],
                "name": data["name"],
                "sku": data["sku"],
                "summary": data["summary"],
                "description": data["description"],
                "highlights": data["highlights"],
                "price": Decimal(data["price"]),
                "compare_at_price": (
                    Decimal(data["compare_at_price"]) if data["compare_at_price"] else None
                ),
                "stock": data["stock"],
                "is_featured": data["featured"],
                "is_active": True,
                "rating": Decimal(data["rating"]),
                "review_count": data["review_count"],
            }
            product, created = Product.objects.update_or_create(
                slug=slug, defaults=defaults
            )
            self._attach_art(product, category_slug, categories)
            products[slug] = product
            if created:
                self.stdout.write(f"  + product {product.name}")
        return products

    def _attach_art(self, product: Product, category_slug: str, categories: dict):
        meta = categories[category_slug]
        deep = meta["deep"]
        accent = meta["category"].accent
        glyph = meta["category"].icon or "box"

        svg = product_art(deep, accent, glyph, variant=0, title=product.name)
        product.image.delete(save=False)
        product.image.save(
            f"{product.slug}.svg", ContentFile(svg.encode("utf-8")), save=True
        )

        product.gallery.all().delete()
        for index in range(2):
            variant = index + 1
            gallery_svg = product_art(deep, accent, glyph, variant=variant, title=product.name)
            image = ProductImage(
                product=product,
                alt=f"{product.name} alternate view {index + 2}",
                sort_order=index,
            )
            image.image.save(
                f"{product.slug}-{variant + 1}.svg",
                ContentFile(gallery_svg.encode("utf-8")),
                save=False,
            )
            image.save()

    def _seed_users(self):
        admin_email = "admin@sable.shop"
        if not User.objects.filter(email=admin_email).exists():
            User.objects.create_superuser(
                email=admin_email,
                password="Admin12345!",
                first_name="Store",
                last_name="Admin",
                username="admin",
            )
            self.stdout.write("  + staff account admin@sable.shop")

        for email, password, first, last in CUSTOMERS:
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(
                    email=email, password=password, first_name=first, last_name=last
                )
                self.stdout.write(f"  + customer {email}")

    def _seed_orders(self, products: dict[str, Product]):
        if Order.objects.exists():
            return

        now = timezone.now()
        for index, (email, status, days_ago, slugs) in enumerate(DEMO_ORDERS):
            user = User.objects.filter(email=email).first()
            if user is None:
                continue

            line_items = []
            subtotal = Decimal("0.00")
            for slug in slugs:
                product = products.get(slug)
                if product is None:
                    continue
                quantity = 1 if product.price >= Decimal("200") else random.choice([1, 1, 2])
                subtotal += product.price * quantity
                line_items.append((product, quantity))

            totals = quote_totals(money(subtotal))
            line1, line2, city, state, postal = ADDRESSES[index % len(ADDRESSES)]
            placed_at = now - timedelta(days=days_ago, hours=random.randint(1, 9))

            order = Order(
                user=user,
                email=user.email,
                status=status,
                subtotal=totals["subtotal"],
                shipping_cost=totals["shipping_cost"],
                tax=totals["tax"],
                total=totals["total"],
                shipping_name=user.display_name,
                shipping_phone="+1 555 0142",
                shipping_line1=line1,
                shipping_line2=line2,
                shipping_city=city,
                shipping_state=state,
                shipping_postal_code=postal,
                shipping_country="United States",
                payment_method="card",
                payment_reference=f"mock_{uuid.uuid4().hex[:18]}",
            )
            order.save()
            Order.objects.filter(pk=order.pk).update(
                created_at=placed_at, updated_at=placed_at
            )

            for product, quantity in line_items:
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
            self.stdout.write(f"  + order {order.number} ({status})")
