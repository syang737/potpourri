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
        <h1 className="text-2xl font-semibold text-white">Manage Answer Pool</h1>
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
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h2 className="text-lg font-semibold text-white">
              Add Single Item
            </h2>
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
                className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
              >
                Add
              </button>
            </form>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h2 className="text-lg font-semibold text-white">Import CSV</h2>
            <form onSubmit={handleImport} className="flex gap-2 items-end">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                className="flex-1 text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-gray-200 file:text-sm file:font-medium hover:file:bg-white/20 file:transition-colors file:duration-150"
              />
              <button
                type="submit"
                disabled={!csvFile}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors duration-150"
              >
                Import
              </button>
            </form>
            {importResult && (
              <div className="text-sm text-green-400">{importResult}</div>
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
                className="border border-white/20 text-gray-100 hover:bg-white/10 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
              >
                Search
              </button>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm"
              >
                <span className="font-medium text-gray-100">{item.label}</span>
                {item.metadata && (
                  <span className="text-gray-500 ml-2 text-xs">
                    {JSON.stringify(item.metadata)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
