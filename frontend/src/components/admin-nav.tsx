"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  BarChart3,
  Store,
} from "lucide-react";

export default function AdminNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">

          {/* Admin Brand */}
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-2 text-lg font-bold text-slate-900"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 text-white">
              <ShieldIcon />
            </div>

            <span>
              Agricult <span className="text-green-700">Admin</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-wrap items-center gap-1">

            {/* Dashboard */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-green-50 hover:text-green-700"
            >
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </Link>

            {/* Users */}
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-green-50 hover:text-green-700"
            >
              <Users size={17} />
              <span>Users</span>
            </Link>

            {/* Products */}
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-green-50 hover:text-green-700"
            >
              <Package size={17} />
              <span>Products</span>
            </Link>

            {/* Orders */}
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-green-50 hover:text-green-700"
            >
              <ShoppingBag size={17} />
              <span>Orders</span>
            </Link>

            {/* Analytics */}
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-green-50 hover:text-green-700"
            >
              <BarChart3 size={17} />
              <span>Analytics</span>
            </Link>

            {/* Marketplace */}
            <Link
              href="/"
              className="ml-2 inline-flex items-center gap-2 rounded-lg border border-green-700 bg-green-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-green-800"
            >
              <Store size={17} />
              <span>Marketplace</span>
            </Link>

          </nav>
        </div>
      </div>
    </header>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}