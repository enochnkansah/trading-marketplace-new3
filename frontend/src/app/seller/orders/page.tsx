"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";

import api from "@/lib/client";
import SiteHeader from "@/components/site-header";
import SellerNav from "@/components/seller-nav";

/* ============================================================
   TYPES
============================================================ */

interface UserAccount {
  id: number;
  username: string;
  email: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
}

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

type StatusFilter = "ALL" | OrderStatus;

/* ============================================================
   STATUS OPTIONS
============================================================ */

const STATUS_OPTIONS: {
  value: OrderStatus;
  label: string;
}[] = [
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
];

/* ============================================================
   MAIN PAGE
============================================================ */

export default function SellerOrdersPage() {
  /* ==========================================================
     AUTH
  ========================================================== */

  const [currentUser, setCurrentUser] =
    useState<UserAccount | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  /* ==========================================================
     ORDERS
  ========================================================== */

  const [orders, setOrders] =
    useState<SellerOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* ==========================================================
     SEARCH / FILTER
  ========================================================== */

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  /* ==========================================================
     STATUS UPDATE
  ========================================================== */

  const [updatingOrderId, setUpdatingOrderId] =
    useState<number | null>(null);

  /* ==========================================================
     EXPANDED ORDER
  ========================================================== */

  const [expandedOrderId, setExpandedOrderId] =
    useState<number | null>(null);

  /* ==========================================================
     MESSAGES
  ========================================================== */

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ==========================================================
     READ AUTH
  ========================================================== */

  useEffect(() => {
    try {
      const storedAuth =
        localStorage.getItem(
          "trademarket-auth"
        );

      if (!storedAuth) {
        setAuthReady(true);
        return;
      }

      const parsedAuth =
        JSON.parse(storedAuth);

      const user =
        parsedAuth?.state?.user;

      if (user?.id) {
        setCurrentUser(user);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  /* ==========================================================
     LOAD ORDERS
  ========================================================== */

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (
      currentUser.role !== "SELLER" &&
      currentUser.role !== "ADMIN"
    ) {
      setLoading(false);
      return;
    }

    loadOrders();
  }, [authReady, currentUser]);

  const loadOrders = async () => {
    try {
      setError("");
      setSuccess("");

      if (orders.length === 0) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response =
        await api.get("/orders/seller/");

      const data: SellerOrder[] =
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];

      setOrders(data);
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to load seller orders."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ==========================================================
     UPDATE STATUS
  ========================================================== */

  const updateOrderStatus = async (
    order: SellerOrder,
    newStatus: OrderStatus
  ) => {
    if (newStatus === order.status) {
      return;
    }

    setError("");
    setSuccess("");
    setUpdatingOrderId(order.id);

    try {
      const response =
        await api.patch(
          `/orders/${order.id}/seller-status/`,
          {
            status: newStatus,
          }
        );

      const updatedOrder: SellerOrder =
        response.data;

      setOrders(
        (previousOrders) =>
          previousOrders.map(
            (item) =>
              item.id === updatedOrder.id
                ? updatedOrder
                : item
          )
      );

      setSuccess(
        `${updatedOrder.order_number} is now ${formatStatus(
          updatedOrder.status
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
      setUpdatingOrderId(null);
    }
  };

  /* ==========================================================
     FILTER ORDERS
  ========================================================== */

  const filteredOrders = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        order.order_number
          .toLowerCase()
          .includes(normalizedSearch) ||
        order.customer_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        order.customer_email
          .toLowerCase()
          .includes(normalizedSearch) ||
        order.items.some((item) =>
          item.product_name
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    orders,
    search,
    statusFilter,
  ]);

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const statistics = useMemo(() => {
    return {
      total: orders.length,

      pending: orders.filter(
        (order) =>
          order.status === "PENDING"
      ).length,

      confirmed: orders.filter(
        (order) =>
          order.status === "CONFIRMED"
      ).length,

      processing: orders.filter(
        (order) =>
          order.status === "PROCESSING"
      ).length,

      shipped: orders.filter(
        (order) =>
          order.status === "SHIPPED"
      ).length,

      delivered: orders.filter(
        (order) =>
          order.status === "DELIVERED"
      ).length,

      cancelled: orders.filter(
        (order) =>
          order.status === "CANCELLED"
      ).length,

      refunded: orders.filter(
        (order) =>
          order.status === "REFUNDED"
      ).length,
    };
  }, [orders]);

  /* ==========================================================
     AUTH LOADING
  ========================================================== */

  if (!authReady) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-slate-600">
              Loading seller center...
            </p>
          </div>
        </main>
      </>
    );
  }

  /* ==========================================================
     LOGIN REQUIRED
  ========================================================== */

  if (!currentUser) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen bg-slate-50">
          <section className="mx-auto max-w-7xl px-6 py-16">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">

              <h1 className="text-xl font-bold">
                Seller login required
              </h1>

              <p className="mt-2">
                Please log in to view seller
                orders.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white hover:bg-green-800"
              >
                Log in
              </Link>

            </div>
          </section>
        </main>
      </>
    );
  }

  /* ==========================================================
     ROLE CHECK
  ========================================================== */

  if (
    currentUser.role !== "SELLER" &&
    currentUser.role !== "ADMIN"
  ) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen bg-slate-50">
          <section className="mx-auto max-w-7xl px-6 py-16">

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">

              <h1 className="text-xl font-bold">
                Seller access required
              </h1>

              <p className="mt-2">
                Your account does not have
                access to seller orders.
              </p>

            </div>

          </section>
        </main>
      </>
    );
  }

  /* ==========================================================
     MAIN PAGE
  ========================================================== */

  return (
    <>
      <SiteHeader />

      <SellerNav />

      <main className="min-h-screen bg-slate-50">

        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <section className="border-b bg-white">

          <div className="mx-auto max-w-7xl px-6 py-10">

            <Link
              href="/seller/dashboard"
              className="mb-7 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-green-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">

                  <ClipboardList className="h-7 w-7 text-green-700" />

                </div>

                <div>

                  <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                    Agricult Seller Center
                  </p>

                  <h1 className="font-serif text-4xl font-bold text-slate-950">
                    Seller Orders
                  </h1>

                </div>

              </div>

              <button
                type="button"
                onClick={loadOrders}
                disabled={
                  loading ||
                  refreshing
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}

              </button>

            </div>

            <p className="mt-5 max-w-3xl text-lg text-slate-600">
              Manage customer orders containing
              your products and update fulfillment
              status.
            </p>

          </div>

        </section>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <section className="mx-auto max-w-7xl px-6 py-10">

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-5 text-red-700">

              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1 whitespace-pre-wrap text-sm">
                {error}
              </p>

            </div>
          )}

          {/* ==================================================
              SUCCESS
          ================================================== */}

          {success && (
            <div className="mb-6 rounded-xl border border-green-300 bg-green-50 p-5 text-green-700">

              <p className="font-semibold">
                Order updated
              </p>

              <p className="mt-1 text-sm">
                {success}
              </p>

            </div>
          )}

          {/* ==================================================
              STATISTICS
          ================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

            <OrderStat
              label="All"
              value={statistics.total}
              active={
                statusFilter === "ALL"
              }
              onClick={() =>
                setStatusFilter("ALL")
              }
            />

            <OrderStat
              label="Pending"
              value={statistics.pending}
              active={
                statusFilter === "PENDING"
              }
              onClick={() =>
                setStatusFilter("PENDING")
              }
            />

            <OrderStat
              label="Confirmed"
              value={statistics.confirmed}
              active={
                statusFilter === "CONFIRMED"
              }
              onClick={() =>
                setStatusFilter(
                  "CONFIRMED"
                )
              }
            />

            <OrderStat
              label="Processing"
              value={statistics.processing}
              active={
                statusFilter === "PROCESSING"
              }
              onClick={() =>
                setStatusFilter(
                  "PROCESSING"
                )
              }
            />

            <OrderStat
              label="Shipped"
              value={statistics.shipped}
              active={
                statusFilter === "SHIPPED"
              }
              onClick={() =>
                setStatusFilter("SHIPPED")
              }
            />

            <OrderStat
              label="Delivered"
              value={statistics.delivered}
              active={
                statusFilter === "DELIVERED"
              }
              onClick={() =>
                setStatusFilter(
                  "DELIVERED"
                )
              }
            />

            <OrderStat
              label="Cancelled"
              value={statistics.cancelled}
              active={
                statusFilter === "CANCELLED"
              }
              onClick={() =>
                setStatusFilter(
                  "CANCELLED"
                )
              }
            />

          </div>

          {/* ==================================================
              SEARCH / FILTER
          ================================================== */}

          <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">

            <div className="grid gap-4 md:grid-cols-[1fr_220px]">

              <div className="relative">

                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search order number, customer or product..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />

              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >

                <option value="ALL">
                  All statuses
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="CONFIRMED">
                  Confirmed
                </option>

                <option value="PROCESSING">
                  Processing
                </option>

                <option value="SHIPPED">
                  Shipped
                </option>

                <option value="DELIVERED">
                  Delivered
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>

                <option value="REFUNDED">
                  Refunded
                </option>

              </select>

            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">

              <p className="text-slate-500">

                Showing{" "}

                <strong className="text-slate-900">
                  {filteredOrders.length}
                </strong>{" "}

                of{" "}

                <strong className="text-slate-900">
                  {orders.length}
                </strong>{" "}

                orders

              </p>

              {(search ||
                statusFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter(
                      "ALL"
                    );
                  }}
                  className="font-semibold text-green-700 hover:text-green-800"
                >
                  Clear filters
                </button>
              )}

            </div>

          </section>

          {/* ==================================================
              ORDER LIST
          ================================================== */}

          <section className="mt-8">

            {loading ? (
              <div className="rounded-2xl border bg-white py-20 text-center">

                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-green-700" />

                <p className="text-slate-500">
                  Loading seller orders...
                </p>

              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-2xl border bg-white px-6 py-20 text-center">

                <ClipboardList className="mx-auto h-12 w-12 text-slate-400" />

                <h2 className="mt-4 font-serif text-2xl font-bold text-slate-950">
                  No orders found
                </h2>

                <p className="mt-2 text-slate-500">
                  {orders.length === 0
                    ? "Orders containing your products will appear here."
                    : "Try changing your search or status filter."}
                </p>

              </div>
            ) : (
              <div className="space-y-5">

                {filteredOrders.map(
                  (order) => (
                    <SellerOrderCard
                      key={order.id}
                      order={order}
                      expanded={
                        expandedOrderId ===
                        order.id
                      }
                      updating={
                        updatingOrderId ===
                        order.id
                      }
                      onToggle={() =>
                        setExpandedOrderId(
                          expandedOrderId ===
                            order.id
                            ? null
                            : order.id
                        )
                      }
                      onStatusChange={(
                        newStatus
                      ) =>
                        updateOrderStatus(
                          order,
                          newStatus
                        )
                      }
                    />
                  )
                )}

              </div>
            )}

          </section>

        </section>

      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t bg-white">

        <div className="mx-auto max-w-7xl px-6 py-8">

          <div className="flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">

            <p>
              ©{" "}
              {new Date().getFullYear()}{" "}
              Agricult Marketplace
            </p>

            <Link
              href="/"
              className="hover:text-green-700"
            >
              Marketplace
            </Link>

          </div>

        </div>

      </footer>
    </>
  );
}

/* ============================================================
   ORDER CARD
============================================================ */

function SellerOrderCard({
  order,
  expanded,
  updating,
  onToggle,
  onStatusChange,
}: {
  order: SellerOrder;
  expanded: boolean;
  updating: boolean;
  onToggle: () => void;
  onStatusChange: (
    status: OrderStatus
  ) => void;
}) {
  const sellerSubtotal =
    getSellerOrderSubtotal(order);

  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">

      {/* ======================================================
          ORDER SUMMARY
      ====================================================== */}

      <div className="p-6 md:p-7">

        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

          {/* ORDER INFORMATION */}

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100">

              <ShoppingBag className="h-6 w-6 text-green-700" />

            </div>

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h2 className="font-serif text-xl font-bold text-slate-950">
                  {order.order_number}
                </h2>

                <StatusBadge
                  status={order.status}
                />

              </div>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

                <span className="inline-flex items-center gap-1.5">

                  <CalendarDays className="h-4 w-4" />

                  {formatDate(
                    order.created_at
                  )}

                </span>

                <span className="inline-flex items-center gap-1.5">

                  <Package className="h-4 w-4" />

                  {getTotalQuantity(
                    order
                  )}{" "}
                  item
                  {getTotalQuantity(
                    order
                  ) !== 1
                    ? "s"
                    : ""}

                </span>

              </div>

            </div>

          </div>

          {/* CUSTOMER */}

          <div className="flex items-start gap-3">

            <User className="mt-0.5 h-5 w-5 text-slate-400" />

            <div>

              <p className="font-semibold text-slate-900">
                {order.customer_name}
              </p>

              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">

                <Mail className="h-3.5 w-3.5" />

                {order.customer_email}

              </p>

            </div>

          </div>

          {/* SELLER TOTAL */}

          <div className="text-left xl:text-right">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Your products
            </p>

            <p className="mt-1 text-2xl font-bold text-green-700">
              {formatCurrency(
                sellerSubtotal
              )}
            </p>

          </div>

          {/* ACTIONS */}

          <div className="flex flex-wrap items-center gap-2">

            {/* IMPORTANT:
                Seller order details route.
                This must NOT point to /orders/{id}.
            */}

            <Link
              href={`/seller/orders/${order.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-green-600 hover:text-green-700"
            >
              Details

              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
            >

              {expanded
                ? "Hide"
                : "Manage"}

              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expanded
                    ? "rotate-180"
                    : ""
                }`}
              />

            </button>

          </div>

        </div>

      </div>

      {/* ======================================================
          EXPANDED MANAGEMENT
      ====================================================== */}

      {expanded && (
        <div className="border-t bg-slate-50 p-6 md:p-7">

          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">

            {/* =================================================
                PRODUCTS
            ================================================= */}

            <div>

              <h3 className="font-serif text-xl font-bold text-slate-950">
                Products in this order
              </h3>

              <div className="mt-5 overflow-hidden rounded-xl border bg-white">

                <div className="divide-y">

                  {order.items.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div className="flex items-start gap-4">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-100">

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

              </div>

            </div>

            {/* =================================================
                STATUS MANAGEMENT
            ================================================= */}

            <div>

              <h3 className="font-serif text-xl font-bold text-slate-950">
                Fulfillment
              </h3>

              <div className="mt-5 rounded-xl border bg-white p-5">

                <p className="text-sm text-slate-500">
                  Current status
                </p>

                <div className="mt-2">
                  <StatusBadge
                    status={order.status}
                  />
                </div>

                {order.status ===
                  "CANCELLED" ||
                order.status ===
                  "REFUNDED" ? (
                  <p className="mt-5 text-sm leading-6 text-slate-500">
                    This order is{" "}
                    {order.status.toLowerCase()}
                    . No further seller status
                    changes are available.
                  </p>
                ) : (
                  <div className="mt-5">

                    <label className="mb-2 block text-sm font-semibold text-slate-900">
                      Update status
                    </label>

                    <div className="relative">

                      <select
                        value={
                          order.status
                        }
                        onChange={(
                          event
                        ) =>
                          onStatusChange(
                            event.target
                              .value as OrderStatus
                          )
                        }
                        disabled={updating}
                        className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        {/* Current status */}

                        <option
                          value={
                            order.status
                          }
                        >
                          {formatStatus(
                            order.status
                          )}
                        </option>

                        {/* Allowed next statuses */}

                        {getNextStatus(
                          order.status
                        ) && (
                          <option
                            value={getNextStatus(
                              order.status
                            )!}
                          >
                            Move to{" "}
                            {formatStatus(
                              getNextStatus(
                                order.status
                              )!
                            )}
                          </option>
                        )}

                      </select>

                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    </div>

                    {updating && (
                      <p className="mt-2 text-xs text-slate-500">
                        Updating order status...
                      </p>
                    )}

                  </div>
                )}

              </div>

              {/* ADDRESS */}

              <div className="mt-5 rounded-xl border bg-white p-5">

                <div className="flex items-start gap-3">

                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />

                  <div>

                    <p className="text-sm font-semibold text-slate-900">
                      Shipping Address
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {order.shipping_address}
                    </p>

                  </div>

                </div>

              </div>

              {/* ORDER SUMMARY */}

              <div className="mt-5 rounded-xl border bg-white p-5">

                <p className="text-sm font-semibold text-slate-900">
                  Order Summary
                </p>

                <div className="mt-4 space-y-3 text-sm">

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

                  <div className="border-t pt-3">

                    <SummaryRow
                      label="Order total"
                      value={formatCurrency(
                        order.total
                      )}
                      strong
                    />

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </article>
  );
}

/* ============================================================
   ORDER STAT
============================================================ */

function OrderStat({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-green-600 bg-green-50 ring-1 ring-green-600"
          : "bg-white hover:border-green-300"
      }`}
    >

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-950">
        {value}
      </p>

    </button>
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
   SELLER ORDER SUBTOTAL
============================================================ */

function getSellerOrderSubtotal(
  order: SellerOrder
): number {
  return order.items.reduce(
    (total, item) =>
      total + Number(item.subtotal),
    0
  );
}

/* ============================================================
   TOTAL QUANTITY
============================================================ */

function getTotalQuantity(
  order: SellerOrder
): number {
  return order.items.reduce(
    (total, item) =>
      total + Number(item.quantity),
    0
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
  const number =
    Number(value);

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
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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

  const status =
    error?.response?.status;

  const data =
    error?.response?.data;

  if (status === 401) {
    return "Your login session has expired. Please log in again.";
  }

  if (status === 403) {
    return "You do not have permission to manage seller orders.";
  }

  if (status === 404) {
    return "The requested order could not be found.";
  }

  if (data?.detail) {
    return String(data.detail);
  }

  if (typeof data === "string") {
    return data;
  }

  if (
    data &&
    typeof data === "object"
  ) {
    const messages =
      Object.entries(data)
        .map(
          ([field, value]) => {
            if (
              Array.isArray(value)
            ) {
              return `${field}: ${value.join(
                ", "
              )}`;
            }

            return `${field}: ${String(
              value
            )}`;
          }
        )
        .join("\n");

    if (messages) {
      return messages;
    }
  }

  return (
    error?.message ||
    fallback
  );
}