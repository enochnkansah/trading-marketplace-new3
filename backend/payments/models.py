from django.db import models
from orders.models import Order


class Payment(models.Model):

    class PaymentMethod(models.TextChoices):
        PAYSTACK = "PAYSTACK", "Paystack"
        MOBILE_MONEY = "MOBILE_MONEY", "Mobile Money"
        CARD = "CARD", "Card"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESSFUL = "SUCCESSFUL", "Successful"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name="payment",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    transaction_reference = models.CharField(
        max_length=100,
        unique=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"{self.order.order_number} - "
            f"{self.status}"
        )
    