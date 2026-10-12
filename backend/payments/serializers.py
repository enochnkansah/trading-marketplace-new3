from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.ReadOnlyField(
        source="order.order_number"
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "order_number",
            "amount",
            "payment_method",
            "status",
            "transaction_reference",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "amount",
            "status",
            "transaction_reference",
            "created_at",
            "updated_at",
        ]


class PaymentCreateSerializer(serializers.Serializer):
    order = serializers.IntegerField()

    payment_method = serializers.ChoiceField(
        choices=Payment.PaymentMethod.choices
    )

class PaymentReferenceVerifySerializer(serializers.Serializer):
    reference = serializers.CharField(max_length=100)

