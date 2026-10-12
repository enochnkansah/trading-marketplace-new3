from rest_framework import serializers
from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            "id",
            "code",
            "description",
            "discount_type",
            "discount_value",
            "minimum_order_amount",
            "usage_limit",
            "used_count",
            "starts_at",
            "expires_at",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "used_count",
            "created_at",
            "updated_at",
        ]

    def validate_code(self, value):
        return value.strip().upper()

    def validate_discount_value(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Discount value must be greater than zero."
            )
        return value

    def validate(self, attrs):
        discount_type = attrs.get(
            "discount_type",
            getattr(self.instance, "discount_type", None)
        )
        discount_value = attrs.get(
            "discount_value",
            getattr(self.instance, "discount_value", None)
        )

        if discount_type == Coupon.DiscountType.PERCENTAGE:
            if discount_value > 100:
                raise serializers.ValidationError({
                    "discount_value": "Percentage discount cannot exceed 100."
                })

        return attrs

class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    subtotal = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0
    )

    def validate_code(self, value):
        return value.strip().upper()