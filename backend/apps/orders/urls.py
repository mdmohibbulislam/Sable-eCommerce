from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import MyOrdersViewSet, QuoteView

router = SimpleRouter()
router.register("orders", MyOrdersViewSet, basename="order")

urlpatterns = [
    path("orders/quote/", QuoteView.as_view(), name="order-quote"),
    *router.urls,
]
