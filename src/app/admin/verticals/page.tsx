"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Vertical {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export default function AdminVerticalsPage() {
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadVerticals = async () => {
    const res = await fetch("/api/admin/verticals");
    if (res.ok) {
      const data = await res.json();
      setVerticals(data.verticals);
    }
  };

  useEffect(() => {
    loadVerticals();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/admin/verticals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name, description: description || null }),
    });

    if (res.ok) {
      setSlug("");
      setName("");
      setDescription("");
      loadVerticals();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  };

  const inputClass =
    "w-full p-2.5 bg-surface-light border border-border-light rounded-lg text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:outline-none transition-colors duration-150";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-150"
          aria-label="Back to dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-2xl font-semibold text-white">Manage Verticals</h1>
      </div>

      <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">
          Create Vertical
        </h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            placeholder="Slug (e.g., movies_tv)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          <button
            type="submit"
            className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
          >
            Create
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">
          Existing Verticals
        </h2>
        {verticals.length === 0 ? (
          <p className="text-gray-400">No verticals yet.</p>
        ) : (
          verticals.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="font-medium text-gray-100">{v.name}</div>
              <div className="text-sm text-gray-400">Slug: {v.slug}</div>
              {v.description && (
                <div className="text-sm text-gray-300 mt-1">
                  {v.description}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
