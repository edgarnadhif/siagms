"use client";

import { login } from "@/app/actions";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(login, null);

  useEffect(() => {
    if (state?.error) {
      setPassword("");
      setShowPassword(false);
    }
  }, [state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      event.preventDefault();
      setClientError("Email and password are required");
      setPassword("");
      setShowPassword(false);
      return;
    }

    setClientError(null);
  }

  const errorMessage = clientError || state?.error || null;
  const passwordErrorMessage = errorMessage
    ? errorMessage === "Invalid credentials"
      ? "Kata sandi yang Anda masukkan salah."
      : errorMessage === "Email and password are required"
        ? "Email dan kata sandi wajib diisi."
        : errorMessage
    : null;

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 ">
        <div className="w-full max-w-sm ">
          <div className="mb-8 flex items-center justify-center gap-4">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={72}
                height={72}
                className="h-14 w-14"
              />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-gray-900">Selamat datang</h1>
              <p className="mt-2 text-sm text-gray-500">
                Masukkan detail akun di bawah untuk masuk
              </p>
            </div>
          </div>

          <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="sr-only">Email</label>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (clientError) setClientError(null);
                  }}
                  className="text-sm w-full px-4 py-4 bg-gray-100 border-none rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="sr-only">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (clientError) setClientError(null);
                    }}
                    aria-invalid={Boolean(passwordErrorMessage)}
                    className={`text-sm w-full px-4 py-4 pr-12 bg-gray-100 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                      passwordErrorMessage
                        ? "border border-red-500 focus:ring-red-200"
                        : "border-none focus:ring-blue-500"
                    }`}
                    placeholder="Password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-r-2xl"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.584 10.587a2 2 0 1 0 2.829 2.829" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 4.24A10.45 10.45 0 0 1 12 4c5.185 0 9.45 3.537 10.543 8.313a10.742 10.742 0 0 1-4.076 5.335M6.228 6.228A10.742 10.742 0 0 0 1.457 12.313 10.713 10.713 0 0 0 6.75 18.75" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1 1 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178a1 1 0 0 1 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrorMessage && (
                  <p className="mt-2 text-sm text-red-600">
                    {passwordErrorMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded "
                />
                <label
                  htmlFor="remember-me"
                  className="ml-3 block text-gray-500 "
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-500 hover:text-blue-600"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="text-white w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-medium bg-[#FF3600] hover:bg-[#D92E00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF3600] disabled:opacity-50 transition-colors"
              >
                {isPending ? "Logging in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden lg:block w-1/2 bg-white p-4 ">
        <div className="relative w-full h-full overflow-hidden rounded-2xl border border-gray-100">
          <Image
            src="/Colour%20Swatch.svg"
            alt="Colour Swatch"
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
