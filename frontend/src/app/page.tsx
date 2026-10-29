
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  Truck,
  ShieldCheck,
  Sprout,
  Tractor,
  Wheat,
  Package,
} from "lucide-react";

import api from "@/lib/client";
import SiteHeader from "@/components/site-header";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  category: number;
  image: string | null;
  condition: string;
  is_active: boolean;
}

const categories = [
  {
    name: "Farm Produce",
    slug: "farm-produce",
    description: "Fresh crops and agricultural produce",
    icon: Wheat,
  },
  {
    name: "Agricultural Equipment",
    slug: "agricultural-equipment",
    description: "Machines and equipment for modern farming",
    icon: Tractor,
  },
  {
    name: "Seeds & Seedlings",
    slug: "seeds-seedlings",
    description: "Quality seeds and healthy seedlings",
    icon: Sprout,
  },
  {
    name: "Farm Inputs",
    slug: "farm-inputs",
    description: "Fertilizers, pesticides and other inputs",
    icon: Package,
  },
  {
    name: "Livestock & Poultry",
    slug: "livestock-poultry",
    description: "Livestock, poultry and related products",
    icon: Sprout,
  },
  {
    name: "Irrigation",
    slug: "irrigation",
    description: "Irrigation systems and water equipment",
    icon: Tractor,
  },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const response = await api.get("/products/");

        const data: Product[] = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatPrice = (price: string) => {
    return `GH₵${Number(price).toLocaleString("en-GH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Category IDs from the current Django API:
  // 3 = Agricultural Equipment
  // 6 = Farm Inputs
  const equipmentProducts = products.filter(
    (product) => product.category === 3
  );

  const farmInputProducts = products.filter(
    (product) => product.category === 6
  );

  // Select up to three products from each category.
  const primaryProducts = [
    ...equipmentProducts.slice(0, 3),
    ...farmInputProducts.slice(0, 3),
  ];

  // Fill any remaining spaces with other products.
  const selectedIds = new Set(
    primaryProducts.map((product) => product.id)
  );

  const featuredProducts = [
  ...primaryProducts,
  ...products.filter(
    (product) => !selectedIds.has(product.id)
  ),
];

  return (
    <main className="min-h-screen bg-background">
      {/* ================= HEADER ================= */}
      <SiteHeader />

      {/* ================= HERO ================= */}
      <section className="border-b">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium">
              <Sprout className="h-4 w-4" />
              Ghana's Agricultural Marketplace
            </div>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-6xl">
              Everything agriculture,
              <span className="block">
                all in one marketplace.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Buy and sell farm produce, agricultural equipment,
              seeds, farm inputs, livestock and more from trusted
              sellers across Ghana.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#products"
                className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                Shop Now
              </Link>

              <Link
                href="/seller"
                className="inline-flex items-center justify-center rounded-lg border px-6 py-3 font-semibold transition hover:bg-muted"
              >
                Sell on Agricult
              </Link>
            </div>
          </div>

          {/* Hero feature cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-6">
              <div className="mb-5 inline-flex rounded-lg bg-muted p-3">
                <Truck className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-semibold">
                Reliable Delivery
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Get your agricultural products and equipment
                delivered safely to your location.
              </p>
            </div>

            <div className="rounded-2xl border p-6">
              <div className="mb-5 inline-flex rounded-lg bg-muted p-3">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-semibold">
                Trusted Marketplace
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Connect with buyers and sellers through a
                secure agricultural marketplace.
              </p>
            </div>

            <div className="rounded-2xl border p-6 sm:col-span-2">
              <div className="mb-5 inline-flex rounded-lg bg-muted p-3">
                <Tractor className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-semibold">
                Agricultural Equipment
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Find tractors, irrigation equipment, farm tools,
                harvesting machines, processing equipment and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Shop Agricultural Categories
            </h2>

            <p className="mt-2 text-muted-foreground">
              Find everything you need for farming and agriculture.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.name}
                  href={`/category/${category.slug}`}
                  className="group rounded-2xl border p-6 text-left transition hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
                >
                  <div className="mb-5 inline-flex rounded-lg bg-muted p-3 transition group-hover:bg-black group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-lg font-semibold">
                    {category.name}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section id="products" className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">
                Featured Products
              </h2>

              <p className="mt-2 text-muted-foreground">
                Discover agricultural equipment and farm inputs
                available from our marketplace.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-muted-foreground">
              Loading agricultural products...
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="rounded-2xl border p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />

              <h3 className="mt-4 text-xl font-semibold">
                No products found
              </h3>

              <p className="mt-2 text-muted-foreground">
                Check back later for new agricultural products.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group overflow-hidden rounded-2xl border transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Product Image */}
                  <div className="flex h-56 items-center justify-center bg-muted">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Package className="h-12 w-12" />

                        <span className="text-sm">
                          Agricultural Product
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        {product.condition}
                      </span>

                      {product.stock_quantity > 0 && (
                        <span className="text-xs text-green-600">
                          In stock
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold group-hover:underline">
                      {product.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {product.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xl font-bold">
                        {formatPrice(product.price)}
                      </span>

                      <span className="text-sm text-muted-foreground">
                        {product.stock_quantity} available
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= SELLER CTA ================= */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl border bg-muted p-8 md:p-12">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex rounded-lg bg-background p-3">
                <Store className="h-6 w-6" />
              </div>

              <h2 className="text-3xl font-bold md:text-4xl">
                Have agricultural products or equipment to sell?
              </h2>

              <p className="mt-4 text-muted-foreground">
                Join Agricult and reach customers looking for
                farm produce, machinery, equipment, tools,
                livestock and agricultural supplies.
              </p>

              <Link
                href="/seller"
                className="mt-7 inline-flex items-center rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <Sprout className="h-5 w-5" />
              Agricult
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Ghana's agricultural e-commerce marketplace.
            </p>
          </div>

          <div className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Buy
            </Link>

            <Link href="/seller" className="hover:text-foreground">
              Sell
            </Link>

            <Link href="/cart" className="hover:text-foreground">
              Cart
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
