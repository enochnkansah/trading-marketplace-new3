from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from accounts.admin_views import (
    AdminAnalyticsView,
    AdminDashboardView,
    AdminOrderDetailView,
    AdminOrdersView,
    AdminProductDetailView,
    AdminProductsView,
    AdminUserDetailView,
    AdminUsersView,
)

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


urlpatterns = [
    # ========================================================
    # Django Admin
    # ========================================================

    path(
        "admin/",
        admin.site.urls,
    ),

    # ========================================================
    # Authentication
    # ========================================================

    path(
        "api/v1/auth/",
        include("accounts.urls"),
    ),

    # ========================================================
    # API Schema
    # ========================================================

    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),

    # ========================================================
    # Swagger UI
    # ========================================================

    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),

    # ========================================================
    # Accounts
    # ========================================================

    path(
        "api/v1/",
        include("accounts.urls"),
    ),

    # ========================================================
    # Catalog
    # ========================================================

    path(
        "api/v1/",
        include("catalog.urls"),
    ),

    # ========================================================
    # Stores
    # ========================================================

    path(
        "api/v1/",
        include("stores.urls"),
    ),

    # ========================================================
    # Cart
    # ========================================================

    path(
        "api/v1/",
        include("cart.urls"),
    ),

    # ========================================================
    # Orders
    # ========================================================

    path(
        "api/v1/",
        include("orders.urls"),
    ),

    # ========================================================
    # Payments
    # ========================================================

    path(
        "api/v1/",
        include("payments.urls"),
    ),

    # ========================================================
    # Shipments
    # ========================================================

    path(
        "api/v1/",
        include("shipments.urls"),
    ),

    # ========================================================
    # Reviews
    # ========================================================

    path(
        "api/v1/",
        include("reviews.urls"),
    ),

    # ========================================================
    # Wishlist
    # ========================================================

    path(
        "api/v1/",
        include("wishlist.urls"),
    ),

    # ========================================================
    # Coupons
    # ========================================================

    path(
        "api/v1/",
        include("coupons.urls"),
    ),

    # ========================================================
    # ADMIN API
    # ========================================================

    # Dashboard
    path(
        "api/v1/admin/dashboard/",
        AdminDashboardView.as_view(),
        name="admin-dashboard",
    ),

    # Users
    path(
        "api/v1/admin/users/",
        AdminUsersView.as_view(),
        name="admin-users",
    ),

    path(
        "api/v1/admin/users/<int:user_id>/",
        AdminUserDetailView.as_view(),
        name="admin-user-detail",
    ),

    # Products
    path(
        "api/v1/admin/products/",
        AdminProductsView.as_view(),
        name="admin-products",
    ),

    path(
        "api/v1/admin/products/<int:product_id>/",
        AdminProductDetailView.as_view(),
        name="admin-product-detail",
    ),

    # Orders
    path(
        "api/v1/admin/orders/",
        AdminOrdersView.as_view(),
        name="admin-orders",
    ),

    path(
        "api/v1/admin/orders/<int:order_id>/",
        AdminOrderDetailView.as_view(),
        name="admin-order-detail",
    ),

    path(
    "api/v1/admin/analytics/",
    AdminAnalyticsView.as_view(),
    name="admin-analytics",
),
]


# ============================================================
# Development Media
# ============================================================

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )