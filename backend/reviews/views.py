from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
)

from orders.models import Order

from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ReviewSerializer

    queryset = Review.objects.select_related(
        "product",
        "customer",
        "order",
    ).all()

    def list(self, request):
        """
        Return reviews created by the authenticated customer.
        """
        reviews = (
            Review.objects.filter(
                customer=request.user,
                is_active=True,
            )
            .select_related(
                "product",
                "customer",
                "order",
            )
            .order_by("-created_at")
        )

        serializer = ReviewSerializer(
            reviews,
            many=True,
        )

        return Response(serializer.data)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
                description="Review ID.",
            )
        ],
        responses=ReviewSerializer,
    )
    def retrieve(self, request, pk=None):
        """
        Retrieve one review belonging to the authenticated customer.
        """
        review = get_object_or_404(
            Review.objects.select_related(
                "product",
                "customer",
                "order",
            ),
            id=pk,
            customer=request.user,
            is_active=True,
        )

        serializer = ReviewSerializer(review)

        return Response(serializer.data)

    def create(self, request):
        """
        Create a review for a product purchased by the customer
        in a delivered order.
        """
        serializer = ReviewSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        product_id = request.data.get("product")
        order_id = request.data.get("order")

        if not product_id or not order_id:
            return Response(
                {
                    "detail": "Product and order are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.get(
                id=order_id,
                customer=request.user,
            )
        except Order.DoesNotExist:
            return Response(
                {
                    "detail": "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only delivered orders can be reviewed.
        if order.status != Order.Status.DELIVERED:
            return Response(
                {
                    "detail": (
                        "You can only review products "
                        "from delivered orders."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Make sure the customer actually purchased
        # this product in this order.
        if not order.items.filter(
            product_id=product_id
        ).exists():
            return Response(
                {
                    "detail": (
                        "You can only review products "
                        "you purchased in this order."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent duplicate reviews.
        if Review.objects.filter(
            customer=request.user,
            product_id=product_id,
            order=order,
        ).exists():
            return Response(
                {
                    "detail": (
                        "You have already reviewed "
                        "this product for this order."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        review = Review.objects.create(
            customer=request.user,
            product_id=product_id,
            order=order,
            rating=serializer.validated_data["rating"],
            comment=serializer.validated_data.get(
                "comment",
                "",
            ),
        )

        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="product_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
                description="Product ID.",
            )
        ],
        responses=ReviewSerializer(many=True),
    )
    def product_reviews(
        self,
        request,
        product_id=None,
    ):
        """
        Return all active reviews for a product,
        including average rating and review count.
        """
        reviews = (
            Review.objects.filter(
                product_id=product_id,
                is_active=True,
            )
            .select_related(
                "product",
                "customer",
                "order",
            )
            .order_by("-created_at")
        )

        average_rating = reviews.aggregate(
            average=Avg("rating")
        )["average"]

        review_count = reviews.aggregate(
            count=Count("id")
        )["count"]

        serializer = ReviewSerializer(
            reviews,
            many=True,
        )

        return Response(
            {
                "product": product_id,
                "average_rating": (
                    round(float(average_rating), 2)
                    if average_rating
                    else 0
                ),
                "review_count": review_count,
                "reviews": serializer.data,
            }
        )