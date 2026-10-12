from rest_framework import viewsets
from rest_framework.permissions import BasePermission

from .models import Store
from .serializers import StoreSerializer


class IsSellerOrAdmin(BasePermission):
    """
    Allows only sellers and admins to access store endpoints.
    Sellers can only manage their own store.
    Admins can manage all stores.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["SELLER", "ADMIN"]
        )

    def has_object_permission(self, request, view, obj):
        # Admins can manage any store
        if request.user.role == "ADMIN":
            return True

        # Sellers can only manage their own store
        return obj.seller == request.user


class StoreViewSet(viewsets.ModelViewSet):
    serializer_class = StoreSerializer
    permission_classes = [IsSellerOrAdmin]

    def get_queryset(self):
        user = self.request.user

        # Swagger/schema generation and unauthenticated requests
        if not user.is_authenticated:
            return Store.objects.none()

        # Admins can see all stores
        if user.role == "ADMIN":
            return Store.objects.all()

        # Sellers can only see their own store
        return Store.objects.filter(seller=user)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)