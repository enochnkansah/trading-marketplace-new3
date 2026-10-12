"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

import { API_ORIGIN } from "@/lib/config";
import {
  ArrowLeft,
  Check,
  Edit3,
  Image as ImageIcon,
  Package,
  Plus,
  Search,
  Store,
  Trash2,
  Upload,
  X,
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

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  is_active: boolean;
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

type Condition = "NEW" | "USED" | "REFURBISHED";

const API_SERVER_URL = API_ORIGIN;

export default function SellerPage() {
  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  // =========================================================
  // DATA
  // =========================================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  // =========================================================
  // ADD PRODUCT FORM
  // =========================================================

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");

  const [condition, setCondition] =
    useState<Condition>("NEW");

  const [image, setImage] =
    useState<File | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  // =========================================================
  // SEARCH / FILTERS
  // =========================================================

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  // =========================================================
  // EDIT PRODUCT
  // =========================================================

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [editName, setEditName] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editCategory, setEditCategory] =
    useState("");

  const [editDescription, setEditDescription] =
    useState("");

  const [editPrice, setEditPrice] =
    useState("");

  const [editStock, setEditStock] =
    useState("");

  const [editCondition, setEditCondition] =
    useState<Condition>("NEW");

  const [savingEdit, setSavingEdit] =
    useState(false);

  // =========================================================
  // DELETE
  // =========================================================

  const [deletingProductId, setDeletingProductId] =
    useState<number | null>(null);

  // =========================================================
  // STATUS
  // =========================================================

  const [updatingStatusId, setUpdatingStatusId] =
    useState<number | null>(null);

  // =========================================================
  // MESSAGES
  // =========================================================

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // READ LOGGED-IN USER
  // =========================================================

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
    } catch (error) {
      console.error(
        "Unable to read authentication:",
        error
      );
    } finally {
      setAuthReady(true);
    }
  }, []);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    if (!authReady || !currentUser) {
      return;
    }

    loadCategories();
    loadProducts();
  }, [authReady, currentUser]);

  // =========================================================
  // LOAD CATEGORIES
  // =========================================================

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);

      const response =
        await api.get("/categories/");

      const data: Category[] =
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];

      setCategories(data);
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to load categories."
        )
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setError("");

      const response =
        await api.get("/products/");

      const data: Product[] =
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];

      if (currentUser?.role === "ADMIN") {
        setProducts(data);
      } else if (currentUser) {
        const sellerProducts =
          data.filter(
            (product) =>
              product.seller === currentUser.id
          );

        setProducts(sellerProducts);
      }
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to load your products."
        )
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // =========================================================
  // ADD PRODUCT
  // =========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentUser) {
      setError(
        "You must be logged in to list a product."
      );
      return;
    }

    if (
      currentUser.role !== "SELLER" &&
      currentUser.role !== "ADMIN"
    ) {
      setError(
        "Your account does not have permission to list products."
      );
      return;
    }

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!sku.trim()) {
      setError("Please enter a SKU.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    if (!price) {
      setError("Please enter a price.");
      return;
    }

    if (!stockQuantity) {
      setError(
        "Please enter the stock quantity."
      );
      return;
    }

    const numericPrice = Number(price);
    const numericStock = Number(stockQuantity);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setError(
        "Please enter a valid price."
      );
      return;
    }

    if (
      Number.isNaN(numericStock) ||
      numericStock < 0 ||
      !Number.isInteger(numericStock)
    ) {
      setError(
        "Stock quantity must be a whole number."
      );
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append(
        "name",
        name.trim()
      );

      formData.append(
        "sku",
        sku.trim()
      );

      formData.append(
        "description",
        description.trim()
      );

      formData.append(
        "price",
        numericPrice.toFixed(2)
      );

      formData.append(
        "stock_quantity",
        String(numericStock)
      );

      formData.append(
        "category",
        category
      );

      formData.append(
        "condition",
        condition
      );

      formData.append(
        "is_active",
        "true"
      );

      if (image) {
        formData.append(
          "image",
          image
        );
      }

      const response =
        await api.post(
          "/products/",
          formData
        );

      const createdProduct: Product =
        response.data;

      setProducts(
        (previousProducts) => [
          createdProduct,
          ...previousProducts,
        ]
      );

      setSuccess(
        `Product "${createdProduct.name}" was listed successfully.`
      );

      setName("");
      setSku("");
      setCategory("");
      setDescription("");
      setPrice("");
      setStockQuantity("");
      setCondition("NEW");
      setImage(null);

      const fileInput =
        document.getElementById(
          "product-image"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to create the product."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditProduct = (
    product: Product
  ) => {
    setEditingProduct(product);

    setEditName(product.name);
    setEditSku(product.sku);
    setEditCategory(
      String(product.category)
    );
    setEditDescription(
      product.description || ""
    );
    setEditPrice(product.price);
    setEditStock(
      String(product.stock_quantity)
    );
    setEditCondition(product.condition);

    setError("");
    setSuccess("");
  };

  // =========================================================
  // CLOSE EDIT MODAL
  // =========================================================

  const closeEditProduct = () => {
    if (savingEdit) {
      return;
    }

    setEditingProduct(null);
  };

  // =========================================================
  // SAVE EDIT
  // =========================================================

  const handleSaveEdit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    setError("");
    setSuccess("");

    if (!editName.trim()) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (!editSku.trim()) {
      setError("SKU is required.");
      return;
    }

    if (!editCategory) {
      setError(
        "Please select a category."
      );
      return;
    }

    const numericPrice =
      Number(editPrice);

    const numericStock =
      Number(editStock);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setError(
        "Please enter a valid price."
      );
      return;
    }

    if (
      Number.isNaN(numericStock) ||
      numericStock < 0 ||
      !Number.isInteger(numericStock)
    ) {
      setError(
        "Stock quantity must be a whole number."
      );
      return;
    }

    setSavingEdit(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "name",
        editName.trim()
      );

      formData.append(
        "sku",
        editSku.trim()
      );

      formData.append(
        "description",
        editDescription.trim()
      );

      formData.append(
        "price",
        numericPrice.toFixed(2)
      );

      formData.append(
        "stock_quantity",
        String(numericStock)
      );

      formData.append(
        "category",
        editCategory
      );

      formData.append(
        "condition",
        editCondition
      );

      const response =
        await api.patch(
          `/products/${editingProduct.id}/`,
          formData
        );

      const updatedProduct: Product =
        response.data;

      setProducts(
        (previousProducts) =>
          previousProducts.map(
            (product) =>
              product.id ===
              updatedProduct.id
                ? updatedProduct
                : product
          )
      );

      setEditingProduct(null);

      setSuccess(
        `Product "${updatedProduct.name}" was updated successfully.`
      );
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to update the product."
        )
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================================================
  // TOGGLE PRODUCT STATUS
  // =========================================================

  const toggleProductStatus = async (
    product: Product
  ) => {
    setError("");
    setSuccess("");

    setUpdatingStatusId(product.id);

    try {
      const formData =
        new FormData();

      formData.append(
        "is_active",
        product.is_active
          ? "false"
          : "true"
      );

      const response =
        await api.patch(
          `/products/${product.id}/`,
          formData
        );

      const updatedProduct: Product =
        response.data;

      /*
       * The backend ProductViewSet currently
       * returns only active products from the
       * queryset.
       *
       * Therefore, when a product is deactivated,
       * it may disappear from the list after the
       * update.
       */
      if (!updatedProduct.is_active) {
        setProducts(
          (previousProducts) =>
            previousProducts.filter(
              (item) =>
                item.id !==
                updatedProduct.id
            )
        );
      } else {
        setProducts(
          (previousProducts) =>
            previousProducts.map(
              (item) =>
                item.id ===
                updatedProduct.id
                  ? updatedProduct
                  : item
            )
        );
      }

      setSuccess(
        product.is_active
          ? `"${product.name}" has been deactivated.`
          : `"${product.name}" has been activated.`
      );
    } catch (error: any) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to update product status."
        )
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDeleteProduct = async (
  product: Product
) => {
  const confirmed = window.confirm(
    `Delete "${product.name}"?\n\nThis action cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  setError("");
  setSuccess("");
  setDeletingProductId(product.id);

  try {
    await api.delete(`/products/${product.id}/`);

    // Immediately remove it from the current screen.
    setProducts((previousProducts) =>
      previousProducts.filter(
        (item) => Number(item.id) !== Number(product.id)
      )
    );

    setSuccess(
      `"${product.name}" was deleted successfully.`
    );

    // Re-fetch from Django to make sure the UI
    // matches the actual database state.
    await loadProducts();

  } catch (error: any) {
    setError(
      getApiErrorMessage(
        error,
        "Unable to delete the product."
      )
    );
  } finally {
    setDeletingProductId(null);
  }
};

  // =========================================================
  // FILTER PRODUCTS
  // =========================================================

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            !normalizedSearch ||
            product.name
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            product.sku
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            product.description
              ?.toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesCategory =
            categoryFilter === "ALL" ||
            String(product.category) ===
              categoryFilter;

          const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" &&
              product.is_active) ||
            (statusFilter === "INACTIVE" &&
              !product.is_active);

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
          );
        }
      );
    }, [
      products,
      search,
      categoryFilter,
      statusFilter,
    ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalProducts =
    products.length;

  const activeProducts =
    products.filter(
      (product) =>
        product.is_active
    ).length;

  const inactiveProducts =
    products.filter(
      (product) =>
        !product.is_active
    ).length;

  const totalUnits =
    products.reduce(
      (total, product) =>
        total +
        product.stock_quantity,
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

  // =========================================================
  // AUTH LOADING
  // =========================================================

  if (!authReady) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-slate-600">
              Loading seller center...
            </p>
          </div>
        </main>
      </>
    );
  }

  // =========================================================
  // NOT LOGGED IN
  // =========================================================

  if (!currentUser) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen bg-slate-50">
          <section className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-6 py-10">
              <Link
                href="/"
                className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-green-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to marketplace
              </Link>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                  <Store className="h-7 w-7 text-green-700" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                    Agricult Seller Center
                  </p>

                  <h1 className="font-serif text-4xl font-bold text-slate-950">
                    Manage Products
                  </h1>
                </div>
              </div>

              <p className="mt-5 text-lg text-slate-600">
                Manage your agricultural products
                and inventory.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              <p className="font-medium">
                Please log in to access the seller
                center.
              </p>

              <Link
                href="/login"
                className="mt-4 inline-flex rounded-lg bg-green-700 px-5 py-2.5 font-medium text-white hover:bg-green-800"
              >
                Log in
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  // =========================================================
  // ROLE CHECK
  // =========================================================

  const canManageProducts =
    currentUser.role === "SELLER" ||
    currentUser.role === "ADMIN";

  if (!canManageProducts) {
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
                Your current account cannot manage
                products.
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

  // =========================================================
  // SELLER CENTER
  // =========================================================

  return (
    <>
      <SiteHeader />

      <SellerNav />

      <main className="min-h-screen bg-slate-50">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-6 py-10">

            <Link
              href="/seller/dashboard"
              className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-green-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                  <Package className="h-7 w-7 text-green-700" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                    Agricult Seller Center
                  </p>

                  <h1 className="font-serif text-4xl font-bold text-slate-950">
                    My Products
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

            <p className="mt-5 text-lg text-slate-600">
              Add, edit and manage your agricultural
              products and available inventory.
            </p>
          </div>
        </section>

        {/* =====================================================
            SELLER QUICK ACTIONS
        ===================================================== */}

        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <Link href="/seller" className="group rounded-2xl border border-green-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-500 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
                    <Package className="h-5 w-5 text-green-700" />
                  </div>
                  <div><p className="font-semibold text-slate-950">Products</p><p className="mt-1 text-sm text-slate-500">Manage your listings</p></div>
                </div>
              </Link>

              <Link href="/seller/orders" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-500 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                    <Package className="h-5 w-5 text-blue-700" />
                  </div>
                  <div><p className="font-semibold text-slate-950">Orders</p><p className="mt-1 text-sm text-slate-500">View and manage orders</p></div>
                </div>
              </Link>

              <Link href="/seller/sales" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-500 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                    <Store className="h-5 w-5 text-amber-700" />
                  </div>
                  <div><p className="font-semibold text-slate-950">Sales</p><p className="mt-1 text-sm text-slate-500">Track your sales performance</p></div>
                </div>
              </Link>

              <Link href="/seller/dashboard" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-500 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                    <Check className="h-5 w-5 text-purple-700" />
                  </div>
                  <div><p className="font-semibold text-slate-950">Dashboard</p><p className="mt-1 text-sm text-slate-500">View your seller overview</p></div>
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* =====================================================
            MAIN
        ===================================================== */}

        <section className="mx-auto max-w-7xl px-6 py-10">

          {/* ===================================================
              MESSAGES
          =================================================== */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-5 text-red-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    Something went wrong
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="rounded-lg p-1 hover:bg-red-100"
                  aria-label="Close error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-300 bg-green-50 p-5 text-green-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    Success
                  </p>

                  <p className="mt-1 text-sm">
                    {success}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSuccess("")}
                  className="rounded-lg p-1 hover:bg-green-100"
                  aria-label="Close success message"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ===================================================
              STATISTICS
          =================================================== */}

          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              icon={<Package className="h-6 w-6 text-green-700" />}
              value={totalProducts}
              label="Total Products"
              description="Products in your inventory"
            />

            <StatCard
              icon={<Check className="h-6 w-6 text-green-700" />}
              value={activeProducts}
              label="Active"
              description="Currently visible products"
            />

            <StatCard
              icon={<Package className="h-6 w-6 text-amber-700" />}
              value={lowStockProducts}
              label="Low Stock"
              description="5 units or fewer"
            />

            <StatCard
              icon={<Package className="h-6 w-6 text-red-700" />}
              value={outOfStockProducts}
              label="Out of Stock"
              description="Products with zero stock"
            />

          </div>

          {/* ===================================================
              ADD PRODUCT + ACCOUNT
          =================================================== */}

          <div className="grid gap-8 lg:grid-cols-[1fr_330px]">

            {/* =================================================
                PRODUCT FORM
            ================================================= */}

            <section className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">

              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Plus className="h-6 w-6 text-green-700" />
                </div>

                <h2 className="font-serif text-2xl font-bold text-slate-950">
                  List a Product
                </h2>

                <p className="mt-2 text-slate-600">
                  Add a new agricultural product to
                  the Agricult marketplace.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >

                {/* PRODUCT NAME */}

                <div>
                  <label
                    htmlFor="product-name"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Product Name
                  </label>

                  <input
                    id="product-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="e.g. Fresh Maize"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* SKU */}

                <div>
                  <label
                    htmlFor="product-sku"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    SKU
                  </label>

                  <input
                    id="product-sku"
                    type="text"
                    value={sku}
                    onChange={(event) =>
                      setSku(event.target.value)
                    }
                    placeholder="e.g. MAIZE-001"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* CATEGORY */}

                <div>
                  <label
                    htmlFor="product-category"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Category
                  </label>

                  <select
                    id="product-category"
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target.value
                      )
                    }
                    disabled={
                      loadingCategories
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
                  >
                    <option value="">
                      {loadingCategories
                        ? "Loading categories..."
                        : "Select a category"}
                    </option>

                    {categories
                      .filter(
                        (item) =>
                          item.is_active !== false
                      )
                      .map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label
                    htmlFor="product-description"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Description
                  </label>

                  <textarea
                    id="product-description"
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="Describe your product..."
                    rows={5}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* PRICE + STOCK */}

                <div className="grid gap-6 md:grid-cols-2">

                  <div>
                    <label
                      htmlFor="product-price"
                      className="mb-2 block text-sm font-semibold text-slate-900"
                    >
                      Price (GHS)
                    </label>

                    <input
                      id="product-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) =>
                        setPrice(
                          event.target.value
                        )
                      }
                      placeholder="500.00"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="product-stock"
                      className="mb-2 block text-sm font-semibold text-slate-900"
                    >
                      Stock Quantity
                    </label>

                    <input
                      id="product-stock"
                      type="number"
                      min="0"
                      step="1"
                      value={stockQuantity}
                      onChange={(event) =>
                        setStockQuantity(
                          event.target.value
                        )
                      }
                      placeholder="50"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                </div>

                {/* CONDITION */}

                <div>
                  <label
                    htmlFor="product-condition"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Condition
                  </label>

                  <select
                    id="product-condition"
                    value={condition}
                    onChange={(event) =>
                      setCondition(
                        event.target.value as Condition
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  >
                    <option value="NEW">
                      New
                    </option>

                    <option value="USED">
                      Used
                    </option>

                    <option value="REFURBISHED">
                      Refurbished
                    </option>
                  </select>
                </div>

                {/* IMAGE */}

                <div>
                  <label
                    htmlFor="product-image"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Product Image

                    <span className="ml-2 font-normal text-slate-500">
                      Optional
                    </span>
                  </label>

                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-5 hover:border-green-500">

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        {image ? (
                          <ImageIcon className="h-6 w-6 text-green-700" />
                        ) : (
                          <Upload className="h-6 w-6 text-slate-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">

                        <input
                          id="product-image"
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const selectedFile =
                              event.target.files?.[0] ||
                              null;

                            setImage(
                              selectedFile
                            );
                          }}
                          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-green-100 file:px-4 file:py-2 file:font-medium file:text-green-700"
                        />

                        {image && (
                          <p className="mt-2 truncate text-xs text-slate-500">
                            Selected:{" "}
                            {image.name}
                          </p>
                        )}

                      </div>
                    </div>
                  </div>
                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Listing Product...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      List Product
                    </>
                  )}
                </button>

              </form>
            </section>

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="space-y-6">

              {/* ACCOUNT */}

              <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Store className="h-6 w-6 text-green-700" />
                </div>

                <h2 className="font-serif text-xl font-bold text-slate-950">
                  Seller Account
                </h2>

                <div className="mt-5 space-y-4">

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Username
                    </p>

                    <p className="mt-1 font-medium">
                      {currentUser.username}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Email
                    </p>

                    <p className="mt-1 break-all font-medium">
                      {currentUser.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Account Type
                    </p>

                    <p className="mt-1 font-semibold text-green-700">
                      {currentUser.role}
                    </p>
                  </div>

                </div>
              </div>

              {/* INVENTORY SUMMARY */}

              <div className="rounded-2xl bg-green-900 p-6 text-white">

                <Package className="mb-4 h-8 w-8" />

                <h2 className="font-serif text-xl font-bold">
                  Inventory
                </h2>

                <div className="mt-5 text-3xl font-bold">
                  {totalUnits}
                </div>

                <p className="text-sm text-green-100">
                  Total units in stock
                </p>

                <div className="mt-5 border-t border-green-700 pt-4">

                  <div className="flex justify-between text-sm">
                    <span className="text-green-100">
                      Active
                    </span>

                    <span className="font-semibold">
                      {activeProducts}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-green-100">
                      Low stock
                    </span>

                    <span className="font-semibold">
                      {lowStockProducts}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-green-100">
                      Out of stock
                    </span>

                    <span className="font-semibold">
                      {outOfStockProducts}
                    </span>
                  </div>

                </div>
              </div>

            </aside>
          </div>

          {/* =====================================================
              PRODUCT INVENTORY
          ===================================================== */}

          <section className="mt-10 rounded-2xl border bg-white shadow-sm">

            {/* HEADER */}

            <div className="border-b p-6 md:p-8">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h2 className="font-serif text-2xl font-bold text-slate-950">
                    Product Inventory
                  </h2>

                  <p className="mt-1 text-slate-600">
                    Manage your products, prices,
                    stock and availability.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadProducts}
                  disabled={loadingProducts}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:border-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  {loadingProducts
                    ? "Refreshing..."
                    : "Refresh Products"}
                </button>

              </div>

              {/* SEARCH + FILTERS */}

              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px_180px]">

                {/* SEARCH */}

                <div className="relative">

                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search products or SKU..."
                    className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                </div>

                {/* CATEGORY FILTER */}

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="ALL">
                    All Categories
                  </option>

                  {categories.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={String(item.id)}
                      >
                        {item.name}
                      </option>
                    )
                  )}
                </select>

                {/* STATUS FILTER */}

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="ALL">
                    All Status
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>

              </div>

              {/* FILTER SUMMARY */}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">

                <span>
                  Showing{" "}
                  <strong className="text-slate-900">
                    {filteredProducts.length}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-slate-900">
                    {products.length}
                  </strong>{" "}
                  products
                </span>

                {(search ||
                  categoryFilter !== "ALL" ||
                  statusFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter(
                        "ALL"
                      );
                      setStatusFilter(
                        "ALL"
                      );
                    }}
                    className="font-medium text-green-700 hover:text-green-800"
                  >
                    Clear filters
                  </button>
                )}

              </div>

            </div>

            {/* LOADING */}

            {loadingProducts && (
              <div className="py-16 text-center text-slate-500">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-green-700" />

                Loading your products...
              </div>
            )}

            {/* EMPTY */}

            {!loadingProducts &&
              filteredProducts.length === 0 && (
                <div className="p-8">

                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">

                    <Package className="mx-auto h-12 w-12 text-slate-400" />

                    <h3 className="mt-4 font-serif text-xl font-bold text-slate-900">
                      {products.length === 0
                        ? "No products yet"
                        : "No products found"}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {products.length === 0
                        ? "Use the form above to list your first product."
                        : "Try changing your search or filters."}
                    </p>

                  </div>
                </div>
              )}

            {/* PRODUCTS */}

            {!loadingProducts &&
              filteredProducts.length > 0 && (
                <div className="divide-y">

                  {filteredProducts.map(
                    (product) => {

                      const productCategory =
                        categories.find(
                          (item) =>
                            item.id ===
                            product.category
                        );

                      const isLowStock =
                        product.stock_quantity >
                          0 &&
                        product.stock_quantity <=
                          5;

                      const isOutOfStock =
                        product.stock_quantity ===
                        0;

                      return (
                        <div
                          key={product.id}
                          className="p-6 transition hover:bg-slate-50 md:p-8"
                        >

                          <div className="flex flex-col gap-6 xl:flex-row xl:items-center">

                            {/* IMAGE */}

                            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">

                              {product.image ? (
                                <img
                                  src={getMediaUrl(
                                    product.image
                                  )}
                                  alt={
                                    product.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-10 w-10 text-slate-400" />
                              )}

                            </div>

                            {/* PRODUCT DETAILS */}

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-start gap-3">

                                <h3 className="font-serif text-xl font-bold text-slate-950">
                                  {product.name}
                                </h3>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    product.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {product.is_active
                                    ? "ACTIVE"
                                    : "INACTIVE"}
                                </span>

                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                  {product.condition}
                                </span>

                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                SKU:{" "}
                                {product.sku}
                              </p>

                              {productCategory && (
                                <p className="mt-2 text-sm font-medium text-slate-600">
                                  {
                                    productCategory.name
                                  }
                                </p>
                              )}

                              {product.description && (
                                <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-slate-500">
                                  {
                                    product.description
                                  }
                                </p>
                              )}

                            </div>

                            {/* PRICE */}

                            <div className="min-w-[150px]">

                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Price
                              </p>

                              <p className="mt-1 text-xl font-bold text-green-700">
                                GHS{" "}
                                {formatCurrency(
                                  product.price
                                )}
                              </p>

                            </div>

                            {/* STOCK */}

                            <div className="min-w-[130px]">

                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Stock
                              </p>

                              <p
                                className={`mt-1 text-xl font-bold ${
                                  isOutOfStock
                                    ? "text-red-600"
                                    : isLowStock
                                    ? "text-amber-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {
                                  product.stock_quantity
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                {isOutOfStock
                                  ? "Out of stock"
                                  : isLowStock
                                  ? "Low stock"
                                  : "Units available"}
                              </p>

                            </div>

                            {/* ACTIONS */}

                            <div className="flex flex-wrap gap-2 xl:w-[280px] xl:justify-end">

                              {/* VIEW */}

                              <Link
                                href={`/products/${product.id}`}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:border-green-600 hover:text-green-700"
                              >
                                View
                              </Link>

                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() =>
                                  openEditProduct(
                                    product
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:border-green-600 hover:text-green-700"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </button>

                              {/* ACTIVATE / DEACTIVATE */}

                              <button
                                type="button"
                                onClick={() =>
                                  toggleProductStatus(
                                    product
                                  )
                                }
                                disabled={
                                  updatingStatusId ===
                                  product.id
                                }
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                                  product.is_active
                                    ? "border border-amber-300 text-amber-700 hover:bg-amber-50"
                                    : "bg-green-700 text-white hover:bg-green-800"
                                }`}
                              >
                                {updatingStatusId ===
                                product.id ? (
                                  "Updating..."
                                ) : product.is_active ? (
                                  "Deactivate"
                                ) : (
                                  "Activate"
                                )}
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteProduct(
                                    product
                                  )
                                }
                                disabled={
                                  deletingProductId ===
                                  product.id
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />

                                {deletingProductId ===
                                product.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                            </div>

                          </div>
                        </div>
                      );
                    }
                  )}

                </div>
              )}

          </section>

        </section>
      </main>

      {/* =======================================================
          EDIT PRODUCT MODAL
      ======================================================= */}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">

              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                  Product Management
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-950">
                  Edit Product
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeEditProduct
                }
                disabled={savingEdit}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* MODAL FORM */}

            <form
              onSubmit={handleSaveEdit}
              className="space-y-6 p-6"
            >

              {/* NAME */}

              <div>
                <label
                  htmlFor="edit-name"
                  className="mb-2 block text-sm font-semibold text-slate-900"
                >
                  Product Name
                </label>

                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(event) =>
                    setEditName(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* SKU */}

              <div>
                <label
                  htmlFor="edit-sku"
                  className="mb-2 block text-sm font-semibold text-slate-900"
                >
                  SKU
                </label>

                <input
                  id="edit-sku"
                  type="text"
                  value={editSku}
                  onChange={(event) =>
                    setEditSku(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* CATEGORY */}

              <div>
                <label
                  htmlFor="edit-category"
                  className="mb-2 block text-sm font-semibold text-slate-900"
                >
                  Category
                </label>

                <select
                  id="edit-category"
                  value={editCategory}
                  onChange={(event) =>
                    setEditCategory(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select a category
                  </option>

                  {categories
                    .filter(
                      (item) =>
                        item.is_active !== false
                    )
                    .map((item) => (
                      <option
                        key={item.id}
                        value={String(
                          item.id
                        )}
                      >
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="edit-description"
                  className="mb-2 block text-sm font-semibold text-slate-900"
                >
                  Description
                </label>

                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(
                      event.target.value
                    )
                  }
                  rows={5}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* PRICE + STOCK */}

              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="edit-price"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Price (GHS)
                  </label>

                  <input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPrice}
                    onChange={(event) =>
                      setEditPrice(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-stock"
                    className="mb-2 block text-sm font-semibold text-slate-900"
                  >
                    Stock Quantity
                  </label>

                  <input
                    id="edit-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={editStock}
                    onChange={(event) =>
                      setEditStock(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

              </div>

              {/* CONDITION */}

              <div>
                <label
                  htmlFor="edit-condition"
                  className="mb-2 block text-sm font-semibold text-slate-900"
                >
                  Condition
                </label>

                <select
                  id="edit-condition"
                  value={editCondition}
                  onChange={(event) =>
                    setEditCondition(
                      event.target.value as Condition
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="NEW">
                    New
                  </option>

                  <option value="USED">
                    Used
                  </option>

                  <option value="REFURBISHED">
                    Refurbished
                  </option>
                </select>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeEditProduct
                  }
                  disabled={savingEdit}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-medium hover:border-slate-500 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingEdit
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          FOOTER
      ======================================================= */}

      <footer className="border-t bg-white">

        <div className="mx-auto max-w-7xl px-6 py-8">

          <div className="flex flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">

            <p>
              © {new Date().getFullYear()} Agricult
              Marketplace
            </p>

            <Link
              href="/"
              className="hover:text-green-700"
            >
              Marketplace
            </Link>

          </div>

        </div>

      </footer>
    </>
  );
}

// =============================================================
// STAT CARD
// =============================================================

function StatCard({
  icon,
  value,
  label,
  description,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between gap-4">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
          {icon}
        </div>

        <p className="font-serif text-3xl font-bold text-slate-950">
          {value}
        </p>

      </div>

      <p className="mt-5 font-semibold text-slate-900">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>

    </div>
  );
}

// =============================================================
// MEDIA URL
// =============================================================

function getMediaUrl(
  image: string | null
): string {
  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${API_SERVER_URL}${image}`;
  }

  return `${API_SERVER_URL}/${image}`;
}

// =============================================================
// CURRENCY
// =============================================================

function formatCurrency(
  value: string | number
): string {
  const numericValue =
    Number(value);

  if (Number.isNaN(numericValue)) {
    return "0.00";
  }

  return numericValue.toLocaleString(
    "en-GH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

// =============================================================
// API ERROR HANDLER
// =============================================================

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
      "Your login session is not valid or has expired. Please log in again."
    );
  }

  if (status === 403) {
    return (
      "You do not have permission to manage this product."
    );
  }

  if (status === 404) {
    return (
      "The requested product could not be found."
    );
  }

  if (status === 413) {
    return (
      "The uploaded image or request is too large."
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