
from decimal import Decimal
import uuid

from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import (
    extend_schema,
    OpenApiExample,
    OpenApiParameter,
    OpenApiTypes,
)

from accounts.models import User
from cart.models import Cart
from .models import Order, OrderItem
from .serializers import (
    CheckoutSerializer,
    OrderSerializer,
    SellerOrderSerializer,
    SellerOrderStatusSerializer,
)


class OrderViewSet(viewsets.ViewSet):
    """
    Customer and seller order endpoints.

    Customer:
        GET   /api/v1/orders/
        GET   /api/v1/orders/{id}/
        POST  /api/v1/orders/checkout/

    Seller:
        GET   /api/v1/orders/seller/
        GET   /api/v1/orders/{id}/seller-detail/
        PATCH /api/v1/orders/{id}/seller-status/
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    # ---------------------------------------------------------
    # CUSTOMER ORDERS
    # ---------------------------------------------------------

    @extend_schema(
        operation_id="orders_list",
        responses=OrderSerializer(many=True),
    )
    def list(self, request):
        orders = (
            Order.objects
            .filter(customer=request.user)
            .prefetch_related("items__product")
            .order_by("-created_at")
        )

        serializer = OrderSerializer(
            orders,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    # ---------------------------------------------------------
    # CUSTOMER ORDER DETAIL
    # ---------------------------------------------------------

    @extend_schema(
        operation_id="orders_retrieve",
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
            ),
        ],
        responses=OrderSerializer,
    )
    def retrieve(self, request, pk=None):
        order = get_object_or_404(
            Order.objects
            .filter(customer=request.user)
            .prefetch_related("items__product"),
            id=pk,
        )

        serializer = OrderSerializer(
            order,
            context={"request": request},
        )
        return Response(serializer.data)

    # ---------------------------------------------------------
    # SELLER ORDER LIST
    # ---------------------------------------------------------

    @extend_schema(
        operation_id="orders_seller_list",
        responses=SellerOrderSerializer(many=True),
    )
    @action(
        detail=False,
        methods=["get"],
        url_path="seller",
    )
    def seller_orders(self, request):
        user = request.user

        if user.role not in [User.Role.SELLER, User.Role.ADMIN]:
            return Response(
                {"detail": "Seller or admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.role == User.Role.ADMIN:
            orders = (
                Order.objects
                .select_related("customer")
                .prefetch_related("items__product")
                .order_by("-created_at")
            )
        else:
            orders = (
                Order.objects
                .filter(items__product__seller=user)
                .select_related("customer")
                .prefetch_related("items__product")
                .distinct()
                .order_by("-created_at")
            )

        serializer = SellerOrderSerializer(
            orders,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    # ---------------------------------------------------------
    # SELLER ORDER DETAIL
    # ---------------------------------------------------------

    @extend_schema(
        operation_id="orders_seller_detail",
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
            ),
        ],
        responses=SellerOrderSerializer,
    )
    @action(
        detail=True,
        methods=["get"],
        url_path="seller-detail",
    )
    def seller_detail(self, request, pk=None):
        user = request.user

        if user.role not in [User.Role.SELLER, User.Role.ADMIN]:
            return Response(
                {"detail": "Seller or admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(
            Order.objects
            .select_related("customer")
            .prefetch_related("items__product"),
            id=pk,
        )

        if user.role == User.Role.SELLER:
            owns_product = (
                order.items
                .filter(product__seller=user)
                .exists()
            )

            if not owns_product:
                return Response(
                    {"detail": "You do not have access to this order."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = SellerOrderSerializer(
            order,
            context={"request": request},
        )
        return Response(serializer.data)

    # ---------------------------------------------------------
    # SELLER ORDER STATUS UPDATE
    # ---------------------------------------------------------

    @extend_schema(
        operation_id="orders_seller_status_update",
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
            ),
        ],
        request=SellerOrderStatusSerializer,
        responses=SellerOrderSerializer,
        examples=[
            OpenApiExample(
                "Confirm order",
                value={"status": "CONFIRMED"},
                request_only=True,
            ),
            OpenApiExample(
                "Process order",
                value={"status": "PROCESSING"},
                request_only=True,
            ),
            OpenApiExample(
                "Ship order",
                value={"status": "SHIPPED"},
                request_only=True,
            ),
            OpenApiExample(
                "Deliver order",
                value={"status": "DELIVERED"},
                request_only=True,
            ),
        ],
    )
    @action(
        detail=True,
        methods=["patch"],
        url_path="seller-status",
    )
    def seller_status(self, request, pk=None):
        user = request.user

        if user.role not in [User.Role.SELLER, User.Role.ADMIN]:
            return Response(
                {"detail": "Seller or admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = SellerOrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        order = get_object_or_404(
            Order.objects
            .select_related("customer")
            .prefetch_related("items__product"),
            id=pk,
        )

        if user.role == User.Role.SELLER:
            owns_product = (
                order.items
                .filter(product__seller=user)
                .exists()
            )

            if not owns_product:
                return Response(
                    {
                        "detail": (
                            "You do not have permission to update this order."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        if order.status == Order.Status.CANCELLED:
            return Response(
                {"detail": "Cancelled orders cannot be updated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status == Order.Status.REFUNDED:
            return Response(
                {"detail": "Refunded orders cannot be updated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_statuses = {
            Order.Status.PENDING,
            Order.Status.CONFIRMED,
            Order.Status.PROCESSING,
            Order.Status.SHIPPED,
            Order.Status.DELIVERED,
        }

        if new_status not in allowed_statuses:
            return Response(
                {
                    "detail": (
                        "Sellers can only set fulfillment status to "
                        "Pending, Confirmed, Processing, Shipped, "
                        "or Delivered."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = new_status
        order.save(update_fields=["status", "updated_at"])

        response_serializer = SellerOrderSerializer(
            order,
            context={"request": request},
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )

    # ---------------------------------------------------------
    # CHECKOUT
    # ---------------------------------------------------------

    @extend_schema(
        operation_id="orders_checkout",
        request=CheckoutSerializer,
        responses={201: OrderSerializer},
        examples=[
            OpenApiExample(
                "Checkout example",
                value={
                    "shipping_address": "Accra, Ghana",
                    "shipping_fee": "20.00",
                    "coupon_code": "",
                },
                request_only=True,
            ),
        ],
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="checkout",
    )
    def checkout(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shipping_address = serializer.validated_data["shipping_address"]
        shipping_fee = serializer.validated_data.get(
            "shipping_fee",
            Decimal("0.00"),
        )
        coupon_code = serializer.validated_data.get("coupon_code", "")

        cart, _ = Cart.objects.get_or_create(customer=request.user)

        cart_items = (
            cart.items
            .select_related("product", "product__seller")
            .all()
        )

        if not cart_items.exists():
            return Response(
                {"detail": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate product availability and stock.
        for cart_item in cart_items:
            product = cart_item.product

            if not product.is_active:
                return Response(
                    {
                        "detail": (
                            f'"{product.name}" is no longer available.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if cart_item.quantity > product.stock_quantity:
                return Response(
                    {
                        "detail": (
                            f'Not enough stock available for "{product.name}". '
                            f"Available stock: {product.stock_quantity}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Calculate subtotal.
        subtotal = sum(
            (
                item.product.price * item.quantity
                for item in cart_items
            ),
            Decimal("0.00"),
        )

        # Optional coupon processing.
        discount_amount = Decimal("0.00")
        coupon = None

        if coupon_code:
            try:
                from coupons.models import Coupon

                coupon = (
                    Coupon.objects
                    .filter(code__iexact=coupon_code, is_active=True)
                    .first()
                )

                if not coupon:
                    return Response(
                        {"detail": "The coupon code is invalid or inactive."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if (
                    hasattr(coupon, "discount_type")
                    and hasattr(coupon, "discount_value")
                ):
                    discount_type = coupon.discount_type
                    discount_value = Decimal(str(coupon.discount_value))

                    if discount_type in [
                        "PERCENTAGE",
                        "PERCENT",
                        "percentage",
                        "percent",
                    ]:
                        discount_amount = (
                            subtotal * discount_value / Decimal("100")
                        )
                    else:
                        discount_amount = discount_value

                    discount_amount = min(discount_amount, subtotal)

            except ImportError:
                return Response(
                    {"detail": "Coupon support is not available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        total = subtotal + shipping_fee - discount_amount
        total = max(total, Decimal("0.00"))

        order_number = f"ORD-{uuid.uuid4().hex[:12].upper()}"

        # Create the order and its item snapshots atomically.
        with transaction.atomic():
            order = Order.objects.create(
                customer=request.user,
                order_number=order_number,
                status=Order.Status.PENDING,
                subtotal=subtotal,
                shipping_fee=shipping_fee,
                coupon=coupon,
                discount_amount=discount_amount,
                total=total,
                shipping_address=shipping_address,
            )

            for cart_item in cart_items:
                product = cart_item.product
                item_subtotal = product.price * cart_item.quantity

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    product_price=product.price,
                    quantity=cart_item.quantity,
                    subtotal=item_subtotal,
                )

        # Stock deduction and cart clearing happen after
        # successful payment verification, not at checkout.
        response_serializer = OrderSerializer(
            order,
            context={"request": request},
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )
