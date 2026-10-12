"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Truck,
  XCircle,
  RotateCcw,
} from "lucide-react";

import api from "@/lib/client";
import AdminNav from "@/components/admin-nav";

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

type OrderStatistics = {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
};

type OrdersResponse = {
  count: number;
  results: Order[];
  statistics: OrderStatistics;
};

type StatusFilter = OrderStatus | "ALL";

const STATUS_OPTIONS: {
  value: StatusFilter;
  label: string;
}[] = [
  {
    value: "ALL",
    label: "All Orders",
  },
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
  },
  {
    value: "PROCESSING",
    label: "Processing",
  },
  {
    value: "SHIPPED",
    label: "Shipped",
  },
  {
    value: "DELIVERED",
    label: "Delivered",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
  {
    value: "REFUNDED",
    label: "Refunded",
  },
];

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [statistics, setStatistics] =
    useState<OrderStatistics | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [expandedOrderId, setExpandedOrderId] =
    useState<number | null>(null);

  const [selectedStatuses, setSelectedStatuses] =
    useState<Record<number, OrderStatus>>({});

  const [updatingOrderId, setUpdatingOrderId] =
    useState<number | null>(null);

  async function loadOrders(
    showRefresh = false,
    searchValue = search,
    statusValue = statusFilter
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params: Record<string, string> = {};

      if (searchValue.trim()) {
        params.search = searchValue.trim();
      }

      if (statusValue !== "ALL") {
        params.status = statusValue;
      }

      const response =
        await api.get<OrdersResponse>(
          "/admin/orders/",
          {
            params,
          }
        );

      setOrders(response.data.results || []);

      setStatistics(response.data.statistics);

      const statusMap: Record<
        number,
        OrderStatus
      > = {};

      response.data.results.forEach((order) => {
        statusMap[order.id] = order.status;
      });

      setSelectedStatuses(statusMap);
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load admin orders."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  function handleSearch() {
    setSearch(searchInput.trim());

    loadOrders(
      false,
      searchInput.trim(),
      statusFilter
    );
  }

  function handleClearFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("ALL");

    loadOrders(false, "", "ALL");
  }

  function toggleOrder(orderId: number) {
    setExpandedOrderId((current) =>
      current === orderId ? null : orderId
    );
  }

  async function updateOrderStatus(
    order: Order
  ) {
    const newStatus =
      selectedStatuses[order.id];

    if (
      !newStatus ||
      newStatus === order.status
    ) {
      return;
    }

    try {
      setUpdatingOrderId(order.id);

      setError("");

      setSuccess("");

      const response =
        await api.patch<Order>(
          `/admin/orders/${order.id}/`,
          {
            status: newStatus,
          }
        );

      setOrders((previousOrders) =>
        previousOrders.map((item) =>
          item.id === order.id
            ? response.data
            : item
        )
      );

      setSelectedStatuses((previous) => ({
        ...previous,
        [order.id]: response.data.status,
      }));

      setSuccess(
        `Order ${order.order_number} was updated to ${getStatusLabel(
          response.data.status
        )}.`
      );

      await loadOrders(
        true,
        search,
        statusFilter
      );
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to update the order status."
        )
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
  <div className="min-h-screen bg-slate-50">
    <AdminNav />

    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    

       

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Orders
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage and monitor all marketplace
              orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadOrders(
                true,
                search,
                statusFilter
              )
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          <StatCard
            label="Total"
            value={statistics?.total ?? 0}
            icon={Package}
            active={
              statusFilter === "ALL"
            }
            onClick={() =>
              setStatusFilter("ALL")
            }
          />

          <StatCard
            label="Pending"
            value={
              statistics?.pending ?? 0
            }
            icon={Clock3}
            active={
              statusFilter === "PENDING"
            }
            onClick={() =>
              setStatusFilter("PENDING")
            }
          />

          <StatCard
            label="Confirmed"
            value={
              statistics?.confirmed ?? 0
            }
            icon={CheckCircle2}
            active={
              statusFilter === "CONFIRMED"
            }
            onClick={() =>
              setStatusFilter("CONFIRMED")
            }
          />

          <StatCard
            label="Processing"
            value={
              statistics?.processing ?? 0
            }
            icon={Package}
            active={
              statusFilter === "PROCESSING"
            }
            onClick={() =>
              setStatusFilter("PROCESSING")
            }
          />

          <StatCard
            label="Shipped"
            value={
              statistics?.shipped ?? 0
            }
            icon={Truck}
            active={
              statusFilter === "SHIPPED"
            }
            onClick={() =>
              setStatusFilter("SHIPPED")
            }
          />

          <StatCard
            label="Delivered"
            value={
              statistics?.delivered ?? 0
            }
            icon={CheckCircle2}
            active={
              statusFilter === "DELIVERED"
            }
            onClick={() =>
              setStatusFilter("DELIVERED")
            }
          />

          <StatCard
            label="Cancelled"
            value={
              statistics?.cancelled ?? 0
            }
            icon={XCircle}
            active={
              statusFilter === "CANCELLED"
            }
            onClick={() =>
              setStatusFilter("CANCELLED")
            }
          />

          <StatCard
            label="Refunded"
            value={
              statistics?.refunded ?? 0
            }
            icon={RotateCcw}
            active={
              statusFilter === "REFUNDED"
            }
            onClick={() =>
              setStatusFilter("REFUNDED")
            }
          />
        </div>

        {/* Search and filter */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    handleSearch();
                  }
                }}
                placeholder="Search order number or customer..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as StatusFilter
                )
              }
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={handleSearch}
              className="h-11 rounded-lg bg-green-700 px-5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Search
            </button>
          </div>

          {(search ||
            statusFilter !== "ALL") && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                Showing {orders.length} matching
                order
                {orders.length === 1
                  ? ""
                  : "s"}.
              </p>

              <button
                type="button"
                onClick={
                  handleClearFilters
                }
                className="text-xs font-semibold text-green-700 hover:text-green-800"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading orders...
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <Package className="mx-auto h-12 w-12 text-slate-300" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No orders found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or status
              filter.
            </p>

            <button
              type="button"
              onClick={
                handleClearFilters
              }
              className="mt-5 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px]">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4">
                        Order
                      </th>

                      <th className="px-5 py-4">
                        Customer
                      </th>

                      <th className="px-5 py-4">
                        Items
                      </th>

                      <th className="px-5 py-4">
                        Total
                      </th>

                      <th className="px-5 py-4">
                        Payment
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {orders.map(
                      (order) => (
                        <OrderTableRow
                          key={order.id}
                          order={order}
                          expanded={
                            expandedOrderId ===
                            order.id
                          }
                          selectedStatus={
                            selectedStatuses[
                              order.id
                            ] ||
                            order.status
                          }
                          updating={
                            updatingOrderId ===
                            order.id
                          }
                          onToggle={() =>
                            toggleOrder(
                              order.id
                            )
                          }
                          onStatusChange={(
                            status
                          ) =>
                            setSelectedStatuses(
                              (previous) => ({
                                ...previous,
                                [order.id]:
                                  status,
                              })
                            )
                          }
                          onUpdate={() =>
                            updateOrderStatus(
                              order
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile */}
            <div className="space-y-4 lg:hidden">
              {orders.map(
                (order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    expanded={
                      expandedOrderId ===
                      order.id
                    }
                    selectedStatus={
                      selectedStatuses[
                        order.id
                      ] || order.status
                    }
                    updating={
                      updatingOrderId ===
                      order.id
                    }
                    onToggle={() =>
                      toggleOrder(
                        order.id
                      )
                    }
                    onStatusChange={(
                      status
                    ) =>
                      setSelectedStatuses(
                        (previous) => ({
                          ...previous,
                          [order.id]:
                            status,
                        })
                      )
                    }
                    onUpdate={() =>
                      updateOrderStatus(
                        order
                      )
                    }
                  />
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: any;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left shadow-sm transition ${
        active
          ? "border-green-300 bg-green-50 ring-1 ring-green-200"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold ${
            active
              ? "text-green-700"
              : "text-slate-500"
          }`}
        >
          {label}
        </span>

        <Icon
          className={`h-4 w-4 ${
            active
              ? "text-green-700"
              : "text-slate-400"
          }`}
        />
      </div>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </button>
  );
}

function OrderTableRow({
  order,
  expanded,
  selectedStatus,
  updating,
  onToggle,
  onStatusChange,
  onUpdate,
}: {
  order: Order;
  expanded: boolean;
  selectedStatus: OrderStatus;
  updating: boolean;
  onToggle: () => void;
  onStatusChange: (
    status: OrderStatus
  ) => void;
  onUpdate: () => void;
}) {
  const StatusIcon = getStatusIcon(
    order.status
  );

  const totalUnits = order.items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  return (
    <>
      <tr className="align-middle hover:bg-slate-50/70">
        <td className="px-5 py-4">
          <p className="font-semibold text-slate-900">
            {order.order_number}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Order #{order.id}
          </p>
        </td>

        <td className="px-5 py-4">
          <p className="font-medium text-slate-900">
            {order.customer_name}
          </p>

          <p className="text-xs text-slate-500">
            @{order.customer_username}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {order.customer_email}
          </p>
        </td>

        <td className="px-5 py-4">
          <p className="font-medium text-slate-700">
            {order.items.length} product
            {order.items.length === 1
              ? ""
              : "s"}
          </p>

          <p className="text-xs text-slate-400">
            {totalUnits} unit
            {totalUnits === 1
              ? ""
              : "s"}
          </p>
        </td>

        <td className="px-5 py-4">
          <p className="font-bold text-slate-900">
            {formatMoney(order.total)}
          </p>

          <p className="text-xs text-slate-400">
            Subtotal{" "}
            {formatMoney(
              order.subtotal
            )}
          </p>
        </td>

        <td className="px-5 py-4">
          <PaymentBadge
            status={
              order.payment_status
            }
          />
        </td>

        <td className="px-5 py-4">
          <StatusBadge
            status={order.status}
            icon={StatusIcon}
          />
        </td>

        <td className="px-5 py-4 text-sm text-slate-500">
          {formatDate(
            order.created_at
          )}
        </td>

        <td className="px-5 py-4">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {expanded
                ? "Hide"
                : "Manage"}

              <ChevronDown
                className={`h-3.5 w-3.5 transition ${
                  expanded
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
            >
              <Eye className="h-3.5 w-3.5" />

              View
            </Link>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td
            colSpan={8}
            className="bg-slate-50 px-5 py-5"
          >
            <OrderManagement
              order={order}
              selectedStatus={
                selectedStatus
              }
              updating={updating}
              onStatusChange={
                onStatusChange
              }
              onUpdate={onUpdate}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function OrderCard({
  order,
  expanded,
  selectedStatus,
  updating,
  onToggle,
  onStatusChange,
  onUpdate,
}: {
  order: Order;
  expanded: boolean;
  selectedStatus: OrderStatus;
  updating: boolean;
  onToggle: () => void;
  onStatusChange: (
    status: OrderStatus
  ) => void;
  onUpdate: () => void;
}) {
  const StatusIcon = getStatusIcon(
    order.status
  );

  const totalUnits = order.items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-slate-900">
              {order.order_number}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {order.customer_name}
            </p>

            <p className="text-xs text-slate-400">
              @{order.customer_username}
            </p>
          </div>

          <StatusBadge
            status={order.status}
            icon={StatusIcon}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">
          <div>
            <p className="text-xs text-slate-400">
              Total
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {formatMoney(order.total)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Payment
            </p>

            <div className="mt-1">
              <PaymentBadge
                status={
                  order.payment_status
                }
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Units
            </p>

            <p className="mt-1 font-semibold text-slate-700">
              {totalUnits}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Date
            </p>

            <p className="mt-1 text-xs font-medium text-slate-700">
              {formatDate(
                order.created_at
              )}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {expanded
              ? "Hide Management"
              : "Manage Order"}

            <ChevronDown
              className={`h-4 w-4 transition ${
                expanded
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
          >
            <Eye className="h-4 w-4" />

            View
          </Link>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <OrderManagement
            order={order}
            selectedStatus={
              selectedStatus
            }
            updating={updating}
            onStatusChange={
              onStatusChange
            }
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
}

function OrderManagement({
  order,
  selectedStatus,
  updating,
  onStatusChange,
  onUpdate,
}: {
  order: Order;
  selectedStatus: OrderStatus;
  updating: boolean;
  onStatusChange: (
    status: OrderStatus
  ) => void;
  onUpdate: () => void;
}) {
  const isTerminal =
    order.status === "CANCELLED" ||
    order.status === "REFUNDED";

  return (
    <div>
      {/* Top management panels */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Status */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">
            Order Status
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Update the current order status.
          </p>

          <select
            value={selectedStatus}
            onChange={(event) =>
              onStatusChange(
                event.target
                  .value as OrderStatus
              )
            }
            className="mt-4 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
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
            onClick={onUpdate}
            disabled={
              updating ||
              selectedStatus ===
                order.status
            }
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {updating && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {updating
              ? "Updating..."
              : selectedStatus ===
                  order.status
                ? "No Changes"
                : "Update Status"}
          </button>

          {isTerminal && (
            <p className="mt-3 text-xs leading-5 text-amber-600">
              This order is{" "}
              {getStatusLabel(
                order.status
              ).toLowerCase()}
              . It cannot be returned to
              an active status.
            </p>
          )}
        </div>

        {/* Customer */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">
            Customer
          </h3>

          <div className="mt-4 space-y-3">
            <InfoRow
              label="Name"
              value={
                order.customer_name
              }
            />

            <InfoRow
              label="Username"
              value={`@${order.customer_username}`}
            />

            <InfoRow
              label="Email"
              value={
                order.customer_email ||
                "—"
              }
            />
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">
            Payment
          </h3>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">
                Status
              </span>

              <PaymentBadge
                status={
                  order.payment_status
                }
              />
            </div>

            <InfoRow
              label="Method"
              value={
                order.payment_method ||
                "—"
              }
            />

            <InfoRow
              label="Transaction"
              value={
                order.transaction_reference ||
                "—"
              }
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900">
          Products
        </h3>

        <div className="mt-3 divide-y divide-slate-100">
          {order.items.map(
            (item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {item.product_name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Seller:{" "}
                    {
                      item.seller_username
                    }
                  </p>
                </div>

                <div className="flex items-center justify-between gap-6 text-sm sm:justify-end">
                  <span className="text-slate-500">
                    {item.quantity} ×{" "}
                    {formatMoney(
                      item.product_price
                    )}
                  </span>

                  <span className="font-bold text-slate-900">
                    {formatMoney(
                      item.subtotal
                    )}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Shipping and summary */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">

        {/* Shipping */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">
            Shipping Address
          </h3>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {order.shipping_address}
          </p>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">
            Order Summary
          </h3>

          <div className="mt-4 space-y-3">
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

            <div className="border-t border-slate-100 pt-3">
              <SummaryRow
                label="Total"
                value={formatMoney(
                  order.total
                )}
                strong
              />
            </div>
          </div>
        </div>
      </div>

      {/* Date information */}
      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow
            label="Created"
            value={formatDate(
              order.created_at
            )}
          />

          <InfoRow
            label="Last Updated"
            value={formatDate(
              order.updated_at
            )}
          />
        </div>
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
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClasses(
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
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
        No Payment
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentClasses(
        status
      )}`}
    >
      {status}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-sm font-medium text-slate-700">
        {value}
      </span>
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
            ? "text-lg font-bold text-slate-900"
            : "text-sm font-medium text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}