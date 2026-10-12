from django.db import models
from orders.models import Order


class Shipment(models.Model):

    class Status(models.TextChoices):
        PROCESSING = "PROCESSING", "Processing"
        SHIPPED = "SHIPPED", "Shipped"
        IN_TRANSIT = "IN_TRANSIT", "In Transit"
        OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for Delivery"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name="shipment",
    )

    tracking_number = models.CharField(
        max_length=100,
        unique=True,
    )

    courier = models.CharField(
        max_length=150,
        blank=True,
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PROCESSING,
    )

    estimated_delivery = models.DateField(
        null=True,
        blank=True,
    )

    shipped_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    delivery_address = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.tracking_number