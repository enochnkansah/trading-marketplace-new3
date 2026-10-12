"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  TicketPercent,
  Loader2,
  CreditCard,
} from "lucide-react";

import api from "@/lib/client";

interface Order {
  id: number;
  order_number: string;
  status: string;
  subtotal: string | number;
  shipping_fee: string | number;
  discount_amount: string | number;
  total: string | number;
  shipping_address: string;
}

interface PaymentResponse {
  id: number;
  amount: string | number;
  payment_method: string;
  status: string;
  transaction_reference: string;
  authorization_url?: string;
  access_code?: string;
}

export default function CheckoutPage() {
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingFee, setShippingFee] = useState("0.00");
  const [couponCode, setCouponCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formatCurrency = (value: string | number) => {
    return Number(value || 0).toLocaleString("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getApiErrorMessage = (error: any) => {
    if (error?.response?.data?.detail) {
      return error.response.data.detail;
    }

    if (error?.response?.data) {
      const data = error.response.data;

      if (typeof data === "string") {
        return data;
      }

      const firstError = Object.values(data)[0];

      if (Array.isArray(firstError)) {
        return String(firstError[0]);
      }

      if (firstError) {
        return String(firstError);
      }
    }

    if (error?.message) {
      return error.message;
    }

    return "Something went wrong. Please try again.";
  };

  const handleCheckout = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!shippingAddress.trim()) {
      setError("Please enter your shipping address.");
      return;
    }

    const parsedShippingFee = Number(shippingFee || 0);

    if (Number.isNaN(parsedShippingFee) || parsedShippingFee < 0) {
      setError("Please enter a valid shipping fee.");
      return;
    }

    setLoading(true);

    try {
      // ---------------------------------------------------------
      // STEP 1: CREATE ORDER
      // ---------------------------------------------------------

      const checkoutResponse = await api.post<Order>(
        "/orders/checkout/",
        {
          shipping_address: shippingAddress.trim(),
          shipping_fee: parsedShippingFee.toFixed(2),
          coupon_code: couponCode.trim(),
        }
      );

      const order = checkoutResponse.data;

      console.log("Order created:", order);

      setSuccess(
        `Order ${order.order_number} created. Redirecting to payment...`
      );

      // ---------------------------------------------------------
      // STEP 2: INITIALIZE PAYSTACK PAYMENT
      // ---------------------------------------------------------

      const paymentResponse = await api.post<PaymentResponse>(
        "/payments/initiate/",
        {
          order: order.id,
          payment_method: "PAYSTACK",
        }
      );

      const payment = paymentResponse.data;

      console.log("Payment initialized:", payment);

      // ---------------------------------------------------------
      // STEP 3: REDIRECT TO PAYSTACK
      // ---------------------------------------------------------

      if (!payment.authorization_url) {
        throw new Error(
          "Paystack did not return a payment authorization URL."
        );
      }

      window.location.href = payment.authorization_url;
    } catch (error: any) {
      console.error("Checkout/payment failed:", error);

      if (error.response?.status === 401) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else {
        setError(getApiErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

          <Link
            href="/"
            className="text-2xl font-bold tracking-tight"
          >
            TradeMarket
          </Link>

          <Link
            href="/cart"
            className="text-sm font-medium hover:underline"
          >
            Cart
          </Link>

        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-6xl px-6 py-10">

        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">
            Checkout
          </h1>

          <p className="mt-2 text-muted-foreground">
            Complete your order by providing your delivery details.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* Checkout Form */}
          <form
            onSubmit={handleCheckout}
            className="space-y-6"
          >

            {/* Delivery Address */}
            <section className="rounded-2xl border p-6">

              <div className="mb-6 flex items-center gap-3">

                <div className="rounded-lg bg-muted p-2">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    Delivery Address
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Where should we deliver your order?
                  </p>
                </div>

              </div>

              <label
                htmlFor="shippingAddress"
                className="mb-2 block text-sm font-medium"
              >
                Shipping Address
              </label>

              <textarea
                id="shippingAddress"
                value={shippingAddress}
                onChange={(event) =>
                  setShippingAddress(event.target.value)
                }
                placeholder="Example: Accra, Ghana"
                rows={5}
                required
                className="w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:border-primary"
              />

            </section>

            {/* Delivery */}
            <section className="rounded-2xl border p-6">

              <div className="mb-6 flex items-center gap-3">

                <div className="rounded-lg bg-muted p-2">
                  <Truck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    Delivery
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Enter your delivery fee.
                  </p>
                </div>

              </div>

              <label
                htmlFor="shippingFee"
                className="mb-2 block text-sm font-medium"
              >
                Shipping Fee
              </label>

              <input
                id="shippingFee"
                type="number"
                min="0"
                step="0.01"
                value={shippingFee}
                onChange={(event) =>
                  setShippingFee(event.target.value)
                }
                className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-primary"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Enter the delivery fee in Ghana cedis.
              </p>

            </section>

            {/* Coupon */}
            <section className="rounded-2xl border p-6">

              <div className="mb-6 flex items-center gap-3">

                <div className="rounded-lg bg-muted p-2">
                  <TicketPercent className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    Discount Coupon
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Apply a coupon to your order.
                  </p>
                </div>

              </div>

              <label
                htmlFor="couponCode"
                className="mb-2 block text-sm font-medium"
              >
                Coupon Code
              </label>

              <input
                id="couponCode"
                type="text"
                value={couponCode}
                onChange={(event) =>
                  setCouponCode(
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="Example: SELLER10"
                className="w-full rounded-lg border bg-background px-4 py-3 uppercase outline-none focus:border-primary"
              />

            </section>

            {/* Payment Information */}
            <section className="rounded-2xl border p-6">

              <div className="flex items-start gap-4">

                <div className="rounded-lg bg-muted p-2">
                  <CreditCard className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    Payment
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    You will be securely redirected to Paystack
                    to complete your payment.
                  </p>
                </div>

              </div>

            </section>

            {/* Place Order */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  Place Order & Pay
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

          </form>

          {/* Order Summary */}
          <aside className="h-fit rounded-2xl border p-6 lg:sticky lg:top-6">

            <h2 className="text-xl font-bold">
              Order Summary
            </h2>

            <div className="mt-6 space-y-5">

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Cart
                </span>

                <Link
                  href="/cart"
                  className="font-medium hover:underline"
                >
                  View cart
                </Link>
              </div>

              <div className="border-t pt-5">

                <div className="flex justify-between text-sm">

                  <span className="text-muted-foreground">
                    Shipping
                  </span>

                  <span className="font-medium">
                    {formatCurrency(shippingFee)}
                  </span>

                </div>

              </div>

              <div className="border-t pt-5">

                <div className="flex justify-between">

                  <span className="font-semibold">
                    Payment
                  </span>

                  <span className="text-sm text-muted-foreground">
                    Paystack
                  </span>

                </div>

              </div>

            </div>

            <Link
              href="/cart"
              className="mt-6 flex w-full items-center justify-center rounded-lg border px-5 py-3 font-medium hover:bg-muted"
            >
              Return to Cart
            </Link>

          </aside>

        </div>

      </section>
    </main>
  );
}