"use client";

import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  UserRound,
  Store,
  Package,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";

export default function SiteHeader() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(query)}`);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();

    setMobileMenuOpen(false);

    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-18 items-center justify-between gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 text-2xl font-bold tracking-tight text-green-700"
          >
            Agricult
          </Link>

          {/* Desktop Search */}
          <div className="hidden max-w-xl flex-1 md:block">
            <form
              onSubmit={handleSearch}
              className="relative"
            >
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search products, equipment, farm supplies..."
                className="h-11 w-full rounded-xl border border-gray-300 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
              />
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-5 lg:flex">

            {/* Marketplace */}
            <Link
              href="/"
              className="text-sm font-semibold text-gray-700 transition hover:text-green-700"
            >
              Marketplace
            </Link>

            {/* Orders */}
            {user && (
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-green-700"
              >
                <Package size={17} />
                Orders
              </Link>
            )}

            {/* Seller Center */}
            {user?.role === "SELLER" && (
              <Link
                href="/seller/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-green-700"
              >
                <Store size={17} />
                Seller Center
              </Link>
            )}

            {/* Admin Dashboard */}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-green-700"
              >
                <ShieldCheck size={17} />
                Admin Dashboard
              </Link>
            )}

            {/* Account */}
            <Link
              href={user ? "/account" : "/login"}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-green-700"
            >
              <UserRound size={17} />
              {user ? "My Account" : "Account"}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-green-600 hover:text-green-700"
            >
              <ShoppingCart size={18} />
              Cart
            </Link>

            {/* Logout */}
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut size={17} />
                Logout
              </button>
            )}

          </nav>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">

            {/* Mobile Orders */}
            {user && (
              <Link
                href="/orders"
                aria-label="Orders"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:border-green-600 hover:text-green-700"
              >
                <Package size={19} />
              </Link>
            )}

            {/* Mobile Cart */}
            <Link
              href="/cart"
              aria-label="Shopping cart"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:border-green-600 hover:text-green-700"
            >
              <ShoppingCart size={19} />
            </Link>

            {/* Mobile Menu */}
            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? "Close menu"
                  : "Open menu"
              }
              onClick={() =>
                setMobileMenuOpen(
                  (current) => !current
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:border-green-600 hover:text-green-700"
            >
              {mobileMenuOpen ? (
                <X size={21} />
              ) : (
                <Menu size={21} />
              )}
            </button>

          </div>
        </div>

        {/* Mobile Search */}
        <div className="pb-4 md:hidden">
          <form
            onSubmit={handleSearch}
            className="relative"
          >
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search products and farm supplies..."
              className="h-11 w-full rounded-xl border border-gray-300 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
            />
          </form>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 py-4 lg:hidden">
            <nav className="flex flex-col">

              {/* Marketplace */}
              <Link
                href="/"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700"
              >
                Marketplace
              </Link>

              {/* Orders */}
              {user && (
                <Link
                  href="/orders"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700"
                >
                  <Package size={18} />
                  My Orders
                </Link>
              )}

              {/* Seller Center */}
              {user?.role === "SELLER" && (
                <Link
                  href="/seller/dashboard"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700"
                >
                  <Store size={18} />
                  Seller Center
                </Link>
              )}

              {/* Admin Dashboard */}
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700"
                >
                  <ShieldCheck size={18} />
                  Admin Dashboard
                </Link>
              )}

              {/* Account */}
              <Link
                href={user ? "/account" : "/login"}
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700"
              >
                <UserRound size={18} />
                {user ? "My Account" : "Account / Login"}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700"
              >
                <ShoppingCart size={18} />
                Shopping Cart
              </Link>

              {/* Logout */}
              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              )}

            </nav>
          </div>
        )}
      </div>
    </header>
  );
}