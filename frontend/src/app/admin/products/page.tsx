"use client";

import { useEffect, useState } from "react";

import { API_ORIGIN } from "@/lib/config";
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  Package,
  Pencil,
  Search,
  Store,
  XCircle,
} from "lucide-react";

import api from "@/lib/client";
import AdminNav from "@/components/admin-nav";

type ProductCondition =
  | "NEW"
  | "USED"
  | "REFURBISHED";

type AdminProduct = {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: string | number;
  stock_quantity: number;
  category: number;
  category_name: string;
  seller: number;
  seller_username: string;
  seller_email: string;
  image: string | null;
  condition: ProductCondition;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Category = {
  id: number;
  name: string;
};

type ProductsResponse = {
  count: number;
  results: AdminProduct[];
  statistics: {
    total: number;
    active: number;
    inactive: number;
    low_stock: number;
    out_of_stock: number;
  };
};

function formatCurrency(value: string | number) {
  return `GHS ${Number(value || 0).toLocaleString(
    "en-GH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString(
    "en-GH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function getImageUrl(image: string | null) {
  if (!image) {
    return null;
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `${API_ORIGIN}${
    image.startsWith("/") ? "" : "/"
  }${image}`;
}

function conditionLabel(
  condition: ProductCondition
) {
  if (condition === "REFURBISHED") {
    return "Refurbished";
  }

  if (condition === "USED") {
    return "Used";
  }

  return "New";
}

function conditionClasses(
  condition: ProductCondition
) {
  if (condition === "REFURBISHED") {
    return "bg-purple-50 text-purple-700";
  }

  if (condition === "USED") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-green-50 text-green-700";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<
    AdminProduct[]
  >([]);

  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    low_stock: 0,
    out_of_stock: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("ALL");

  const [status, setStatus] =
    useState("ALL");

  const [stock, setStock] =
    useState("ALL");

  const [
    updatingProductId,
    setUpdatingProductId,
  ] = useState<number | null>(null);

  const [
    editingProduct,
    setEditingProduct,
  ] = useState<AdminProduct | null>(
    null
  );

  const [editStock, setEditStock] =
    useState("");

  const [editPrice, setEditPrice] =
    useState("");

  const [editStatus, setEditStatus] =
    useState(true);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (category !== "ALL") {
        params.set(
          "category",
          category
        );
      }

      if (status !== "ALL") {
        params.set(
          "status",
          status.toLowerCase()
        );
      }

      if (stock !== "ALL") {
        params.set(
          "stock",
          stock.toLowerCase()
        );
      }

      const query =
        params.toString();

      const response =
        await api.get<ProductsResponse>(
          `/admin/products/${
            query ? `?${query}` : ""
          }`
        );

      setProducts(
        response.data.results
      );

      setStatistics(
        response.data.statistics
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load admin products."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response =
        await api.get("/categories/");

      setCategories(
        Array.isArray(response.data)
          ? response.data
          : response.data.results || []
      );
    } catch (err) {
      console.error(
        "Unable to load categories:",
        err
      );
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadProducts();
      }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    search,
    category,
    status,
    stock,
  ]);

  const openEditModal = (
    product: AdminProduct
  ) => {
    setEditingProduct(product);

    setEditStock(
      String(product.stock_quantity)
    );

    setEditPrice(
      String(product.price)
    );

    setEditStatus(
      product.is_active
    );

    setError("");
    setSuccess("");
  };

  const closeEditModal = () => {
    if (
      updatingProductId !== null
    ) {
      return;
    }

    setEditingProduct(null);
    setEditStock("");
    setEditPrice("");
    setEditStatus(true);
  };

  const handleSaveProduct =
    async () => {
      if (!editingProduct) {
        return;
      }

      const stockQuantity =
        Number(editStock);

      const price =
        Number(editPrice);

      if (
        !Number.isFinite(
          stockQuantity
        ) ||
        stockQuantity < 0
      ) {
        setError(
          "Stock quantity must be a valid number of 0 or greater."
        );

        return;
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        setError(
          "Price must be a valid amount of 0 or greater."
        );

        return;
      }

      try {
        setUpdatingProductId(
          editingProduct.id
        );

        setError("");
        setSuccess("");

        const response =
          await api.patch(
            `/admin/products/${editingProduct.id}/`,
            {
              stock_quantity:
                Math.floor(
                  stockQuantity
                ),

              price:
                price.toFixed(2),

              is_active:
                editStatus,
            }
          );

        setProducts(
          (current) =>
            current.map(
              (product) =>
                product.id ===
                editingProduct.id
                  ? response.data
                  : product
            )
        );

        setSuccess(
          `"${editingProduct.name}" was updated successfully.`
        );

        setEditingProduct(null);

        await loadProducts();
      } catch (err: any) {
        console.error(err);

        setError(
          err?.response?.data
            ?.detail ||
            "Unable to update the product."
        );
      } finally {
        setUpdatingProductId(
          null
        );
      }
    };

  const handleToggleActive =
    async (
      product: AdminProduct
    ) => {
      const nextStatus =
        !product.is_active;

      const confirmed =
        window.confirm(
          nextStatus
            ? `Activate "${product.name}"?`
            : `Deactivate "${product.name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setUpdatingProductId(
          product.id
        );

        setError("");
        setSuccess("");

        const response =
          await api.patch(
            `/admin/products/${product.id}/`,
            {
              is_active:
                nextStatus,
            }
          );

        setProducts(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                product.id
                  ? response.data
                  : item
            )
        );

        setSuccess(
          nextStatus
            ? `"${product.name}" is now active.`
            : `"${product.name}" has been deactivated.`
        );

        await loadProducts();
      } catch (err: any) {
        console.error(err);

        setError(
          err?.response?.data
            ?.detail ||
            "Unable to update product status."
        );
      } finally {
        setUpdatingProductId(
          null
        );
      }
    };

  return (
  <main className="min-h-screen bg-slate-50">
    <AdminNav />

    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              Agricult Admin
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Product Management
            </h1>

            <p className="mt-2 text-slate-600">
              Manage marketplace products,
              pricing, stock, and visibility.
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

        {/* Global Statistics */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {statistics.total}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="mt-1 text-2xl font-bold text-green-700">
              {statistics.active}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Inactive
            </p>

            <p className="mt-1 text-2xl font-bold text-red-600">
              {statistics.inactive}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Low Stock
            </p>

            <p className="mt-1 text-2xl font-bold text-amber-600">
              {statistics.low_stock}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Out of Stock
            </p>

            <p className="mt-1 text-2xl font-bold text-red-600">
              {statistics.out_of_stock}
            </p>
          </div>

        </section>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_200px_180px_180px]">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product, SKU or seller..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Category */}
            <div className="relative">
              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                <option value="ALL">
                  All categories
                </option>

                {categories.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                <option value="ALL">
                  All statuses
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Stock */}
            <div className="relative">
              <select
                value={stock}
                onChange={(event) =>
                  setStock(
                    event.target.value
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                <option value="ALL">
                  All stock
                </option>

                <option value="AVAILABLE">
                  In stock
                </option>

                <option value="OUT">
                  Out of stock
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

          </div>
        </section>

        {/* Products Table */}
        <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-6 py-4">
            <h2 className="font-bold text-slate-900">
              Products
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading products..."
                : `${products.length} product${
                    products.length === 1
                      ? ""
                      : "s"
                  } found`}
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({
                length: 4,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl bg-slate-100"
                  />
                )
              )}
            </div>
          ) : products.length === 0 ? (
            <div className="px-6 py-16 text-center">

              <Package className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No products found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1150px]">

                <thead className="bg-slate-50">

                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-slate-500">

                    <th className="px-6 py-4">
                      Product
                    </th>

                    <th className="px-6 py-4">
                      Category
                    </th>

                    <th className="px-6 py-4">
                      Seller
                    </th>

                    <th className="px-6 py-4">
                      Price
                    </th>

                    <th className="px-6 py-4">
                      Stock
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Condition
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y">

                  {products.map(
                    (product) => {

                      const imageUrl =
                        getImageUrl(
                          product.image
                        );

                      return (
                        <tr
                          key={
                            product.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* Product */}
                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-slate-100">

                                {imageUrl ? (
                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={
                                      product.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-6 w-6 text-slate-300" />
                                  </div>
                                )}

                              </div>

                              <div className="min-w-0">

                                <p className="max-w-[220px] truncate font-semibold text-slate-900">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="text-xs text-slate-500">
                                  SKU:{" "}
                                  {
                                    product.sku
                                  }
                                </p>

                                <p className="text-xs text-slate-400">
                                  Added{" "}
                                  {formatDate(
                                    product.created_at
                                  )}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* Category */}
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">
                              {
                                product.category_name ||
                                "—"
                              }
                            </span>
                          </td>

                          {/* Seller */}
                          <td className="px-6 py-4">

                            <div className="flex items-center gap-2">

                              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <Store className="h-4 w-4" />
                              </div>

                              <div>

                                <p className="text-sm font-semibold text-slate-800">
                                  {
                                    product.seller_username
                                  }
                                </p>

                                <p className="text-xs text-slate-400">
                                  ID:{" "}
                                  {
                                    product.seller
                                  }
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* Price */}
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(
                                product.price
                              )}
                            </p>
                          </td>

                          {/* Stock */}
                          <td className="px-6 py-4">

                            <div>

                              <span
                                className={`font-semibold ${
                                  product.stock_quantity ===
                                  0
                                    ? "text-red-600"
                                    : product.stock_quantity <=
                                      5
                                    ? "text-amber-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {
                                  product.stock_quantity
                                }
                              </span>

                              <p className="text-xs text-slate-400">
                                {product.stock_quantity ===
                                0
                                  ? "Out of stock"
                                  : product.stock_quantity <=
                                    5
                                  ? "Low stock"
                                  : "Available"}
                              </p>

                            </div>

                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                product.is_active
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >

                              {product.is_active ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}

                              {product.is_active
                                ? "Active"
                                : "Inactive"}

                            </span>

                          </td>

                          {/* Condition */}
                          <td className="px-6 py-4">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${conditionClasses(
                                product.condition
                              )}`}
                            >
                              {conditionLabel(
                                product.condition
                              )}
                            </span>

                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">

                            <div className="flex justify-end gap-2">

                              <a
                                href={`/products/${product.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border bg-white p-2 text-slate-500 transition hover:border-green-300 hover:text-green-700"
                                title="View product"
                              >
                                <Eye className="h-4 w-4" />
                              </a>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    product
                                  )
                                }
                                className="rounded-lg border bg-white p-2 text-slate-500 transition hover:border-blue-300 hover:text-blue-700"
                                title="Edit product"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleActive(
                                    product
                                  )
                                }
                                disabled={
                                  updatingProductId ===
                                  product.id
                                }
                                className={`rounded-lg border p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  product.is_active
                                    ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                                    : "border-green-200 bg-white text-green-700 hover:bg-green-50"
                                }`}
                                title={
                                  product.is_active
                                    ? "Deactivate product"
                                    : "Activate product"
                                }
                              >

                                {product.is_active ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}

                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* Edit Modal */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

              <div className="border-b px-6 py-5">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">
                      Edit Product
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        editingProduct.name
                      }
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      closeEditModal
                    }
                    disabled={
                      updatingProductId !==
                      null
                    }
                    className="text-2xl leading-none text-slate-400 hover:text-slate-700"
                  >
                    ×
                  </button>

                </div>

              </div>

              <div className="space-y-5 p-6">

                {/* Price */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Price
                  </label>

                  <div className="relative">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      GHS
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(event) =>
                        setEditPrice(
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 pl-14 pr-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />

                  </div>

                </div>

                {/* Stock */}
                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Stock Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editStock}
                    onChange={(event) =>
                      setEditStock(
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />

                </div>

                {/* Visibility */}
                <div className="flex items-center justify-between rounded-xl border p-4">

                  <div>

                    <p className="font-semibold text-slate-800">
                      Product visibility
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Inactive products are hidden from the marketplace.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditStatus(
                        (current) =>
                          !current
                      )
                    }
                    className={`relative h-6 w-11 rounded-full transition ${
                      editStatus
                        ? "bg-green-600"
                        : "bg-slate-300"
                    }`}
                  >

                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                        editStatus
                          ? "left-6"
                          : "left-1"
                      }`}
                    />

                  </button>

                </div>

              </div>

              <div className="flex justify-end gap-3 border-t px-6 py-4">

                <button
                  type="button"
                  onClick={
                    closeEditModal
                  }
                  disabled={
                    updatingProductId !==
                    null
                  }
                  className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveProduct
                  }
                  disabled={
                    updatingProductId !==
                    null
                  }
                  className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingProductId !==
                  null
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}