"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PASSWORD = "ReNeW2026";
const AUTH_COOKIE = "renew_auth";
const AUTH_VALUE = "ReNeW2026_approved";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password === PASSWORD) {
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `${AUTH_COOKIE}=${AUTH_VALUE}; path=/; max-age=${maxAge}; SameSite=Lax`;
      router.push(from);
      router.refresh();
    } else {
      setError("Incorrect password. Try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Access Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoFocus
          required
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {isLoading ? "Verifying..." : "Enter Platform"}
      </button>

      <p className="text-xs text-gray-400 text-center pt-2">
        This platform is protected. Contact your Super Admin if you don't have access.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-10 text-center">
          <h1 className="text-4xl font-bold text-white">ReNew</h1>
          <p className="text-blue-100 text-sm mt-2 font-semibold">D&S Platform</p>
          <p className="text-blue-200 text-xs mt-3">Shop Soiled Inventory Management</p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}