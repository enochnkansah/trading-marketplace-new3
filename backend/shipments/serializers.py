from rest_framework import serializers

from .models import Shipment


class ShipmentSerializer(serializers.ModelSerializer):
    order_number = serializers.ReadOnlyField(
        source="order.order_number"
    )

    class Meta:
        model = Shipment
        fields = [
            "id",
            "order",
            "order_number",
            "tracking_number",
            "courier",
            "status",
            "estimated_delivery",
            "shipped_at",
            "delivered_at",
            "delivery_address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "tracking_number",
            "status",
            "shipped_at",
            "delivered_at",
            "created_at",
            "updated_at",
        ]


class ShipmentCreateSerializer(serializers.Serializer):
    order = serializers.IntegerField()
    courier = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )
    estimated_delivery = serializers.DateField(
        required=False,
        allow_null=True,
    )