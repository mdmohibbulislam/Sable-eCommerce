from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import AdminOrderViewSet, AdminProductViewSet, AdminStatsView

router = SimpleRouter()
router.register("products", AdminProductViewSet, basename="admin-product")
router.register("orders", AdminOrderViewSet, basename="admin-order")

urlpatterns = [
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
    *router.urls,
]
