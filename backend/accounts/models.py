from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        SELLER = "SELLER", "Seller"
        ADMIN = "ADMIN", "Admin"
        DELIVERY_AGENT = "DELIVERY_AGENT", "Delivery Agent"
        SUPPORT = "SUPPORT", "Support"

    email = models.EmailField(unique=True)

    phone_number = models.CharField(
        max_length=20,
        null=True,
        blank=True,
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        Group,
        related_name="marketplace_users",
        blank=True,
        help_text="The groups this user belongs to.",
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name="marketplace_users",
        blank=True,
        help_text="Specific permissions for this user.",
    )

    def __str__(self):
        return self.email