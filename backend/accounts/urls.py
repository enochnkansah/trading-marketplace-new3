from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import MeView, RegisterView


urlpatterns = [
    # JWT authentication
    path(
        "token/",
        TokenObtainPairView.as_view(),
        name="token",
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # Account
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),
]