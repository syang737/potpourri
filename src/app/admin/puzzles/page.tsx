"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Puzzle {
  id: string;
  topic: string;
  status: string;
  scheduledFor: string;
  vertical: { name: string; slug: string };
  answers: { rank: number; answerPoolItem: { label: string } }[];
}

export default function AdminPuzzlesPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);

  useEffect(() => {
    fetch("/api/admin/puzzles")
      .then((r) => r.json())
      .then((d) => setPuzzles(d.puzzles))
      .catch(() => {});
  }, []);

  const handlePublish = async (id: string) => {
    const res = await fetch(`/api/admin/puzzles/${id}/publish`, {
      method: "POST",
    });
    if (res.ok) {
      setPuzzles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "PUBLISHED" } : p))
      );
    }
  };

  const statusColors: Record<string, string> = {
    PUBLISHED: "bg-mint text-green-700 border-green-300/40",
    SCHEDULED: "bg-lemon text-yellow-700 border-yellow-300/40",
    DRAFT: "bg-surface-light text-warm-brown/50 border-border",
    ARCHIVED: "bg-surface-light text-warm-brown/40 border-border",
  };

  const backButtonClass =
    "flex items-center justify-center w-8 h-8 rounded-xl bg-surface border border-border text-warm-brown/50 hover:text-accent hover:bg-peach/30 transition-colors duration-150 shadow-sm";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className={backButtonClass} aria-label="Back to dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-2xl font-extrabold text-warm-brown">Manage Puzzles</h1>
        </div>
        <Link
          href="/admin/puzzles/new"
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-2xl text-sm font-bold transition-colors duration-150 shadow-sm"
        >
          Create Puzzle
        </Link>
      </div>

      <div className="space-y-3">
        {puzzles.length === 0 ? (
          <p className="text-warm-brown/50 font-semibold">No puzzles yet.</p>
        ) : (
          puzzles.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-surface border border-border shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground">{p.topic}</span>
                  <span className="ml-2 text-sm text-warm-brown/50">
                    ({p.vertical.name})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                      statusColors[p.status] ?? statusColors.DRAFT
                    }`}
                  >
                    {p.status}
                  </span>
                  {p.status !== "PUBLISHED" && (
                    <button
                      onClick={() => handlePublish(p.id)}
                      className="text-xs bg-success hover:bg-green-500 text-white px-2.5 py-1 rounded-lg font-bold transition-colors duration-150"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm text-warm-brown/50 font-semibold">
                Scheduled: {new Date(p.scheduledFor).toLocaleDateString()}
              </div>
              <div className="text-sm text-foreground/70 font-semibold">
                Answers:{" "}
                {p.answers.map((a) => a.answerPoolItem.label).join(", ")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
