"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  Truck,
  User,
} from "lucide-react";

import api from "@/lib/client";
import SiteHeader from "@/components/site-header";
import SellerNav from "@/components/seller-nav";

interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string | null;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
  is_verified: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: string;
  stock_quantity: number;
  category: number;
  seller: number;
  image: string | null;
  condition: "NEW" | "USED" | "REFURBISHED";
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export default function SellerDashboardPage() {
  // ---------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  // ---------------------------------------------------------
  // Data
  // ---------------------------------------------------------

  const [products, setProducts] =
    useState<Product[]>([]);

  const [orders, setOrders] =
    useState<SellerOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // ---------------------------------------------------------
  // Read logged-in user
  // ---------------------------------------------------------

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
      // Keep authentication errors on the page.
    } finally {
      setAuthReady(true);
    }
  }, []);

  // ---------------------------------------------------------
  // Load dashboard data
  // ---------------------------------------------------------

  useEffect(() => {
    if (!authReady || !currentUser) {
      return;
    }

    loadDashboard();
  }, [authReady, currentUser]);

  // ---------------------------------------------------------
  // Fetch products + orders
  // ---------------------------------------------------------

  const loadDashboard = async () => {
    try {
      setError("");

      if (!products.length && !orders.length) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [productsResponse, ordersResponse] =
        await Promise.all([
          api.get("/products/"),
          api.get("/orders/seller/"),
        ]);

      const allProducts: Product[] =
        Array.isArray(productsResponse.data)
          ? productsResponse.data
          : productsResponse.data?.results || [];

      const sellerProducts =
        currentUser
          ? allProducts.filter(
              (product) =>
                product.seller === currentUser.id
            )
          : [];

      const sellerOrders: SellerOrder[] =
        Array.isArray(ordersResponse.data)
          ? ordersResponse.data
          : ordersResponse.data?.results || [];

      setProducts(sellerProducts);
      setOrders(sellerOrders);
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to load the seller dashboard."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ---------------------------------------------------------
  // Dashboard statistics
  // ---------------------------------------------------------

  const statistics = useMemo(() => {
    const totalOrders = orders.length;

    const pendingOrders =
      orders.filter(
        (order) => order.status === "PENDING"
      ).length;

    const processingOrders =
      orders.filter(
        (order) =>
          order.status === "CONFIRMED" ||
          order.status === "PROCESSING"
      ).length;

    const shippedOrders =
      orders.filter(
        (order) => order.status === "SHIPPED"
      ).length;

    const deliveredOrders =
      orders.filter(
        (order) => order.status === "DELIVERED"
      ).length;

    const totalSales = orders
      .filter(
        (order) =>
          order.status === "DELIVERED"
      )
      .reduce((orderTotal, order) => {
        const sellerSubtotal =
          order.items.reduce(
            (itemTotal, item) =>
              itemTotal +
              Number(item.subtotal),
            0
          );

        return orderTotal + sellerSubtotal;
      }, 0);

    const pendingValue = orders
      .filter(
        (order) =>
          order.status !== "CANCELLED" &&
          order.status !== "REFUNDED" &&
          order.status !== "DELIVERED"
      )
      .reduce((orderTotal, order) => {
        const sellerSubtotal =
          order.items.reduce(
            (itemTotal, item) =>
              itemTotal +
              Number(item.subtotal),
            0
          );

        return orderTotal + sellerSubtotal;
      }, 0);

    const totalStock = products.reduce(
      (total, product) =>
        total + product.stock_quantity,
      0
    );

    const lowStockProducts =
      products.filter(
        (product) =>
          product.stock_quantity > 0 &&
          product.stock_quantity <= 5
      ).length;

    const outOfStockProducts =
      products.filter(
        (product) =>
          product.stock_quantity === 0
      ).length;

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      totalSales,
      pendingValue,
      totalStock,
      lowStockProducts,
      outOfStockProducts,
    };
  }, [products, orders]);

  // ---------------------------------------------------------
  // Recent orders
  // ---------------------------------------------------------

  const recentOrders =
    useMemo(() => {
      return [...orders]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 5);
    }, [orders]);

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (!authReady) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-slate-600">
              Loading seller dashboard...
            </p>
          </div>
        </main>
      </>
    );
  }

  // ---------------------------------------------------------
  // Not logged in
  // ---------------------------------------------------------

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
                Please log in to access the seller
                dashboard.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-lg bg-green-700 px-5 py-2.5 font-medium text-white hover:bg-green-800"
              >
                Log in
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  // ---------------------------------------------------------
  // Role check
  // ---------------------------------------------------------

  const canManage =
    currentUser.role === "SELLER" ||
    currentUser.role === "ADMIN";

  if (!canManage) {
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
                Your account does not have seller
                dashboard access.
              </p>

              <Link
                href="/"
                className="mt-5 inline-flex rounded-lg bg-green-700 px-5 py-2.5 font-medium text-white hover:bg-green-800"
              >
                Back to marketplace
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  // ---------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------

  return (
    <>
      
 <SiteHeader />

 <SellerNav />

 <main className="min-h-screen bg-slate-50">
        {/* ===================================================
            HERO
        =================================================== */}

        <section className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                  <BarChart3 className="h-7 w-7 text-green-700" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                    Agricult Seller Center
                  </p>

                  <h1 className="font-serif text-4xl font-bold text-slate-950">
                    Seller Dashboard
                  </h1>
                </div>
              </div>

              <div className="rounded-xl border bg-slate-50 px-5 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Signed in as
                </p>

                <p className="font-semibold text-slate-900">
                  {currentUser.username}
                </p>

                <p className="text-xs font-medium text-green-700">
                  {currentUser.role}
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-lg text-slate-600">
              Manage your products, track orders, and
              monitor your Agricult marketplace activity.
            </p>
          </div>
        </section>

        {/* ===================================================
            MAIN
        =================================================== */}

        <section className="mx-auto max-w-7xl px-6 py-10">
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
              QUICK ACTIONS
          ================================================= */}

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <Link
              href="/seller"
              className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:border-green-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Store className="h-6 w-6 text-green-700" />
                </div>

                <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-green-700" />
              </div>

              <h2 className="mt-5 font-serif text-xl font-bold text-slate-950">
                Manage Products
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Add products, update your listings, and
                manage your available stock.
              </p>
            </Link>

            <Link
              href="/seller/orders"
              className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:border-green-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <ClipboardList className="h-6 w-6 text-green-700" />
                </div>

                <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-green-700" />
              </div>

              <h2 className="mt-5 font-serif text-xl font-bold text-slate-950">
                Manage Orders
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                View customer orders and update fulfillment
                status.
              </p>
            </Link>
          </div>

          {/* =================================================
              PRIMARY STATISTICS
          ================================================= */}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              icon={
                <Package className="h-5 w-5" />
              }
              label="Products"
              value={products.length}
              description="Active products"
            />

            <DashboardCard
              icon={
                <ShoppingBag className="h-5 w-5" />
              }
              label="Orders"
              value={statistics.totalOrders}
              description="Orders containing your products"
            />

            <DashboardMoneyCard
              icon={
                <BarChart3 className="h-5 w-5" />
              }
              label="Delivered Sales"
              value={statistics.totalSales}
              description="Value of delivered products"
            />

            <DashboardCard
              icon={
                <Truck className="h-5 w-5" />
              }
              label="Delivered"
              value={statistics.deliveredOrders}
              description="Completed orders"
            />
          </div>

          {/* =================================================
              ORDER STATUS
          ================================================= */}

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <SmallStat
              label="Pending"
              value={statistics.pendingOrders}
              description="Waiting for confirmation"
            />

            <SmallStat
              label="Processing"
              value={statistics.processingOrders}
              description="Being prepared"
            />

            <SmallStat
              label="Shipped"
              value={statistics.shippedOrders}
              description="On the way to customers"
            />

            <SmallStat
              label="Delivered"
              value={statistics.deliveredOrders}
              description="Successfully delivered"
            />
          </div>

          {/* =================================================
              INVENTORY + SALES
          ================================================= */}

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Inventory */}

            <section className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                    Inventory
                  </p>

                  <h2 className="mt-1 font-serif text-2xl font-bold text-slate-950">
                    Stock Overview
                  </h2>
                </div>

                <Package className="h-7 w-7 text-green-700" />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Total Stock
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {statistics.totalStock}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs text-amber-700">
                    Low Stock
                  </p>

                  <p className="mt-2 text-2xl font-bold text-amber-800">
                    {statistics.lowStockProducts}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs text-red-700">
                    Out of Stock
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-800">
                    {statistics.outOfStockProducts}
                  </p>
                </div>
              </div>

              <Link
                href="/seller"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
              >
                Manage inventory
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>

            {/* Sales */}

            <section className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                    Sales
                  </p>

                  <h2 className="mt-1 font-serif text-2xl font-bold text-slate-950">
                    Sales Overview
                  </h2>
                </div>

                <BarChart3 className="h-7 w-7 text-green-700" />
              </div>

              <div className="mt-6">
                <p className="text-sm text-slate-500">
                  Delivered sales
                </p>

                <p className="mt-1 text-3xl font-bold text-green-700">
                  {formatCurrency(
                    statistics.totalSales
                  )}
                </p>

                <div className="mt-5 border-t pt-5">
                  <p className="text-sm text-slate-500">
                    Pending fulfillment value
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-950">
                    {formatCurrency(
                      statistics.pendingValue
                    )}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-500">
                Delivered sales are calculated from the
                seller's products in completed orders.
              </p>
            </section>
          </div>

          {/* =================================================
              RECENT ORDERS
          ================================================= */}

          <section className="mt-8 rounded-2xl border bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                  Recent Activity
                </p>

                <h2 className="mt-1 font-serif text-2xl font-bold text-slate-950">
                  Recent Orders
                </h2>

                <p className="mt-1 text-slate-600">
                  The latest orders containing your products.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={loadDashboard}
                  disabled={loading || refreshing}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:border-green-600 hover:text-green-700 disabled:opacity-50"
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

                <Link
                  href="/seller/orders"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                >
                  All Orders
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="py-14 text-center text-slate-500">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-green-700" />

                Loading dashboard...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <ClipboardList className="mx-auto h-10 w-10 text-slate-400" />

                <h3 className="mt-4 font-serif text-xl font-bold">
                  No orders yet
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Orders containing your products will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:px-8"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
                        <ShoppingBag className="h-5 w-5 text-green-700" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-semibold text-slate-950">
                            {order.order_number}
                          </h3>

                          <StatusBadge
                            status={order.status}
                          />
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {order.customer_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            order.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 md:justify-end">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-500">
                          Your items
                        </p>

                        <p className="mt-1 font-bold text-slate-950">
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
                        View
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* =================================================
              ACCOUNT
          ================================================= */}

          <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <User className="h-6 w-6 text-green-700" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Seller Account
                  </p>

                  <h2 className="font-serif text-xl font-bold text-slate-950">
                    {currentUser.username}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <Link
                href="/account"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium hover:border-green-600 hover:text-green-700"
              >
                Account Settings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} Agricult
              Marketplace
            </p>

            <div className="flex gap-5">
              <Link
                href="/seller"
                className="hover:text-green-700"
              >
                Seller Center
              </Link>

              <Link
                href="/seller/orders"
                className="hover:text-green-700"
              >
                Seller Orders
              </Link>

              <Link
                href="/"
                className="hover:text-green-700"
              >
                Marketplace
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

/*
|--------------------------------------------------------------------------
| DASHBOARD CARD
|--------------------------------------------------------------------------
*/

function DashboardCard({
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
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
          {icon}
        </div>

        <span className="text-3xl font-bold text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-5 font-semibold text-slate-950">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| MONEY CARD
|--------------------------------------------------------------------------
*/

function DashboardMoneyCard({
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
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
          {icon}
        </div>
      </div>

      <p className="mt-5 font-semibold text-slate-950">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-green-700">
        {formatCurrency(value)}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SMALL STAT
|--------------------------------------------------------------------------
*/

function SmallStat({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-950">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-green-700">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({
  status,
}: {
  status: SellerOrder["status"];
}) {
  const styles: Record<
    SellerOrder["status"],
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
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {formatStatus(status)}
    </span>
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
| FORMAT STATUS
|--------------------------------------------------------------------------
*/

function formatStatus(
  status: string
): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
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
| API ERROR HANDLER
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
      "Your login session is not valid or has expired. " +
      "Please log in again."
    );
  }

  if (status === 403) {
    return (
      "You do not have permission to access the seller dashboard."
    );
  }

  if (status === 404) {
    return (
      "The requested seller information could not be found."
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

            if (
              typeof value ===
                "object" &&
              value !== null
            ) {
              return `${field}: ${JSON.stringify(
                value
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