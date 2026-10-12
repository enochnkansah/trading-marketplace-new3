"use client";

import { useEffect, useState } from "react";

import { API_ORIGIN } from "@/lib/config";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Loader2,
  ArrowRight,
  Package,
  X,
} from "lucide-react";

import api from "@/lib/client";
import SiteHeader from "@/components/site-header";

interface CartItem {
  id: number;
  product: number;
  product_name?: string;
  product_price?: string;
  quantity: number;
}

interface Cart {
  id: number;
  items: CartItem[];
  total?: string;
}

interface Product {
  id: number;
  name: string;
  image: string | null;
  stock_quantity: number;
  price: string;
  is_active: boolean;
}

const DJANGO_BASE_URL = API_ORIGIN;

function getImageUrl(
  image: string | null | undefined
): string | null {
  if (!image) return null;

  const cleanImage = image.trim();

  if (!cleanImage) return null;

  if (
    cleanImage.startsWith("http://") ||
    cleanImage.startsWith("https://")
  ) {
    return cleanImage;
  }

  if (cleanImage.startsWith("/")) {
    return `${DJANGO_BASE_URL}${cleanImage}`;
  }

  return `${DJANGO_BASE_URL}/${cleanImage}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-GH", {
    style: "currency",
    currency: "GHS",
  });
}

function getApiErrorMessage(error: any): string {
  const data = error?.response?.data;

  if (!data) {
    return "Something went wrong. Please try again.";
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (typeof data === "object") {
    const firstKey = Object.keys(data)[0];

    if (firstKey) {
      const value = data[firstKey];

      if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
      }

      if (typeof value === "string") {
        return value;
      }
    }
  }

  return "Something went wrong. Please try again.";
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);

  const [products, setProducts] = useState<
    Record<number, Product>
  >({});

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(
    null
  );

  const [clearing, setClearing] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");

      const [cartResponse, productsResponse] =
        await Promise.all([
          api.get("/cart/"),
          api.get("/products/"),
        ]);

      const cartData = cartResponse.data;

      setCart(cartData);

      const productData = Array.isArray(productsResponse.data)
        ? productsResponse.data
        : productsResponse.data?.results || [];

      const productMap: Record<number, Product> = {};

      productData.forEach((product: Product) => {
        productMap[product.id] = product;
      });

      setProducts(productMap);
    } catch (error: any) {
      console.error("Failed to load cart:", error);

      if (error?.response?.status === 401) {
        setError("Please log in to view your cart.");
      } else {
        setError(getApiErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (
    item: CartItem,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      return;
    }

    const product = products[item.product];

    if (
      product &&
      newQuantity > product.stock_quantity
    ) {
      setError(
        `Only ${product.stock_quantity} units of ${product.name} are currently available.`
      );
      return;
    }

    try {
      setUpdating(item.id);
      setError("");
      setSuccessMessage("");

      const response = await api.patch(
        "/cart/update_item/",
        {
          item: item.id,
          quantity: newQuantity,
        }
      );

      setCart(response.data);
    } catch (error: any) {
      console.error(
        "Failed to update cart item:",
        error
      );

      setError(getApiErrorMessage(error));
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (item: CartItem) => {
    try {
      setUpdating(item.id);
      setError("");
      setSuccessMessage("");

      const response = await api.delete(
        "/cart/remove_item/",
        {
          params: {
            item: item.id,
          },
        }
      );

      setCart(response.data);

      setSuccessMessage(
        `${item.product_name || "Product"} removed from your cart.`
      );
    } catch (error: any) {
      console.error(
        "Failed to remove cart item:",
        error
      );

      setError(getApiErrorMessage(error));
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    if (!cart?.items?.length) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove all items from your cart?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setClearing(true);
      setError("");
      setSuccessMessage("");

      const response = await api.delete("/cart/clear/");

      setCart(response.data);

      setSuccessMessage(
        "Your cart has been cleared."
      );
    } catch (error: any) {
      console.error(
        "Failed to clear cart:",
        error
      );

      setError(getApiErrorMessage(error));
    } finally {
      setClearing(false);
    }
  };

  const cartItems = cart?.items || [];

  const calculatedTotal = cartItems.reduce(
    (total, item) => {
      const price = Number(
        item.product_price ?? 0
      );

      return total + price * item.quantity;
    },
    0
  );

  const total = Number(
    cart?.total ?? calculatedTotal
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <SiteHeader />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-green-700" />

            <span className="text-gray-600">
              Loading your cart...
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* Back */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-green-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>

        {/* Heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-950">
              Shopping Cart
            </h1>

            <p className="mt-2 text-gray-500">
              Review the products in your cart before checkout.
            </p>
          </div>

          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              disabled={clearing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              {clearing
                ? "Clearing..."
                : "Clear Cart"}
            </button>
          )}

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <X className="mt-0.5 h-5 w-5 shrink-0" />

            <p>{error}</p>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-medium text-green-700">
            {successMessage}
          </div>
        )}

        {/* Empty Cart */}
        {cartItems.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-20 text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <ShoppingCart className="h-10 w-10 text-green-700" />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              You haven't added any products to your cart yet.
              Explore the marketplace and find something you need.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Start Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>
        ) : (

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

            {/* Cart Items */}
            <div className="space-y-4">

              {cartItems.map((item) => {
                const product =
                  products[item.product];

                const price = Number(
                  item.product_price ?? product?.price ?? 0
                );

                const itemTotal =
                  price * item.quantity;

                const imageUrl = getImageUrl(
                  product?.image
                );

                const isUpdating =
                  updating === item.id;

                const maxStock =
                  product?.stock_quantity ?? 999999;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex gap-5">

                      {/* Product Image */}
                      <Link
                        href={`/products/${item.product}`}
                        className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              item.product_name ||
                              "Product"
                            }
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <Package className="h-10 w-10 text-gray-300" />
                        )}
                      </Link>

                      {/* Details */}
                      <div className="min-w-0 flex-1">

                        <Link
                          href={`/products/${item.product}`}
                          className="font-semibold text-gray-900 transition hover:text-green-700"
                        >
                          {item.product_name ||
                            `Product #${item.product}`}
                        </Link>

                        <p className="mt-1 text-sm text-gray-500">
                          {formatCurrency(price)}
                          {" "}per item
                        </p>

                        <p className="mt-2 text-lg font-bold text-gray-900">
                          {formatCurrency(itemTotal)}
                        </p>

                        {/* Controls */}
                        <div className="mt-4 flex flex-wrap items-center gap-4">

                          <div className="flex items-center overflow-hidden rounded-xl border border-gray-300">

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item,
                                  item.quantity - 1
                                )
                              }
                              disabled={
                                isUpdating ||
                                item.quantity <= 1
                              }
                              className="flex h-10 w-10 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            <div className="flex h-10 w-12 items-center justify-center border-x border-gray-300 text-sm font-semibold text-gray-900">
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                item.quantity
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item,
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                isUpdating ||
                                item.quantity >= maxStock
                              }
                              className="flex h-10 w-10 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus className="h-4 w-4" />
                            </button>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item)
                            }
                            disabled={isUpdating}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition hover:text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>

                        </div>

                        {/* Stock */}
                        {product && (
                          <p className="mt-3 text-xs text-gray-500">
                            {product.stock_quantity > 0
                              ? `${product.stock_quantity} units available`
                              : "Currently out of stock"}
                          </p>
                        )}

                      </div>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* Summary */}
            <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">

              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Items
                  </span>

                  <span className="font-medium text-gray-900">
                    {cartItems.reduce(
                      (sum, item) =>
                        sum + item.quantity,
                      0
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Shipping
                  </span>

                  <span className="font-medium text-gray-900">
                    Calculated at checkout
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-green-700">
                      {formatCurrency(total)}
                    </span>
                  </div>

                </div>

              </div>

              <Link
                href="/checkout"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-4 font-semibold text-white transition hover:bg-green-800"
              >
                Proceed to Checkout
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/"
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Continue Shopping
              </Link>

            </div>

          </div>
        )}

      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">

          <p>
            © {new Date().getFullYear()} Agricult.
            Agricultural marketplace.
          </p>

          <div className="flex gap-5">
            <Link
              href="/"
              className="transition hover:text-green-700"
            >
              Marketplace
            </Link>

            <Link
              href="/cart"
              className="transition hover:text-green-700"
            >
              Cart
            </Link>
          </div>

        </div>
      </footer>
    </main>
  );
}