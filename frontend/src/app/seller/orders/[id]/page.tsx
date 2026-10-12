"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  User,
} from "lucide-react";

import api from "@/lib/client";
import SiteHeader from "@/components/site-header";
import SellerNav from "@/components/seller-nav";

interface SellerOrderItem {
  id: number;
  product: number;
  product_name: string;
  product_price: string;
  quantity: number;
  subtotal: string;
  seller: number;
}

interface SellerOrder {
  id: number;
  order_number: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  items: SellerOrderItem[];
  customer_name: string;
  customer_email: string;
  subtotal: string;
  shipping_fee: string;
  coupon: number | null;
  discount_amount: string;
  total: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
}

type OrderStatus = SellerOrder["status"];

export default function SellerOrderDetailsPage() {
  const params = useParams();

  const orderId = params?.id as string;

  const [order, setOrder] =
    useState<SellerOrder | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updating, setUpdating] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          `/orders/${orderId}/seller-detail/`
        );

      setOrder(response.data);
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to load order."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    statusValue: OrderStatus
  ) => {
    if (!order) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const response =
        await api.patch(
          `/orders/${order.id}/seller-status/`,
          {
            status: statusValue,
          }
        );

      setOrder(response.data);

      setSuccess(
        `Order ${response.data.order_number} is now ${formatStatus(
          response.data.status
        )}.`
      );
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to update order status."
        )
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <>
        <SiteHeader />
        <SellerNav />

        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-20 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-green-700" />

            <p className="mt-4 text-slate-500">
              Loading order...
            </p>
          </div>
        </main>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <SiteHeader />
        <SellerNav />

        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <ClipboardList className="h-7 w-7 text-red-600" />
              </div>

              <h1 className="mt-5 font-serif text-2xl font-bold text-slate-950">
                Unable to load order
              </h1>

              <p className="mt-3 whitespace-pre-wrap text-slate-600">
                {error || "Order not found."}
              </p>

              <div className="mt-7 flex justify-center gap-3">

                <button
                  type="button"
                  onClick={loadOrder}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>

                <Link
                  href="/seller/orders"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:border-green-600 hover:text-green-700"
                >
                  Back to Orders
                </Link>

              </div>

            </div>
          </div>
        </main>
      </>
    );
  }

  const sellerSubtotal =
    order.items.reduce(
      (sum, item) =>
        sum + Number(item.subtotal),
      0
    );

  return (
    <>
      <SiteHeader />
      <SellerNav />

      <main className="min-h-screen bg-slate-50">

        {/* HEADER */}

        <section className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-6 py-8">

            <Link
              href="/seller/orders"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-green-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Seller Orders
            </Link>

            <div className="mt-7 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                  <Package className="h-7 w-7 text-green-700" />
                </div>

                <div>

                  <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                    Seller Order
                  </p>

                  <h1 className="font-serif text-3xl font-bold text-slate-950">
                    {order.order_number}
                  </h1>

                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">

                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(
                        order.created_at
                      )}
                    </span>

                    <StatusBadge
                      status={order.status}
                    />

                  </div>

                </div>

              </div>

              <div className="text-left md:text-right">

                <p className="text-sm text-slate-500">
                  Your product sales
                </p>

                <p className="mt-1 text-3xl font-bold text-green-700">
                  {formatCurrency(
                    sellerSubtotal
                  )}
                </p>

              </div>

            </div>

          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10">

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
              {success}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

            {/* LEFT */}

            <div className="space-y-8">

              {/* CUSTOMER */}

              <section className="rounded-2xl border bg-white p-6 shadow-sm">

                <h2 className="font-serif text-xl font-bold text-slate-950">
                  Customer
                </h2>

                <div className="mt-5 flex items-start gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                    <User className="h-6 w-6 text-slate-600" />
                  </div>

                  <div>

                    <p className="font-semibold text-slate-950">
                      {order.customer_name}
                    </p>

                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="h-4 w-4" />
                      {order.customer_email}
                    </p>

                  </div>

                </div>

              </section>

              {/* PRODUCTS */}

              <section className="rounded-2xl border bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <h2 className="font-serif text-xl font-bold text-slate-950">
                    Products
                  </h2>

                  <span className="text-sm text-slate-500">
                    {order.items.length} product
                    {order.items.length !== 1
                      ? "s"
                      : ""}
                  </span>

                </div>

                <div className="mt-5 divide-y">

                  {order.items.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div className="flex items-start gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100">
                            <Package className="h-5 w-5 text-green-700" />
                          </div>

                          <div>

                            <p className="font-semibold text-slate-950">
                              {item.product_name}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {formatCurrency(
                                item.product_price
                              )}{" "}
                              ×{" "}
                              {item.quantity}
                            </p>

                          </div>

                        </div>

                        <p className="font-bold text-slate-950">
                          {formatCurrency(
                            item.subtotal
                          )}
                        </p>

                      </div>
                    )
                  )}

                </div>

              </section>

              {/* SHIPPING */}

              <section className="rounded-2xl border bg-white p-6 shadow-sm">

                <h2 className="font-serif text-xl font-bold text-slate-950">
                  Shipping Information
                </h2>

                <div className="mt-5 flex items-start gap-4">

                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-green-700" />

                  <div>

                    <p className="font-semibold text-slate-900">
                      Delivery Address
                    </p>

                    <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">
                      {order.shipping_address}
                    </p>

                  </div>

                </div>

              </section>

            </div>

            {/* RIGHT */}

            <aside className="space-y-6">

              {/* STATUS */}

              <section className="rounded-2xl border bg-white p-6 shadow-sm">

                <h2 className="font-serif text-xl font-bold text-slate-950">
                  Fulfillment Status
                </h2>

                <div className="mt-5">
                  <StatusBadge
                    status={order.status}
                  />
                </div>

                {order.status !==
                  "DELIVERED" &&
                  order.status !==
                    "CANCELLED" &&
                  order.status !==
                    "REFUNDED" && (
                    <div className="mt-5 space-y-2">

                      {getNextStatus(
                        order.status
                      ) && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() =>
                            updateStatus(
                              getNextStatus(
                                order.status
                              )!
                            )
                          }
                          className="w-full rounded-xl bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                        >
                          {updating
                            ? "Updating..."
                            : `Move to ${formatStatus(
                                getNextStatus(
                                  order.status
                                )!
                              )}`}
                        </button>
                      )}

                    </div>
                  )}

                <div className="mt-6 space-y-4">

                  {[
                    "CONFIRMED",
                    "PROCESSING",
                    "SHIPPED",
                    "DELIVERED",
                  ].map(
                    (statusValue) => {
                      const completed =
                        isStatusReached(
                          order.status,
                          statusValue as OrderStatus
                        );

                      return (
                        <div
                          key={
                            statusValue
                          }
                          className="flex items-center gap-3"
                        >
                          <CheckCircle2
                            className={`h-5 w-5 ${
                              completed
                                ? "text-green-600"
                                : "text-slate-300"
                            }`}
                          />

                          <span
                            className={`text-sm ${
                              completed
                                ? "font-semibold text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {formatStatus(
                              statusValue as OrderStatus
                            )}
                          </span>
                        </div>
                      );
                    }
                  )}

                </div>

              </section>

              {/* ORDER SUMMARY */}

              <section className="rounded-2xl border bg-white p-6 shadow-sm">

                <h2 className="font-serif text-xl font-bold text-slate-950">
                  Order Summary
                </h2>

                <div className="mt-5 space-y-4">

                  <SummaryRow
                    label="Order subtotal"
                    value={formatCurrency(
                      order.subtotal
                    )}
                  />

                  <SummaryRow
                    label="Shipping"
                    value={formatCurrency(
                      order.shipping_fee
                    )}
                  />

                  <SummaryRow
                    label="Discount"
                    value={`- ${formatCurrency(
                      order.discount_amount
                    )}`}
                  />

                  <div className="border-t pt-4">

                    <SummaryRow
                      label="Order total"
                      value={formatCurrency(
                        order.total
                      )}
                      strong
                    />

                  </div>

                </div>

              </section>

            </aside>

          </div>

        </section>
      </main>
    </>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const styles: Record<
    OrderStatus,
    string
  > = {
    PENDING:
      "bg-amber-100 text-amber-800",
    CONFIRMED:
      "bg-blue-100 text-blue-800",
    PROCESSING:
      "bg-purple-100 text-purple-800",
    SHIPPED:
      "bg-indigo-100 text-indigo-800",
    DELIVERED:
      "bg-green-100 text-green-800",
    CANCELLED:
      "bg-red-100 text-red-800",
    REFUNDED:
      "bg-slate-200 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}

/* ============================================================
   NEXT STATUS
============================================================ */

function getNextStatus(
  current: OrderStatus
): OrderStatus | null {
  const flow: OrderStatus[] = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
  ];

  const index =
    flow.indexOf(current);

  if (
    index === -1 ||
    index >= flow.length - 1
  ) {
    return null;
  }

  return flow[index + 1];
}

/* ============================================================
   STATUS PROGRESS
============================================================ */

function isStatusReached(
  current: OrderStatus,
  target: OrderStatus
): boolean {
  const flow: OrderStatus[] = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
  ];

  const currentIndex =
    flow.indexOf(current);

  const targetIndex =
    flow.indexOf(target);

  return (
    currentIndex >= 0 &&
    targetIndex >= 0 &&
    currentIndex >= targetIndex
  );
}

/* ============================================================
   SUMMARY ROW
============================================================ */

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span
        className={
          strong
            ? "font-semibold text-slate-950"
            : "text-slate-500"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "font-bold text-slate-950"
            : "text-slate-700"
        }
      >
        {value}
      </span>

    </div>
  );
}

/* ============================================================
   FORMAT STATUS
============================================================ */

function formatStatus(
  status: OrderStatus
): string {
  return (
    status.charAt(0) +
    status.slice(1).toLowerCase()
  );
}

/* ============================================================
   FORMAT CURRENCY
============================================================ */

function formatCurrency(
  value: string | number
): string {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "GHS 0.00";
  }

  return `GHS ${number.toLocaleString(
    "en-GH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

/* ============================================================
   FORMAT DATE
============================================================ */

function formatDate(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-GH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

/* ============================================================
   API ERROR
============================================================ */

function getApiErrorMessage(
  error: any,
  fallback: string
): string {
  if (!error) {
    return fallback;
  }

  if (error?.response?.status === 403) {
    return "You do not have access to this order.";
  }

  if (error?.response?.status === 404) {
    return "The requested order could not be found.";
  }

  if (error?.response?.data?.detail) {
    return String(
      error.response.data.detail
    );
  }

  if (
    error?.response?.data &&
    typeof error.response.data === "object"
  ) {
    return Object.entries(
      error.response.data
    )
      .map(
        ([field, value]) =>
          `${field}: ${String(value)}`
      )
      .join("\n");
  }

  return (
    error?.message ||
    fallback
  );
}