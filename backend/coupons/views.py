from decimal import Decimal

from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Coupon
from .permissions import IsSellerOrAdmin
from .serializers import (
    ApplyCouponSerializer,
    CouponSerializer,
)


class CouponViewSet(viewsets.ModelViewSet):
    serializer_class = CouponSerializer
    permission_classes = [IsSellerOrAdmin]

    def get_queryset(self):
        return Coupon.objects.all().order_by("-created_at")

    @action(
        detail=False,
        methods=["post"],
        url_path="apply",
        permission_classes=[IsAuthenticated],
    )
    def apply(self, request):
        serializer = ApplyCouponSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        code = serializer.validated_data["code"]
        subtotal = serializer.validated_data["subtotal"]

        try:
            coupon = Coupon.objects.get(
                code=code
            )
        except Coupon.DoesNotExist:
            return Response(
                {
                    "detail": "Coupon not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        now = timezone.now()

        if not coupon.is_active:
            return Response(
                {
                    "detail": "This coupon is inactive."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if now < coupon.starts_at:
            return Response(
                {
                    "detail": (
                        "This coupon is not active yet."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            coupon.expires_at
            and now > coupon.expires_at
        ):
            return Response(
                {
                    "detail": "This coupon has expired."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            coupon.usage_limit is not None
            and coupon.used_count
            >= coupon.usage_limit
        ):
            return Response(
                {
                    "detail": (
                        "This coupon has reached "
                        "its usage limit."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            subtotal
            < coupon.minimum_order_amount
        ):
            return Response(
                {
                    "detail": (
                        "Minimum order amount is "
                        f"{coupon.minimum_order_amount}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            coupon.discount_type
            == Coupon.DiscountType.PERCENTAGE
        ):
            discount = (
                subtotal
                * (
                    coupon.discount_value
                    / Decimal("100")
                )
            )
        else:
            discount = coupon.discount_value

        discount = min(
            discount,
            subtotal,
        )

        final_amount = (
            subtotal - discount
        )

        return Response(
            {
                "coupon": coupon.code,
                "discount_type": coupon.discount_type,
                "discount_value": coupon.discount_value,
                "subtotal": subtotal,
                "discount_amount": discount,
                "final_amount": final_amount,
            },
            status=status.HTTP_200_OK,
        )