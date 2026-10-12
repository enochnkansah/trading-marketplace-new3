"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  ArrowLeft,
  LogOut,
  Store,
  LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";

export default function AccountPage() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roleLabel =
    user.role === "ADMIN"
      ? "Administrator"
      : user.role === "SELLER"
        ? "Seller"
        : user.role === "CUSTOMER"
          ? "Customer"
          : user.role;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-green-700"
          >
            <ArrowLeft size={17} />
            Back to marketplace
          </Link>

          <div className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              My Account
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Manage and view your account information.
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Profile Header */}
          <div className="border-b border-gray-100 bg-green-50 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-700 text-white">
                <UserRound size={30} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user.username}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {roleLabel}
                </p>
              </div>

            </div>
          </div>

          {/* Account Information */}
          <div className="divide-y divide-gray-100">

            {/* Username */}
            <div className="flex items-center gap-4 px-6 py-5 sm:px-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <UserRound size={19} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Username
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {user.username}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 px-6 py-5 sm:px-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <Mail size={19} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Email
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-4 px-6 py-5 sm:px-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <Phone size={19} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Phone Number
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {user.phone_number || "Not provided"}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-4 px-6 py-5 sm:px-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <ShieldCheck size={19} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Account Type
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {roleLabel}
                </p>
              </div>
            </div>

            {/* Verification */}
            <div className="flex items-center gap-4 px-6 py-5 sm:px-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <ShieldCheck size={19} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Verification Status
                </p>

                <p
                  className={`mt-1 font-medium ${
                    user.is_verified
                      ? "text-green-700"
                      : "text-amber-600"
                  }`}
                >
                  {user.is_verified
                    ? "Verified"
                    : "Not verified"}
                </p>
              </div>
            </div>

            {/* User ID */}
            <div className="flex items-center gap-4 px-6 py-5 sm:px-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <CalendarDays size={19} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Account ID
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  #{user.id}
                </p>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row">

              {/* Seller Dashboard */}
              {user.role === "SELLER" && (
                <Link
                  href="/seller/dashboard"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                >
                  <Store size={18} />
                  Seller Center
                </Link>
              )}

              {/* Admin Dashboard */}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                >
                  <LayoutDashboard size={18} />
                  Admin Dashboard
                </Link>
              )}

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </button>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}