"use client";

import { useState, useEffect } from "react";

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Manage Verticals</h1>

      <div className="bg-white p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Create Vertical</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            placeholder="Slug (e.g., movies_tv)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create
          </button>
        </form>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Existing Verticals</h2>
        {verticals.length === 0 ? (
          <p className="text-gray-500">No verticals yet.</p>
        ) : (
          verticals.map((v) => (
            <div key={v.id} className="bg-white p-4 rounded-lg border">
              <div className="font-medium">{v.name}</div>
              <div className="text-sm text-gray-500">Slug: {v.slug}</div>
              {v.description && (
                <div className="text-sm text-gray-600 mt-1">
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
