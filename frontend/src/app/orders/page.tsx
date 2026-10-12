"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
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
};

type Order = {
  id: number;
  order_number: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: string;
  shipping_fee: string;
  coupon: number | null;
  discount_amount: string;
  total: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
};

type OrdersResponse = {
  count?: number;
  results?: Order[];
};

function formatMoney(value: string | number) {
  const amount = Number(value || 0);

  return `GHS ${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

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

function getApiErrorMessage(
  error: any,
  fallback: string
) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadOrders(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get<OrdersResponse | Order[]>(
        "/orders/"
      );

      const data = response.data;

      /*
       * Django may return either:
       *
       * 1. A direct array:
       *    [
       *      {...},
       *      {...}
       *    ]
       *
       * OR
       *
       * 2. A paginated response:
       *    {
       *      "count": 2,
       *      "results": [...]
       *    }
       *
       * Support both formats.
       */
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders(data.results || []);
      }
    } catch (err: any) {
      console.error("Orders loading error:", err);

      setError(
        getApiErrorMessage(
          err,
          "Unable to load your orders."
        )
      );

      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return true;
    }

    return (
      order.order_number
        .toLowerCase()
        .includes(searchTerm) ||
      order.items.some((item) =>
        item.product_name
          .toLowerCase()
          .includes(searchTerm)
      )
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/"
            className="transition hover:text-green-700"
          >
            Home
          </Link>

          <ChevronRight className="h-4 w-4" />

          <span>Orders</span>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My Orders
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and track your orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Unable to load orders
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

        {/* Search */}
        {!loading && orders.length > 0 && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by order number or product..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Showing {filteredOrders.length} of{" "}
              {orders.length} order
              {orders.length === 1 ? "" : "s"}.
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />

              Loading your orders...
            </div>
          </div>
        ) : orders.length === 0 ? (

          /* No orders */
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <Package className="mx-auto h-14 w-14 text-slate-300" />

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              You have no orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              When you place an order, it will appear here so
              you can track its status and view the order
              details.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Start Shopping
            </Link>
          </div>

        ) : filteredOrders.length === 0 ? (

          /* Search empty */
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <Search className="mx-auto h-12 w-12 text-slate-300" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No matching orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Try a different order number or product name.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-5 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Clear Search
            </button>
          </div>

        ) : (

          /* Orders */
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
}: {
  order: Order;
}) {
  const StatusIcon = getStatusIcon(order.status);

  const totalUnits = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">

      {/* Order header */}
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Order
            </p>

            <h2 className="mt-1 font-bold text-slate-900">
              {order.order_number}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Placed {formatDate(order.created_at)}
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getStatusClasses(
              order.status
            )}`}
          >
            <StatusIcon className="h-4 w-4" />

            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      {/* Products */}
      <div className="divide-y divide-slate-100">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 p-4 sm:p-5"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 sm:h-16 sm:w-16">
              <Package className="h-7 w-7 text-slate-400" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">
                {item.product_name}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Quantity: {item.quantity}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {formatMoney(item.product_price)} each
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-bold text-slate-900">
                {formatMoney(item.subtotal)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:flex sm:items-center">

            <div>
              <span className="text-slate-500">
                Items
              </span>

              <span className="ml-2 font-semibold text-slate-700">
                {totalUnits}
              </span>
            </div>

            <div>
              <span className="text-slate-500">
                Total
              </span>

              <span className="ml-2 font-bold text-slate-900">
                {formatMoney(order.total)}
              </span>
            </div>

          </div>

          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            <Eye className="h-4 w-4" />
            View Order
          </Link>

        </div>
      </div>

    </div>
  );
}