"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Search,
  ShieldCheck,
  Store,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

import api from "@/lib/client";
import AdminNav from "@/components/admin-nav";

type UserRole = "CUSTOMER" | "SELLER" | "ADMIN";

type AdminUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
  created_at: string;
};

type UsersResponse = {
  count: number;
  results: AdminUser[];
};

function getFullName(user: AdminUser) {
  const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return name || user.username;
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function roleLabel(role: UserRole) {
  if (role === "ADMIN") return "Admin";
  if (role === "SELLER") return "Seller";
  return "Customer";
}

function roleClasses(role: UserRole) {
  if (role === "ADMIN") {
    return "bg-purple-50 text-purple-700";
  }

  if (role === "SELLER") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-green-50 text-green-700";
}

function RoleIcon({ role }: { role: UserRole }) {
  if (role === "ADMIN") {
    return <ShieldCheck className="h-3.5 w-3.5" />;
  }

  if (role === "SELLER") {
    return <Store className="h-3.5 w-3.5" />;
  }

  return <Users className="h-3.5 w-3.5" />;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [updatingUserId, setUpdatingUserId] = useState<number | null>(
    null
  );

  const [success, setSuccess] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (role !== "ALL") {
        params.set("role", role);
      }

      if (status !== "ALL") {
        params.set("status", status.toLowerCase());
      }

      const query = params.toString();

      const response = await api.get<UsersResponse>(
        `/admin/users/${query ? `?${query}` : ""}`
      );

      setUsers(response.data.results);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, role, status]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      customers: users.filter((user) => user.role === "CUSTOMER").length,
      sellers: users.filter((user) => user.role === "SELLER").length,
      admins: users.filter((user) => user.role === "ADMIN").length,
      active: users.filter((user) => user.is_active).length,
      inactive: users.filter((user) => !user.is_active).length,
    };
  }, [users]);

  const handleToggleActive = async (user: AdminUser) => {
    const nextStatus = !user.is_active;

    const confirmed = window.confirm(
      nextStatus
        ? `Activate ${user.username}?`
        : `Deactivate ${user.username}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user.id);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/admin/users/${user.id}/`,
        {
          is_active: nextStatus,
        }
      );

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? response.data : item
        )
      );

      setSuccess(
        nextStatus
          ? `${user.username} has been activated.`
          : `${user.username} has been deactivated.`
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to update the user."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
  <main className="min-h-screen bg-slate-50">
    <AdminNav />

    <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              Agricult Admin
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              User Management
            </h1>

            <p className="mt-2 text-slate-600">
              Manage customers, sellers, and administrator accounts.
            </p>
          </div>

          
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Customers</p>
            <p className="mt-1 text-2xl font-bold text-green-700">
              {stats.customers}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Sellers</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">
              {stats.sellers}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Admins</p>
            <p className="mt-1 text-2xl font-bold text-purple-700">
              {stats.admins}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-green-700">
              {stats.active}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Inactive</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {stats.inactive}
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_200px_200px]">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search username, email or name..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Role */}
            <div className="relative">
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                <option value="ALL">All roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="SELLER">Sellers</option>
                <option value="ADMIN">Admins</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </section>

        {/* Users table */}
        <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-bold text-slate-900">
              Users
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading users..."
                : `${users.length} user${
                    users.length === 1 ? "" : "s"
                  } found`}
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No users found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 font-bold text-green-700">
                            {getFullName(user)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {getFullName(user)}
                            </p>

                            <p className="truncate text-sm text-slate-500">
                              @{user.username}
                            </p>

                            <p className="truncate text-xs text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${roleClasses(
                            user.role
                          )}`}
                        >
                          <RoleIcon role={user.role} />
                          {roleLabel(user.role)}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.phone_number || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                              user.is_active
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {user.is_active ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <UserX className="h-3.5 w-3.5" />
                            )}

                            {user.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>

                          {user.is_verified && (
                            <span className="text-xs text-blue-600">
                              Verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(user.date_joined)}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleActive(user)
                          }
                          disabled={
                            updatingUserId === user.id
                          }
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.is_active
                              ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                              : "bg-green-700 text-white hover:bg-green-800"
                          }`}
                        >
                          {updatingUserId === user.id
                            ? "Updating..."
                            : user.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}