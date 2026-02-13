"use client";

import { useState, useEffect } from "react";

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Manage Answer Pool</h1>

      <select
        value={selectedVertical}
        onChange={(e) => setSelectedVertical(e.target.value)}
        className="w-full p-2 border rounded"
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
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <h2 className="text-lg font-semibold">Add Single Item</h2>
            <form onSubmit={handleAddItem} className="flex gap-2">
              <input
                type="text"
                placeholder="Label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                required
                className="flex-1 p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add
              </button>
            </form>
          </div>

          <div className="bg-white p-4 rounded-lg border space-y-3">
            <h2 className="text-lg font-semibold">Import CSV</h2>
            <form onSubmit={handleImport} className="flex gap-2 items-end">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                className="flex-1"
              />
              <button
                type="submit"
                disabled={!csvFile}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Import
              </button>
            </form>
            {importResult && (
              <div className="text-sm text-green-700">{importResult}</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search items..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={loadItems}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                Search
              </button>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3 rounded border text-sm"
              >
                <span className="font-medium">{item.label}</span>
                {item.metadata && (
                  <span className="text-gray-500 ml-2">
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
