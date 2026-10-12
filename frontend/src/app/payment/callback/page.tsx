"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShoppingBag,
  Receipt,
  RefreshCw,
} from "lucide-react";

import api from "@/lib/client";

interface Payment {
  id: number;
  order: number;
  order_number: string;
  amount: string;
  payment_method: string;
  status: string;
  transaction_reference: string;
  created_at: string;
  updated_at: string;
}

type PaymentState = "loading" | "success" | "failed";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();

  const reference = searchParams.get("reference");

  const [status, setStatus] =
    useState<PaymentState>("loading");

  const [payment, setPayment] =
    useState<Payment | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isRetrying, setIsRetrying] =
    useState(false);

  const verifyPayment = async () => {
    if (!reference) {
      setStatus("failed");
      setErrorMessage(
        "No Paystack transaction reference was found."
      );
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage("");

      const response = await api.post<Payment>(
        "/payments/verify-reference/",
        {
          reference,
        }
      );

      const verifiedPayment = response.data;

      if (
        verifiedPayment.status ===
        "SUCCESSFUL"
      ) {
        setPayment(verifiedPayment);
        setStatus("success");
        return;
      }

      setStatus("failed");
      setErrorMessage(
        "The payment could not be confirmed."
      );
    } catch (error: any) {
      console.error(
        "Payment verification error:",
        error
      );

      const detail =
        error?.response?.data?.detail;

      setStatus("failed");

      setErrorMessage(
        detail ||
          "We could not verify your payment. Please contact support if money was deducted from your account."
      );
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [reference]);

  const handleRetry = () => {
    setIsRetrying(true);
    verifyPayment();
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-200">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <Loader2 className="h-9 w-9 animate-spin text-green-600" />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Verifying your payment
          </h1>

          <p className="mt-3 text-slate-600">
            Please wait while we confirm your
            Paystack transaction.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Do not close this page.
          </p>

          {reference && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Transaction reference
              </p>

              <p className="mt-1 break-all text-sm font-medium text-slate-700">
                {reference}
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ============================================================
  // SUCCESS
  // ============================================================

  if (
    status === "success" &&
    payment
  ) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-200">

          {/* Success icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
          </div>

          {/* Heading */}
          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Payment Successful!
          </h1>

          <p className="mt-3 text-slate-600">
            Your payment has been successfully
            confirmed. Your order is now being
            processed.
          </p>

          {/* Confirmed badge */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Order Confirmed
          </div>

          {/* Payment information */}
          <div className="mt-8 rounded-xl bg-slate-50 p-5 text-left">

            {/* Order number */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-3">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-slate-400" />

                <span className="text-slate-500">
                  Order number
                </span>
              </div>

              <span className="text-right font-semibold text-slate-900">
                {payment.order_number}
              </span>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-3">
              <span className="text-slate-500">
                Amount paid
              </span>

              <span className="font-semibold text-slate-900">
                {Number(
                  payment.amount
                ).toLocaleString(
                  "en-GH",
                  {
                    style: "currency",
                    currency: "GHS",
                  }
                )}
              </span>
            </div>

            {/* Payment method */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-3">
              <span className="text-slate-500">
                Payment method
              </span>

              <span className="font-semibold text-slate-900">
                {payment.payment_method}
              </span>
            </div>

            {/* Payment status */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-3">
              <span className="text-slate-500">
                Payment status
              </span>

              <span className="font-semibold text-green-600">
                {payment.status}
              </span>
            </div>

            {/* Transaction reference */}
            <div className="pt-4">
              <span className="text-sm text-slate-500">
                Transaction reference
              </span>

              <p className="mt-1 break-all text-sm font-medium text-slate-900">
                {payment.transaction_reference}
              </p>
            </div>
          </div>

          {/* Important message */}
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-left">
            <p className="text-sm text-green-800">
              Your payment has been recorded and
              your order has been confirmed. You
              can view your order details from your
              orders page.
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              <ShoppingBag className="h-5 w-5" />
              Continue Shopping
            </Link>

            <Link
              href="/orders"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              <Receipt className="h-5 w-5" />
              View My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // FAILED
  // ============================================================

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-200">

        {/* Error icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-14 w-14 text-red-600" />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Payment Verification Failed
        </h1>

        <p className="mt-3 text-slate-600">
          {errorMessage}
        </p>

        {/* Reference */}
        {reference && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
            <p className="text-sm text-slate-500">
              Transaction reference
            </p>

            <p className="mt-1 break-all text-sm font-medium text-slate-900">
              {reference}
            </p>
          </div>
        )}

        {/* Warning */}
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-left">
          <p className="text-sm text-red-800">
            If money was deducted from your account,
            please do not make another payment.
            Contact support and provide the
            transaction reference above.
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">

          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-5 w-5 ${
                isRetrying
                  ? "animate-spin"
                  : ""
              }`}
            />

            {isRetrying
              ? "Retrying..."
              : "Retry Verification"}
          </button>

          <Link
            href="/orders"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            <Receipt className="h-5 w-5" />
            View My Orders
          </Link>
        </div>

        <Link
          href="/"
          className="mt-4 block text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-green-600" />

            <p className="mt-4 text-slate-600">
              Loading payment information...
            </p>
          </div>
        </main>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}