import uuid
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
)

from orders.models import Order

from .models import Shipment
from .serializers import (
    ShipmentCreateSerializer,
    ShipmentSerializer,
)


class ShipmentViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ShipmentSerializer
    queryset = Shipment.objects.select_related("order").all()

    def list(self, request):
        shipments = (
            Shipment.objects
            .filter(order__customer=request.user)
            .select_related("order")
            .order_by("-created_at")
        )

        serializer = ShipmentSerializer(
            shipments,
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
                description="Shipment ID.",
            )
        ],
        responses=ShipmentSerializer,
    )
    def retrieve(self, request, pk=None):
        try:
            shipment = (
                Shipment.objects
                .select_related("order")
                .get(
                    id=pk,
                    order__customer=request.user,
                )
            )
        except Shipment.DoesNotExist:
            return Response(
                {
                    "detail": "Shipment not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ShipmentSerializer(shipment)

        return Response(serializer.data)

    @extend_schema(
        request=ShipmentCreateSerializer,
        responses=ShipmentSerializer,
    )
    @action(
        detail=False,
        methods=["post"],
    )
    def create_shipment(self, request):
        serializer = ShipmentCreateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        order_id = serializer.validated_data["order"]
        courier = serializer.validated_data.get(
            "courier",
            "",
        )
        estimated_delivery = serializer.validated_data.get(
            "estimated_delivery"
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

        if order.status != Order.Status.CONFIRMED:
            return Response(
                {
                    "detail": (
                        "A shipment can only be created "
                        "for a confirmed order."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(order, "shipment"):
            return Response(
                {
                    "detail": (
                        "A shipment already exists "
                        "for this order."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        tracking_number = (
            f"TRK-"
            f"{uuid.uuid4().hex[:12].upper()}"
        )

        shipment = Shipment.objects.create(
            order=order,
            tracking_number=tracking_number,
            courier=courier,
            status=Shipment.Status.PROCESSING,
            estimated_delivery=estimated_delivery,
            delivery_address=order.shipping_address,
        )

        serializer = ShipmentSerializer(shipment)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        request=None,
        responses=ShipmentSerializer,
    )
    @action(
        detail=True,
        methods=["post"],
    )
    def ship(self, request, pk=None):
        try:
            shipment = (
                Shipment.objects
                .select_related("order")
                .get(
                    id=pk,
                    order__customer=request.user,
                )
            )
        except Shipment.DoesNotExist:
            return Response(
                {
                    "detail": "Shipment not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if shipment.status != Shipment.Status.PROCESSING:
            return Response(
                {
                    "detail": (
                        "Only processing shipments "
                        "can be shipped."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        shipment.status = Shipment.Status.SHIPPED
        shipment.shipped_at = timezone.now()

        shipment.save(
            update_fields=[
                "status",
                "shipped_at",
                "updated_at",
            ]
        )

        order = shipment.order
        order.status = Order.Status.SHIPPED

        order.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return Response(
            ShipmentSerializer(shipment).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=None,
        responses=ShipmentSerializer,
    )
    @action(
        detail=True,
        methods=["post"],
    )
    def transit(self, request, pk=None):
        try:
            shipment = (
                Shipment.objects
                .select_related("order")
                .get(
                    id=pk,
                    order__customer=request.user,
                )
            )
        except Shipment.DoesNotExist:
            return Response(
                {
                    "detail": "Shipment not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if shipment.status != Shipment.Status.SHIPPED:
            return Response(
                {
                    "detail": (
                        "Only shipped shipments "
                        "can enter transit."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        shipment.status = Shipment.Status.IN_TRANSIT

        shipment.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return Response(
            ShipmentSerializer(shipment).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=None,
        responses=ShipmentSerializer,
    )
    @action(
        detail=True,
        methods=["post"],
    )
    def out_for_delivery(self, request, pk=None):
        try:
            shipment = (
                Shipment.objects
                .select_related("order")
                .get(
                    id=pk,
                    order__customer=request.user,
                )
            )
        except Shipment.DoesNotExist:
            return Response(
                {
                    "detail": "Shipment not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if shipment.status != Shipment.Status.IN_TRANSIT:
            return Response(
                {
                    "detail": (
                        "Only shipments in transit "
                        "can go out for delivery."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        shipment.status = (
            Shipment.Status.OUT_FOR_DELIVERY
        )

        shipment.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return Response(
            ShipmentSerializer(shipment).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=None,
        responses=ShipmentSerializer,
    )
    @action(
        detail=True,
        methods=["post"],
    )
    def deliver(self, request, pk=None):
        try:
            shipment = (
                Shipment.objects
                .select_related("order")
                .get(
                    id=pk,
                    order__customer=request.user,
                )
            )
        except Shipment.DoesNotExist:
            return Response(
                {
                    "detail": "Shipment not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if shipment.status != Shipment.Status.OUT_FOR_DELIVERY:
            return Response(
                {
                    "detail": (
                        "Only shipments out for "
                        "delivery can be delivered."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        shipment.status = Shipment.Status.DELIVERED
        shipment.delivered_at = timezone.now()

        shipment.save(
            update_fields=[
                "status",
                "delivered_at",
                "updated_at",
            ]
        )

        order = shipment.order
        order.status = Order.Status.DELIVERED

        order.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return Response(
            ShipmentSerializer(shipment).data,
            status=status.HTTP_200_OK,
        )