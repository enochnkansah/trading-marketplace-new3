from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = "PERCENTAGE", "Percentage"
        FIXED = "FIXED", "Fixed Amount"

    code = models.CharField(
        max_length=50,
        unique=True,
    )
    description = models.TextField(
        blank=True,
    )
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
    )
    discount_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    minimum_order_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    usage_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
    )
    used_count = models.PositiveIntegerField(
        default=0,
    )
    starts_at = models.DateTimeField(
        default=timezone.now,
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(
        default=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.code