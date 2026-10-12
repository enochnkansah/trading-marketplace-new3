from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Category, Product
from .models import Cart, CartItem

User = get_user_model()


class CartSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # ---------------------------------------------------------
        # USERS
        # ---------------------------------------------------------

        self.customer = User.objects.create_user(
            username="cart_customer",
            email="cartcustomer@example.com",
            password="Customer123!",
            role=User.Role.CUSTOMER,
        )

        self.other_customer = User.objects.create_user(
            username="cart_other_customer",
            email="othercustomer@example.com",
            password="OtherCustomer123!",
            role=User.Role.CUSTOMER,
        )

        # ---------------------------------------------------------
        # CATEGORY
        # ---------------------------------------------------------

        self.category = Category.objects.create(
            name="Cart Test Category",
            description="Category used for cart tests",
        )

        # ---------------------------------------------------------
        # PRODUCTS
        # ---------------------------------------------------------

        self.product = Product.objects.create(
            name="Cart Test Product",
            sku="CART-TEST-001",
            description="Product used for cart tests",
            price=Decimal("100.00"),
            stock_quantity=10,
            category=self.category,
            seller=self.customer,
            condition="NEW",
            is_active=True,
        )

        self.other_product = Product.objects.create(
            name="Other Cart Product",
            sku="CART-TEST-002",
            description="Another product used for cart tests",
            price=Decimal("50.00"),
            stock_quantity=5,
            category=self.category,
            seller=self.customer,
            condition="NEW",
            is_active=True,
        )

        # ---------------------------------------------------------
        # CARTS
        # ---------------------------------------------------------

        self.customer_cart = Cart.objects.create(
            customer=self.customer
        )

        self.other_customer_cart = Cart.objects.create(
            customer=self.other_customer
        )

        # ---------------------------------------------------------
        # CART ITEMS
        # ---------------------------------------------------------

        self.customer_item = CartItem.objects.create(
            cart=self.customer_cart,
            product=self.product,
            quantity=2,
        )

        self.other_customer_item = CartItem.objects.create(
            cart=self.other_customer_cart,
            product=self.other_product,
            quantity=1,
        )

    # =========================================================
    # AUTHENTICATION
    # =========================================================

    def test_cart_requires_authentication(self):
        response = self.client.get(
            "/api/v1/cart/"
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    # =========================================================
    # VIEW CART
    # =========================================================

    def test_customer_can_view_own_cart(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.get(
            "/api/v1/cart/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["id"],
            self.customer_cart.id,
        )

        self.assertEqual(
            len(response.data["items"]),
            1,
        )

    def test_customer_only_sees_own_cart(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.get(
            "/api/v1/cart/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        product_ids = [
            item["product"]
            for item in response.data["items"]
        ]

        self.assertIn(
            self.product.id,
            product_ids,
        )

        self.assertNotIn(
            self.other_product.id,
            product_ids,
        )

    # =========================================================
    # ADD TO CART
    # =========================================================

    def test_customer_can_add_product_to_cart(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            "/api/v1/cart/add_item/",
            {
                "product": self.other_product.id,
                "quantity": 2,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        item = CartItem.objects.get(
            cart=self.customer_cart,
            product=self.other_product,
        )

        self.assertEqual(
            item.quantity,
            2,
        )

    def test_adding_existing_product_increases_quantity(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            "/api/v1/cart/add_item/",
            {
                "product": self.product.id,
                "quantity": 3,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.customer_item.refresh_from_db()

        self.assertEqual(
            self.customer_item.quantity,
            5,
        )

    def test_customer_cannot_add_more_than_available_stock(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            "/api/v1/cart/add_item/",
            {
                "product": self.product.id,
                "quantity": 20,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.customer_item.refresh_from_db()

        self.assertEqual(
            self.customer_item.quantity,
            2,
        )

    # =========================================================
    # UPDATE CART ITEM
    # =========================================================

    def test_customer_can_update_own_cart_item(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.patch(
            "/api/v1/cart/update_item/",
            {
                "item": self.customer_item.id,
                "quantity": 4,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.customer_item.refresh_from_db()

        self.assertEqual(
            self.customer_item.quantity,
            4,
        )

    def test_customer_cannot_update_another_customer_cart_item(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.patch(
            "/api/v1/cart/update_item/",
            {
                "item": self.other_customer_item.id,
                "quantity": 5,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.other_customer_item.refresh_from_db()

        self.assertEqual(
            self.other_customer_item.quantity,
            1,
        )

    # =========================================================
    # REMOVE CART ITEM
    # =========================================================

    def test_customer_cannot_remove_another_customer_cart_item(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.delete(
            f"/api/v1/cart/remove_item/"
            f"?item={self.other_customer_item.id}"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.assertTrue(
            CartItem.objects.filter(
                id=self.other_customer_item.id
            ).exists()
        )

    def test_customer_can_remove_own_cart_item(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.delete(
            f"/api/v1/cart/remove_item/"
            f"?item={self.customer_item.id}"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertFalse(
            CartItem.objects.filter(
                id=self.customer_item.id
            ).exists()
        )

    # =========================================================
    # CLEAR CART
    # =========================================================

    def test_customer_can_clear_own_cart(self):
        self.client.force_authenticate(
            user=self.customer
        )

        CartItem.objects.create(
            cart=self.customer_cart,
            product=self.other_product,
            quantity=1,
        )

        response = self.client.delete(
            "/api/v1/cart/clear/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertFalse(
            CartItem.objects.filter(
                cart=self.customer_cart
            ).exists()
        )

        # Make sure another customer's cart
        # was NOT affected.
        self.assertTrue(
            CartItem.objects.filter(
                cart=self.other_customer_cart,
                id=self.other_customer_item.id,
            ).exists()
        )