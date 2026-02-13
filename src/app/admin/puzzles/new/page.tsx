"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Vertical {
  id: string;
  slug: string;
  name: string;
}

interface PoolItem {
  id: string;
  label: string;
}

interface SelectedAnswer {
  answerPoolItemId: string;
  label: string;
  rank: number;
}

export default function CreatePuzzlePage() {
  const router = useRouter();
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [verticalId, setVerticalId] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PoolItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/verticals")
      .then((r) => r.json())
      .then((d) => setVerticals(d.verticals))
      .catch(() => {});
  }, []);

  const searchPool = useCallback(async () => {
    if (!verticalId || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(
      `/api/admin/vertical/${verticalId}/answer-pool?query=${encodeURIComponent(searchQuery)}`
    );
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.items);
    }
  }, [verticalId, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(searchPool, 300);
    return () => clearTimeout(timer);
  }, [searchPool]);

  const addAnswer = (item: PoolItem) => {
    if (selectedAnswers.length >= 10) return;
    if (selectedAnswers.some((a) => a.answerPoolItemId === item.id)) return;

    setSelectedAnswers((prev) => [
      ...prev,
      {
        answerPoolItemId: item.id,
        label: item.label,
        rank: prev.length + 1,
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeAnswer = (idx: number) => {
    setSelectedAnswers((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((a, i) => ({ ...a, rank: i + 1 }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedAnswers.length !== 10) {
      setError("Exactly 10 answers are required");
      return;
    }

    const res = await fetch("/api/admin/puzzles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verticalId,
        topic,
        description: description || null,
        scheduledFor: new Date(scheduledFor).toISOString(),
        status: "SCHEDULED",
        answers: selectedAnswers.map((a) => ({
          answerPoolItemId: a.answerPoolItemId,
          rank: a.rank,
        })),
      }),
    });

    if (res.ok) {
      router.push("/admin/puzzles");
    } else {
      const data = await res.json();
      setError(data.error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create Puzzle</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Vertical</label>
          <select
            value={verticalId}
            onChange={(e) => {
              setVerticalId(e.target.value);
              setSelectedAnswers([]);
            }}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select vertical...</option>
            {verticals.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="e.g., Top 10 countries by land area"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Admin notes / source"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Scheduled For
          </label>
          <input
            type="date"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {verticalId && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Answers ({selectedAnswers.length}/10)
            </label>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search answer pool..."
                className="w-full p-2 border rounded"
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                  {searchResults.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => addAnswer(item)}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                    >
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1">
              {selectedAnswers.map((a, idx) => (
                <div
                  key={a.answerPoolItemId}
                  className="flex items-center gap-2 bg-white p-2 rounded border"
                >
                  <span className="w-6 text-center font-bold text-gray-500">
                    {a.rank}
                  </span>
                  <span className="flex-1">{a.label}</span>
                  <button
                    type="button"
                    onClick={() => removeAnswer(idx)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Create Puzzle
        </button>
      </form>
    </div>
  );
}
