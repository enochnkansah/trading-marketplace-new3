"use client";

import { useEffect, useState } from "react";

import { API_ORIGIN } from "@/lib/config";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  Package,
} from "lucide-react";

import api from "@/lib/client";
import SiteHeader from "@/components/site-header";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
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

const DJANGO_BASE_URL = API_ORIGIN;

/**
 * Convert a Django image value into a complete browser URL.
 *
 * Examples:
 *
 * /media/products/image.png
 * -> http://127.0.0.1:8000/media/products/image.png
 *
 * media/products/image.png
 * -> http://127.0.0.1:8000/media/products/image.png
 *
 * http://127.0.0.1:8000/media/products/image.png
 * -> unchanged
 */
function getImageUrl(
  image: string | null | undefined
): string | null {
  if (!image) {
    return null;
  }

  const cleanImage = image.trim();

  if (!cleanImage) {
    return null;
  }

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

export default function CategoryPage() {
  const [category, setCategory] =
    useState<Category | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadCategoryAndProducts();
  }, []);

  const loadCategoryAndProducts =
    async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Get category slug from URL.
         *
         * Example:
         * /category/farm-produce
         *
         * slug = farm-produce
         */
        const pathname =
          window.location.pathname;

        const parts =
          pathname
            .split("/")
            .filter(Boolean);

        const slug =
          parts[parts.length - 1];

        if (!slug) {
          setError(
            "Category was not specified."
          );
          return;
        }

        /*
         * Load categories
         */
        const categoryResponse =
          await api.get("/categories/");

        const categoryData: Category[] =
          Array.isArray(
            categoryResponse.data
          )
            ? categoryResponse.data
            : categoryResponse.data
                ?.results || [];

        const foundCategory =
          categoryData.find(
            (item) =>
              item.slug === slug
          );

        if (!foundCategory) {
          setError(
            "Category not found."
          );
          return;
        }

        setCategory(
          foundCategory
        );

        /*
         * Load products
         */
        const productResponse =
          await api.get("/products/");

        const productData: Product[] =
          Array.isArray(
            productResponse.data
          )
            ? productResponse.data
            : productResponse.data
                ?.results || [];

        /*
         * Filter products belonging
         * to this category.
         */
        const categoryProducts =
          productData.filter(
            (product) =>
              Number(product.category) ===
                Number(foundCategory.id) &&
              product.is_active !== false
          );

        setProducts(
          categoryProducts
        );
      } catch (err: any) {
        console.error(
          "Category page error:",
          err
        );

        setError(
          err?.response?.data
            ?.detail ||
            err?.message ||
            "Unable to load this category."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-white">
        {/* =====================================================
            CATEGORY HEADER
        ===================================================== */}

        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-green-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to marketplace
            </Link>

            {category && (
              <>
                <h1 className="font-serif text-4xl font-bold text-slate-950">
                  {category.name}
                </h1>

                <p className="mt-2 text-slate-600">
                  {category.description ||
                    "Browse available products in this category."}
                </p>
              </>
            )}
          </div>
        </section>

        {/* =====================================================
            PRODUCTS
        ===================================================== */}

        <section className="mx-auto max-w-7xl px-6 py-10">
          {/* Loading */}
          {loading && (
            <div className="py-16 text-center text-slate-500">
              Loading products...
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
              {error}
            </div>
          )}

          {/* No products */}
          {!loading &&
            !error &&
            products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-slate-400" />

                <h2 className="mt-4 font-serif text-2xl font-bold">
                  No products yet
                </h2>

                <p className="mt-2 text-slate-600">
                  There are currently no
                  products available in
                  this category.
                </p>
              </div>
            )}

          {/* Products */}
          {!loading &&
            !error &&
            products.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map(
                  (product) => {
                    const imageUrl =
                      getImageUrl(
                        product.image
                      );

                    /*
                     * Temporary debugging.
                     *
                     * These messages will appear
                     * in the browser console.
                     */
                    console.log(
                      "PRODUCT:",
                      product.name
                    );

                    console.log(
                      "RAW IMAGE:",
                      product.image
                    );

                    console.log(
                      "IMAGE URL:",
                      imageUrl
                    );

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                      >
                        {/* =================================================
                            PRODUCT IMAGE
                        ================================================= */}

                        <div className="relative flex h-64 items-center justify-center overflow-hidden bg-slate-50">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              loading="lazy"
                              onLoad={() => {
                                console.log(
                                  "IMAGE LOADED:",
                                  imageUrl
                                );
                              }}
                              onError={(event) => {
                                console.error(
                                  "IMAGE FAILED:",
                                  imageUrl
                                );

                                /*
                                 * Hide broken image.
                                 */
                                event.currentTarget.style.display =
                                  "none";

                                /*
                                 * Show fallback.
                                 */
                                const fallback =
                                  event
                                    .currentTarget
                                    .parentElement
                                    ?.querySelector(
                                      "[data-image-fallback]"
                                    );

                                if (
                                  fallback
                                ) {
                                  (
                                    fallback as HTMLElement
                                  ).style.display =
                                    "flex";
                                }
                              }}
                            />
                          ) : null}

                          {/* =================================================
                              IMAGE FALLBACK
                          ================================================= */}

                          <div
                            data-image-fallback
                            className={`absolute inset-0 ${
                              imageUrl
                                ? "hidden"
                                : "flex"
                            } flex-col items-center justify-center text-center`}
                          >
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                              <Box className="h-10 w-10 text-green-700" />
                            </div>

                            <p className="mt-4 text-sm text-slate-500">
                              Image coming soon
                            </p>
                          </div>
                        </div>

                        {/* =================================================
                            PRODUCT DETAILS
                        ================================================= */}

                        <div className="p-5">
                          {/* Condition + Stock */}
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {
                                product.condition
                              }
                            </span>

                            {product.stock_quantity >
                            0 ? (
                              <span className="text-xs font-semibold text-green-700">
                                In Stock
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-red-600">
                                Out of Stock
                              </span>
                            )}
                          </div>

                          {/* Product name */}
                          <h2 className="mt-4 font-serif text-xl font-bold text-slate-950 transition group-hover:text-green-700">
                            {product.name}
                          </h2>

                          {/* Description */}
                          {product.description && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                              {
                                product.description
                              }
                            </p>
                          )}

                          {/* Price + Stock */}
                          <div className="mt-5 flex items-end justify-between">
                            <p className="text-xl font-bold text-green-700">
                              GHC{" "}
                              {Number(
                                product.price
                              ).toLocaleString(
                                "en-GH",
                                {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </p>

                            <p className="text-xs text-slate-500">
                              {
                                product.stock_quantity
                              }{" "}
                              available
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  }
                )}
              </div>
            )}
        </section>
      </main>
    </>
  );
}