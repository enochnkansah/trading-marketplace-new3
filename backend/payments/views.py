import uuid
from decimal import Decimal

import requests

from django.conf import settings
from django.db import transaction

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema

from cart.models import Cart
from catalog.models import Product
from coupons.models import Coupon
from orders.models import Order

from .models import Payment
from .serializers import (
    PaymentSerializer,
    PaymentCreateSerializer,
    PaymentReferenceVerifySerializer,
)


class PaymentViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer
    queryset = Payment.objects.select_related("order").all()

    # ============================================================
    # LIST PAYMENTS
    # ============================================================

    def list(self, request):
        payments = (
            Payment.objects
            .filter(order__customer=request.user)
            .select_related("order")
            .order_by("-created_at")
        )

        serializer = PaymentSerializer(
            payments,
            many=True,
        )

        return Response(serializer.data)

    # ============================================================
    # RETRIEVE SINGLE PAYMENT
    # ============================================================

    def retrieve(self, request, pk=None):
        try:
            payment = (
                Payment.objects
                .select_related("order")
                .get(
                    id=pk,
                    order__customer=request.user,
                )
            )

        except Payment.DoesNotExist:
            return Response(
                {
                    "detail": "Payment not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PaymentSerializer(payment)

        return Response(serializer.data)

    # ============================================================
    # INITIATE PAYSTACK PAYMENT
    # ============================================================

    @extend_schema(
        request=PaymentCreateSerializer,
        responses=PaymentSerializer,
    )
    @action(
        detail=False,
        methods=["post"],
    )
    def initiate(self, request):
        serializer = PaymentCreateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        order_id = serializer.validated_data["order"]
        payment_method = serializer.validated_data[
            "payment_method"
        ]

        # --------------------------------------------------------
        # Find order belonging to logged-in customer
        # --------------------------------------------------------

        try:
            order = (
                Order.objects
                .select_related("customer")
                .get(
                    id=order_id,
                    customer=request.user,
                )
            )

        except Order.DoesNotExist:
            return Response(
                {
                    "detail": "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------------
        # Make sure payment does not already exist
        # --------------------------------------------------------

        if hasattr(order, "payment"):
            return Response(
                {
                    "detail": (
                        "A payment already exists "
                        "for this order."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Only pending orders can be paid
        # --------------------------------------------------------

        if order.status != Order.Status.PENDING:
            return Response(
                {
                    "detail": (
                        "Only pending orders can be paid for."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Check Paystack configuration
        # --------------------------------------------------------

        if not settings.PAYSTACK_SECRET_KEY:
            return Response(
                {
                    "detail": (
                        "Paystack is not configured "
                        "on the server."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # --------------------------------------------------------
        # Generate transaction reference
        # --------------------------------------------------------

        reference = (
            f"TXN-{uuid.uuid4().hex[:16].upper()}"
        )

        # Paystack expects amount in the smallest currency unit.
        # For GHS, multiply by 100.

        amount_subunit = int(
            (
                order.total * Decimal("100")
            ).quantize(
                Decimal("1")
            )
        )

        # --------------------------------------------------------
        # Paystack request
        # --------------------------------------------------------

        payload = {
            "email": request.user.email,
            "amount": amount_subunit,
            "currency": settings.PAYSTACK_CURRENCY,
            "reference": reference,

            # Send customer back to Next.js after payment.
            "callback_url": (
                "http://localhost:3000/payment/callback"
                f"?reference={reference}"
            ),
        }

        headers = {
            "Authorization": (
                f"Bearer {settings.PAYSTACK_SECRET_KEY}"
            ),
            "Content-Type": "application/json",
        }

        # --------------------------------------------------------
        # Send request to Paystack
        # --------------------------------------------------------

        try:
            paystack_response = requests.post(
                (
                    f"{settings.PAYSTACK_BASE_URL}"
                    "/transaction/initialize"
                ),
                json=payload,
                headers=headers,
                timeout=30,
            )

            paystack_data = paystack_response.json()

        except requests.RequestException as exc:
            # Log the exception type without exposing payment credentials.
            import logging

            logging.getLogger(__name__).error(
                "Paystack connection failed: %s",
                type(exc).__name__,
            )

            return Response(
                {
                    "detail": "Unable to connect to Paystack."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )

        except ValueError:
            return Response(
                {
                    "detail": (
                        "Invalid response received "
                        "from Paystack."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # --------------------------------------------------------
        # Check Paystack response
        # --------------------------------------------------------

        if (
            paystack_response.status_code >= 400
            or not paystack_data.get("status")
        ):
            return Response(
                {
                    "detail": paystack_data.get(
                        "message",
                        (
                            "Paystack transaction "
                            "initialization failed."
                        ),
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        paystack_transaction = paystack_data.get(
            "data",
            {},
        )

        paystack_reference = (
            paystack_transaction.get("reference")
        )

        authorization_url = (
            paystack_transaction.get(
                "authorization_url"
            )
        )

        access_code = (
            paystack_transaction.get(
                "access_code"
            )
        )

        # --------------------------------------------------------
        # Make sure Paystack returned a reference
        # --------------------------------------------------------

        if not paystack_reference:
            return Response(
                {
                    "detail": (
                        "Paystack did not return "
                        "a transaction reference."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # --------------------------------------------------------
        # Create payment record
        # --------------------------------------------------------

        with transaction.atomic():
            payment = Payment.objects.create(
                order=order,
                amount=order.total,
                payment_method=payment_method,
                status=Payment.Status.PENDING,
                transaction_reference=paystack_reference,
            )

        # --------------------------------------------------------
        # Return payment information
        # --------------------------------------------------------

        response_data = PaymentSerializer(
            payment
        ).data

        response_data["authorization_url"] = (
            authorization_url
        )

        response_data["access_code"] = (
            access_code
        )

        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
        )

    # ============================================================
    # FINALIZE SUCCESSFUL PAYMENT
    # ============================================================

    def finalize_successful_payment(self, payment):
        """
        Finalize an order after Paystack confirms payment.

        Everything that changes marketplace state happens inside
        one database transaction.

        Steps:

        1. Lock payment.
        2. Check idempotency.
        3. Lock order.
        4. Load order items.
        5. Lock products.
        6. Verify stock.
        7. Deduct stock.
        8. Increment coupon usage.
        9. Remove only the purchased quantities from cart.
        10. Mark payment SUCCESSFUL.
        11. Mark order CONFIRMED.

        If anything fails, the database transaction rolls back.
        """

        with transaction.atomic():

            # ----------------------------------------------------
            # Lock payment
            # ----------------------------------------------------

            payment = (
                Payment.objects
                .select_for_update()
                .get(
                    id=payment.id
                )
            )

            # ----------------------------------------------------
            # Idempotency protection
            # ----------------------------------------------------

            if (
                payment.status
                == Payment.Status.SUCCESSFUL
            ):
                return payment

            if (
                payment.status
                == Payment.Status.REFUNDED
            ):
                raise ValueError(
                    "This payment has already been refunded."
                )

            # ----------------------------------------------------
            # Lock order
            # ----------------------------------------------------

            order = (
                Order.objects
                .select_for_update()
                .get(
                    id=payment.order_id
                )
            )

            # ----------------------------------------------------
            # Get order items
            # ----------------------------------------------------

            order_items = list(
                order.items.select_related(
                    "product"
                )
            )

            # ----------------------------------------------------
            # Collect product IDs
            # ----------------------------------------------------

            product_ids = [
                item.product_id
                for item in order_items
                if item.product_id is not None
            ]

            # ----------------------------------------------------
            # Lock products
            # ----------------------------------------------------

            locked_products = {}

            if product_ids:

                products = (
                    Product.objects
                    .select_for_update()
                    .filter(
                        id__in=product_ids
                    )
                )

                locked_products = {
                    product.id: product
                    for product in products
                }

            # ----------------------------------------------------
            # Verify stock
            # ----------------------------------------------------

            for item in order_items:

                if item.product_id is None:
                    continue

                product = locked_products.get(
                    item.product_id
                )

                if product is None:
                    raise ValueError(
                        f"Product for order item "
                        f"{item.id} no longer exists."
                    )

                if not product.is_active:
                    raise ValueError(
                        f"{product.name} is no longer available."
                    )

                if (
                    item.quantity
                    > product.stock_quantity
                ):
                    raise ValueError(
                        "Not enough stock available "
                        f"for {product.name}. "
                        f"Available stock: "
                        f"{product.stock_quantity}."
                    )

            # ----------------------------------------------------
            # Deduct stock
            # ----------------------------------------------------

            for item in order_items:

                if item.product_id is None:
                    continue

                product = locked_products[
                    item.product_id
                ]

                product.stock_quantity -= (
                    item.quantity
                )

                product.save(
                    update_fields=[
                        "stock_quantity",
                        "updated_at",
                    ]
                )

            # ----------------------------------------------------
            # Increment coupon usage
            # ----------------------------------------------------

            if order.coupon_id:

                coupon = (
                    Coupon.objects
                    .select_for_update()
                    .get(
                        id=order.coupon_id
                    )
                )

                if (
                    coupon.usage_limit is not None
                    and coupon.used_count
                    >= coupon.usage_limit
                ):
                    raise ValueError(
                        "This coupon has reached "
                        "its usage limit."
                    )

                coupon.used_count += 1

                coupon.save(
                    update_fields=[
                        "used_count",
                    ]
                )

            # ----------------------------------------------------
            # Remove ONLY purchased quantities from cart
            # ----------------------------------------------------

            cart = (
                Cart.objects
                .select_for_update()
                .filter(
                    customer_id=order.customer_id
                )
                .first()
            )

            if cart is not None:

                # Create a lookup of product -> purchased quantity.
                purchased_quantities = {
                    item.product_id: item.quantity
                    for item in order_items
                    if item.product_id is not None
                }

                cart_items = list(
                    cart.items.filter(
                        product_id__in=purchased_quantities.keys()
                    )
                )

                for cart_item in cart_items:

                    purchased_quantity = (
                        purchased_quantities.get(
                            cart_item.product_id,
                            0,
                        )
                    )

                    if purchased_quantity <= 0:
                        continue

                    # ------------------------------------------------
                    # If the cart contains exactly what was purchased,
                    # remove the cart item.
                    # ------------------------------------------------

                    if (
                        cart_item.quantity
                        <= purchased_quantity
                    ):
                        cart_item.delete()

                    # ------------------------------------------------
                    # If the customer added more after checkout,
                    # keep the remaining quantity.
                    # ------------------------------------------------

                    else:
                        cart_item.quantity -= (
                            purchased_quantity
                        )

                        cart_item.save(
                            update_fields=[
                                "quantity",
                            ]
                        )

            # ----------------------------------------------------
            # Mark payment successful
            # ----------------------------------------------------

            payment.status = (
                Payment.Status.SUCCESSFUL
            )

            payment.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            # ----------------------------------------------------
            # Mark order confirmed
            # ----------------------------------------------------

            if (
                order.status
                == Order.Status.PENDING
            ):
                order.status = (
                    Order.Status.CONFIRMED
                )

                order.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )

            return payment

    # ============================================================
    # VERIFY PAYMENT BY PAYMENT ID
    # ============================================================

    @extend_schema(
        request=None,
        responses=PaymentSerializer,
    )
    @action(
        detail=True,
        methods=["post"],
    )
    def verify(self, request, pk=None):

        # --------------------------------------------------------
        # Find payment
        # --------------------------------------------------------

        try:
            payment = (
                Payment.objects
                .select_related(
                    "order",
                    "order__customer",
                )
                .get(
                    id=pk,
                    order__customer=request.user,
                )
            )

        except Payment.DoesNotExist:
            return Response(
                {
                    "detail": "Payment not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------------
        # Already successful
        # --------------------------------------------------------

        if (
            payment.status
            == Payment.Status.SUCCESSFUL
        ):
            return Response(
                PaymentSerializer(payment).data,
                status=status.HTTP_200_OK,
            )

        # --------------------------------------------------------
        # Already refunded
        # --------------------------------------------------------

        if (
            payment.status
            == Payment.Status.REFUNDED
        ):
            return Response(
                {
                    "detail": (
                        "This payment has already "
                        "been refunded."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Check Paystack configuration
        # --------------------------------------------------------

        if not settings.PAYSTACK_SECRET_KEY:
            return Response(
                {
                    "detail": (
                        "Paystack is not configured "
                        "on the server."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        reference = payment.transaction_reference

        headers = {
            "Authorization": (
                f"Bearer {settings.PAYSTACK_SECRET_KEY}"
            )
        }

        # --------------------------------------------------------
        # Ask Paystack to verify transaction
        # --------------------------------------------------------

        try:
            paystack_response = requests.get(
                (
                    f"{settings.PAYSTACK_BASE_URL}"
                    f"/transaction/verify/{reference}"
                ),
                headers=headers,
                timeout=30,
            )

            paystack_data = paystack_response.json()

        except requests.RequestException:
            return Response(
                {
                    "detail": (
                        "Unable to connect to Paystack."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except ValueError:
            return Response(
                {
                    "detail": (
                        "Invalid response received "
                        "from Paystack."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # --------------------------------------------------------
        # Check Paystack response
        # --------------------------------------------------------

        if (
            paystack_response.status_code >= 400
            or not paystack_data.get("status")
        ):
            return Response(
                {
                    "detail": paystack_data.get(
                        "message",
                        "Paystack verification failed.",
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        transaction_data = paystack_data.get(
            "data",
            {},
        )

        paystack_status = (
            transaction_data.get("status")
        )

        # --------------------------------------------------------
        # Payment was not successful
        # --------------------------------------------------------

        if paystack_status != "success":

            if paystack_status in [
                "failed",
                "abandoned",
                "reversed",
            ]:
                payment.status = (
                    Payment.Status.FAILED
                )

                payment.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )

            return Response(
                {
                    "detail": (
                        "Payment has not been "
                        "successfully completed."
                    ),
                    "paystack_status": (
                        paystack_status
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Verify payment amount
        # --------------------------------------------------------

        expected_amount = int(
            (
                payment.amount
                * Decimal("100")
            ).quantize(
                Decimal("1")
            )
        )

        received_amount = (
            transaction_data.get("amount")
        )

        if received_amount != expected_amount:

            payment.status = (
                Payment.Status.FAILED
            )

            payment.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "detail": (
                        "Payment amount does not "
                        "match the order amount."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Verify currency
        # --------------------------------------------------------

        received_currency = (
            transaction_data.get("currency")
        )

        if (
            received_currency
            != settings.PAYSTACK_CURRENCY
        ):

            payment.status = (
                Payment.Status.FAILED
            )

            payment.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "detail": (
                        "Payment currency does not "
                        "match the expected currency."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # FINALIZE ORDER
        # --------------------------------------------------------

        try:
            payment = (
                self.finalize_successful_payment(
                    payment
                )
            )

        except ValueError as exc:
            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_409_CONFLICT,
            )

        # --------------------------------------------------------
        # Return successful payment
        # --------------------------------------------------------

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_200_OK,
        )

    # ============================================================
    # VERIFY PAYMENT BY PAYSTACK REFERENCE
    # ============================================================

    @extend_schema(
        request=PaymentReferenceVerifySerializer,
        responses=PaymentSerializer,
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="verify-reference",
    )
    def verify_reference(self, request):

        # --------------------------------------------------------
        # Validate reference
        # --------------------------------------------------------

        serializer = PaymentReferenceVerifySerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        reference = serializer.validated_data[
            "reference"
        ]

        # --------------------------------------------------------
        # Find payment using Paystack reference
        # --------------------------------------------------------

        try:
            payment = (
                Payment.objects
                .select_related(
                    "order",
                    "order__customer",
                )
                .get(
                    transaction_reference=reference,
                    order__customer=request.user,
                )
            )

        except Payment.DoesNotExist:
            return Response(
                {
                    "detail": "Payment not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------------
        # Already successful
        # --------------------------------------------------------

        if (
            payment.status
            == Payment.Status.SUCCESSFUL
        ):
            return Response(
                PaymentSerializer(payment).data,
                status=status.HTTP_200_OK,
            )

        # --------------------------------------------------------
        # Already refunded
        # --------------------------------------------------------

        if (
            payment.status
            == Payment.Status.REFUNDED
        ):
            return Response(
                {
                    "detail": (
                        "This payment has already "
                        "been refunded."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Check Paystack configuration
        # --------------------------------------------------------

        if not settings.PAYSTACK_SECRET_KEY:
            return Response(
                {
                    "detail": (
                        "Paystack is not configured "
                        "on the server."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        headers = {
            "Authorization": (
                f"Bearer {settings.PAYSTACK_SECRET_KEY}"
            )
        }

        # --------------------------------------------------------
        # Verify transaction with Paystack
        # --------------------------------------------------------

        try:
            paystack_response = requests.get(
                (
                    f"{settings.PAYSTACK_BASE_URL}"
                    f"/transaction/verify/{reference}"
                ),
                headers=headers,
                timeout=30,
            )

            paystack_data = paystack_response.json()

        except requests.RequestException:
            return Response(
                {
                    "detail": (
                        "Unable to connect to Paystack."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except ValueError:
            return Response(
                {
                    "detail": (
                        "Invalid response received "
                        "from Paystack."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # --------------------------------------------------------
        # Check Paystack response
        # --------------------------------------------------------

        if (
            paystack_response.status_code >= 400
            or not paystack_data.get("status")
        ):
            return Response(
                {
                    "detail": paystack_data.get(
                        "message",
                        "Paystack verification failed.",
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        transaction_data = paystack_data.get(
            "data",
            {},
        )

        paystack_status = (
            transaction_data.get("status")
        )

        # --------------------------------------------------------
        # Payment not successful
        # --------------------------------------------------------

        if paystack_status != "success":

            if paystack_status in [
                "failed",
                "abandoned",
                "reversed",
            ]:
                payment.status = (
                    Payment.Status.FAILED
                )

                payment.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )

            return Response(
                {
                    "detail": (
                        "Payment has not been "
                        "successfully completed."
                    ),
                    "paystack_status": (
                        paystack_status
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Verify amount
        # --------------------------------------------------------

        expected_amount = int(
            (
                payment.amount
                * Decimal("100")
            ).quantize(
                Decimal("1")
            )
        )

        received_amount = (
            transaction_data.get("amount")
        )

        if received_amount != expected_amount:

            payment.status = (
                Payment.Status.FAILED
            )

            payment.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "detail": (
                        "Payment amount does not "
                        "match the order amount."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Verify currency
        # --------------------------------------------------------

        received_currency = (
            transaction_data.get("currency")
        )

        if (
            received_currency
            != settings.PAYSTACK_CURRENCY
        ):

            payment.status = (
                Payment.Status.FAILED
            )

            payment.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "detail": (
                        "Payment currency does not "
                        "match the expected currency."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # FINALIZE ORDER
        # --------------------------------------------------------

        try:
            payment = (
                self.finalize_successful_payment(
                    payment
                )
            )

        except ValueError as exc:
            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_409_CONFLICT,
            )

        # --------------------------------------------------------
        # Return successful payment
        # --------------------------------------------------------

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_200_OK,
        )