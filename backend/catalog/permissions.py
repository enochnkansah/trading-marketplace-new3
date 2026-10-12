from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import User


class IsSellerOrAdmin(BasePermission):
    """
    Customers can view products.
    Sellers can create products and manage their own products.
    Admins can manage all products.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.role in [
            User.Role.SELLER,
            User.Role.ADMIN,
        ]

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        if request.user.role == User.Role.ADMIN:
            return True

        return obj.seller_id == request.user.id