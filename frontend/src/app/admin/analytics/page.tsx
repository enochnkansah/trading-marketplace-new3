"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  BarChart3,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import api from "@/lib/client";
import AdminNav from "@/components/admin-nav";

type AnalyticsRange =
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "all";

type RevenueStats = {
  total: string | number;
  today: string | number;
  this_month: string | number;
  average_order_value: string | number;
  all_time?: string | number;
};

type OrderStats = {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
};

type SalesStats = {
  successful_orders: number;
  total_units_sold: number;
};

type ProductStats = {
  total: number;
  active: number;
  inactive: number;
  low_stock: number;
  out_of_stock: number;
};

type UserStats = {
  total: number;
  customers: number;
  sellers: number;
  admins: number;
  active: number;
  inactive: number;
};

type TopProduct = {
  product_id: number;
  product_name: string;
  units_sold: number;
  revenue: string | number;
};

type TopSeller = {
  seller_id: number | null;
  seller_username: string | null;
  units_sold: number;
  revenue: string | number;
};

type DailyRevenue = {
  date: string;
  revenue: string | number;
};

type MonthlyRevenue = {
  month: string;
  revenue: string | number;
};

type RecentSale = {
  payment_id: number;
  order_id: number;
  order_number: string;
  customer_username: string;
  amount: string | number;
  payment_method: string;
  transaction_reference: string;
  created_at: string | null;
};

type AnalyticsResponse = {
  range: AnalyticsRange;
  range_start: string | null;
  range_end: string;

  revenue: RevenueStats;
  orders: OrderStats;
  sales: SalesStats;
  products: ProductStats;
  users: UserStats;

  top_products: TopProduct[];
  top_sellers: TopSeller[];
  daily_revenue: DailyRevenue[];
  monthly_revenue: MonthlyRevenue[];
  recent_sales: RecentSale[];
};

const RANGE_OPTIONS: Array<{
  value: AnalyticsRange;
  label: string;
  description: string;
}> = [
  {
    value: "today",
    label: "Today",
    description: "Today's activity",
  },
  {
    value: "7d",
    label: "7 Days",
    description: "Last 7 days",
  },
  {
    value: "30d",
    label: "30 Days",
    description: "Last 30 days",
  },
  {
    value: "month",
    label: "This Month",
    description: "Current month",
  },
  {
    value: "all",
    label: "All Time",
    description: "Complete history",
  },
];

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-GH").format(
    Number(value || 0)
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GH", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMonth(value: string) {
  const normalized =
    value.length >= 7
      ? value.slice(0, 7)
      : value;

  const date = new Date(`${normalized}-01T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GH", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function getRangeLabel(range: AnalyticsRange) {
  return (
    RANGE_OPTIONS.find((item) => item.value === range)
      ?.label || "All Time"
  );
}

function getApiErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (typeof data === "string") {
    return data;
  }

  return fallback;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({
  data,
  monthly = false,
}: {
  data: Array<{
    label: string;
    value: number;
  }>;
  monthly?: boolean;
}) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed bg-slate-50 text-sm text-slate-500">
        No revenue data available for this period.
      </div>
    );
  }

  const max = Math.max(
    ...data.map((item) => item.value),
    1
  );

  return (
    <div className="overflow-x-auto">
      <div
        className={`flex h-72 min-w-full items-end ${
          monthly ? "gap-5" : "gap-1"
        }`}
      >
        {data.map((item, index) => {
          const height =
            item.value <= 0
              ? 2
              : Math.max(
                  8,
                  Math.round((item.value / max) * 220)
                );

          return (
            <div
              key={`${item.label}-${index}`}
              className="group flex min-w-[30px] flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="relative flex w-full justify-center">
                <div
                  className="w-full max-w-[42px] rounded-t-lg bg-green-600 transition hover:bg-green-700"
                  style={{ height }}
                />

                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                  {formatMoney(item.value)}
                </div>
              </div>

              <span className="max-w-[60px] truncate text-[10px] text-slate-500">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] =
    useState<AnalyticsResponse | null>(null);

  const [selectedRange, setSelectedRange] =
    useState<AnalyticsRange>("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllSales, setShowAllSales] = useState(false);

  const loadAnalytics = async (
    range: AnalyticsRange = selectedRange
  ) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<AnalyticsResponse>(
        `/admin/analytics/?range=${range}`
      );

      setAnalytics(response.data);
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to load admin sales and revenue analytics."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics("all");
  }, []);

  const handleRangeChange = (
    range: AnalyticsRange
  ) => {
    setSelectedRange(range);
    setShowAllSales(false);
    loadAnalytics(range);
  };

  const dailyChartData = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return analytics.daily_revenue.map((item) => ({
      label: formatShortDate(item.date),
      value: Number(item.revenue || 0),
    }));
  }, [analytics]);

  const monthlyChartData = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return analytics.monthly_revenue.map((item) => ({
      label: formatMonth(item.month),
      value: Number(item.revenue || 0),
    }));
  }, [analytics]);

  const displayedSales = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return showAllSales
      ? analytics.recent_sales
      : analytics.recent_sales.slice(0, 5);
  }, [analytics, showAllSales]);

  if (loading && !analytics) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-slate-200" />

            <div className="mt-4 h-10 w-80 rounded-lg bg-slate-200" />

            <div className="mt-3 h-5 w-96 rounded bg-slate-200" />
          </div>

          <div className="mt-8 h-16 animate-pulse rounded-2xl bg-white" />

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
                />
              )
            )}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !analytics) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <BarChart3 className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Unable to load analytics
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadAnalytics(selectedRange)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!analytics) {
    return null;
  }

  const orderStatusData = [
    {
      label: "Pending",
      value: analytics.orders.pending,
    },
    {
      label: "Confirmed",
      value: analytics.orders.confirmed,
    },
    {
      label: "Processing",
      value: analytics.orders.processing,
    },
    {
      label: "Shipped",
      value: analytics.orders.shipped,
    },
    {
      label: "Delivered",
      value: analytics.orders.delivered,
    },
    {
      label: "Cancelled",
      value: analytics.orders.cancelled,
    },
    {
      label: "Refunded",
      value: analytics.orders.refunded,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminNav />

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white shadow-sm">
                <BarChart3 className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Sales & Revenue Analytics
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Monitor marketplace performance, revenue,
                  products and sellers.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadAnalytics(selectedRange)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* ================================================== */}
        {/* DATE RANGE FILTER */}
        {/* ================================================== */}

        <section className="mb-8 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-green-700" />

                <h2 className="font-bold text-slate-900">
                  Reporting Period
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Choose the period used for revenue and sales
                analytics.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {RANGE_OPTIONS.map((option) => {
                const active =
                  selectedRange === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      handleRangeChange(option.value)
                    }
                    disabled={loading}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      active
                        ? "bg-green-700 text-white shadow-sm"
                        : "border bg-white text-slate-600 hover:border-green-300 hover:text-green-700"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              Current period:
            </span>

            <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700">
              {getRangeLabel(selectedRange)}
            </span>

            {analytics.range_start && (
              <span>
                From{" "}
                {new Intl.DateTimeFormat("en-GH", {
                  dateStyle: "medium",
                }).format(
                  new Date(
                    `${analytics.range_start}T00:00:00`
                  )
                )}
              </span>
            )}
          </div>
        </section>

        {/* ================================================== */}
        {/* REVENUE OVERVIEW */}
        {/* ================================================== */}

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-700" />

            <h2 className="text-lg font-bold text-slate-900">
              Revenue Overview
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Period Revenue"
              value={formatMoney(
                analytics.revenue.total
              )}
              description={`${getRangeLabel(
                selectedRange
              )} successful payments`}
              icon={CircleDollarSign}
            />

            <StatCard
              title="Today's Revenue"
              value={formatMoney(
                analytics.revenue.today
              )}
              description="Successful payments today"
              icon={CalendarDays}
            />

            <StatCard
              title="This Month"
              value={formatMoney(
                analytics.revenue.this_month
              )}
              description="Successful payments this month"
              icon={TrendingUp}
            />

            <StatCard
              title="Average Order"
              value={formatMoney(
                analytics.revenue.average_order_value
              )}
              description={`${getRangeLabel(
                selectedRange
              )} average`}
              icon={CreditCard}
            />
          </div>
        </section>

        {/* ================================================== */}
        {/* SALES OVERVIEW */}
        {/* ================================================== */}

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-green-700" />

            <h2 className="text-lg font-bold text-slate-900">
              Sales Overview
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Successful Orders"
              value={formatNumber(
                analytics.sales.successful_orders
              )}
              description={`${getRangeLabel(
                selectedRange
              )} successful orders`}
              icon={CheckCircle2}
            />

            <StatCard
              title="Units Sold"
              value={formatNumber(
                analytics.sales.total_units_sold
              )}
              description={`${getRangeLabel(
                selectedRange
              )} units sold`}
              icon={Package}
            />

            <StatCard
              title="Total Orders"
              value={formatNumber(
                analytics.orders.total
              )}
              description="All marketplace orders"
              icon={ShoppingCart}
            />

            <StatCard
              title="Delivered Orders"
              value={formatNumber(
                analytics.orders.delivered
              )}
              description="Orders marked delivered"
              icon={CheckCircle2}
            />
          </div>
        </section>

                {/* ================================================== */}
        {/* REVENUE CHARTS */}
        {/* ================================================== */}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Daily Revenue
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Daily revenue for{" "}
                  {getRangeLabel(
                    selectedRange
                  ).toLowerCase()}
                </p>
              </div>

              <CalendarDays className="h-5 w-5 text-slate-400" />
            </div>

            <MiniBarChart data={dailyChartData} />
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Monthly Revenue
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Monthly revenue for the selected period
                </p>
              </div>

              <BarChart3 className="h-5 w-5 text-slate-400" />
            </div>

            <MiniBarChart
              data={monthlyChartData}
              monthly
            />
          </div>
        </section>

        {/* ================================================== */}
        {/* TOP PRODUCTS + TOP SELLERS */}
        {/* ================================================== */}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* TOP PRODUCTS */}

          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                  <Package className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Top Products
                  </h2>

                  <p className="text-xs text-slate-500">
                    Highest revenue in the selected period
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y">
              {analytics.top_products.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No product sales available for this period.
                </div>
              ) : (
                analytics.top_products.map(
                  (product, index) => (
                    <div
                      key={product.product_id}
                      className="flex items-center gap-4 px-6 py-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {product.product_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatNumber(
                            product.units_sold
                          )}{" "}
                          units sold
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatMoney(
                            product.revenue
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {/* TOP SELLERS */}

          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Store className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Top Sellers
                  </h2>

                  <p className="text-xs text-slate-500">
                    Highest revenue in the selected period
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y">
              {analytics.top_sellers.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No seller sales available for this period.
                </div>
              ) : (
                analytics.top_sellers.map(
                  (seller, index) => (
                    <div
                      key={`${seller.seller_id}-${index}`}
                      className="flex items-center gap-4 px-6 py-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {seller.seller_username ||
                            "Unknown seller"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatNumber(
                            seller.units_sold
                          )}{" "}
                          units sold
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatMoney(
                            seller.revenue
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* ORDER / INVENTORY / USERS */}
        {/* ================================================== */}

        <section className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* ORDER STATUS */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-green-700" />

              <h2 className="font-bold text-slate-900">
                Order Status
              </h2>
            </div>

            <div className="space-y-4">
              {orderStatusData.map((item) => {
                const percentage =
                  analytics.orders.total > 0
                    ? Math.round(
                        (item.value /
                          analytics.orders.total) *
                          100
                      )
                    : 0;

                return (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {item.label}
                      </span>

                      <span className="font-semibold text-slate-900">
                        {formatNumber(item.value)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-green-600"
                        style={{
                          width: `${Math.min(
                            percentage,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INVENTORY */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Box className="h-5 w-5 text-green-700" />

              <h2 className="font-bold text-slate-900">
                Product Inventory
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <span className="text-sm text-slate-600">
                  Total Products
                </span>

                <span className="font-bold text-slate-900">
                  {formatNumber(
                    analytics.products.total
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                <span className="text-sm text-green-700">
                  Active
                </span>

                <span className="font-bold text-green-800">
                  {formatNumber(
                    analytics.products.active
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <span className="text-sm text-slate-600">
                  Inactive
                </span>

                <span className="font-bold text-slate-900">
                  {formatNumber(
                    analytics.products.inactive
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
                <span className="text-sm text-amber-700">
                  Low Stock
                </span>

                <span className="font-bold text-amber-800">
                  {formatNumber(
                    analytics.products.low_stock
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-red-50 p-4">
                <span className="text-sm text-red-700">
                  Out of Stock
                </span>

                <span className="font-bold text-red-800">
                  {formatNumber(
                    analytics.products.out_of_stock
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* USERS */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Users className="h-5 w-5 text-green-700" />

              <h2 className="font-bold text-slate-900">
                User Statistics
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <span className="text-sm text-slate-600">
                  Total Users
                </span>

                <span className="font-bold text-slate-900">
                  {formatNumber(
                    analytics.users.total
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4">
                <span className="text-sm text-blue-700">
                  Customers
                </span>

                <span className="font-bold text-blue-800">
                  {formatNumber(
                    analytics.users.customers
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                <span className="text-sm text-green-700">
                  Sellers
                </span>

                <span className="font-bold text-green-800">
                  {formatNumber(
                    analytics.users.sellers
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-purple-50 p-4">
                <span className="text-sm text-purple-700">
                  Administrators
                </span>

                <span className="font-bold text-purple-800">
                  {formatNumber(
                    analytics.users.admins
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <span className="text-sm text-slate-600">
                  Active Users
                </span>

                <span className="font-bold text-slate-900">
                  {formatNumber(
                    analytics.users.active
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* RECENT SALES */}
        {/* ================================================== */}

        <section className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-green-700" />

                <h2 className="font-bold text-slate-900">
                  Recent Successful Sales
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Latest successful payments for{" "}
                {getRangeLabel(
                  selectedRange
                ).toLowerCase()}
              </p>
            </div>

            {analytics.recent_sales.length > 5 && (
              <button
                type="button"
                onClick={() =>
                  setShowAllSales((value) => !value)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {showAllSales ? (
                  <>
                    Show Less
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    View All
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {displayedSales.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No successful sales found for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">
                      Order
                    </th>

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Payment
                    </th>

                    <th className="px-6 py-4">
                      Reference
                    </th>

                    <th className="px-6 py-4">
                      Amount
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {displayedSales.map((sale) => (
                    <tr
                      key={sale.payment_id}
                      className="text-sm transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/orders/${sale.order_id}`}
                          className="font-semibold text-green-700 hover:text-green-800 hover:underline"
                        >
                          {sale.order_number}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {sale.customer_username}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          {sale.payment_method || "—"}
                        </span>
                      </td>

                      <td className="max-w-[220px] truncate px-6 py-4 font-mono text-xs text-slate-500">
                        {sale.transaction_reference ||
                          "—"}
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatMoney(sale.amount)}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(sale.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

                {/* ================================================== */}
        {/* FOOTER SUMMARY */}
        {/* ================================================== */}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active Products
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatNumber(
                analytics.products.active
              )}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active Users
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatNumber(
                analytics.users.active
              )}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selected Period Revenue
            </p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {formatMoney(
                analytics.revenue.total
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}