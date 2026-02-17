"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Vertical {
  id: string;
  slug: string;
  name: string;
}

interface AnswerPoolItem {
  id: string;
  label: string;
  normalizedLabel: string;
  metadata: Record<string, unknown> | null;
}

export default function AdminAnswerPoolPage() {
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [selectedVertical, setSelectedVertical] = useState<string>("");
  const [items, setItems] = useState<AnswerPoolItem[]>([]);
  const [query, setQuery] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/verticals")
      .then((r) => r.json())
      .then((d) => setVerticals(d.verticals))
      .catch(() => {});
  }, []);

  const loadItems = async () => {
    if (!selectedVertical) return;
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    const res = await fetch(
      `/api/admin/vertical/${selectedVertical}/answer-pool?${params}`
    );
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVertical]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVertical || !newLabel) return;

    await fetch(`/api/admin/vertical/${selectedVertical}/answer-pool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel }),
    });

    setNewLabel("");
    loadItems();
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVertical || !csvFile) return;

    const formData = new FormData();
    formData.append("file", csvFile);

    const res = await fetch(
      `/api/admin/vertical/${selectedVertical}/answer-pool/import`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    setImportResult(`Imported: ${data.imported}, Skipped: ${data.skipped}`);
    setCsvFile(null);
    loadItems();
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Remove this item from the answer pool?")) return;
    setDeletingId(itemId);
    try {
      const res = await fetch(
        `/api/admin/vertical/${selectedVertical}/answer-pool/${itemId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } finally {
      setDeletingId(null);
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
        <h1 className="text-2xl font-extrabold text-warm-brown">Manage Answer Pool</h1>
      </div>

      <select
        value={selectedVertical}
        onChange={(e) => setSelectedVertical(e.target.value)}
        className={inputClass}
      >
        <option value="">Select a vertical...</option>
        {verticals.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>

      {selectedVertical && (
        <>
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3">
            <h2 className="text-lg font-extrabold text-warm-brown">Add Single Item</h2>
            <form onSubmit={handleAddItem} className="flex gap-2">
              <input
                type="text"
                placeholder="Label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                required
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="submit"
                className="bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors duration-150 shadow-sm"
              >
                Add
              </button>
            </form>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3">
            <h2 className="text-lg font-extrabold text-warm-brown">Import CSV</h2>
            <form onSubmit={handleImport} className="flex gap-2 items-end">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                className="flex-1 text-foreground/70 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-peach file:text-warm-brown file:text-sm file:font-bold hover:file:bg-peach/70 file:transition-colors file:duration-150"
              />
              <button
                type="submit"
                disabled={!csvFile}
                className="bg-success hover:bg-green-500 text-white px-4 py-2.5 rounded-2xl text-sm font-bold disabled:opacity-40 transition-colors duration-150 shadow-sm"
              >
                Import
              </button>
            </form>
            {importResult && (
              <div className="text-sm font-bold text-green-700 bg-mint px-3 py-2 rounded-xl">{importResult}</div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search items..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`flex-1 ${inputClass}`}
              />
              <button
                onClick={loadItems}
                className="border border-border text-warm-brown hover:bg-peach/30 px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors duration-150"
              >
                Search
              </button>
            </div>
            {items.length === 0 && (
              <p className="text-warm-brown/50 text-sm font-semibold">No items found.</p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border shadow-sm text-sm"
              >
                <span className="flex-1 font-bold text-foreground">{item.label}</span>
                {item.metadata && (
                  <span className="text-warm-brown/40 text-xs">
                    {JSON.stringify(item.metadata)}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="text-error hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-xl text-xs font-bold transition-colors duration-150 disabled:opacity-40"
                  aria-label={`Remove ${item.label}`}
                >
                  {deletingId === item.id ? "..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
