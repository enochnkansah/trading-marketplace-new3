from rest_framework import serializers

from .models import Cart, CartItem
from decimal import Decimal


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.name")
    product_price = serializers.ReadOnlyField(source="product.price")

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "quantity",
        ]
        read_only_fields = [
            "id",
            "product_name",
            "product_price",
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "total",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "items",
            "total",
            "created_at",
            "updated_at",
        ]

    def get_total(self, obj) -> Decimal:
        return sum(
            item.product.price * item.quantity
            for item in obj.items.select_related("product")
        )

class AddCartItemSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    item = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class RemoveCartItemSerializer(serializers.Serializer):
    item = serializers.IntegerField()