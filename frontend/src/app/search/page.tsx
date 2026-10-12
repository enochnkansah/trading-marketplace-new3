"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  ArrowLeft,
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const searchQuery = searchParams.get("q")?.trim() || "";

    setQuery(searchQuery);

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products/");

        const data = response.data;

        // Supports both:
        // 1. A normal array
        // 2. Django/DRF paginated results
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data?.results)) {
          setProducts(data.results);
        } else {
          setProducts([]);
        }
      } catch (err: any) {
        console.error("Unable to load products:", err);

        if (err?.response?.status === 401) {
          setError("Please log in to view marketplace products.");
        } else if (err?.response?.status === 403) {
          setError("You do not have permission to view these products.");
        } else {
          setError("Unable to load marketplace products.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const search = query.toLowerCase();

  const results = products.filter((product) => {
    if (!search) {
      return true;
    }

    return (
      product.name?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search) ||
      product.condition?.toLowerCase().includes(search)
    );
  });

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-green-700"
        >
          <ArrowLeft size={16} />
          Back to marketplace
        </Link>

        {/* Heading */}
        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            Agricult Marketplace
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            {query
              ? `Search results for "${query}"`
              : "Marketplace Products"}
          </h1>

          {!loading && !error && (
            <p className="mt-2 text-gray-500">
              {results.length}{" "}
              {results.length === 1 ? "product" : "products"} found
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-gray-200"
              >
                <div className="h-56 animate-pulse bg-gray-100" />

                <div className="space-y-3 p-5">
                  <div className="h-5 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
            <Package
              className="mx-auto text-red-500"
              size={45}
            />

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Something went wrong
            </h2>

            <p className="mt-2 text-gray-600">
              {error}
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white"
            >
              Return to marketplace
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product) => {
              const price = Number(product.price).toLocaleString(
                "en-GH",
                {
                  style: "currency",
                  currency: "GHS",
                }
              );

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:border-green-300 hover:shadow-lg"
                >
                  {/* Image */}
                  <div className="flex h-56 items-center justify-center bg-gray-50">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain p-5 transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                          <Package
                            size={36}
                            className="text-green-700"
                          />
                        </div>

                        <p className="mt-3 text-xs text-gray-400">
                          Image coming soon
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Product information */}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase text-gray-600">
                        {product.condition}
                      </span>

                      {product.stock_quantity > 0 ? (
                        <span className="text-xs font-semibold text-green-700">
                          In Stock
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-red-600">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 line-clamp-2 text-lg font-bold text-gray-900 group-hover:text-green-700">
                      {product.name}
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                      {product.description}
                    </p>

                    <p className="mt-5 text-xl font-bold text-green-700">
                      {price}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* No results */}
        {!loading && !error && results.length === 0 && (
          <div className="mt-10 rounded-3xl border border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Search
                size={36}
                className="text-green-700"
              />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              No products found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              We couldn't find any Agricult products matching{" "}
              <strong>"{query}"</strong>.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800"
            >
              Browse marketplace
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}