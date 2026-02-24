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
  const [source, setSource] = useState("");
  const [scheduledFor, setScheduledFor] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PoolItem[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/verticals")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load verticals");
        return r.json();
      })
      .then((d) => setVerticals(d.verticals ?? []))
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
      setHighlightIndex(0);
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
    setHighlightIndex(0);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults[highlightIndex]) {
        addAnswer(searchResults[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setSearchResults([]);
    }
  };

  const removeAnswer = (idx: number) => {
    setSelectedAnswers((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((a, i) => ({ ...a, rank: i + 1 }));
    });
  };

  const moveAnswer = (idx: number, direction: "up" | "down") => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
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
        source: source || null,
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
    "w-full p-2.5 bg-surface border border-border rounded-2xl text-foreground placeholder-warm-brown/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-150";

  const backButtonClass =
    "flex items-center justify-center w-8 h-8 rounded-xl bg-surface border border-border text-warm-brown/50 hover:text-accent hover:bg-peach/30 transition-colors duration-150 shadow-sm";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/puzzles" className={backButtonClass} aria-label="Back to puzzles">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-2xl font-extrabold text-warm-brown">Create Puzzle</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 p-6 rounded-3xl bg-surface border border-border shadow-sm"
      >
        <div>
          <label className="block text-sm font-bold text-warm-brown/70 mb-1">
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
          <label className="block text-sm font-bold text-warm-brown/70 mb-1">
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
          <label className="block text-sm font-bold text-warm-brown/70 mb-1">
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
          <label className="block text-sm font-bold text-warm-brown/70 mb-1">
            Source URL (optional)
          </label>
          <input
            type="url"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="https://example.com/source"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-warm-brown/70 mb-1">
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
            <label className="block text-sm font-bold text-warm-brown/70">
              Answers ({selectedAnswers.length}/10)
            </label>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search answer pool..."
                className={inputClass}
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-2xl shadow-lg max-h-40 overflow-y-auto">
                  {searchResults.map((item, idx) => (
                    <li
                      key={item.id}
                      onClick={() => addAnswer(item)}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      className={`px-4 py-2.5 cursor-pointer text-sm font-semibold transition-colors duration-100 ${
                        idx === highlightIndex
                          ? "bg-peach text-accent"
                          : "text-foreground hover:bg-peach"
                      }`}
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
                  className="flex items-center gap-1.5 p-2.5 rounded-2xl bg-surface-light border border-border"
                >
                  <span className="w-6 text-center font-extrabold text-warm-brown/40 text-sm">
                    {a.rank}
                  </span>
                  <span className="flex-1 text-foreground font-semibold text-sm">
                    {a.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveAnswer(idx, "up")}
                    disabled={idx === 0}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-warm-brown/40 hover:text-accent hover:bg-peach/30 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-warm-brown/40 transition-colors duration-150"
                    aria-label="Move up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveAnswer(idx, "down")}
                    disabled={idx === selectedAnswers.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-warm-brown/40 hover:text-accent hover:bg-peach/30 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-warm-brown/40 transition-colors duration-150"
                    aria-label="Move down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAnswer(idx)}
                    className="text-error hover:text-red-600 text-xs font-bold transition-colors duration-150 ml-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-error text-sm bg-red-50 border border-red-200 rounded-2xl px-3 py-2 font-semibold">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-accent hover:bg-accent-hover text-white py-2.5 rounded-2xl text-sm font-bold transition-colors duration-150 shadow-sm"
        >
          Create Puzzle
        </button>
      </form>
    </div>
  );
}
