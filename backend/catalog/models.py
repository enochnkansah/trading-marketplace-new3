from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    slug = models.SlugField(
        max_length=120,
        unique=True,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    image = models.URLField(
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

    class Meta:
        ordering = ["name"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    CONDITION_CHOICES = [
        ("NEW", "New"),
        ("USED", "Used"),
        ("REFURBISHED", "Refurbished"),
    ]

    name = models.CharField(
        max_length=255,
    )

    sku = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.TextField()

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    stock_quantity = models.PositiveIntegerField(
        default=0,
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="products",
    )

    image = models.ImageField(
        upload_to="products/",
        blank=True,
        null=True,
    )

    condition = models.CharField(
        max_length=20,
        choices=CONDITION_CHOICES,
        default="NEW",
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
        return self.name