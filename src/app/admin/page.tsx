"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      setLoggedIn(true);
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
    }
  };

  if (loggedIn) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <nav className="space-y-2">
          <Link
            href="/admin/verticals"
            className="block p-4 bg-white rounded-lg border hover:border-blue-500 transition-colors"
          >
            Manage Verticals
          </Link>
          <Link
            href="/admin/answer-pool"
            className="block p-4 bg-white rounded-lg border hover:border-blue-500 transition-colors"
          >
            Manage Answer Pools
          </Link>
          <Link
            href="/admin/puzzles"
            className="block p-4 bg-white rounded-lg border hover:border-blue-500 transition-colors"
          >
            Manage Puzzles
          </Link>
        </nav>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded-lg"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
