"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface PoolItem {
  id: string;
  label: string;
}

interface SelectedAnswer {
  answerPoolItemId: string;
  label: string;
  rank: number;
}

interface PuzzleData {
  id: string;
  topic: string;
  description: string | null;
  scheduledFor: string;
  status: string;
  verticalId: string;
  vertical: { id: string; slug: string; name: string };
  answers: { rank: number; answerPoolItemId: string; answerPoolItem: { label: string } }[];
}

export default function EditPuzzlePage() {
  const router = useRouter();
  const params = useParams();
  const puzzleId = params.id as string;

  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PoolItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load puzzle on mount
  useEffect(() => {
    fetch(`/api/admin/puzzles/${puzzleId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Puzzle not found");
        return r.json();
      })
      .then((data) => {
        const p: PuzzleData = data.puzzle;
        setPuzzle(p);
        setTopic(p.topic);
        setDescription(p.description ?? "");
        setScheduledFor(new Date(p.scheduledFor).toISOString().split("T")[0]);
        setSelectedAnswers(
          p.answers.map((a) => ({
            answerPoolItemId: a.answerPoolItemId,
            label: a.answerPoolItem.label,
            rank: a.rank,
          }))
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [puzzleId]);

  const searchPool = useCallback(async () => {
    if (!puzzle?.verticalId || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(
      `/api/admin/vertical/${puzzle.verticalId}/answer-pool?query=${encodeURIComponent(searchQuery)}`
    );
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.items);
    }
  }, [puzzle?.verticalId, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(searchPool, 300);
    return () => clearTimeout(timer);
  }, [searchPool]);

  const addAnswer = (item: PoolItem) => {
    if (selectedAnswers.length >= 10) return;
    if (selectedAnswers.some((a) => a.answerPoolItemId === item.id)) return;
    setSelectedAnswers((prev) => [
      ...prev,
      { answerPoolItemId: item.id, label: item.label, rank: prev.length + 1 },
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

    setSaving(true);
    const res = await fetch(`/api/admin/puzzles/${puzzleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        description: description || null,
        scheduledFor: new Date(scheduledFor).toISOString(),
        answers: selectedAnswers.map((a) => ({
          answerPoolItemId: a.answerPoolItemId,
          rank: a.rank,
        })),
      }),
    });
    setSaving(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-warm-brown/50 font-bold animate-pulse">Loading puzzle...</div>
      </div>
    );
  }

  if (error && !puzzle) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-error font-semibold bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          {error}
        </div>
        <Link href="/admin/puzzles" className="text-accent font-bold text-sm">
          ← Back to puzzles
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/puzzles" className={backButtonClass} aria-label="Back to puzzles">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-warm-brown">Edit Puzzle</h1>
          <p className="text-sm text-warm-brown/50 font-semibold">{puzzle?.vertical.name}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 p-6 rounded-3xl bg-surface border border-border shadow-sm"
      >
        <div>
          <label className="block text-sm font-bold text-warm-brown/70 mb-1">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
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
          <label className="block text-sm font-bold text-warm-brown/70 mb-1">Scheduled For</label>
          <input
            type="date"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-warm-brown/70">
            Answers ({selectedAnswers.length}/10)
          </label>

          {selectedAnswers.length < 10 && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search answer pool to add..."
                className={inputClass}
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-2xl shadow-lg max-h-40 overflow-y-auto">
                  {searchResults
                    .filter((r) => !selectedAnswers.some((a) => a.answerPoolItemId === r.id))
                    .map((item) => (
                      <li
                        key={item.id}
                        onClick={() => addAnswer(item)}
                        className="px-4 py-2.5 hover:bg-peach cursor-pointer text-sm font-semibold text-foreground transition-colors duration-100"
                      >
                        {item.label}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            {selectedAnswers.map((a, idx) => (
              <div
                key={a.answerPoolItemId}
                className="flex items-center gap-1.5 p-2.5 rounded-2xl bg-surface-light border border-border"
              >
                <span className="w-6 text-center font-extrabold text-warm-brown/40 text-sm">
                  {a.rank}
                </span>
                <span className="flex-1 text-foreground font-semibold text-sm">{a.label}</span>
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

        {error && (
          <div className="text-error text-sm bg-red-50 border border-red-200 rounded-2xl px-3 py-2 font-semibold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-2xl text-sm font-bold transition-colors duration-150 shadow-sm"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
