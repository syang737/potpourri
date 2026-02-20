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

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

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

  const startEditing = (v: Vertical) => {
    setEditingId(v.id);
    setEditName(v.name);
    setEditDescription(v.description ?? "");
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleSave = async (id: string) => {
    setEditError(null);
    setEditSaving(true);

    const res = await fetch(`/api/admin/verticals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        description: editDescription || null,
      }),
    });

    setEditSaving(false);

    if (res.ok) {
      setEditingId(null);
      loadVerticals();
    } else {
      const data = await res.json();
      setEditError(data.error);
    }
  };

  const inputClass =
    "w-full p-2.5 bg-surface border border-border rounded-2xl text-foreground placeholder-warm-brown/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-150";

  const backButtonClass =
    "flex items-center justify-center w-8 h-8 rounded-xl bg-surface border border-border text-warm-brown/50 hover:text-accent hover:bg-peach/30 transition-colors duration-150 shadow-sm";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin" className={backButtonClass} aria-label="Back to dashboard">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-2xl font-extrabold text-warm-brown">Manage Verticals</h1>
      </div>

      <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
        <h2 className="text-lg font-extrabold text-warm-brown mb-4">Create Vertical</h2>
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
            <div className="text-error text-sm font-semibold">{error}</div>
          )}
          <button
            type="submit"
            className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-2xl text-sm font-bold transition-colors duration-150 shadow-sm"
          >
            Create
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-extrabold text-warm-brown">Existing Verticals</h2>
        {verticals.length === 0 ? (
          <p className="text-warm-brown/50 font-semibold">No verticals yet.</p>
        ) : (
          verticals.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-2xl bg-surface border border-border shadow-sm"
            >
              {editingId === v.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-warm-brown/50 mb-1">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-brown/50 mb-1">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className={inputClass}
                    />
                  </div>
                  {editError && (
                    <div className="text-error text-sm font-semibold">{editError}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(v.id)}
                      disabled={editSaving}
                      className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors duration-150"
                    >
                      {editSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="border border-border text-warm-brown hover:bg-peach/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors duration-150"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-foreground">{v.name}</div>
                    <div className="text-sm text-warm-brown/50 font-semibold">Slug: {v.slug}</div>
                    {v.description && (
                      <div className="text-sm text-foreground/70 mt-1">
                        {v.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => startEditing(v)}
                    className="text-xs border border-border text-warm-brown hover:bg-peach/30 px-2.5 py-1 rounded-lg font-bold transition-colors duration-150 flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
