"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already authenticated on mount
  useEffect(() => {
    fetch("/api/admin/check")
      .then((res) => {
        if (res.ok) setLoggedIn(true);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: { error?: string; success?: boolean } | null = null;
      try {
        data = await res.json();
      } catch {
        // response wasn't JSON
      }

      if (res.ok) {
        setLoggedIn(true);
      } else {
        setError(data?.error || `Login failed (HTTP ${res.status})`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Network error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full p-2.5 bg-surface border border-border rounded-2xl text-foreground placeholder-warm-brown/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-150";

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-warm-brown/50 font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (loggedIn) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-extrabold text-warm-brown">Admin Dashboard</h1>
        <nav className="space-y-3">
          {[
            { href: "/admin/verticals", label: "Manage Verticals" },
            { href: "/admin/answer-pool", label: "Manage Answer Pools" },
            { href: "/admin/puzzles", label: "Manage Puzzles" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block p-4 rounded-2xl bg-surface border border-border text-foreground font-bold hover:bg-peach/30 hover:border-accent/40 transition-colors duration-150 shadow-sm"
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
      <h1 className="text-2xl font-extrabold text-warm-brown mb-6">Admin Login</h1>
      <form
        onSubmit={handleLogin}
        className="space-y-4 p-6 rounded-3xl bg-surface border border-border shadow-sm"
      >
        <div>
          <label className="block text-sm font-bold text-warm-brown/70 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-warm-brown/70 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        {error && (
          <div className="text-error text-sm bg-red-50 border border-red-200 rounded-2xl px-3 py-2 font-semibold">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-2xl text-sm font-bold transition-colors duration-150"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
