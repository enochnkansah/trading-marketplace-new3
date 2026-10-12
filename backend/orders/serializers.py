
from decimal import Decimal

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "quantity",
            "subtotal",
        ]
        read_only_fields = [
            "id",
            "product_name",
            "product_price",
            "subtotal",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "items",
            "subtotal",
            "shipping_fee",
            "coupon",
            "discount_amount",
            "total",
            "shipping_address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "status",
            "items",
            "subtotal",
            "coupon",
            "discount_amount",
            "total",
            "created_at",
            "updated_at",
        ]


class SellerOrderItemSerializer(serializers.ModelSerializer):
    seller = serializers.IntegerField(
        source="product.seller_id",
        read_only=True,
    )

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "quantity",
            "subtotal",
            "seller",
        ]
        read_only_fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "quantity",
            "subtotal",
            "seller",
        ]


class SellerOrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.EmailField(
        source="customer.email",
        read_only=True,
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "items",
            "customer_name",
            "customer_email",
            "subtotal",
            "shipping_fee",
            "coupon",
            "discount_amount",
            "total",
            "shipping_address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "status",
            "items",
            "customer_name",
            "customer_email",
            "subtotal",
            "shipping_fee",
            "coupon",
            "discount_amount",
            "total",
            "shipping_address",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(SellerOrderItemSerializer(many=True))
    def get_items(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return []

        user = request.user

        if getattr(user, "role", None) == "ADMIN":
            items = obj.items.select_related("product").all()
        else:
            items = (
                obj.items
                .select_related("product")
                .filter(product__seller=user)
            )

        return SellerOrderItemSerializer(
            items,
            many=True,
            context=self.context,
        ).data

    @extend_schema_field(serializers.CharField())
    def get_customer_name(self, obj):
        full_name = (
            f"{obj.customer.first_name} "
            f"{obj.customer.last_name}"
        ).strip()

        if full_name:
            return full_name

        return obj.customer.username


class SellerOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=Order.Status.choices,
    )


class CheckoutSerializer(serializers.Serializer):
    shipping_address = serializers.CharField(
        max_length=1000,
        allow_blank=False,
    )

    shipping_fee = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
        default=Decimal("0.00"),
    )

    coupon_code = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
    )
