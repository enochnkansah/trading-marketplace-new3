"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";

import api from "@/lib/client";
import SiteHeader from "@/components/site-header";

interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_price: string;
  quantity: number;
  subtotal: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  items: OrderItem[];
  subtotal: string;
  shipping_fee: string;
  coupon: number | null;
  discount_amount: string;
  total: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("en-GH", {
    style: "currency",
    currency: "GHS",
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-GH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function getStatusClasses(status: string) {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return "bg-green-100 text-green-700";

    case "PROCESSING":
      return "bg-blue-100 text-blue-700";

    case "SHIPPED":
      return "bg-purple-100 text-purple-700";

    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    case "PENDING":
      return "bg-amber-100 text-amber-700";

    case "FAILED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStatusIcon(status: string) {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
    case "DELIVERED":
      return <CheckCircle2 className="h-5 w-5" />;

    case "CANCELLED":
    case "FAILED":
      return <XCircle className="h-5 w-5" />;

    case "SHIPPED":
      return <Truck className="h-5 w-5" />;

    default:
      return <Clock3 className="h-5 w-5" />;
  }
}

function getApiErrorMessage(error: any) {
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (typeof error?.response?.data === "string") {
    return error.response.data;
  }

  return "Unable to load this order. Please try again.";
}

const STATUS_STEPS = [
  {
    key: "PENDING",
    label: "Order placed",
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
  },
  {
    key: "PROCESSING",
    label: "Processing",
  },
  {
    key: "SHIPPED",
    label: "Shipped",
  },
  {
    key: "DELIVERED",
    label: "Delivered",
  },
];

const STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

function getStatusStepIndex(status: string) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === "CANCELLED" || normalizedStatus === "FAILED") {
    return -1;
  }

  return STATUS_ORDER.indexOf(normalizedStatus);
}

export default function OrderDetailsPage() {
  const params = useParams();

  const orderId = params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchOrder() {
    if (!orderId) {
      setErrorMessage("Order ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get<Order>(
        `/orders/${orderId}/`
      );

      setOrder(response.data);
    } catch (error: any) {
      console.error("Order details error:", error);
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  /*
   * Loading state
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <SiteHeader />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-48 rounded bg-slate-200" />

            <div className="h-10 w-72 rounded bg-slate-200" />

            <div className="h-32 rounded-2xl bg-white" />

            <div className="h-64 rounded-2xl bg-white" />

            <div className="h-48 rounded-2xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  /*
   * Error state
   */
  if (errorMessage || !order) {
    return (
      <main className="min-h-screen bg-slate-50">
        <SiteHeader />

        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <XCircle className="mx-auto h-14 w-14 text-red-500" />

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Unable to load order
            </h1>

            <p className="mt-3 text-slate-600">
              {errorMessage ||
                "The requested order could not be found."}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={fetchOrder}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>

              <Link
                href="/orders"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentStatus = order.status.toUpperCase();
  const currentStep = getStatusStepIndex(currentStatus);
  const isCancelled =
    currentStatus === "CANCELLED" ||
    currentStatus === "FAILED";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Agricult Header */}
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/"
            className="transition hover:text-green-700"
          >
            Marketplace
          </Link>

          <ChevronRight className="h-4 w-4" />

          <Link
            href="/orders"
            className="transition hover:text-green-700"
          >
            My Orders
          </Link>

          <ChevronRight className="h-4 w-4" />

          <span className="font-medium text-slate-700">
            {order.order_number}
          </span>
        </div>

        {/* Page Heading */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <Package className="h-4 w-4" />
              Order Details
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {order.order_number}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Placed on {formatDateTime(order.created_at)}
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide ${getStatusClasses(
              order.status
            )}`}
          >
            {getStatusIcon(order.status)}
            {getStatusLabel(order.status)}
          </div>
        </div>

        {/* Cancelled / Failed Notice */}
        {isCancelled && (
          <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <h2 className="font-bold text-red-800">
                  {currentStatus === "CANCELLED"
                    ? "This order was cancelled"
                    : "This order has failed"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  Please review your order information or
                  contact support if you need assistance.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Status Card */}
        <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 text-green-600">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Order status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your order is currently{" "}
                <span className="font-semibold text-slate-700">
                  {getStatusLabel(order.status).toLowerCase()}
                </span>
                .
              </p>
            </div>
          </div>

          {/* Status Progress */}
          {!isCancelled && (
            <div className="mt-8 overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="flex items-start">
                  {STATUS_STEPS.map((step, index) => {
                    const completed = currentStep >= index;
                    const active = currentStep === index;

                    return (
                      <div
                        key={step.key}
                        className={`flex items-start ${
                          index === STATUS_STEPS.length - 1
                            ? ""
                            : "flex-1"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                              completed
                                ? "bg-green-600 text-white"
                                : "bg-slate-200 text-slate-500"
                            } ${
                              active
                                ? "ring-4 ring-green-100"
                                : ""
                            }`}
                          >
                            {completed ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              index + 1
                            )}
                          </div>

                          <p
                            className={`mt-2 whitespace-nowrap text-xs font-semibold ${
                              completed
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>

                        {index < STATUS_STEPS.length - 1 && (
                          <div
                            className={`mt-5 h-1 flex-1 rounded ${
                              currentStep > index
                                ? "bg-green-600"
                                : "bg-slate-200"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Items */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border bg-white shadow-sm">

              {/* Items Header */}
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-slate-500" />

                  <h2 className="text-lg font-bold text-slate-900">
                    Items in this order
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {order.items.length}{" "}
                  {order.items.length === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              {/* Items */}
              <div className="divide-y">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.product}`}
                          className="text-lg font-semibold text-slate-900 transition hover:text-green-600"
                        >
                          {item.product_name}
                        </Link>

                        <div className="mt-2 space-y-1 text-sm text-slate-500">
                          <p>
                            Quantity:{" "}
                            <span className="font-medium text-slate-700">
                              {item.quantity}
                            </span>
                          </p>

                          <p>
                            Unit price:{" "}
                            <span className="font-medium text-slate-700">
                              {formatCurrency(
                                item.product_price
                              )}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm text-slate-500">
                          Item total
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right Column */}
          <aside>

            {/* Order Summary */}
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Order Summary
                </h2>
              </div>

              <div className="space-y-4 px-6 py-5">

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-slate-900">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Shipping
                  </span>

                  <span className="font-medium text-slate-900">
                    {formatCurrency(order.shipping_fee)}
                  </span>
                </div>

                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-slate-500">
                      Discount
                    </span>

                    <span className="font-medium text-green-600">
                      -{formatCurrency(order.discount_amount)}
                    </span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between gap-4">
                    <span className="font-bold text-slate-900">
                      Total
                    </span>

                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Delivery Address */}
            <div className="mt-6 rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-slate-500" />

                  <h2 className="text-lg font-bold text-slate-900">
                    Delivery Address
                  </h2>
                </div>
              </div>

              <div className="px-6 py-5">
                <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
                  {order.shipping_address}
                </p>
              </div>
            </div>

            {/* Order Dates */}
            <div className="mt-6 rounded-2xl border bg-white shadow-sm">
              <div className="px-6 py-5">

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Order placed
                  </span>

                  <span className="text-right font-medium text-slate-900">
                    {formatDateTime(order.created_at)}
                  </span>
                </div>

                <div className="mt-4 flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Last updated
                  </span>

                  <span className="text-right font-medium text-slate-900">
                    {formatDateTime(order.updated_at)}
                  </span>
                </div>

              </div>
            </div>

          </aside>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">

          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Orders
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Continue Shopping
          </Link>

        </div>

      </div>
    </main>
  );
}