from decimal import Decimal
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from orders.models import Order, OrderItem
from catalog.models import Category, Product
from cart.models import Cart, CartItem
from .models import Payment


User = get_user_model()


@override_settings(
    PAYSTACK_SECRET_KEY="test-secret-key",
    PAYSTACK_BASE_URL="https://api.paystack.co",
    PAYSTACK_CURRENCY="GHS",
)
class PaymentVerificationTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.customer = User.objects.create_user(
            username="payment_test_customer",
            password="TestPassword123!",
            role=User.Role.CUSTOMER,
        )

        self.category = Category.objects.create(
            name="Payment Test Category",
        )

        self.product = Product.objects.create(
            name="Payment Test Product",
            sku="PAYMENT-TEST-001",
            description="Product used for payment tests",
            price=Decimal("100.00"),
            stock_quantity=10,
            category=self.category,
            seller=self.customer,
            condition="NEW",
            is_active=True,
        )

        self.order = Order.objects.create(
            customer=self.customer,
            shipping_address="Test Address",
            shipping_fee=Decimal("0.00"),
            subtotal=Decimal("100.00"),
            total=Decimal("100.00"),
            status=Order.Status.PENDING,
        )

        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            product_name=self.product.name,
            product_price=Decimal("100.00"),
            quantity=1,
            subtotal=Decimal("100.00"),
        )

        self.payment = Payment.objects.create(
            order=self.order,
            amount=Decimal("100.00"),
            payment_method="PAYSTACK",
            status=Payment.Status.PENDING,
            transaction_reference="TEST-PAYMENT-001",
        )

        self.client.force_authenticate(
            user=self.customer
        )

    def mock_paystack_response(
        self,
        amount=10000,
        currency="GHS",
        payment_status="success",
    ):
        response = Mock()
        response.status_code = 200

        response.json.return_value = {
            "status": True,
            "message": "Verification successful",
            "data": {
                "status": payment_status,
                "amount": amount,
                "currency": currency,
            },
        }

        return response

    # =========================================================
    # 1. WRONG AMOUNT
    # =========================================================

    @patch("payments.views.requests.get")
    def test_wrong_amount_is_rejected(self, mock_get):

        mock_get.return_value = self.mock_paystack_response(
            amount=9999,
            currency="GHS",
        )

        response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/verify/"
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.Status.FAILED,
        )

        self.assertIn(
            "amount",
            response.data["detail"].lower(),
        )

    # =========================================================
    # 2. WRONG CURRENCY
    # =========================================================

    @patch("payments.views.requests.get")
    def test_wrong_currency_is_rejected(self, mock_get):

        mock_get.return_value = self.mock_paystack_response(
            amount=10000,
            currency="USD",
        )

        response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/verify/"
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.Status.FAILED,
        )

        self.assertIn(
            "currency",
            response.data["detail"].lower(),
        )

    # =========================================================
    # 3. FAILED PAYSTACK TRANSACTION
    # =========================================================

    @patch("payments.views.requests.get")
    def test_failed_paystack_transaction_is_rejected(
        self,
        mock_get,
    ):

        mock_get.return_value = self.mock_paystack_response(
            amount=10000,
            currency="GHS",
            payment_status="failed",
        )

        response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/verify/"
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.Status.FAILED,
        )

        self.assertEqual(
            response.data["paystack_status"],
            "failed",
        )

    # =========================================================
    # 4. SUCCESSFUL PAYMENT FINALIZATION
    # =========================================================

    @patch("payments.views.requests.get")
    def test_successful_payment_finalizes_order(
        self,
        mock_get,
    ):

        cart = Cart.objects.create(
            customer=self.customer,
        )

        cart_item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=1,
        )

        mock_get.return_value = self.mock_paystack_response(
            amount=10000,
            currency="GHS",
            payment_status="success",
        )

        response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/verify/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.product.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.Status.SUCCESSFUL,
        )

        self.assertEqual(
            self.order.status,
            Order.Status.CONFIRMED,
        )

        self.assertEqual(
            self.product.stock_quantity,
            9,
        )

        self.assertFalse(
            CartItem.objects.filter(
                id=cart_item.id,
            ).exists()
        )

    # =========================================================
    # 5. PAYMENT IDEMPOTENCY / REPLAY PROTECTION
    # =========================================================

    @patch("payments.views.requests.get")
    def test_successful_payment_is_idempotent(
        self,
        mock_get,
    ):

        mock_get.return_value = self.mock_paystack_response(
            amount=10000,
            currency="GHS",
            payment_status="success",
        )

        first_response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/verify/"
        )

        self.assertEqual(
            first_response.status_code,
            200,
        )

        self.product.refresh_from_db()

        stock_after_first_payment = (
            self.product.stock_quantity
        )

        second_response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/verify/"
        )

        self.assertEqual(
            second_response.status_code,
            200,
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock_quantity,
            stock_after_first_payment,
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.Status.SUCCESSFUL,
        )

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.status,
            Order.Status.CONFIRMED,
        )

    # =========================================================
    # 6. ABANDONED PAYSTACK TRANSACTION
    # =========================================================

    @patch("payments.views.requests.get")
    def test_abandoned_paystack_transaction_is_rejected(
        self,
        mock_get,
    ):

        mock_get.return_value = self.mock_paystack_response(
            amount=10000,
            currency="GHS",
            payment_status="abandoned",
        )

        response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/verify/"
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.Status.FAILED,
        )

        self.assertEqual(
            response.data["paystack_status"],
            "abandoned",
        )

    # =========================================================
    # 7. REVERSED PAYSTACK TRANSACTION
    # =========================================================

    @patch("payments.views.requests.get")
    def test_reversed_paystack_transaction_is_rejected(
        self,
        mock_get,
    ):

        mock_get.return_value = self.mock_paystack_response(
            amount=10000,
            currency="GHS",
            payment_status="reversed",
        )

        response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/verify/"
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.Status.FAILED,
        )

        self.assertEqual(
            response.data["paystack_status"],
            "reversed",
        )

    # =========================================================
    # 8. PAYSTACK HTTP ERROR
    # =========================================================

    @patch("payments.views.requests.get")
    def test_paystack_http_error_is_rejected(
        self,
        mock_get,
    ):

        response_from_paystack = Mock()

        response_from_paystack.status_code = 400

        response_from_paystack.json.return_value = {
            "status": False,
            "message": "Invalid transaction reference",
        }

        mock_get.return_value = response_from_paystack

        response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/verify/"
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.Status.PENDING,
        )

    # =========================================================
    # 9. INVALID PAYSTACK RESPONSE
    # =========================================================

    @patch("payments.views.requests.get")
    def test_invalid_paystack_response_returns_bad_gateway(
        self,
        mock_get,
    ):

        response_from_paystack = Mock()

        response_from_paystack.status_code = 200

        response_from_paystack.json.side_effect = ValueError(
            "Invalid JSON"
        )

        mock_get.return_value = response_from_paystack

        response = self.client.post(
            f"/api/v1/payments/{self.payment.id}/verify/"
        )

        self.assertEqual(
            response.status_code,
            502,
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.Status.PENDING,
        )

    # =========================================================
    # 10. VERIFY PAYMENT BY TRANSACTION REFERENCE
    # =========================================================

    @patch("payments.views.requests.get")
    def test_payment_can_be_verified_by_reference(
        self,
        mock_get,
    ):

        mock_get.return_value = self.mock_paystack_response(
            amount=10000,
            currency="GHS",
            payment_status="success",
        )

        response = self.client.post(
            "/api/v1/payments/verify-reference/",
            {
                "reference": (
                    self.payment.transaction_reference
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.product.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.Status.SUCCESSFUL,
        )

        self.assertEqual(
            self.order.status,
            Order.Status.CONFIRMED,
        )

        self.assertEqual(
            self.product.stock_quantity,
            9,
        )