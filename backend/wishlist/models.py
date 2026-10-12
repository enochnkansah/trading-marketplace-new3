from django.conf import settings
from django.db import models

from catalog.models import Product


class Wishlist(models.Model):
    customer = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist",
    )
    products = models.ManyToManyField(
        Product,
        related_name="wishlisted_by",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wishlist for {self.customer.username}"