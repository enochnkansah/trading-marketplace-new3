from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Category, Product


User = get_user_model()


class ProductSecurityTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.customer = User.objects.create_user(
            username="catalog_customer",
            email="catalogcustomer@example.com",
            password="Customer123!",
            role=User.Role.CUSTOMER,
        )

        self.seller = User.objects.create_user(
            username="catalog_seller",
            email="seller@example.com",
            password="Seller123!",
            role=User.Role.SELLER,
        )

        self.other_seller = User.objects.create_user(
            username="catalog_other_seller",
            email="otherseller@example.com",
            password="OtherSeller123!",
            role=User.Role.SELLER,
        )

        self.admin = User.objects.create_user(
            username="catalog_admin",
            email="admin@example.com",
            password="Admin123!",
            role=User.Role.ADMIN,
        )

        self.category = Category.objects.create(
            name="Catalog Test Category",
            description="Category used for catalog tests",
        )

        self.product = Product.objects.create(
            name="Seller Product",
            sku="CATALOG-TEST-001",
            description="Product belonging to the first seller",
            price=Decimal("500.00"),
            stock_quantity=10,
            category=self.category,
            seller=self.seller,
            condition="NEW",
            is_active=True,
        )

        self.other_product = Product.objects.create(
            name="Other Seller Product",
            sku="CATALOG-TEST-002",
            description="Product belonging to another seller",
            price=Decimal("700.00"),
            stock_quantity=20,
            category=self.category,
            seller=self.other_seller,
            condition="NEW",
            is_active=True,
        )

    # =========================================================
    # 1. PUBLIC PRODUCT LIST
    # =========================================================

    def test_unauthenticated_user_can_list_products(self):
        response = self.client.get(
            "/api/v1/products/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    # =========================================================
    # 2. PUBLIC PRODUCT DETAIL
    # =========================================================

    def test_unauthenticated_user_can_view_product(self):
        response = self.client.get(
            f"/api/v1/products/{self.product.id}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["id"],
            self.product.id,
        )

    # =========================================================
    # 3. CUSTOMER CANNOT CREATE PRODUCT
    # =========================================================

    def test_customer_cannot_create_product(self):
        self.client.force_authenticate(
            user=self.customer
        )

        response = self.client.post(
            "/api/v1/products/",
            {
                "name": "Customer Product",
                "sku": "CUSTOMER-001",
                "description": (
                    "Customer should not create products"
                ),
                "price": "100.00",
                "stock_quantity": 5,
                "category": self.category.id,
                "condition": "NEW",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertFalse(
            Product.objects.filter(
                sku="CUSTOMER-001"
            ).exists()
        )

    # =========================================================
    # 4. SELLER CAN CREATE PRODUCT
    # =========================================================

    def test_seller_can_create_product(self):
        self.client.force_authenticate(
            user=self.seller
        )

        response = self.client.post(
            "/api/v1/products/",
            {
                "name": "New Seller Product",
                "sku": "SELLER-NEW-001",
                "description": "Seller created product",
                "price": "250.00",
                "stock_quantity": 15,
                "category": self.category.id,
                "condition": "NEW",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        product = Product.objects.get(
            sku="SELLER-NEW-001"
        )

        self.assertEqual(
            product.seller_id,
            self.seller.id,
        )

    # =========================================================
    # 5. SELLER CAN UPDATE OWN PRODUCT
    # =========================================================

    def test_seller_can_update_own_product(self):
        self.client.force_authenticate(
            user=self.seller
        )

        response = self.client.patch(
            f"/api/v1/products/{self.product.id}/",
            {
                "price": "450.00",
                "stock_quantity": 25,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.price,
            Decimal("450.00"),
        )

        self.assertEqual(
            self.product.stock_quantity,
            25,
        )

    # =========================================================
    # 6. SELLER CANNOT UPDATE ANOTHER SELLER'S PRODUCT
    # =========================================================

    def test_seller_cannot_update_other_seller_product(self):
        self.client.force_authenticate(
            user=self.seller
        )

        response = self.client.patch(
            f"/api/v1/products/{self.other_product.id}/",
            {
                "price": "1.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.other_product.refresh_from_db()

        self.assertEqual(
            self.other_product.price,
            Decimal("700.00"),
        )

    # =========================================================
    # 7. SELLER CANNOT DELETE ANOTHER SELLER'S PRODUCT
    # =========================================================

    def test_seller_cannot_delete_other_seller_product(self):
        self.client.force_authenticate(
            user=self.seller
        )

        response = self.client.delete(
            f"/api/v1/products/{self.other_product.id}/"
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertTrue(
            Product.objects.filter(
                id=self.other_product.id
            ).exists()
        )

    # =========================================================
    # 8. SELLER CAN DELETE OWN PRODUCT
    # =========================================================

    def test_seller_can_delete_own_product(self):
        self.client.force_authenticate(
            user=self.seller
        )

        response = self.client.delete(
            f"/api/v1/products/{self.product.id}/"
        )

        self.assertEqual(
            response.status_code,
            204,
        )

        self.assertFalse(
            Product.objects.filter(
                id=self.product.id
            ).exists()
        )

    # =========================================================
    # 9. ADMIN CAN UPDATE ANY PRODUCT
    # =========================================================

    def test_admin_can_update_any_product(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.patch(
            f"/api/v1/products/{self.other_product.id}/",
            {
                "price": "600.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.other_product.refresh_from_db()

        self.assertEqual(
            self.other_product.price,
            Decimal("600.00"),
        )

    # =========================================================
    # 10. ADMIN CAN DELETE ANY PRODUCT
    # =========================================================

    def test_admin_can_delete_any_product(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.delete(
            f"/api/v1/products/{self.other_product.id}/"
        )

        self.assertEqual(
            response.status_code,
            204,
        )

        self.assertFalse(
            Product.objects.filter(
                id=self.other_product.id
            ).exists()
        )