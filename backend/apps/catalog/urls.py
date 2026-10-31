from rest_framework.routers import SimpleRouter

from .views import CategoryViewSet, ProductViewSet

router = SimpleRouter()
router.register("products", ProductViewSet, basename="product")
router.register("categories", CategoryViewSet, basename="category")

urlpatterns = router.urls
