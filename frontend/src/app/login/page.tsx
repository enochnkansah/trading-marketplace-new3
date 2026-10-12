"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/client";
import { useAuthStore } from "@/lib/store/auth";

interface LoginResponse {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string | null;
  role: string;
  is_verified: boolean;
}

export default function LoginPage() {
  const router = useRouter();

  const setAuth = useAuthStore(
    (state) => state.setAuth
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const loginResponse =
        await api.post<LoginResponse>(
          "/auth/token/",
          {
            username,
            password,
          }
        );

      const {
        access,
        refresh,
      } = loginResponse.data;

      const userResponse =
        await api.get<User>("/auth/me/", {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

      const user = userResponse.data;

      setAuth(
        access,
        refresh,
        user
      );

      // Redirect based on the user's role
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "SELLER") {
        router.push("/seller/dashboard");
      } else {
        router.push("/");
      }

      router.push("/");
    } catch (error: any) {
      console.error(
        "Login failed:",
        error
      );

      if (
        error.response?.data?.detail
      ) {
        setError(
          error.response.data.detail
        );
      } else if (
        error.response?.data
      ) {
        setError(
          "Invalid username or password."
        );
      } else {
        setError(
          "Unable to connect to the server."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-3xl font-bold tracking-tight"
          >
            Trade
            <span className="text-primary">
              Market
            </span>
          </Link>

          <h1 className="mt-6 text-2xl font-bold">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your TradeMarket account
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="h-11 w-full rounded-lg border bg-background px-3 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>

          </form>

          {/* Register */}
          <div className="mt-6 border-t pt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?
            </span>{" "}

            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Create account
            </Link>
          </div>

        </div>

        {/* Back */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to marketplace
          </Link>
        </div>

      </div>

    </main>
  );
}
