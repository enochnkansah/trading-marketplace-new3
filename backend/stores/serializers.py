from rest_framework import serializers

from .models import Store


class StoreSerializer(serializers.ModelSerializer):
    seller = serializers.ReadOnlyField(source="seller.id")

    class Meta:
        model = Store
        fields = [
            "id",
            "seller",
            "name",
            "slug",
            "description",
            "logo",
            "phone",
            "email",
            "address",
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