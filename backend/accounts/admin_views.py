from decimal import Decimal
from datetime import timedelta

from django.db.models import Q, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone

from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from catalog.models import Product
from orders.models import Order, OrderItem
from payments.models import Payment

from drf_spectacular.utils import (
    extend_schema,
    inline_serializer,
    OpenApiParameter,
    OpenApiTypes,
)


# ============================================================
# ADMIN ACCESS HELPER
# ============================================================

class IsAdminUser:
    """
    Helper used to verify that the authenticated user
    has the ADMIN role.
    """

    @staticmethod
    def check(request):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


# ============================================================
# ADMIN DASHBOARD
# ============================================================

class AdminDashboardView(APIView):
    """
    Admin dashboard statistics.

    GET /api/v1/admin/dashboard/
    """

    permission_classes = [IsAuthenticated]
    
    
    
    @extend_schema(
        operation_id="admin_dashboard_retrieve",
        responses=OpenApiTypes.OBJECT,
    )
    def get(self, request):
        if not IsAdminUser.check(request):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        successful_payments = Payment.objects.filter(
            status=Payment.Status.SUCCESSFUL
        )

        successful_revenue = (
            successful_payments.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        delivered_sales = (
            Order.objects.filter(
                status=Order.Status.DELIVERED
            ).aggregate(
                total=Sum("total")
            )["total"]
            or Decimal("0.00")
        )

        data = {
            "users": {
                "total": User.objects.count(),

                "customers": User.objects.filter(
                    role=User.Role.CUSTOMER
                ).count(),

                "sellers": User.objects.filter(
                    role=User.Role.SELLER
                ).count(),

                "admins": User.objects.filter(
                    role=User.Role.ADMIN
                ).count(),

                "active": User.objects.filter(
                    is_active=True
                ).count(),

                "inactive": User.objects.filter(
                    is_active=False
                ).count(),
            },

            "products": {
                "total": Product.objects.count(),

                "active": Product.objects.filter(
                    is_active=True
                ).count(),

                "inactive": Product.objects.filter(
                    is_active=False
                ).count(),

                "out_of_stock": Product.objects.filter(
                    stock_quantity=0
                ).count(),
            },

            "orders": {
                "total": Order.objects.count(),

                "pending": Order.objects.filter(
                    status=Order.Status.PENDING
                ).count(),

                "confirmed": Order.objects.filter(
                    status=Order.Status.CONFIRMED
                ).count(),

                "processing": Order.objects.filter(
                    status=Order.Status.PROCESSING
                ).count(),

                "shipped": Order.objects.filter(
                    status=Order.Status.SHIPPED
                ).count(),

                "delivered": Order.objects.filter(
                    status=Order.Status.DELIVERED
                ).count(),

                "cancelled": Order.objects.filter(
                    status=Order.Status.CANCELLED
                ).count(),

                "refunded": Order.objects.filter(
                    status=Order.Status.REFUNDED
                ).count(),
            },

            "payments": {
                "total": Payment.objects.count(),

                "successful": successful_payments.count(),

                "pending": Payment.objects.filter(
                    status=Payment.Status.PENDING
                ).count(),

                "failed": Payment.objects.filter(
                    status=Payment.Status.FAILED
                ).count(),

                "refunded": Payment.objects.filter(
                    status=Payment.Status.REFUNDED
                ).count(),

                "successful_revenue": successful_revenue,
            },

            "sales": {
                "delivered_sales": delivered_sales,
            },
        }

        return Response(data)


# ============================================================
# ADMIN USERS
# ============================================================

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_verified",
            "is_active",
            "date_joined",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "username",
            "date_joined",
            "created_at",
        ]


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "role",
            "is_verified",
            "is_active",
        ]


class AdminUsersView(APIView):
    """
    GET /api/v1/admin/users/

    Optional filters:

    ?search=patience
    ?role=CUSTOMER
    ?role=SELLER
    ?role=ADMIN
    ?status=active
    ?status=inactive
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_users_list",
        parameters=[
            OpenApiParameter("search", str, required=False),
            OpenApiParameter("role", str, required=False),
            OpenApiParameter("status", str, required=False),
        ],
        responses=OpenApiTypes.OBJECT,
    )
    def get(self, request):
        if not IsAdminUser.check(request):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        users = User.objects.all().order_by("-created_at")

        search = request.query_params.get(
            "search",
            "",
        ).strip()

        role = request.query_params.get(
            "role",
            "",
        ).strip().upper()

        status = request.query_params.get(
            "status",
            "",
        ).strip().lower()

        if search:
            users = users.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        valid_roles = [
            User.Role.CUSTOMER,
            User.Role.SELLER,
            User.Role.ADMIN,
        ]

        if role in valid_roles:
            users = users.filter(
                role=role
            )

        if status == "active":
            users = users.filter(
                is_active=True
            )

        elif status == "inactive":
            users = users.filter(
                is_active=False
            )

        serializer = AdminUserSerializer(
            users,
            many=True,
        )

        return Response(
            {
                "count": users.count(),
                "results": serializer.data,
            }
        )


class AdminUserDetailView(APIView):
    """
    PATCH /api/v1/admin/users/<user_id>/
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_user_update",
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT},
    )
    def patch(self, request, user_id):
        if not IsAdminUser.check(request):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        try:
            user = User.objects.get(
                id=user_id
            )

        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=404,
            )

        # Prevent an admin from disabling their own account.
        if (
            user.id == request.user.id
            and request.data.get("is_active") is False
        ):
            return Response(
                {
                    "detail": (
                        "You cannot deactivate "
                        "your own admin account."
                    )
                },
                status=400,
            )

        serializer = AdminUserUpdateSerializer(
            user,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                AdminUserSerializer(user).data
            )

        return Response(
            serializer.errors,
            status=400,
        )


# ============================================================
# ADMIN PRODUCTS
# ============================================================

class AdminProductSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(
        source="seller.username",
        read_only=True,
    )

    seller_email = serializers.EmailField(
        source="seller.email",
        read_only=True,
    )

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "sku",
            "description",
            "price",
            "stock_quantity",
            "category",
            "category_name",
            "seller",
            "seller_username",
            "seller_email",
            "image",
            "condition",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "seller",
            "seller_username",
            "seller_email",
            "category_name",
            "created_at",
            "updated_at",
        ]


class AdminProductUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product

        fields = [
            "name",
            "sku",
            "description",
            "price",
            "stock_quantity",
            "category",
            "condition",
            "is_active",
        ]


class AdminProductsView(APIView):
    """
    GET /api/v1/admin/products/

    Optional filters:

    ?search=samsung
    ?category=1
    ?seller=6
    ?status=active
    ?status=inactive
    ?stock=out
    ?stock=available
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_products_list",
        parameters=[
            OpenApiParameter("search", str, required=False),
            OpenApiParameter("category", str, required=False),
            OpenApiParameter("seller", str, required=False),
            OpenApiParameter("status", str, required=False),
            OpenApiParameter("stock", str, required=False),
        ],
        responses=OpenApiTypes.OBJECT,
    )
    def get(self, request):
        if not IsAdminUser.check(request):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        products = (
            Product.objects
            .select_related(
                "seller",
                "category",
            )
            .all()
            .order_by("-created_at")
        )

        search = request.query_params.get(
            "search",
            "",
        ).strip()

        category = request.query_params.get(
            "category",
            "",
        ).strip()

        seller = request.query_params.get(
            "seller",
            "",
        ).strip()

        status = request.query_params.get(
            "status",
            "",
        ).strip().lower()

        stock = request.query_params.get(
            "stock",
            "",
        ).strip().lower()

        if search:
            products = products.filter(
                Q(name__icontains=search)
                | Q(sku__icontains=search)
                | Q(description__icontains=search)
                | Q(
                    seller__username__icontains=search
                )
            )

        if category.isdigit():
            products = products.filter(
                category_id=int(category)
            )

        if seller.isdigit():
            products = products.filter(
                seller_id=int(seller)
            )

        if status == "active":
            products = products.filter(
                is_active=True
            )

        elif status == "inactive":
            products = products.filter(
                is_active=False
            )

        if stock == "out":
            products = products.filter(
                stock_quantity=0
            )

        elif stock == "available":
            products = products.filter(
                stock_quantity__gt=0
            )

        serializer = AdminProductSerializer(
            products,
            many=True,
        )

        # Global product statistics.
        all_products = Product.objects.all()

        statistics = {
            "total": all_products.count(),

            "active": all_products.filter(
                is_active=True
            ).count(),

            "inactive": all_products.filter(
                is_active=False
            ).count(),

            "low_stock": all_products.filter(
                stock_quantity__gt=0,
                stock_quantity__lte=5,
            ).count(),

            "out_of_stock": all_products.filter(
                stock_quantity=0
            ).count(),
        }

        return Response(
            {
                "count": products.count(),
                "results": serializer.data,
                "statistics": statistics,
            }
        )


class AdminProductDetailView(APIView):
    """
    PATCH /api/v1/admin/products/<product_id>/
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_product_update",
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT},
    )
    def patch(self, request, product_id):
        if not IsAdminUser.check(request):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        try:
            product = (
                Product.objects
                .select_related(
                    "seller",
                    "category",
                )
                .get(id=product_id)
            )

        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found."},
                status=404,
            )

        serializer = AdminProductUpdateSerializer(
            product,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()

            product.refresh_from_db()

            return Response(
                AdminProductSerializer(product).data
            )

        return Response(
            serializer.errors,
            status=400,
        )


# ============================================================
# ADMIN ORDERS
# ============================================================

class AdminOrderItemSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(
        source="product.seller.username",
        read_only=True,
    )

    class Meta:
        model = OrderItem

        fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "quantity",
            "subtotal",
            "seller_username",
        ]

        read_only_fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "quantity",
            "subtotal",
            "seller_username",
        ]


class AdminOrderSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(
        source="customer.username",
        read_only=True,
    )

    customer_email = serializers.EmailField(
        source="customer.email",
        read_only=True,
    )

    customer_name = serializers.SerializerMethodField()

    items = AdminOrderItemSerializer(
        many=True,
        read_only=True,
    )

    payment_status = serializers.SerializerMethodField()

    payment_method = serializers.SerializerMethodField()

    transaction_reference = serializers.SerializerMethodField()

    class Meta:
        model = Order

        fields = [
            "id",
            "order_number",
            "status",
            "customer_username",
            "customer_name",
            "customer_email",
            "items",
            "subtotal",
            "shipping_fee",
            "coupon",
            "discount_amount",
            "total",
            "shipping_address",
            "payment_status",
            "payment_method",
            "transaction_reference",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

    def get_customer_name(self, obj):
        full_name = (
            f"{obj.customer.first_name} "
            f"{obj.customer.last_name}"
        ).strip()

        if full_name:
            return full_name

        return obj.customer.username

    def get_payment(self, obj):
        """
        Get the latest payment belonging to this order.

        The Payment model does not expose a 'payments'
        related_name, so we query Payment directly.
        """

        return (
            Payment.objects
            .filter(order=obj)
            .order_by("-id")
            .first()
        )

    def get_payment_status(self, obj):
        payment = self.get_payment(obj)

        if not payment:
            return None

        return payment.status

    def get_payment_method(self, obj):
        payment = self.get_payment(obj)

        if not payment:
            return None

        return payment.payment_method

    def get_transaction_reference(self, obj):
        payment = self.get_payment(obj)

        if not payment:
            return None

        return payment.transaction_reference


class AdminOrdersView(APIView):
    """
    GET /api/v1/admin/orders/

    Optional filters:

    ?search=ORD-123
    ?search=customer
    ?status=PENDING
    ?status=CONFIRMED
    ?status=PROCESSING
    ?status=SHIPPED
    ?status=DELIVERED
    ?status=CANCELLED
    ?status=REFUNDED
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_orders_list",
        parameters=[
            OpenApiParameter("search", str, required=False),
            OpenApiParameter("status", str, required=False),
        ],
        responses=OpenApiTypes.OBJECT,
    )
    def get(self, request):
        if not IsAdminUser.check(request):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        orders = (
            Order.objects
            .select_related("customer")
            .prefetch_related(
                "items__product",
            )
            .all()
            .order_by("-created_at")
        )

        search = request.query_params.get(
            "search",
            "",
        ).strip()

        status = request.query_params.get(
            "status",
            "",
        ).strip().upper()

        if search:
            orders = orders.filter(
                Q(order_number__icontains=search)
                | Q(
                    customer__username__icontains=search
                )
                | Q(
                    customer__email__icontains=search
                )
                | Q(
                    customer__first_name__icontains=search
                )
                | Q(
                    customer__last_name__icontains=search
                )
            ).distinct()

        valid_statuses = [
            Order.Status.PENDING,
            Order.Status.CONFIRMED,
            Order.Status.PROCESSING,
            Order.Status.SHIPPED,
            Order.Status.DELIVERED,
            Order.Status.CANCELLED,
            Order.Status.REFUNDED,
        ]

        if status in valid_statuses:
            orders = orders.filter(
                status=status
            )

        serializer = AdminOrderSerializer(
            orders,
            many=True,
        )

        # Global order statistics.
        all_orders = Order.objects.all()

        statistics = {
            "total": all_orders.count(),

            "pending": all_orders.filter(
                status=Order.Status.PENDING
            ).count(),

            "confirmed": all_orders.filter(
                status=Order.Status.CONFIRMED
            ).count(),

            "processing": all_orders.filter(
                status=Order.Status.PROCESSING
            ).count(),

            "shipped": all_orders.filter(
                status=Order.Status.SHIPPED
            ).count(),

            "delivered": all_orders.filter(
                status=Order.Status.DELIVERED
            ).count(),

            "cancelled": all_orders.filter(
                status=Order.Status.CANCELLED
            ).count(),

            "refunded": all_orders.filter(
                status=Order.Status.REFUNDED
            ).count(),
        }

        return Response(
            {
                "count": orders.count(),
                "results": serializer.data,
                "statistics": statistics,
            }
        )


class AdminOrderDetailView(APIView):
    """
    GET:
        /api/v1/admin/orders/<order_id>/

    PATCH:
        /api/v1/admin/orders/<order_id>/
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_order_detail_retrieve",
        responses={200: OpenApiTypes.OBJECT},
    )
    def get(self, request, order_id):
        if not IsAdminUser.check(request):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        try:
            order = (
                Order.objects
                .select_related("customer")
                .prefetch_related(
                    "items__product",
                )
                .get(id=order_id)
            )

        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=404,
            )

        serializer = AdminOrderSerializer(
            order
        )

        return Response(
            serializer.data
        )

    @extend_schema(
        operation_id="admin_order_detail_update",
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT},
    )
    def patch(self, request, order_id):
        if not IsAdminUser.check(request):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        try:
            order = (
                Order.objects
                .select_related("customer")
                .prefetch_related(
                    "items__product",
                )
                .get(id=order_id)
            )

        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=404,
            )

        new_status = request.data.get(
            "status"
        )

        valid_statuses = [
            Order.Status.PENDING,
            Order.Status.CONFIRMED,
            Order.Status.PROCESSING,
            Order.Status.SHIPPED,
            Order.Status.DELIVERED,
            Order.Status.CANCELLED,
            Order.Status.REFUNDED,
        ]

        if new_status not in valid_statuses:
            return Response(
                {
                    "status": [
                        "Invalid order status."
                    ]
                },
                status=400,
            )

        # A cancelled or refunded order cannot
        # return to an active state.
        if (
            order.status
            in [
                Order.Status.CANCELLED,
                Order.Status.REFUNDED,
            ]
            and new_status
            not in [
                Order.Status.CANCELLED,
                Order.Status.REFUNDED,
            ]
        ):
            return Response(
                {
                    "detail": (
                        "A cancelled or refunded "
                        "order cannot be returned "
                        "to an active status."
                    )
                },
                status=400,
            )

        order.status = new_status

        order.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        order.refresh_from_db()

        return Response(
            AdminOrderSerializer(order).data
        )


# ============================================================
# ADMIN ANALYTICS
# ============================================================

class AdminAnalyticsView(APIView):
    """
    GET /api/v1/admin/analytics/

    Marketplace-wide analytics for administrators.

    Supported ranges:

        ?range=today
        ?range=7d
        ?range=30d
        ?range=month
        ?range=all

    The selected range controls:

        - Revenue total
        - Average order value
        - Successful orders
        - Total units sold
        - Top products
        - Top sellers
        - Daily revenue
        - Monthly revenue
        - Recent successful sales

    The following remain marketplace-wide:

        - Order status statistics
        - Product inventory statistics
        - User statistics
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="admin_analytics_retrieve",
        parameters=[
            OpenApiParameter("range", str, required=False),
        ],
        responses=OpenApiTypes.OBJECT,
    )
    def get(self, request):
        # --------------------------------------------------------
        # ADMIN CHECK
        # --------------------------------------------------------

        if not IsAdminUser.check(request):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        # --------------------------------------------------------
        # DATE INFORMATION
        # --------------------------------------------------------

        now = timezone.now()

        today = now.date()

        month_start = today.replace(
            day=1
        )

        requested_range = (
            request.query_params.get(
                "range",
                "all",
            )
            .lower()
            .strip()
        )

        allowed_ranges = {
            "today",
            "7d",
            "30d",
            "month",
            "all",
        }

        if requested_range not in allowed_ranges:
            requested_range = "all"

        # Determine beginning of selected period.
        if requested_range == "today":
            range_start = today

        elif requested_range == "7d":
            # Today + previous 6 days = 7 days.
            range_start = (
                today - timedelta(days=6)
            )

        elif requested_range == "30d":
            # Today + previous 29 days = 30 days.
            range_start = (
                today - timedelta(days=29)
            )

        elif requested_range == "month":
            range_start = month_start

        else:
            range_start = None

        # --------------------------------------------------------
        # SUCCESSFUL PAYMENTS
        # --------------------------------------------------------

        successful_payments = Payment.objects.filter(
            status=Payment.Status.SUCCESSFUL
        )

        # Payments inside selected range.
        period_payments = successful_payments

        if range_start is not None:
            period_payments = (
                period_payments.filter(
                    created_at__date__gte=range_start
                )
            )

        # --------------------------------------------------------
        # ORDER STATISTICS
        # --------------------------------------------------------

        all_orders = Order.objects.all()

        total_orders = all_orders.count()

        pending_orders = all_orders.filter(
            status=Order.Status.PENDING
        ).count()

        confirmed_orders = all_orders.filter(
            status=Order.Status.CONFIRMED
        ).count()

        processing_orders = all_orders.filter(
            status=Order.Status.PROCESSING
        ).count()

        shipped_orders = all_orders.filter(
            status=Order.Status.SHIPPED
        ).count()

        delivered_orders = all_orders.filter(
            status=Order.Status.DELIVERED
        ).count()

        cancelled_orders = all_orders.filter(
            status=Order.Status.CANCELLED
        ).count()

        refunded_orders = all_orders.filter(
            status=Order.Status.REFUNDED
        ).count()

        # --------------------------------------------------------
        # SUCCESSFUL ORDERS
        # --------------------------------------------------------

        successful_order_ids = (
            period_payments.values(
                "order_id"
            )
        )

        successful_order_count = (
            period_payments.count()
        )

        # --------------------------------------------------------
        # REVENUE
        # --------------------------------------------------------

        selected_revenue = (
            period_payments.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        # Today's revenue is always today's revenue,
        # regardless of the selected range.
        today_revenue = (
            successful_payments
            .filter(
                created_at__date=today
            )
            .aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        # Current month's revenue.
        this_month_revenue = (
            successful_payments
            .filter(
                created_at__date__gte=month_start
            )
            .aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        # All-time revenue.
        total_revenue = (
            successful_payments
            .aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        # --------------------------------------------------------
        # AVERAGE ORDER VALUE
        # --------------------------------------------------------

        if successful_order_count > 0:
            average_order_value = (
                selected_revenue
                / successful_order_count
            )
        else:
            average_order_value = Decimal(
                "0.00"
            )

        # --------------------------------------------------------
        # TOTAL UNITS SOLD
        # --------------------------------------------------------

        total_units_sold = (
            OrderItem.objects
            .filter(
                order_id__in=successful_order_ids
            )
            .aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        # --------------------------------------------------------
        # TOP PRODUCTS
        # --------------------------------------------------------

        top_products = (
            OrderItem.objects
            .filter(
                order_id__in=successful_order_ids
            )
            .values(
                "product_id",
                "product_name",
            )
            .annotate(
                units_sold=Sum("quantity"),
                revenue=Sum("subtotal"),
            )
            .order_by(
                "-revenue"
            )[:10]
        )

        top_products_data = []

        for item in top_products:
            top_products_data.append(
                {
                    "product_id": item[
                        "product_id"
                    ],

                    "product_name": item[
                        "product_name"
                    ],

                    "units_sold": (
                        item["units_sold"]
                        or 0
                    ),

                    "revenue": (
                        item["revenue"]
                        or Decimal("0.00")
                    ),
                }
            )

        # --------------------------------------------------------
        # TOP SELLERS
        # --------------------------------------------------------

        top_sellers = (
            OrderItem.objects
            .filter(
                order_id__in=successful_order_ids
            )
            .values(
                "product__seller_id",
                "product__seller__username",
            )
            .annotate(
                units_sold=Sum("quantity"),
                revenue=Sum("subtotal"),
            )
            .order_by(
                "-revenue"
            )[:10]
        )

        top_sellers_data = []

        for seller in top_sellers:
            top_sellers_data.append(
                {
                    "seller_id": seller[
                        "product__seller_id"
                    ],

                    "seller_username": seller[
                        "product__seller__username"
                    ],

                    "units_sold": (
                        seller["units_sold"]
                        or 0
                    ),

                    "revenue": (
                        seller["revenue"]
                        or Decimal("0.00")
                    ),
                }
            )

        # --------------------------------------------------------
        # DAILY REVENUE
        # --------------------------------------------------------

        daily_revenue = (
            period_payments
            .annotate(
                day=TruncDate(
                    "created_at"
                )
            )
            .values("day")
            .annotate(
                revenue=Sum("amount")
            )
            .order_by("day")
        )

        daily_revenue_data = []

        for item in daily_revenue:
            daily_revenue_data.append(
                {
                    "date": item["day"],

                    "revenue": (
                        item["revenue"]
                        or Decimal("0.00")
                    ),
                }
            )

        # --------------------------------------------------------
        # MONTHLY REVENUE
        # --------------------------------------------------------

        monthly_revenue = (
            period_payments
            .annotate(
                month=TruncMonth(
                    "created_at"
                )
            )
            .values("month")
            .annotate(
                revenue=Sum("amount")
            )
            .order_by("month")
        )

        monthly_revenue_data = []

        for item in monthly_revenue:
            monthly_revenue_data.append(
                {
                    "month": item["month"],

                    "revenue": (
                        item["revenue"]
                        or Decimal("0.00")
                    ),
                }
            )

        # --------------------------------------------------------
        # RECENT SUCCESSFUL SALES
        # --------------------------------------------------------

        recent_payments = (
            period_payments
            .select_related(
                "order",
                "order__customer",
            )
            .order_by(
                "-created_at"
            )[:10]
        )

        recent_sales = []

        for payment in recent_payments:
            recent_sales.append(
                {
                    "payment_id": payment.id,

                    "order_id": payment.order_id,

                    "order_number": (
                        payment.order.order_number
                    ),

                    "customer_username": (
                        payment
                        .order
                        .customer
                        .username
                    ),

                    "amount": payment.amount,

                    "payment_method": (
                        payment.payment_method
                    ),

                    "transaction_reference": (
                        payment.transaction_reference
                    ),

                    "created_at": (
                        payment.created_at
                    ),
                }
            )

        # --------------------------------------------------------
        # PRODUCT STATISTICS
        # --------------------------------------------------------

        all_products = Product.objects.all()

        total_products = (
            all_products.count()
        )

        active_products = (
            all_products
            .filter(
                is_active=True
            )
            .count()
        )

        inactive_products = (
            all_products
            .filter(
                is_active=False
            )
            .count()
        )

        low_stock_products = (
            all_products
            .filter(
                stock_quantity__gt=0,
                stock_quantity__lte=5,
            )
            .count()
        )

        out_of_stock_products = (
            all_products
            .filter(
                stock_quantity=0
            )
            .count()
        )

        # --------------------------------------------------------
        # USER STATISTICS
        # --------------------------------------------------------

        total_users = User.objects.count()

        total_customers = (
            User.objects
            .filter(
                role=User.Role.CUSTOMER
            )
            .count()
        )

        total_sellers = (
            User.objects
            .filter(
                role=User.Role.SELLER
            )
            .count()
        )

        total_admins = (
            User.objects
            .filter(
                role=User.Role.ADMIN
            )
            .count()
        )

        active_users = (
            User.objects
            .filter(
                is_active=True
            )
            .count()
        )

        inactive_users = (
            User.objects
            .filter(
                is_active=False
            )
            .count()
        )

        # --------------------------------------------------------
        # FINAL RESPONSE
        # --------------------------------------------------------

        return Response(
            {
                "range": requested_range,

                "range_start": (
                    range_start
                    if range_start is not None
                    else None
                ),

                "range_end": today,

                "revenue": {
                    # Revenue for selected period.
                    "total": selected_revenue,

                    # Always today's revenue.
                    "today": today_revenue,

                    # Always current month's revenue.
                    "this_month": this_month_revenue,

                    # Average order value for selected period.
                    "average_order_value": (
                        average_order_value
                    ),

                    # Always all-time revenue.
                    "all_time": total_revenue,
                },

                "orders": {
                    "total": total_orders,
                    "pending": pending_orders,
                    "confirmed": confirmed_orders,
                    "processing": processing_orders,
                    "shipped": shipped_orders,
                    "delivered": delivered_orders,
                    "cancelled": cancelled_orders,
                    "refunded": refunded_orders,
                },

                "sales": {
                    "successful_orders": (
                        successful_order_count
                    ),

                    "total_units_sold": (
                        total_units_sold
                    ),
                },

                "products": {
                    "total": total_products,
                    "active": active_products,
                    "inactive": inactive_products,
                    "low_stock": low_stock_products,
                    "out_of_stock": (
                        out_of_stock_products
                    ),
                },

                "users": {
                    "total": total_users,
                    "customers": total_customers,
                    "sellers": total_sellers,
                    "admins": total_admins,
                    "active": active_users,
                    "inactive": inactive_users,
                },

                "top_products": (
                    top_products_data
                ),

                "top_sellers": (
                    top_sellers_data
                ),

                "daily_revenue": (
                    daily_revenue_data
                ),

                "monthly_revenue": (
                    monthly_revenue_data
                ),

                "recent_sales": recent_sales,
            }
        )