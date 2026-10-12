"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/client";

interface RegisterResponse {
  id?: number;
  username?: string;
  email?: string;
  phone_number?: string | null;
  role?: string;
}

interface ErrorResponse {
  [key: string]: string | string[] | undefined;
}

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [role, setRole] = useState("CUSTOMER");

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Frontend password validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<RegisterResponse>(
        "/auth/register/",
        {
          username: username.trim(),
          email: email.trim(),
          phone_number: phoneNumber.trim(),
          password,
          password2,
          role,
        }
      );

      console.log("Registration successful:", response.data);

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      // Clear form
      setUsername("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
      setPassword2("");
      setRole("CUSTOMER");

      // Give the user a moment to see the success message
      setTimeout(() => {
        router.push("/login");
      }, 1200);

    } catch (error: any) {
      console.error(
        "Registration failed:",
        error
      );

      const data: ErrorResponse | undefined =
        error.response?.data;

      if (data) {
        // Username error
        if (data.username) {
          const message = Array.isArray(data.username)
            ? data.username[0]
            : data.username;

          setError(`Username: ${message}`);
        }

        // Email error
        else if (data.email) {
          const message = Array.isArray(data.email)
            ? data.email[0]
            : data.email;

          setError(`Email: ${message}`);
        }

        // Phone error
        else if (data.phone_number) {
          const message = Array.isArray(data.phone_number)
            ? data.phone_number[0]
            : data.phone_number;

          setError(`Phone number: ${message}`);
        }

        // Password error
        else if (data.password) {
          const message = Array.isArray(data.password)
            ? data.password[0]
            : data.password;

          setError(`Password: ${message}`);
        }

        // General backend error
        else if (data.detail) {
          const message = Array.isArray(data.detail)
            ? data.detail[0]
            : data.detail;

          setError(message);
        }

        // Non-field errors
        else if (data.non_field_errors) {
          const message = Array.isArray(
            data.non_field_errors
          )
            ? data.non_field_errors[0]
            : data.non_field_errors;

          setError(message);
        }

        else {
          setError(
            "Unable to create your account. Please check your information."
          );
        }
      } else {
        setError(
          "Unable to connect to the server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">

      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="mb-8 text-center">

          <Link
            href="/"
            className="text-3xl font-bold tracking-tight"
          >
            Agricult
          </Link>

          <h1 className="mt-6 text-2xl font-bold">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Join Agricult and start buying or selling
          </p>

        </div>

        {/* Registration Card */}
        <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
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
                  setUsername(event.target.value)
                }
                placeholder="Choose a username"
                required
                autoComplete="username"
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                required
                autoComplete="email"
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone_number"
                className="mb-2 block text-sm font-medium"
              >
                Phone Number
              </label>

              <input
                id="phone_number"
                type="tel"
                value={phoneNumber}
                onChange={(event) =>
                  setPhoneNumber(event.target.value)
                }
                placeholder="e.g. 0241234567"
                required
                autoComplete="tel"
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Account Type */}
            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium"
              >
                Account Type
              </label>

              <select
                id="role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value)
                }
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="CUSTOMER">
                  Customer — Buy products
                </option>

                <option value="SELLER">
                  Seller — Sell products
                </option>
              </select>
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
                    setPassword(event.target.value)
                  }
                  placeholder="Create a password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-lg border bg-background px-3 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
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

              <p className="mt-1 text-xs text-muted-foreground">
                Password must be at least 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="password2"
                className="mb-2 block text-sm font-medium"
              >
                Confirm Password
              </label>

              <div className="relative">

                <input
                  id="password2"
                  type={
                    showPassword2
                      ? "text"
                      : "password"
                  }
                  value={password2}
                  onChange={(event) =>
                    setPassword2(event.target.value)
                  }
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-lg border bg-background px-3 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword2(
                      (current) => !current
                    )
                  }
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword2
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword2 ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </>
              )}
            </button>

          </form>

          {/* Login Link */}
          <div className="mt-6 border-t pt-6 text-center text-sm">

            <span className="text-muted-foreground">
              Already have an account?
            </span>{" "}

            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
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