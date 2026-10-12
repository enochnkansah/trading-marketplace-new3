"use client";

import { useEffect, useState } from "react";

import { API_ORIGIN } from "@/lib/config";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Store,
  Package,
  CheckCircle2,
} from "lucide-react";

import api from "@/lib/client";
import SiteHeader from "@/components/site-header";

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
  condition: string;
  is_active: boolean;
}

const DJANGO_BASE_URL = API_ORIGIN;

function getImageUrl(image: string | null | undefined): string | null {
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/products/${productId}/`);

        setProduct(response.data);

        if (response.data.stock_quantity <= 0) {
          setQuantity(1);
        }
      } catch (err: any) {
        console.error("Unable to load product:", err);

        if (err?.response?.status === 404) {
          setError("Product not found.");
        } else {
          setError("Unable to load this product.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const increaseQuantity = () => {
    if (!product) return;

    setQuantity((current) =>
      Math.min(current + 1, product.stock_quantity)
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const addToCart = async () => {
    if (!product) return;

    if (product.stock_quantity < 1) {
      setError("This product is currently out of stock.");
      return;
    }

    try {
      setAddingToCart(true);
      setCartMessage("");
      setError("");

      await api.post("/cart/add_item/", {
        product: product.id,
        quantity,
      });

      setCartMessage(
        `${quantity} ${
          quantity === 1 ? "item" : "items"
        } added to your cart.`
      );
    } catch (err: any) {
      console.error("Unable to add product to cart:", err);

      if (err?.response?.status === 401) {
        setError("Please log in to add products to your cart.");
      } else {
        setError(getApiErrorMessage(err));
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const buyNow = async () => {
    if (!product) return;

    if (product.stock_quantity < 1) {
      setError("This product is currently out of stock.");
      return;
    }

    try {
      setAddingToCart(true);
      setCartMessage("");
      setError("");

      await api.post("/cart/add_item/", {
        product: product.id,
        quantity,
      });

      router.push("/checkout");
    } catch (err: any) {
      console.error("Unable to continue to checkout:", err);

      if (err?.response?.status === 401) {
        setError("Please log in before continuing to checkout.");
      } else {
        setError(getApiErrorMessage(err));
      }

      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <SiteHeader />

        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />

          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div className="h-[500px] animate-pulse rounded-3xl bg-gray-100" />

            <div className="space-y-6">
              <div className="h-10 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-12 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="h-32 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="min-h-screen bg-white">
        <SiteHeader />

        <div className="mx-auto max-w-7xl px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-green-700"
          >
            <ArrowLeft size={16} />
            Back to marketplace
          </Link>

          <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 px-6 py-16 text-center">
            <Package className="mx-auto h-14 w-14 text-red-500" />

            <h1 className="mt-5 text-3xl font-bold text-gray-900">
              Product Not Found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-gray-600">
              {error}
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
            >
              Return to Agricult
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  const formattedPrice = Number(product.price).toLocaleString(
    "en-GH",
    {
      style: "currency",
      currency: "GHS",
    }
  );

  const subtotal = Number(product.price) * quantity;

  const formattedSubtotal = subtotal.toLocaleString(
    "en-GH",
    {
      style: "currency",
      currency: "GHS",
    }
  );

  const isInStock = product.stock_quantity > 0;

  const imageUrl = getImageUrl(product.image);

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link
            href="/"
            className="transition hover:text-green-700"
          >
            Marketplace
          </Link>

          <span>/</span>

          <span className="text-gray-900">
            {product.name}
          </span>
        </div>

        {/* Main Product */}
        <div className="grid gap-10 lg:grid-cols-2">

          {/* Product Image */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50">
            <div className="flex min-h-[420px] items-center justify-center p-8 sm:min-h-[520px]">

              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="max-h-[480px] w-full object-contain"
                  onLoad={() => {
                    console.log(
                      "PRODUCT IMAGE LOADED:",
                      imageUrl
                    );
                  }}
                  onError={(event) => {
                    console.error(
                      "PRODUCT IMAGE FAILED:",
                      imageUrl
                    );

                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-green-100">
                    <Package
                      size={54}
                      className="text-green-700"
                    />
                  </div>

                  <p className="mt-5 text-sm font-medium text-gray-500">
                    Product image
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Image coming soon
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Product Information */}
          <div className="flex flex-col">

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-700">
                {product.condition}
              </span>

              {isInStock ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  <CheckCircle2 size={14} />
                  In Stock
                </span>
              ) : (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              {product.name}
            </h1>

            {/* SKU */}
            <p className="mt-3 text-sm text-gray-500">
              SKU:{" "}
              <span className="font-medium text-gray-700">
                {product.sku}
              </span>
            </p>

            {/* Price */}
            <div className="mt-7">
              <p className="text-4xl font-bold text-green-700">
                {formattedPrice}
              </p>

              {isInStock && (
                <p className="mt-2 text-sm text-gray-500">
                  {product.stock_quantity} units available
                </p>
              )}
            </div>

            <div className="my-7 h-px bg-gray-200" />

            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Product Description
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                {product.description ||
                  "No product description has been provided yet."}
              </p>
            </div>

            {/* Cart Success */}
            {cartMessage && (
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                <CheckCircle2 size={18} />
                {cartMessage}
              </div>
            )}

            {/* Error */}
            {error && product && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* Quantity */}
            {isInStock && (
              <div className="mt-8">
                <p className="mb-3 text-sm font-bold text-gray-900">
                  Quantity
                </p>

                <div className="flex flex-wrap items-center gap-4">

                  <div className="flex items-center overflow-hidden rounded-xl border border-gray-300">

                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      disabled={
                        quantity <= 1 || addingToCart
                      }
                      className="flex h-11 w-11 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={17} />
                    </button>

                    <div className="flex h-11 w-14 items-center justify-center border-x border-gray-300 font-bold text-gray-900">
                      {quantity}
                    </div>

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      disabled={
                        quantity >= product.stock_quantity ||
                        addingToCart
                      }
                      className="flex h-11 w-11 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={17} />
                    </button>

                  </div>

                  <span className="text-sm text-gray-500">
                    Subtotal:{" "}
                    <span className="font-bold text-gray-900">
                      {formattedSubtotal}
                    </span>
                  </span>

                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={addToCart}
                disabled={!isInStock || addingToCart}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border-2 border-green-700 px-5 font-bold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={20} />

                {addingToCart
                  ? "Adding..."
                  : "Add to Cart"}
              </button>

              <button
                type="button"
                onClick={buyNow}
                disabled={!isInStock || addingToCart}
                className="inline-flex h-13 items-center justify-center rounded-xl bg-green-700 px-5 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingToCart
                  ? "Processing..."
                  : "Buy Now"}
              </button>

            </div>

            {/* Benefits */}
            <div className="mt-8 grid gap-4 border-t border-gray-200 pt-7 sm:grid-cols-3">

              <div className="flex gap-3">
                <Truck
                  className="mt-0.5 shrink-0 text-green-700"
                  size={22}
                />

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Delivery
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Convenient delivery options available.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-green-700"
                  size={22}
                />

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Secure Shopping
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Shop with confidence on Agricult.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Store
                  className="mt-0.5 shrink-0 text-green-700"
                  size={22}
                />

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Marketplace Seller
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Seller ID: {product.seller}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Product Details */}
        <section className="mt-16 border-t border-gray-200 pt-12">

          <div className="grid gap-10 lg:grid-cols-3">

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Product Details
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Important information about this marketplace
                product.
              </p>
            </div>

            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-gray-200">

                <div className="grid grid-cols-2 border-b border-gray-200">
                  <div className="bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-600">
                    Product
                  </div>

                  <div className="px-5 py-4 text-sm text-gray-900">
                    {product.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-gray-200">
                  <div className="bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-600">
                    SKU
                  </div>

                  <div className="px-5 py-4 text-sm text-gray-900">
                    {product.sku}
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-gray-200">
                  <div className="bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-600">
                    Condition
                  </div>

                  <div className="px-5 py-4 text-sm text-gray-900">
                    {product.condition}
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-gray-200">
                  <div className="bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-600">
                    Category ID
                  </div>

                  <div className="px-5 py-4 text-sm text-gray-900">
                    {product.category}
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-600">
                    Availability
                  </div>

                  <div className="px-5 py-4 text-sm text-gray-900">
                    {isInStock
                      ? `${product.stock_quantity} units available`
                      : "Currently unavailable"}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Marketplace CTA */}
        <section className="mt-16 overflow-hidden rounded-3xl bg-green-700 px-6 py-12 text-white sm:px-10">

          <div className="max-w-3xl">

            <p className="text-sm font-bold uppercase tracking-widest text-green-100">
              Agricult Marketplace
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Everything you need to grow, produce and farm.
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-green-50">
              Discover farm produce, agricultural equipment,
              seeds, livestock, farm inputs, irrigation
              solutions and more from sellers on Agricult.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-green-700 transition hover:bg-green-50"
            >
              Explore the marketplace
            </Link>

          </div>
        </section>

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