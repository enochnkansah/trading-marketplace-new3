"use client";


import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import AdminNav from "@/components/admin-nav";

import api from "@/lib/client";

interface DashboardData {
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
    refunded: number;
    successful_revenue: string | number;
  };

  sales: {
    delivered_sales: string | number;
  };
}

function formatCurrency(value: string | number) {
  const amount = Number(value || 0);

  return `GHS ${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/admin/dashboard/"
      );

      setDashboard(response.data);
    } catch (error: any) {
      console.error(
        "Unable to load admin dashboard:",
        error
      );

      setError(
        error?.response?.data?.detail ||
          "Unable to load the admin dashboard."
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
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-center gap-3 text-slate-600">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading admin dashboard...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-bold text-red-800">
              Unable to load dashboard
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              onClick={loadDashboard}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
  <main className="min-h-screen bg-slate-50">
    <AdminNav />

    {/* Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <ShieldCheck className="h-6 w-6 text-green-700" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Admin Dashboard
                  </h1>

                  <p className="text-sm text-slate-500">
                    Manage and monitor your marketplace.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={loadDashboard}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Main Statistics */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* Revenue */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Successful Revenue
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(
                    dashboard.payments.successful_revenue
                  )}
                </p>
              </div>

              <div className="rounded-lg bg-green-100 p-3">
                <BarChart3 className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Orders
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {dashboard.orders.total.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-blue-100 p-3">
                <ShoppingCart className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Products
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {dashboard.products.total.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-purple-100 p-3">
                <Package className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Users
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {dashboard.users.total.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-orange-100 p-3">
                <Users className="h-5 w-5 text-orange-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Management */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Management
            </h2>

            <p className="text-sm text-slate-500">
              Manage the main areas of the marketplace.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              href="/admin/users"
              className="group rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
            >
              <Users className="h-7 w-7 text-green-700" />

              <h3 className="mt-4 font-bold text-slate-900">
                Manage Users
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Customers, sellers and administrators.
              </p>
            </Link>

            <Link
              href="/admin/products"
              className="group rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
            >
              <Package className="h-7 w-7 text-green-700" />

              <h3 className="mt-4 font-bold text-slate-900">
                Manage Products
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Products, stock, pricing and status.
              </p>
            </Link>

            <Link
              href="/admin/orders"
              className="group rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
            >
              <ClipboardList className="h-7 w-7 text-green-700" />

              <h3 className="mt-4 font-bold text-slate-900">
                Manage Orders
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Review and update marketplace orders.
              </p>
            </Link>

            <Link
              href="/admin/analytics"
              className="group rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
            >
              <BarChart3 className="h-7 w-7 text-green-700" />

              <h3 className="mt-4 font-bold text-slate-900">
                Sales & Analytics
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Revenue, sales and marketplace analytics.
              </p>
            </Link>
          </div>
        </section>

        {/* Summary */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* Users */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">
              Users
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Customers
                </span>

                <span className="font-semibold">
                  {dashboard.users.customers}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Sellers
                </span>

                <span className="font-semibold">
                  {dashboard.users.sellers}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Admins
                </span>

                <span className="font-semibold">
                  {dashboard.users.admins}
                </span>
              </div>

              <div className="flex justify-between border-t pt-3">
                <span className="text-slate-500">
                  Active
                </span>

                <span className="font-semibold text-green-700">
                  {dashboard.users.active}
                </span>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">
              Orders
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Pending
                </span>

                <span className="font-semibold">
                  {dashboard.orders.pending}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Processing
                </span>

                <span className="font-semibold">
                  {dashboard.orders.processing}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Shipped
                </span>

                <span className="font-semibold">
                  {dashboard.orders.shipped}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Delivered
                </span>

                <span className="font-semibold text-green-700">
                  {dashboard.orders.delivered}
                </span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">
              Products
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Active
                </span>

                <span className="font-semibold text-green-700">
                  {dashboard.products.active}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Inactive
                </span>

                <span className="font-semibold">
                  {dashboard.products.inactive}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Out of Stock
                </span>

                <span className="font-semibold text-red-600">
                  {dashboard.products.out_of_stock}
                </span>
              </div>

              <div className="flex justify-between border-t pt-3">
                <span className="text-slate-500">
                  Delivered Sales
                </span>

                <span className="font-semibold">
                  {formatCurrency(
                    dashboard.sales.delivered_sales
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Summary */}
        <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Payment Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current marketplace payment status.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Total Payments
              </p>

              <p className="mt-1 text-xl font-bold">
                {dashboard.payments.total}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs text-green-700">
                Successful
              </p>

              <p className="mt-1 text-xl font-bold text-green-800">
                {dashboard.payments.successful}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-xs text-yellow-700">
                Pending
              </p>

              <p className="mt-1 text-xl font-bold text-yellow-800">
                {dashboard.payments.pending}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-xs text-red-700">
                Failed
              </p>

              <p className="mt-1 text-xl font-bold text-red-800">
                {dashboard.payments.failed}
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-xs text-purple-700">
                Refunded
              </p>

              <p className="mt-1 text-xl font-bold text-purple-800">
                {dashboard.payments.refunded}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}