from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "updated_at",
        ]


class ProductSerializer(serializers.ModelSerializer):

    image = serializers.ImageField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "description",
            "price",
            "stock_quantity",
            "category",
            "seller",
            "image",
            "condition",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "seller",
            "created_at",
            "updated_at",
        ]

class ProductUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = [
            "name",
            "sku",
            "description",
            "price",
            "stock_quantity",
            "category",
            "condition",
            "is_active",
        ]