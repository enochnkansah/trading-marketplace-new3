from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema

from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductUpdateSerializer,
)
from .permissions import IsSellerOrAdmin


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_permissions(self):
        """
        Product browsing is public.

        Creating, updating, and deleting products requires
        seller or admin permissions.
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsSellerOrAdmin]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @extend_schema(
        request=ProductUpdateSerializer,
    )
    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().partial_update(request, *args, **kwargs)