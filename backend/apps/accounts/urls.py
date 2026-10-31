from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import ChangePasswordView, MeView, RegisterView, StoreTokenObtainPairView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("token/", StoreTokenObtainPairView.as_view(), name="auth-token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("password/", ChangePasswordView.as_view(), name="auth-password"),
]
