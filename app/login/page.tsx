"use client";

import { login } from "@/app/actions";
import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 ">
        <div className="w-full max-w-sm ">
          <div className="flex justify-center mb-2 ">
            <Image
              src="/Icon.svg"
              alt="Logo"
              width={64}
              height={64}
              className="w-16 h-16"
            />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Selamat datang</h1>
            <p className="mt-2 text-sm text-gray-500">
              Masukkan detail akun di bawah untuk masuk
            </p>
          </div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="sr-only">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="text-sm w-full px-4 py-4 bg-gray-100 border-none rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="sr-only">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  className="text-sm w-full px-4 py-4 bg-gray-100 border-none rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                />
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
                className="text-white w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-medium  bg-[#E94B3C] hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Logging in..." : "Sign in"}
              </button>
            </div>

            {state?.error && (
              <div className="text-center text-sm text-red-600 bg-red-50 p-2 rounded">
                {state.error}
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="hidden lg:block w-1/2 bg-white p-4 ">
        <div
          className="w-full h-full rounded-2xl border border-gray-100 "
          style={{
            background:
              "radial-gradient(125% 125% at 50% 10%, #fff 40%, #E94B3C 100%)",
          }}
        />
      </div>
    </div>
  );
}
