from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
)

from catalog.models import Product

from .models import Wishlist
from .serializers import (
    WishlistItemSerializer,
    WishlistSerializer,
)


class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = WishlistSerializer

    queryset = Wishlist.objects.prefetch_related(
        "products"
    ).all()

    def get_wishlist(self, user):
        wishlist, _ = Wishlist.objects.get_or_create(
            customer=user
        )
        return wishlist

    def list(self, request):
        """
        Return the authenticated customer's wishlist.
        """
        wishlist = self.get_wishlist(request.user)

        serializer = WishlistSerializer(wishlist)

        return Response(serializer.data)

    @extend_schema(
        request=WishlistItemSerializer,
        responses=WishlistSerializer,
    )
    @action(detail=False, methods=["post"])
    def add_item(self, request):
        """
        Add a product to the customer's wishlist.
        """
        serializer = WishlistItemSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        product_id = serializer.validated_data["product"]

        product = get_object_or_404(
            Product,
            id=product_id,
            is_active=True,
        )

        wishlist = self.get_wishlist(request.user)

        if wishlist.products.filter(
            id=product.id
        ).exists():
            return Response(
                {
                    "detail": (
                        "Product is already in your wishlist."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        wishlist.products.add(product)

        return Response(
            WishlistSerializer(wishlist).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="product",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Product ID to remove from the wishlist.",
            )
        ],
        responses=WishlistSerializer,
    )
    @action(detail=False, methods=["delete"])
    def remove_item(self, request):
        """
        Remove a product from the customer's wishlist.
        """
        product_id = request.query_params.get("product")

        if not product_id:
            return Response(
                {
                    "detail": "Product is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product_id = int(product_id)
        except (TypeError, ValueError):
            return Response(
                {
                    "detail": "Product must be a valid integer."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        wishlist = self.get_wishlist(request.user)

        product = get_object_or_404(
            Product,
            id=product_id,
        )

        if not wishlist.products.filter(
            id=product.id
        ).exists():
            return Response(
                {
                    "detail": (
                        "Product is not in your wishlist."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        wishlist.products.remove(product)

        return Response(
            WishlistSerializer(wishlist).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=None,
        responses=WishlistSerializer,
    )
    @action(detail=False, methods=["delete"])
    def clear(self, request):
        """
        Remove all products from the customer's wishlist.
        """
        wishlist = self.get_wishlist(request.user)

        wishlist.products.clear()

        return Response(
            WishlistSerializer(wishlist).data,
            status=status.HTTP_200_OK,
        )