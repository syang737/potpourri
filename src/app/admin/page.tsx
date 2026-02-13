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
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
        <nav className="space-y-3">
          {[
            { href: "/admin/verticals", label: "Manage Verticals" },
            { href: "/admin/answer-pool", label: "Manage Answer Pools" },
            { href: "/admin/puzzles", label: "Manage Puzzles" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block p-4 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 hover:border-sky-500/30 transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-6">Admin Login</h1>
      <form
        onSubmit={handleLogin}
        className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10"
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2.5 bg-surface-light border border-border-light rounded-lg text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:outline-none transition-colors duration-150"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2.5 bg-surface-light border border-border-light rounded-lg text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:outline-none transition-colors duration-150"
          />
        </div>
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-sky-500 hover:bg-sky-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
        >
          Login
        </button>
      </form>
    </div>
  );
}
