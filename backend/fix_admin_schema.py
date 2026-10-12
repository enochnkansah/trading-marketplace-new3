
from pathlib import Path

FILE_PATH = Path("accounts/admin_views.py")

# Schema annotations to add to the existing admin methods.
ANNOTATIONS = {
    ("AdminDashboardView", "get"): '''
    @extend_schema(
        operation_id="admin_dashboard_retrieve",
        responses=OpenApiTypes.OBJECT,
    )''',

    ("AdminUsersView", "get"): '''
    @extend_schema(
        operation_id="admin_users_list",
        parameters=[
            OpenApiParameter("search", str, required=False),
            OpenApiParameter("role", str, required=False),
            OpenApiParameter("status", str, required=False),
        ],
        responses=OpenApiTypes.OBJECT,
    )''',

    ("AdminUserDetailView", "patch"): '''
    @extend_schema(
        operation_id="admin_user_update",
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT},
    )''',

    ("AdminProductsView", "get"): '''
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
    )''',

    ("AdminProductDetailView", "patch"): '''
    @extend_schema(
        operation_id="admin_product_update",
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT},
    )''',

    ("AdminOrdersView", "get"): '''
    @extend_schema(
        operation_id="admin_orders_list",
        parameters=[
            OpenApiParameter("search", str, required=False),
            OpenApiParameter("status", str, required=False),
        ],
        responses=OpenApiTypes.OBJECT,
    )''',

    ("AdminOrderDetailView", "get"): '''
    @extend_schema(
        operation_id="admin_order_detail_retrieve",
        responses={200: OpenApiTypes.OBJECT},
    )''',

    ("AdminOrderDetailView", "patch"): '''
    @extend_schema(
        operation_id="admin_order_detail_update",
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT},
    )''',

    ("AdminAnalyticsView", "get"): '''
    @extend_schema(
        operation_id="admin_analytics_retrieve",
        parameters=[
            OpenApiParameter("range", str, required=False),
        ],
        responses=OpenApiTypes.OBJECT,
    )''',
}


def main():
    if not FILE_PATH.exists():
        raise SystemExit(
            f"File not found: {FILE_PATH.resolve()}\n"
            "Run this script from your backend directory."
        )

    source = FILE_PATH.read_text(encoding="utf-8")
    lines = source.splitlines(keepends=True)

    output = []
    current_class = None
    inserted = []
    skipped = []

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("class ") and stripped.endswith(":"):
            current_class = stripped.split()[1].split("(")[0].rstrip(":")
        
        matched = False

        if current_class:
            for (class_name, method_name), annotation in ANNOTATIONS.items():
                method_prefix = f"def {method_name}("

                if (
                    current_class == class_name
                    and stripped.startswith(method_prefix)
                ):
                    # Avoid adding a duplicate annotation if rerun.
                    previous = "".join(output).rstrip().splitlines()
                    if previous and previous[-1].strip() == ")":
                        # Continue below; inspect the preceding decorator block.
                        pass

                    recent = output[-15:]
                    recent_text = "".join(recent)

                    if "@extend_schema(" in recent_text:
                        skipped.append(f"{class_name}.{method_name}")
                    else:
                        output.append(annotation.strip("\n") + "\n")
                        inserted.append(f"{class_name}.{method_name}")

                    matched = True
                    break

        output.append(line)

    FILE_PATH.write_text("".join(output), encoding="utf-8")

    print(f"Updated: {FILE_PATH.resolve()}")
    print(f"Annotations added: {len(inserted)}")

    for item in inserted:
        print(f"  + {item}")

    if skipped:
        print("Already annotated; skipped:")
        for item in skipped:
            print(f"  - {item}")

    missing = set(ANNOTATIONS) - {
        (cls, method)
        for cls, method in ANNOTATIONS
        if f"{cls}.{method}" in inserted
        or f"{cls}.{method}" in skipped
    }

    if missing:
        print("\nWARNING: These methods were not found:")
        for cls, method in sorted(missing):
            print(f"  ! {cls}.{method}")

    print("\nReview the file before continuing.")


if __name__ == "__main__":
    main()
