"""Root URL configuration for the Sable storefront API."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

admin.site.site_header = "Sable Administration"
admin.site.site_title = "Sable Admin"
admin.site.index_title = "Store management"


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    """Small discovery document so the API is browsable from a browser."""
    return Response(
        {
            "store": settings.STORE_NAME,
            "currency": settings.CURRENCY_CODE,
            "endpoints": {
                "auth_register": "/api/auth/register/",
                "auth_token": "/api/auth/token/",
                "auth_me": "/api/auth/me/",
                "categories": "/api/categories/",
                "products": "/api/products/",
                "orders": "/api/orders/",
                "admin_stats": "/api/admin/stats/",
            },
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api_root, name="api-root"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/admin/", include("apps.dashboard.urls")),
    path("api/", include("apps.catalog.urls")),
    path("api/", include("apps.orders.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
