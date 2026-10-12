from rest_framework import serializers

from catalog.models import Product
from .models import Wishlist


class WishlistProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "price",
            "stock_quantity",
            "category",
            "image",
            "condition",
            "is_active",
        ]


class WishlistSerializer(serializers.ModelSerializer):
    products = WishlistProductSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Wishlist
        fields = [
            "id",
            "products",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "products",
            "created_at",
            "updated_at",
        ]


class WishlistItemSerializer(serializers.Serializer):
    product = serializers.IntegerField()