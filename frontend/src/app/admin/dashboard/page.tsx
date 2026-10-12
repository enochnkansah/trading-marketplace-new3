"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Box,
  CheckCircle2,
  Clock3,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  UserCheck,
  UserCog,
  UserRound,
} from "lucide-react";

import api from "@/lib/client";

type DashboardData = {
  users: {
    total: number;
    customers: number;
    sellers: number;
    admins: number;
    active: number;
    inactive: number;
  };

  products: {
    total: number;
    active: number;
    inactive: number;
    low_stock: number;
    out_of_stock: number;
  };

  orders: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
  };

  payments: {
    total: number;
    successful: number;
    pending: number;
    failed: number;
    successful_revenue: string | number;
  };
};

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GH").format(Number(value || 0));
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
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: any;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm text-slate-600">{label}</span>

        <span className="text-sm font-semibold text-slate-900">
          {formatNumber(value)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-green-600 transition-all"
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<DashboardData>(
        "/admin/dashboard/"
      );

      setData(response.data);
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to load the admin dashboard."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-slate-200" />

            <div className="mt-3 h-10 w-72 rounded-lg bg-slate-200" />

            <div className="mt-3 h-5 w-96 rounded bg-slate-200" />
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
            <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <Activity className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-red-800">
                  Unable to load dashboard
                </h1>

                <p className="mt-2 text-sm text-red-700">
                  {error || "No dashboard data was returned."}
                </p>

                <button
                  type="button"
                  onClick={loadDashboard}
                  className="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              Agricult Admin
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Dashboard
            </h1>

            <p className="mt-2 text-slate-600">
              Overview of your marketplace activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {/* USERS */}

            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-green-300 hover:text-green-700"
            >
              <Users className="h-4 w-4" />
              Manage Users
            </Link>

            {/* PRODUCTS */}

            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
            >
              <Package className="h-4 w-4" />
              Manage Products
            </Link>

            {/* ANALYTICS */}

            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-100"
            >
              <BarChart3 className="h-4 w-4" />
              Sales & Analytics
            </Link>

            {/* ORDERS */}

            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-green-300 hover:text-green-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Manage Orders
            </Link>
          </div>
        </div>

        {/* ================================================== */}
        {/* MAIN STATISTICS */}
        {/* ================================================== */}

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-700" />

            <h2 className="text-lg font-bold text-slate-900">
              Marketplace Overview
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              title="Total Users"
              value={formatNumber(data.users.total)}
              icon={Users}
              description={`${formatNumber(
                data.users.customers
              )} customers · ${formatNumber(
                data.users.sellers
              )} sellers`}
            />

            <StatCard
              title="Products"
              value={formatNumber(data.products.total)}
              icon={Package}
              description={`${formatNumber(
                data.products.active
              )} active products`}
            />

            <StatCard
              title="Orders"
              value={formatNumber(data.orders.total)}
              icon={ShoppingCart}
              description={`${formatNumber(
                data.orders.delivered
              )} delivered`}
            />

            <StatCard
              title="Successful Revenue"
              value={formatCurrency(
                data.payments.successful_revenue
              )}
              icon={DollarSign}
              description={`${formatNumber(
                data.payments.successful
              )} successful payments`}
            />
          </div>
        </section>

        {/* ================================================== */}
        {/* USER STATISTICS */}
        {/* ================================================== */}

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-green-700" />

            <h2 className="text-lg font-bold text-slate-900">
              Users
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              title="Customers"
              value={formatNumber(data.users.customers)}
              icon={UserRound}
              description="Registered customers"
            />

            <StatCard
              title="Sellers"
              value={formatNumber(data.users.sellers)}
              icon={StoreIcon}
              description="Registered sellers"
            />

            <StatCard
              title="Administrators"
              value={formatNumber(data.users.admins)}
              icon={UserCog}
              description="Admin accounts"
            />

            <StatCard
              title="Active Users"
              value={formatNumber(data.users.active)}
              icon={UserCheck}
              description={`${formatNumber(
                data.users.inactive
              )} inactive`}
            />
          </div>
        </section>

        {/* ================================================== */}
        {/* PRODUCT STATISTICS */}
        {/* ================================================== */}

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-green-700" />

            <h2 className="text-lg font-bold text-slate-900">
              Product Inventory
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              title="Active Products"
              value={formatNumber(data.products.active)}
              icon={CheckCircle2}
              description="Currently available"
            />

            <StatCard
              title="Inactive Products"
              value={formatNumber(data.products.inactive)}
              icon={Box}
              description="Currently hidden"
            />

            <StatCard
              title="Low Stock"
              value={formatNumber(data.products.low_stock)}
              icon={TrendingUp}
              description="5 units or fewer"
            />

            <StatCard
              title="Out of Stock"
              value={formatNumber(data.products.out_of_stock)}
              icon={Clock3}
              description="Zero available units"
            />
          </div>
        </section>

        {/* ================================================== */}
        {/* ORDER + PAYMENT OVERVIEW */}
        {/* ================================================== */}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* ORDER STATUS */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-700" />

                  <h2 className="font-bold text-slate-900">
                    Order Status
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Current marketplace order distribution
                </p>
              </div>
            </div>

            <div className="space-y-5">

              <StatusRow
                label="Pending"
                value={data.orders.pending}
                total={data.orders.total}
              />

              <StatusRow
                label="Confirmed"
                value={data.orders.confirmed}
                total={data.orders.total}
              />

              <StatusRow
                label="Processing"
                value={data.orders.processing}
                total={data.orders.total}
              />

              <StatusRow
                label="Shipped"
                value={data.orders.shipped}
                total={data.orders.total}
              />

              <StatusRow
                label="Delivered"
                value={data.orders.delivered}
                total={data.orders.total}
              />

              <StatusRow
                label="Cancelled"
                value={data.orders.cancelled}
                total={data.orders.total}
              />

              <StatusRow
                label="Refunded"
                value={data.orders.refunded}
                total={data.orders.total}
              />
            </div>
          </div>

          {/* PAYMENT STATUS */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-700" />

                  <h2 className="font-bold text-slate-900">
                    Payment Overview
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Current payment activity
                </p>
              </div>
            </div>

            <div className="space-y-4">

              <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-700" />

                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Successful
                    </p>

                    <p className="text-xs text-green-700">
                      Completed payments
                    </p>
                  </div>
                </div>

                <span className="text-xl font-bold text-green-800">
                  {formatNumber(data.payments.successful)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-amber-700" />

                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Pending
                    </p>

                    <p className="text-xs text-amber-700">
                      Awaiting completion
                    </p>
                  </div>
                </div>

                <span className="text-xl font-bold text-amber-800">
                  {formatNumber(data.payments.pending)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-red-700" />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Failed
                    </p>

                    <p className="text-xs text-red-700">
                      Unsuccessful payments
                    </p>
                  </div>
                </div>

                <span className="text-xl font-bold text-red-800">
                  {formatNumber(data.payments.failed)}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Successful Revenue
                </p>

                <p className="mt-2 text-2xl font-bold text-green-700">
                  {formatCurrency(
                    data.payments.successful_revenue
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* QUICK ACTIONS */}
        {/* ================================================== */}

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage the most important areas of your marketplace.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* USERS */}

            <Link
              href="/admin/users"
              className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Users className="h-5 w-5" />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Manage Users
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                View customers, sellers and administrators.
              </p>

              <p className="mt-4 text-sm font-semibold text-green-700 group-hover:text-green-800">
                Open Users →
              </p>
            </Link>

            {/* PRODUCTS */}

            <Link
              href="/admin/products"
              className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <Package className="h-5 w-5" />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Manage Products
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Manage marketplace products and inventory.
              </p>

              <p className="mt-4 text-sm font-semibold text-green-700 group-hover:text-green-800">
                Open Products →
              </p>
            </Link>

            {/* ORDERS */}

            <Link
              href="/admin/orders"
              className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                <ShoppingCart className="h-5 w-5" />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Manage Orders
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Review orders and update their status.
              </p>

              <p className="mt-4 text-sm font-semibold text-green-700 group-hover:text-green-800">
                Open Orders →
              </p>
            </Link>

            {/* ANALYTICS */}

            <Link
              href="/admin/analytics"
              className="group rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-400 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-green-700">
                <BarChart3 className="h-5 w-5" />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Sales & Analytics
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Analyze revenue, sales, products and sellers.
              </p>

              <p className="mt-4 text-sm font-semibold text-green-700 group-hover:text-green-800">
                View Analytics →
              </p>
            </Link>
          </div>
        </section>

        {/* ================================================== */}
        {/* SUMMARY */}
        {/* ================================================== */}

        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-700" />

                <h2 className="font-bold text-slate-900">
                  Marketplace Summary
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Current platform performance at a glance.
              </p>
            </div>

            <Link
              href="/admin/analytics"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              <BarChart3 className="h-4 w-4" />
              Open Full Analytics
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Users
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatNumber(data.users.total)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Products
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatNumber(data.products.total)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Orders
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatNumber(data.orders.total)}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Revenue
              </p>

              <p className="mt-2 text-xl font-bold text-green-800">
                {formatCurrency(
                  data.payments.successful_revenue
                )}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * Small local icon wrapper used for the seller statistic.
 * Keeping it here avoids adding another dependency.
 */
function StoreIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M5 9v10h14V9" />
      <path d="M3 9h18" />
      <path d="M8 19v-5h8v5" />
    </svg>
  );
}