"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ClipboardList,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import api from "@/lib/client";
import SiteHeader from "@/components/site-header";
import SellerNav from "@/components/seller-nav";

interface User {
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
  discount_amount: string;
  total: string;

  shipping_address: string;

  created_at: string;
  updated_at: string;
}

export default function SellerSalesPage() {
  /*
  |--------------------------------------------------------------------------
  | AUTHENTICATION
  |--------------------------------------------------------------------------
  */

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | DATA
  |--------------------------------------------------------------------------
  */

  const [orders, setOrders] =
    useState<SellerOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | READ LOGGED-IN USER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const storedAuth =
        localStorage.getItem("trademarket-auth");

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

  /*
  |--------------------------------------------------------------------------
  | LOAD SALES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!authReady || !currentUser) {
      return;
    }

    loadSales();
  }, [authReady, currentUser]);

  /*
  |--------------------------------------------------------------------------
  | FETCH SELLER ORDERS
  |--------------------------------------------------------------------------
  */

  const loadSales = async () => {
    try {
      setError("");

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
          "Unable to load sales information."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SALES CALCULATIONS
  |--------------------------------------------------------------------------
  */

  const sales = useMemo(() => {
    const deliveredOrders =
      orders.filter(
        (order) =>
          order.status === "DELIVERED"
      );

    const activeOrders =
      orders.filter(
        (order) =>
          ![
            "CANCELLED",
            "REFUNDED",
            "DELIVERED",
          ].includes(order.status)
      );

    const cancelledOrders =
      orders.filter(
        (order) =>
          order.status === "CANCELLED"
      );

    const refundedOrders =
      orders.filter(
        (order) =>
          order.status === "REFUNDED"
      );

    const deliveredSales =
      deliveredOrders.reduce(
        (total, order) =>
          total +
          getSellerOrderSubtotal(order),
        0
      );

    const pendingSales =
      activeOrders.reduce(
        (total, order) =>
          total +
          getSellerOrderSubtotal(order),
        0
      );

    const cancelledSales =
      cancelledOrders.reduce(
        (total, order) =>
          total +
          getSellerOrderSubtotal(order),
        0
      );

    const refundedSales =
      refundedOrders.reduce(
        (total, order) =>
          total +
          getSellerOrderSubtotal(order),
        0
      );

    const totalUnitsSold =
      deliveredOrders.reduce(
        (total, order) =>
          total +
          order.items.reduce(
            (itemTotal, item) =>
              itemTotal + item.quantity,
            0
          ),
        0
      );

    return {
      deliveredOrders,
      activeOrders,
      cancelledOrders,
      refundedOrders,

      deliveredSales,
      pendingSales,
      cancelledSales,
      refundedSales,

      totalUnitsSold,
    };
  }, [orders]);

  /*
  |--------------------------------------------------------------------------
  | RECENT SALES
  |--------------------------------------------------------------------------
  */

  const recentSales =
    useMemo(() => {
      return orders
        .filter(
          (order) =>
            order.status === "DELIVERED"
        )
        .sort(
          (a, b) =>
            new Date(
              b.updated_at
            ).getTime() -
            new Date(
              a.updated_at
            ).getTime()
        )
        .slice(0, 10);
    }, [orders]);

  /*
  |--------------------------------------------------------------------------
  | AUTH LOADING
  |--------------------------------------------------------------------------
  */

  if (!authReady) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-slate-600">
              Loading seller sales...
            </p>
          </div>
        </main>
      </>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT LOGGED IN
  |--------------------------------------------------------------------------
  */

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
                Please log in to view your sales.
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

  /*
  |--------------------------------------------------------------------------
  | ROLE CHECK
  |--------------------------------------------------------------------------
  */

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
                Your account does not have access
                to seller sales.
              </p>

              <Link
                href="/"
                className="mt-5 inline-flex rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white hover:bg-green-800"
              >
                Back to Marketplace
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <SiteHeader />

      <SellerNav />

      <main className="min-h-screen bg-slate-50">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

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
                  <TrendingUp className="h-7 w-7 text-green-700" />
                </div>

                <div>

                  <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                    Agricult Seller Center
                  </p>

                  <h1 className="font-serif text-4xl font-bold text-slate-950">
                    Sales & Earnings
                  </h1>

                </div>

              </div>

              <button
                type="button"
                onClick={loadSales}
                disabled={
                  loading || refreshing
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

            <p className="mt-5 max-w-2xl text-lg text-slate-600">
              Track completed sales, pending fulfillment,
              and the value of products sold through
              Agricult.
            </p>

          </div>
        </section>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <section className="mx-auto max-w-7xl px-6 py-10">

          {/* ERROR */}

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

          {/* =================================================
              TOP SALES CARDS
          ================================================= */}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <MoneyCard
              icon={
                <TrendingUp className="h-5 w-5" />
              }
              label="Delivered Sales"
              value={
                sales.deliveredSales
              }
              description="Completed product sales"
            />

            <MoneyCard
              icon={
                <BarChart3 className="h-5 w-5" />
              }
              label="Pending Sales"
              value={
                sales.pendingSales
              }
              description="Orders still being fulfilled"
            />

            <NumberCard
              icon={
                <ClipboardList className="h-5 w-5" />
              }
              label="Delivered Orders"
              value={
                sales.deliveredOrders.length
              }
              description="Completed customer orders"
            />

            <NumberCard
              icon={
                <ShoppingBag className="h-5 w-5" />
              }
              label="Units Sold"
              value={
                sales.totalUnitsSold
              }
              description="Units in delivered orders"
            />

          </div>

          {/* =================================================
              ORDER STATUS
          ================================================= */}

          <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm md:p-8">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                  Order Status
                </p>

                <h2 className="mt-1 font-serif text-2xl font-bold text-slate-950">
                  Sales Pipeline
                </h2>

              </div>

              <CalendarDays className="h-7 w-7 text-green-700" />

            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <PipelineCard
                label="Active Orders"
                value={
                  sales.activeOrders.length
                }
                description="Pending, confirmed, processing or shipped"
              />

              <PipelineCard
                label="Delivered"
                value={
                  sales.deliveredOrders.length
                }
                description="Successfully completed"
              />

              <PipelineCard
                label="Cancelled"
                value={
                  sales.cancelledOrders.length
                }
                description="Cancelled orders"
              />

              <PipelineCard
                label="Refunded"
                value={
                  sales.refundedOrders.length
                }
                description="Refunded orders"
              />

            </div>

          </section>

          {/* =================================================
              SALES BREAKDOWN + PERFORMANCE
          ================================================= */}

          <section className="mt-8 grid gap-8 lg:grid-cols-2">

            {/* SALES BREAKDOWN */}

            <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">

              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Revenue Summary
              </p>

              <h2 className="mt-1 font-serif text-2xl font-bold text-slate-950">
                Sales Breakdown
              </h2>

              <div className="mt-6 space-y-4">

                <SalesRow
                  label="Delivered sales"
                  value={
                    sales.deliveredSales
                  }
                  positive
                />

                <SalesRow
                  label="Pending sales"
                  value={
                    sales.pendingSales
                  }
                />

                <SalesRow
                  label="Cancelled value"
                  value={
                    sales.cancelledSales
                  }
                />

                <SalesRow
                  label="Refunded value"
                  value={
                    sales.refundedSales
                  }
                />

              </div>

              <div className="mt-6 rounded-xl bg-green-50 p-5">

                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Completed Sales
                </p>

                <p className="mt-1 text-3xl font-bold text-green-800">
                  {formatCurrency(
                    sales.deliveredSales
                  )}
                </p>

              </div>

            </div>

            {/* PERFORMANCE */}

            <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">

              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Seller Performance
              </p>

              <h2 className="mt-1 font-serif text-2xl font-bold text-slate-950">
                Marketplace Activity
              </h2>

              <div className="mt-6 space-y-5">

                <PerformanceRow
                  label="Total orders"
                  value={orders.length}
                />

                <PerformanceRow
                  label="Delivered orders"
                  value={
                    sales.deliveredOrders.length
                  }
                />

                <PerformanceRow
                  label="Active orders"
                  value={
                    sales.activeOrders.length
                  }
                />

                <PerformanceRow
                  label="Units delivered"
                  value={
                    sales.totalUnitsSold
                  }
                />

              </div>

              <Link
                href="/seller/orders"
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
              >
                Manage orders

                <ArrowRight className="h-4 w-4" />
              </Link>

            </div>

          </section>

          {/* =================================================
              RECENT SALES
          ================================================= */}

          <section className="mt-8 rounded-2xl border bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between md:p-8">

              <div>

                <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                  Completed Sales
                </p>

                <h2 className="mt-1 font-serif text-2xl font-bold text-slate-950">
                  Recent Sales
                </h2>

                <p className="mt-1 text-slate-600">
                  Your most recently delivered orders.
                </p>

              </div>

              <Link
                href="/seller/orders"
                className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
              >
                View all orders

                <ArrowRight className="h-4 w-4" />
              </Link>

            </div>

            {/* LOADING */}

            {loading && (
              <div className="py-16 text-center text-slate-500">

                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-green-700" />

                Loading sales...

              </div>
            )}

            {/* EMPTY */}

            {!loading &&
              recentSales.length === 0 && (
                <div className="px-6 py-16 text-center">

                  <TrendingUp className="mx-auto h-10 w-10 text-slate-400" />

                  <h3 className="mt-4 font-serif text-xl font-bold text-slate-950">
                    No completed sales yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Delivered orders containing your
                    products will appear here.
                  </p>

                </div>
              )}

            {/* SALES LIST */}

            {!loading &&
              recentSales.length > 0 && (
                <div className="divide-y">

                  {recentSales.map(
                    (order) => (
                      <div
                        key={order.id}
                        className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:px-8"
                      >

                        <div className="flex items-start gap-4">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
                            <ShoppingBag className="h-5 w-5 text-green-700" />
                          </div>

                          <div>

                            <p className="font-semibold text-slate-950">
                              {order.order_number}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {order.customer_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Delivered{" "}
                              {formatDate(
                                order.updated_at
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="flex items-center justify-between gap-6 md:justify-end">

                          <div className="text-left md:text-right">

                            <p className="text-xs text-slate-500">
                              Your sale
                            </p>

                            <p className="mt-1 text-lg font-bold text-green-700">
                              {formatCurrency(
                                getSellerOrderSubtotal(
                                  order
                                )
                              )}
                            </p>

                          </div>

                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
                          >
                            Details

                            <ArrowRight className="h-4 w-4" />
                          </Link>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

          </section>

          {/* =================================================
              INFORMATION NOTE
          ================================================= */}

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-800">

            <strong>
              Sales calculation:
            </strong>{" "}
            completed sales are calculated from the
            subtotal of your own products in delivered
            orders. Shipping fees and other sellers'
            products are not included.

          </div>

        </section>

      </main>
    </>
  );
}

/*
|--------------------------------------------------------------------------
| MONEY CARD
|--------------------------------------------------------------------------
*/

function MoneyCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
        {icon}
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-green-700">
        {formatCurrency(value)}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| NUMBER CARD
|--------------------------------------------------------------------------
*/

function NumberCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
        {icon}
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-bold text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PIPELINE CARD
|--------------------------------------------------------------------------
*/

function PipelineCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-5">

      <p className="text-sm font-semibold text-slate-950">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-green-700">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SALES ROW
|--------------------------------------------------------------------------
*/

function SalesRow({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">

      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span
        className={`font-semibold ${
          positive
            ? "text-green-700"
            : "text-slate-950"
        }`}
      >
        {formatCurrency(value)}
      </span>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PERFORMANCE ROW
|--------------------------------------------------------------------------
*/

function PerformanceRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">

      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span className="font-bold text-slate-950">
        {value.toLocaleString("en-GH")}
      </span>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SELLER ORDER SUBTOTAL
|--------------------------------------------------------------------------
*/

function getSellerOrderSubtotal(
  order: SellerOrder
): number {
  return order.items.reduce(
    (total, item) =>
      total + Number(item.subtotal),
    0
  );
}

/*
|--------------------------------------------------------------------------
| FORMAT CURRENCY
|--------------------------------------------------------------------------
*/

function formatCurrency(
  value: string | number
): string {
  return `GHS ${Number(value).toLocaleString(
    "en-GH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDate(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/*
|--------------------------------------------------------------------------
| API ERROR MESSAGE
|--------------------------------------------------------------------------
*/

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
    return (
      "Your login session has expired. " +
      "Please log in again."
    );
  }

  if (status === 403) {
    return (
      "You do not have permission to view " +
      "seller sales."
    );
  }

  if (status === 404) {
    return (
      "The sales endpoint could not be found."
    );
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
            if (Array.isArray(value)) {
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

  if (error?.message) {
    return error.message;
  }

  return fallback;
}