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

function getTodayET(): string {
  const now = new Date();
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  return `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, "0")}-${String(et.getDate()).padStart(2, "0")}`;
}

function toDateStr(scheduledFor: string): string {
  const d = new Date(scheduledFor);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default function AdminPuzzlesPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [showPast, setShowPast] = useState(false);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this puzzle? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/puzzles/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPuzzles((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const statusColors: Record<string, string> = {
    PUBLISHED: "bg-mint text-green-700 border-green-300/40",
    DRAFT: "bg-surface-light text-warm-brown/50 border-border",
  };

  const todayET = getTodayET();

  // Categorize puzzles
  // Drafts = anything not published; Upcoming = published + future;
  // Today = published + today; Past = published + past
  const todayPuzzle: Puzzle[] = [];
  const upcoming: Puzzle[] = [];
  const drafts: Puzzle[] = [];
  const past: Puzzle[] = [];

  for (const p of puzzles) {
    if (p.status !== "PUBLISHED") {
      drafts.push(p);
    } else {
      const dateStr = toDateStr(p.scheduledFor);
      if (dateStr === todayET) {
        todayPuzzle.push(p);
      } else if (dateStr > todayET) {
        upcoming.push(p);
      } else {
        past.push(p);
      }
    }
  }

  // Sort upcoming soonest-first, past newest-first
  upcoming.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  past.sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());

  const backButtonClass =
    "flex items-center justify-center w-8 h-8 rounded-xl bg-surface border border-border text-warm-brown/50 hover:text-accent hover:bg-peach/30 transition-colors duration-150 shadow-sm";

  const renderPuzzleCard = (p: Puzzle, style?: "featured" | "muted") => {
    const isFeatured = style === "featured";
    const isMuted = style === "muted";

    return (
      <div
        key={p.id}
        className={`p-4 rounded-2xl border shadow-sm space-y-2 ${
          isFeatured
            ? "bg-surface border-accent/40 shadow-md"
            : isMuted
              ? "bg-surface-light border-border opacity-80"
              : "bg-surface border-border"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className={`font-bold text-foreground ${isFeatured ? "text-lg" : ""}`}>
              {p.topic}
            </span>
            <span className="ml-2 text-sm text-warm-brown/50">
              ({p.vertical.name})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                p.status === "PUBLISHED" ? statusColors.PUBLISHED : statusColors.DRAFT
              }`}
            >
              {p.status === "PUBLISHED" ? "Published" : "Draft"}
            </span>
          </div>
        </div>
        <div className="text-sm text-warm-brown/50 font-semibold">
          Scheduled: {new Date(p.scheduledFor).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
        </div>
        <div className="text-sm text-foreground/70 font-semibold">
          Answers:{" "}
          {p.answers.map((a) => a.answerPoolItem.label).join(", ")}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/admin/puzzles/${p.id}/edit`}
            className="text-xs border border-border text-warm-brown hover:bg-peach/30 px-2.5 py-1 rounded-lg font-bold transition-colors duration-150"
          >
            Edit
          </Link>
          {p.status !== "PUBLISHED" && (
            <button
              onClick={() => handlePublish(p.id)}
              className="text-xs bg-success hover:bg-green-500 text-white px-2.5 py-1 rounded-lg font-bold transition-colors duration-150"
            >
              Publish
            </button>
          )}
          <button
            onClick={() => handleDelete(p.id)}
            className="text-xs border border-red-200/50 text-red-400 hover:bg-red-50 hover:text-red-600 px-2.5 py-1 rounded-lg font-bold transition-colors duration-150"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  const sectionHeader = (title: string, count: number) => (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-extrabold text-warm-brown/50 uppercase tracking-wider">
        {title}
      </h2>
      <span className="text-xs font-bold text-warm-brown/30 bg-warm-brown/5 px-2 py-0.5 rounded-full">
        {count}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );

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

      {puzzles.length === 0 ? (
        <p className="text-warm-brown/50 font-semibold">No puzzles yet.</p>
      ) : (
        <div className="space-y-8">
          {/* Today's Puzzle */}
          {todayPuzzle.length > 0 && (
            <div className="space-y-3">
              {sectionHeader("Today's Puzzle", todayPuzzle.length)}
              {todayPuzzle.map((p) => renderPuzzleCard(p, "featured"))}
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              {sectionHeader("Upcoming", upcoming.length)}
              {upcoming.map((p) => renderPuzzleCard(p))}
            </div>
          )}

          {/* Drafts */}
          {drafts.length > 0 && (
            <div className="space-y-3">
              {sectionHeader("Drafts", drafts.length)}
              {drafts.map((p) => renderPuzzleCard(p, "muted"))}
            </div>
          )}

          {/* Past Puzzles */}
          {past.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowPast((v) => !v)}
                className="flex items-center gap-3 w-full group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-warm-brown/40 transition-transform duration-200 ${showPast ? "rotate-90" : ""}`}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                <h2 className="text-sm font-extrabold text-warm-brown/40 uppercase tracking-wider group-hover:text-warm-brown/60 transition-colors duration-150">
                  Past Puzzles
                </h2>
                <span className="text-xs font-bold text-warm-brown/30 bg-warm-brown/5 px-2 py-0.5 rounded-full">
                  {past.length}
                </span>
                <div className="flex-1 h-px bg-border" />
              </button>
              {showPast && (
                <div className="space-y-3 animate-fade-in">
                  {past.map((p) => renderPuzzleCard(p))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
