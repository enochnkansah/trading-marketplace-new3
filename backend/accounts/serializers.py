from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    password2 = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "phone_number",
            "password",
            "password2",
            "role",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {
                    "password": "Passwords do not match."
                }
            )

        role = attrs.get(
            "role",
            User.Role.CUSTOMER
        )

        # Public registration is only allowed
        # to create Customer or Seller accounts.
        if role not in [
            User.Role.CUSTOMER,
            User.Role.SELLER,
        ]:
            raise serializers.ValidationError(
                {
                    "role": (
                        "Public registration only allows "
                        "Customer or Seller accounts."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")

        password = validated_data.pop("password")

        user = User(**validated_data)

        user.set_password(password)

        user.save()

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone_number",
            "role",
            "is_verified",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "username",
            "email",
            "phone_number",
            "role",
            "is_verified",
            "created_at",
            "updated_at",
        ]