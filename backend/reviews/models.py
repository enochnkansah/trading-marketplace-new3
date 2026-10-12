from django.conf import settings
from django.db import models

from catalog.models import Product
from orders.models import Order


class Review(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "product", "order"],
                name="unique_customer_product_order_review",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.name} - {self.rating}/5"