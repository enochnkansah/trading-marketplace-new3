from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiTypes,
    extend_schema,
)

from catalog.models import Product

from .models import Cart, CartItem
from .serializers import (
    AddCartItemSerializer,
    CartSerializer,
    UpdateCartItemSerializer,
)


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CartSerializer

    def get_cart(self, user):
        cart, _ = Cart.objects.get_or_create(customer=user)
        return cart

    def list(self, request):
        cart = self.get_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @extend_schema(request=AddCartItemSerializer)
    @action(detail=False, methods=["post"])
    def add_item(self, request):
        product_id = request.data.get("product")
        quantity = request.data.get("quantity", 1)

        if not product_id:
            return Response(
                {"detail": "Product is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity < 1:
            return Response(
                {"detail": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = get_object_or_404(
            Product,
            id=product_id,
            is_active=True,
        )

        if quantity > product.stock_quantity:
            return Response(
                {"detail": "Not enough stock available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = self.get_cart(request.user)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )

        if not created:
            new_quantity = item.quantity + quantity

            if new_quantity > product.stock_quantity:
                return Response(
                    {"detail": "Not enough stock available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            item.quantity = new_quantity
            item.save()

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(request=UpdateCartItemSerializer)
    @action(detail=False, methods=["patch"])
    def update_item(self, request):
        item_id = request.data.get("item")
        quantity = request.data.get("quantity")

        if not item_id or quantity is None:
            return Response(
                {"detail": "Item and quantity are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity < 1:
            return Response(
                {"detail": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = self.get_cart(request.user)

        item = get_object_or_404(
            CartItem,
            id=item_id,
            cart=cart,
        )

        if quantity > item.product.stock_quantity:
            return Response(
                {"detail": "Not enough stock available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = quantity
        item.save()

        return Response(CartSerializer(cart).data)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="item",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Cart item ID to remove.",
            )
        ]
    )
    @action(detail=False, methods=["delete"])
    def remove_item(self, request):
        item_id = request.query_params.get("item")

        if not item_id:
            return Response(
                {"detail": "Item is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = self.get_cart(request.user)

        item = get_object_or_404(
            CartItem,
            id=item_id,
            cart=cart,
        )

        item.delete()

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["delete"])
    def clear(self, request):
        cart = self.get_cart(request.user)
        cart.items.all().delete()

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_200_OK,
        )