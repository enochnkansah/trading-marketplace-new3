from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    customer = serializers.ReadOnlyField(source="customer.id")
    customer_username = serializers.ReadOnlyField(source="customer.username")
    product_name = serializers.ReadOnlyField(source="product.name")
    order_number = serializers.ReadOnlyField(source="order.order_number")

    class Meta:
        model = Review
        fields = [
            "id",
            "customer",
            "customer_username",
            "product",
            "product_name",
            "order",
            "order_number",
            "rating",
            "comment",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "customer",
            "customer_username",
            "product_name",
            "order_number",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )
        return value