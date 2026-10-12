from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Category, Product
from cart.models import Cart, CartItem
from orders.models import Order, OrderItem


User = get_user_model()


class OrderSecurityTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # ============================================================
        # USERS
        # ============================================================

        self.customer = User.objects.create_user(
            username="order_customer",
            email="ordercustomer@example.com",
            password="Customer123!",
            role=User.Role.CUSTOMER,
        )

        self.other_customer = User.objects.create_user(
            username="order_other_customer",
            email="otherordercustomer@example.com",
            password="OtherCustomer123!",
            role=User.Role.CUSTOMER,
        )

        self.seller = User.objects.create_user(
            username="order_seller",
            email="orderseller@example.com",
            password="Seller123!",
            role=User.Role.SELLER,
        )

        self.other_seller = User.objects.create_user(
            username="order_other_seller",
            email="otherorderseller@example.com",
            password="OtherSeller123!",
            role=User.Role.SELLER,
        )

        self.admin = User.objects.create_user(
            username="order_admin",
            email="orderadmin@example.com",
            password="Admin123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
        )

        # ============================================================
        # CATEGORY
        # ============================================================

        self.category = Category.objects.create(
            name="Order Test Category",
            description="Category used for order tests",
        )

        # ============================================================
        # PRODUCTS
        # ============================================================

        self.product = Product.objects.create(
            name="Order Test Product",
            sku="ORDER-TEST-001",
            description="Product used for order tests",
            price=Decimal("100.00"),
            stock_quantity=20,
            category=self.category,
            seller=self.seller,
            condition="NEW",
            is_active=True,
        )

        self.other_product = Product.objects.create(
            name="Other Seller Product",
            sku="ORDER-TEST-002",
            description="Product belonging to another seller",
            price=Decimal("50.00"),
            stock_quantity=20,
            category=self.category,
            seller=self.other_seller,
            condition="NEW",
            is_active=True,
        )

        # ============================================================
        # CUSTOMER 1 ORDER
        # ============================================================

        self.order = Order.objects.create(
            customer=self.customer,
            order_number="ORD-TEST-0001",
            status=Order.Status.PENDING,
            subtotal=Decimal("200.00"),
            shipping_fee=Decimal("20.00"),
            discount_amount=Decimal("0.00"),
            total=Decimal("220.00"),
            shipping_address="Accra, Ghana",
        )

        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            product_name=self.product.name,
            product_price=self.product.price,
            quantity=2,
            subtotal=Decimal("200.00"),
        )

        # ============================================================
        # CUSTOMER 2 ORDER
        # ============================================================

        self.other_order = Order.objects.create(
            customer=self.other_customer,
            order_number="ORD-TEST-0002",
            status=Order.Status.PENDING,
            subtotal=Decimal("50.00"),
            shipping_fee=Decimal("10.00"),
            discount_amount=Decimal("0.00"),
            total=Decimal("60.00"),
            shipping_address="Kumasi, Ghana",
        )

        self.other_order_item = OrderItem.objects.create(
            order=self.other_order,
            product=self.other_product,
            product_name=self.other_product.name,
            product_price=self.other_product.price,
            quantity=1,
            subtotal=Decimal("50.00"),
        )

    # ================================================================
    # ORDER SECURITY TESTS
    # ================================================================

    def test_orders_require_authentication(self):
        response = self.client.get(
            "/api/v1/orders/"
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    def test_customer_can_view_own_orders(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.get(
            "/api/v1/orders/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        order_ids = [
            order["id"]
            for order in response.data
        ]

        self.assertIn(
            self.order.id,
            order_ids,
        )

        self.assertNotIn(
            self.other_order.id,
            order_ids,
        )

    def test_customer_can_view_own_order(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.get(
            f"/api/v1/orders/{self.order.id}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["id"],
            self.order.id,
        )

    def test_customer_cannot_view_another_customer_order(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.get(
            f"/api/v1/orders/{self.other_order.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_other_customer_cannot_view_order(self):
        self.client.force_authenticate(
            user=self.other_customer
        )

        response = self.client.get(
            f"/api/v1/orders/{self.order.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_seller_can_view_orders_containing_own_products(self):
        self.client.force_authenticate(
            user=self.seller
        )

        response = self.client.get(
            "/api/v1/orders/seller/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        order_ids = [
            order["id"]
            for order in response.data
        ]

        self.assertIn(
            self.order.id,
            order_ids,
        )

        self.assertNotIn(
            self.other_order.id,
            order_ids,
        )

    def test_seller_can_view_own_order_detail(self):
        self.client.force_authenticate(
            user=self.seller
        )

        response = self.client.get(
            f"/api/v1/orders/{self.order.id}/seller-detail/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_seller_cannot_view_another_sellers_order(self):
        self.client.force_authenticate(
            user=self.seller
        )

        response = self.client.get(
            f"/api/v1/orders/{self.other_order.id}/seller-detail/"
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_seller_can_update_own_order_status(self):
        self.client.force_authenticate(
            user=self.seller
        )

        response = self.client.patch(
            f"/api/v1/orders/{self.order.id}/seller-status/",
            {
                "status": "PROCESSING",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.status,
            "PROCESSING",
        )

    def test_seller_cannot_update_another_sellers_order(self):
        self.client.force_authenticate(
            user=self.seller
        )

        response = self.client.patch(
            f"/api/v1/orders/{self.other_order.id}/seller-status/",
            {
                "status": "PROCESSING",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.other_order.refresh_from_db()

        self.assertEqual(
            self.other_order.status,
            "PENDING",
        )

    def test_admin_can_view_all_orders(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            "/api/v1/orders/seller/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        order_ids = [
            order["id"]
            for order in response.data
        ]

        self.assertIn(
            self.order.id,
            order_ids,
        )

        self.assertIn(
            self.other_order.id,
            order_ids,
        )

    def test_admin_can_view_any_order_detail(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            f"/api/v1/orders/{self.other_order.id}/seller-detail/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_admin_can_update_order_status(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.patch(
            f"/api/v1/orders/{self.order.id}/seller-status/",
            {
                "status": "PROCESSING",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.order.refresh_from_db()

        self.assertEqual(
            self.order.status,
            "PROCESSING",
        )


# ====================================================================
# CHECKOUT TESTS
# ====================================================================

class CheckoutTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # ============================================================
        # USERS
        # ============================================================

        self.customer = User.objects.create_user(
            username="checkout_customer",
            email="checkoutcustomer@example.com",
            password="Customer123!",
            role=User.Role.CUSTOMER,
        )

        self.other_customer = User.objects.create_user(
            username="checkout_other_customer",
            email="checkoutother@example.com",
            password="OtherCustomer123!",
            role=User.Role.CUSTOMER,
        )

        self.seller = User.objects.create_user(
            username="checkout_seller",
            email="checkoutseller@example.com",
            password="Seller123!",
            role=User.Role.SELLER,
        )

        # ============================================================
        # CATEGORY
        # ============================================================

        self.category = Category.objects.create(
            name="Checkout Test Category",
            description="Category used for checkout tests",
        )

        # ============================================================
        # PRODUCT
        # ============================================================

        self.product = Product.objects.create(
            name="Checkout Product",
            sku="CHECKOUT-TEST-001",
            description="Product used for checkout tests",
            price=Decimal("100.00"),
            stock_quantity=10,
            category=self.category,
            seller=self.seller,
            condition="NEW",
            is_active=True,
        )

        # ============================================================
        # CUSTOMER CART
        # ============================================================

        self.cart = Cart.objects.create(
            customer=self.customer
        )

        self.cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2,
        )

    # ================================================================
    # AUTHENTICATION
    # ================================================================

    def test_checkout_requires_authentication(self):
        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "20.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    # ================================================================
    # BASIC CHECKOUT
    # ================================================================

    def test_customer_can_checkout(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "20.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertTrue(
            Order.objects.filter(
                customer=self.customer
            ).exists()
        )

    def test_checkout_creates_order_item(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "20.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        order_id = response.data["id"]

        self.assertTrue(
            OrderItem.objects.filter(
                order_id=order_id,
                product=self.product,
            ).exists()
        )

    # ================================================================
    # TOTAL CALCULATION
    # ================================================================

    def test_checkout_calculates_total_correctly(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "20.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertEqual(
            Decimal(str(response.data["subtotal"])),
            Decimal("200.00"),
        )

        self.assertEqual(
            Decimal(str(response.data["shipping_fee"])),
            Decimal("20.00"),
        )

        self.assertEqual(
            Decimal(str(response.data["total"])),
            Decimal("220.00"),
        )

    # ================================================================
    # PRICE SNAPSHOT
    # ================================================================

    def test_checkout_snapshots_product_price(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "0.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        order = Order.objects.get(
            id=response.data["id"]
        )

        item = order.items.get(
            product=self.product
        )

        self.assertEqual(
            item.product_price,
            Decimal("100.00"),
        )

    # ================================================================
    # STOCK
    # ================================================================

    def test_checkout_does_not_reduce_stock(self):
        self.client.force_authenticate(
            user=self.customer
        )

        initial_stock = self.product.stock_quantity

        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "0.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock_quantity,
            initial_stock,
        )

    def test_checkout_rejects_insufficient_stock(self):
        self.client.force_authenticate(
            user=self.customer
        )

        self.cart_item.quantity = 50
        self.cart_item.save()

        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "0.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_checkout_rejects_inactive_product(self):
        self.client.force_authenticate(
            user=self.customer
        )

        self.product.is_active = False
        self.product.save()

        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "0.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    # ================================================================
    # EMPTY CART
    # ================================================================

    def test_checkout_empty_cart_is_rejected(self):
        self.client.force_authenticate(
            user=self.customer
        )

        self.cart.items.all().delete()

        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "0.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    # ================================================================
    # CART ISOLATION
    # ================================================================

    def test_checkout_does_not_affect_another_customer_cart(self):
        other_cart = Cart.objects.create(
            customer=self.other_customer
        )

        other_item = CartItem.objects.create(
            cart=other_cart,
            product=self.product,
            quantity=1,
        )

        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "0.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertTrue(
            CartItem.objects.filter(
                id=other_item.id
            ).exists()
        )

    # ================================================================
    # ORDER STATUS
    # ================================================================

    def test_checkout_creates_pending_order(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_address": "Accra, Ghana",
                "shipping_fee": "0.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        order = Order.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            order.status,
            "PENDING",
        )