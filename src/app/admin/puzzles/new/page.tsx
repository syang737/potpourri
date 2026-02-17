"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  const inputClass =
    "w-full p-2.5 bg-surface-light border border-border-light rounded-lg text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:outline-none transition-colors duration-150";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/puzzles"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-150"
          aria-label="Back to puzzles"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-2xl font-semibold text-white">Create Puzzle</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 p-6 rounded-2xl bg-white/5 border border-white/10"
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Vertical
          </label>
          <select
            value={verticalId}
            onChange={(e) => {
              setVerticalId(e.target.value);
              setSelectedAnswers([]);
            }}
            required
            className={inputClass}
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
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="e.g., Top 10 countries by land area"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Admin notes / source"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Scheduled For
          </label>
          <input
            type="date"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {verticalId && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Answers ({selectedAnswers.length}/10)
            </label>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search answer pool..."
                className={inputClass}
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-surface-light border border-border-light rounded-lg shadow-2xl max-h-40 overflow-y-auto">
                  {searchResults.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => addAnswer(item)}
                      className="px-4 py-2.5 hover:bg-sky-500/15 cursor-pointer text-sm text-gray-200 transition-colors duration-100"
                    >
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              {selectedAnswers.map((a, idx) => (
                <div
                  key={a.answerPoolItemId}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10"
                >
                  <span className="w-6 text-center font-bold text-gray-500 text-sm">
                    {a.rank}
                  </span>
                  <span className="flex-1 text-gray-200 text-sm">
                    {a.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAnswer(idx)}
                    className="text-red-400 hover:text-red-300 text-xs transition-colors duration-150"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-sky-500 hover:bg-sky-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
        >
          Create Puzzle
        </button>
      </form>
    </div>
  );
}
