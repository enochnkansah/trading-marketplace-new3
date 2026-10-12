"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  Save,
  Truck,
  User,
  XCircle,
} from "lucide-react";

import api from "@/lib/client";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

type OrderItem = {
  id: number;
  product: number;
  product_name: string;
  product_price: string;
  quantity: number;
  subtotal: string;
  seller_username: string;
};

type Order = {
  id: number;
  order_number: string;
  status: OrderStatus;

  customer_username: string;
  customer_name: string;
  customer_email: string;

  items: OrderItem[];

  subtotal: string;
  shipping_fee: string;
  coupon: number | null;
  discount_amount: string;
  total: string;
  shipping_address: string;

  payment_status: string | null;
  payment_method: string | null;
  transaction_reference: string | null;

  created_at: string;
  updated_at: string;
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

function formatMoney(value: string | number) {
  const amount = Number(value || 0);

  return `GHS ${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "Pending";

    case "CONFIRMED":
      return "Confirmed";

    case "PROCESSING":
      return "Processing";

    case "SHIPPED":
      return "Shipped";

    case "DELIVERED":
      return "Delivered";

    case "CANCELLED":
      return "Cancelled";

    case "REFUNDED":
      return "Refunded";

    default:
      return status;
  }
}

function getStatusClasses(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";

    case "CONFIRMED":
      return "bg-blue-50 text-blue-700 ring-blue-200";

    case "PROCESSING":
      return "bg-violet-50 text-violet-700 ring-violet-200";

    case "SHIPPED":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";

    case "DELIVERED":
      return "bg-green-50 text-green-700 ring-green-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-200";

    case "REFUNDED":
      return "bg-slate-100 text-slate-700 ring-slate-200";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return Clock3;

    case "CONFIRMED":
      return CheckCircle2;

    case "PROCESSING":
      return Package;

    case "SHIPPED":
      return Truck;

    case "DELIVERED":
      return CheckCircle2;

    case "CANCELLED":
      return XCircle;

    case "REFUNDED":
      return RotateCcw;

    default:
      return Package;
  }
}

function getPaymentClasses(status: string | null) {
  if (!status) {
    return "bg-slate-100 text-slate-500";
  }

  switch (status.toUpperCase()) {
    case "SUCCESSFUL":
      return "bg-green-50 text-green-700";

    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "FAILED":
      return "bg-red-50 text-red-700";

    case "REFUNDED":
      return "bg-violet-50 text-violet-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getApiErrorMessage(
  error: any,
  fallback: string
) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.status?.[0] ||
    fallback
  );
}

export default function AdminOrderDetailsPage() {
  const params = useParams();

  const orderId = params?.id as string;

  const [order, setOrder] =
    useState<Order | null>(null);

  const [selectedStatus, setSelectedStatus] =
    useState<OrderStatus | "">("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadOrder(
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await api.get<Order>(
          `/admin/orders/${orderId}/`
        );

      setOrder(response.data);

      setSelectedStatus(
        response.data.status
      );
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load this order."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  async function updateStatus() {
    if (!order) return;

    if (
      !selectedStatus ||
      selectedStatus === order.status
    ) {
      return;
    }

    try {
      setSaving(true);

      setError("");

      setSuccess("");

      const response =
        await api.patch<Order>(
          `/admin/orders/${order.id}/`,
          {
            status: selectedStatus,
          }
        );

      setOrder(response.data);

      setSelectedStatus(
        response.data.status
      );

      setSuccess(
        `Order ${response.data.order_number} was successfully updated to ${getStatusLabel(
          response.data.status
        )}.`
      );
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to update the order status."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading order...
          </div>
        </div>
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell>
        <div className="rounded-xl border border-red-200 bg-white px-6 py-16 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Order not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "The requested order could not be found."}
          </p>

          <Link
            href="/admin/orders"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </div>
      </PageShell>
    );
  }

  const StatusIcon = getStatusIcon(
    order.status
  );

  const isTerminal =
    order.status === "CANCELLED" ||
    order.status === "REFUNDED";

  const totalUnits = order.items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-green-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {order.order_number}
              </h1>

              <StatusBadge
                status={order.status}
                icon={StatusIcon}
              />
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Order #{order.id} · Placed{" "}
              {formatDate(order.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOrder(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">
              Success
            </p>

            <p className="mt-1">
              {success}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Status management */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Manage Order Status
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Change the status of this order.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value as OrderStatus
                )
              }
              className="h-11 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              {ORDER_STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {getStatusLabel(
                      status
                    )}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={updateStatus}
              disabled={
                saving ||
                selectedStatus ===
                  order.status
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? "Saving..."
                : "Save Status"}
            </button>
          </div>
        </div>

        {isTerminal && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
            This order is{" "}
            <strong>
              {getStatusLabel(
                order.status
              ).toLowerCase()}
            </strong>
            . A cancelled or refunded order
            cannot be returned to an active
            status.
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left */}
        <div className="space-y-6 lg:col-span-2">

          {/* Customer */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={User}
              title="Customer Information"
            />

            <div className="grid gap-5 p-5 sm:grid-cols-3">
              <InfoBlock
                label="Name"
                value={
                  order.customer_name
                }
              />

              <InfoBlock
                label="Username"
                value={`@${order.customer_username}`}
              />

              <InfoBlock
                label="Email"
                value={
                  order.customer_email ||
                  "—"
                }
              />
            </div>
          </section>

          {/* Products */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={Package}
              title="Products"
              right={
                <span className="text-xs font-medium text-slate-500">
                  {totalUnits} unit
                  {totalUnits === 1
                    ? ""
                    : "s"}
                </span>
              }
            />

            <div className="divide-y divide-slate-100">
              {order.items.map(
                (item) => (
                  <div
                    key={item.id}
                    className="p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Package className="h-7 w-7 text-slate-400" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900">
                            {
                              item.product_name
                            }
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Seller:{" "}
                            {
                              item.seller_username
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Quantity:{" "}
                            {
                              item.quantity
                            }
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm text-slate-500">
                          {item.quantity} ×{" "}
                          {formatMoney(
                            item.product_price
                          )}
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {formatMoney(
                            item.subtotal
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* Shipping */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={Truck}
              title="Shipping Information"
            />

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Shipping Address
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {order.shipping_address}
              </p>
            </div>
          </section>
        </div>

        {/* Right */}
        <div className="space-y-6">

          {/* Payment */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={CheckCircle2}
              title="Payment"
            />

            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Payment Status
                </p>

                <div className="mt-2">
                  <PaymentBadge
                    status={
                      order.payment_status
                    }
                  />
                </div>
              </div>

              <InfoBlock
                label="Payment Method"
                value={
                  order.payment_method ||
                  "—"
                }
              />

              <InfoBlock
                label="Transaction Reference"
                value={
                  order.transaction_reference ||
                  "—"
                }
              />
            </div>
          </section>

          {/* Summary */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={Package}
              title="Order Summary"
            />

            <div className="space-y-3 p-5">
              <SummaryRow
                label="Subtotal"
                value={formatMoney(
                  order.subtotal
                )}
              />

              <SummaryRow
                label="Shipping"
                value={formatMoney(
                  order.shipping_fee
                )}
              />

              <SummaryRow
                label="Discount"
                value={`-${formatMoney(
                  order.discount_amount
                )}`}
              />

              <div className="border-t border-slate-100 pt-4">
                <SummaryRow
                  label="Total"
                  value={formatMoney(
                    order.total
                  )}
                  strong
                />
              </div>
            </div>
          </section>

          {/* Order dates */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={Clock3}
              title="Order Timeline"
            />

            <div className="space-y-4 p-5">
              <TimelineItem
                title="Order Created"
                value={formatDate(
                  order.created_at
                )}
                active
              />

              <TimelineItem
                title="Last Updated"
                value={formatDate(
                  order.updated_at
                )}
                active
              />

              <TimelineItem
                title="Current Status"
                value={getStatusLabel(
                  order.status
                )}
                active
              />
            </div>
          </section>

          {/* Quick actions */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">
              Quick Actions
            </h2>

            <div className="mt-4 space-y-2">
              <Link
                href="/admin/orders"
                className="flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to All Orders
              </Link>

              <Link
                href={`/orders/${order.id}`}
                target="_blank"
                className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open Customer Order View
              </Link>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  right,
}: {
  icon: any;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-green-700" />

        <h2 className="font-bold text-slate-900">
          {title}
        </h2>
      </div>

      {right}
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

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
            ? "font-bold text-slate-900"
            : "text-sm text-slate-500"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-xl font-bold text-slate-900"
            : "text-sm font-medium text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function TimelineItem({
  title,
  value,
  active = false,
}: {
  title: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
          active
            ? "bg-green-600"
            : "bg-slate-300"
        }`}
      />

      <div>
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  icon: Icon,
}: {
  status: OrderStatus;
  icon: any;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getStatusClasses(
        status
      )}`}
    >
      <Icon className="h-3.5 w-3.5" />

      {getStatusLabel(status)}
    </span>
  );
}

function PaymentBadge({
  status,
}: {
  status: string | null;
}) {
  if (!status) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
        No Payment
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getPaymentClasses(
        status
      )}`}
    >
      {status}
    </span>
  );
}