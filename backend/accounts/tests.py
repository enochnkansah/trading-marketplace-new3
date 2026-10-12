
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = "/api/v1/auth/register/"
        self.login_url = "/api/v1/auth/token/"
        self.refresh_url = "/api/v1/auth/token/refresh/"
        self.me_url = "/api/v1/auth/me/"

        self.user = User.objects.create_user(
            username="testcustomer",
            email="testcustomer@example.com",
            password="TestPassword123!",
            role=User.Role.CUSTOMER,
        )

    def test_customer_registration(self):
        response = self.client.post(
            self.register_url,
            {
                "username": "newcustomer",
                "email": "newcustomer@example.com",
                "phone_number": "0201111111",
                "password": "TestPassword123!",
                "password2": "TestPassword123!",
                "role": "CUSTOMER",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            User.objects.filter(username="newcustomer").exists()
        )

        new_user = User.objects.get(username="newcustomer")
        self.assertEqual(new_user.role, User.Role.CUSTOMER)
        self.assertTrue(new_user.check_password("TestPassword123!"))

    def test_admin_registration_is_rejected(self):
        response = self.client.post(
            self.register_url,
            {
                "username": "securitytestadmin",
                "email": "securitytestadmin@example.com",
                "phone_number": "0200000000",
                "password": "TestPassword123!",
                "password2": "TestPassword123!",
                "role": "ADMIN",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("role", response.data)

        self.assertFalse(
            User.objects.filter(
                username="securitytestadmin"
            ).exists()
        )

    def test_duplicate_username_is_rejected(self):
        response = self.client.post(
            self.register_url,
            {
                "username": "testcustomer",
                "email": "anothercustomer@example.com",
                "phone_number": "0202222222",
                "password": "TestPassword123!",
                "password2": "TestPassword123!",
                "role": "CUSTOMER",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_password_mismatch_is_rejected(self):
        response = self.client.post(
            self.register_url,
            {
                "username": "passwordmismatch",
                "email": "mismatch@example.com",
                "phone_number": "0203333333",
                "password": "TestPassword123!",
                "password2": "DifferentPassword123!",
                "role": "CUSTOMER",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_jwt_login(self):
        response = self.client.post(
            self.login_url,
            {
                "username": "testcustomer",
                "password": "TestPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_invalid_login_is_rejected(self):
        response = self.client.post(
            self.login_url,
            {
                "username": "testcustomer",
                "password": "WrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_jwt_refresh(self):
        login_response = self.client.post(
            self.login_url,
            {
                "username": "testcustomer",
                "password": "TestPassword123!",
            },
            format="json",
        )

        self.assertEqual(login_response.status_code, 200)

        refresh_response = self.client.post(
            self.refresh_url,
            {
                "refresh": login_response.data["refresh"],
            },
            format="json",
        )

        self.assertEqual(refresh_response.status_code, 200)
        self.assertIn("access", refresh_response.data)

    def test_invalid_refresh_token_is_rejected(self):
        response = self.client.post(
            self.refresh_url,
            {"refresh": "invalid-refresh-token"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_me_requires_authentication(self):
        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_access_me(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "testcustomer")

    def test_me_returns_customer_role(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["role"], "CUSTOMER")
