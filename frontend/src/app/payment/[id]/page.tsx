"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from "lucide-react";

import api from "@/lib/client";

interface Order {
  id: number;
  order_number: string;
  status: string;
  subtotal: string;
  shipping_fee: string;
  discount_amount: string;
  total: string;
  shipping_address: string;
}

interface PaymentResponse {
  id: number;
  order: number;
  order_number: string;
  amount: string;
  payment_method: string;
  status: string;
  transaction_reference: string;
  authorization_url?: string;
  access_code?: string;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("PAYSTACK");

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/orders/${orderId}/`);

        setOrder(response.data);
      } catch (err: any) {
        console.error("Failed to load order:", err);

        if (err?.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (err?.response?.status === 404) {
          setError("Order not found.");
        } else {
          setError("Unable to load order.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handlePayment = async () => {
    if (!order) return;

    try {
      setPaying(true);
      setError("");

      const response = await api.post("/payments/initiate/", {
        order: order.id,
        payment_method: paymentMethod,
      });

      const payment: PaymentResponse = response.data;

      if (payment.authorization_url) {
        window.location.href = payment.authorization_url;
        return;
      }

      setError("Payment authorization URL was not returned.");
    } catch (err: any) {
      console.error("Payment initialization failed:", err);

      const detail =
        err?.response?.data?.detail ||
        "Unable to initialize payment. Please try again.";

      setError(detail);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/cart"
            className="mb-10 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cart
          </Link>

          <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/checkout"
          className="mb-10 inline-flex items-center gap-2 text-sm hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to checkout
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">
            Complete Payment
          </h1>

          <p className="mt-2 text-gray-600">
            Complete your payment to confirm your order.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order summary */}
          <section className="rounded-2xl border p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-3">
                <CreditCard className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold">Order Summary</h2>
                <p className="text-sm text-gray-600">
                  {order.order_number}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>
                  ₵{Number(order.subtotal).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>
                  ₵{Number(order.shipping_fee).toLocaleString()}
                </span>
              </div>

              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>
                    -₵{Number(order.discount_amount).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>
                    ₵{Number(order.total).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-semibold">Delivery Address</p>
              <p className="mt-1 text-sm text-gray-600">
                {order.shipping_address}
              </p>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-3">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold">Payment Method</h2>
                <p className="text-sm text-gray-600">
                  Secure payment powered by Paystack.
                </p>
              </div>
            </div>

            <div className="rounded-xl border-2 border-black p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="payment_method"
                  value="PAYSTACK"
                  checked={paymentMethod === "PAYSTACK"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />

                <div>
                  <p className="font-semibold">Paystack</p>
                  <p className="text-sm text-gray-600">
                    Pay securely with card, mobile money, or other supported
                    methods.
                  </p>
                </div>
              </label>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={paying}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Initializing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pay ₵{Number(order.total).toLocaleString()}
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-gray-500">
              You will be redirected to Paystack to complete your payment.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}