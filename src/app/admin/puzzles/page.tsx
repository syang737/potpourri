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
    PUBLISHED: "bg-green-500/15 text-green-400 border-green-500/20",
    SCHEDULED: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    DRAFT: "bg-white/10 text-gray-400 border-white/10",
    ARCHIVED: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Manage Puzzles</h1>
        <Link
          href="/admin/puzzles/new"
          className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
        >
          Create Puzzle
        </Link>
      </div>

      <div className="space-y-3">
        {puzzles.length === 0 ? (
          <p className="text-gray-400">No puzzles yet.</p>
        ) : (
          puzzles.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-100">{p.topic}</span>
                  <span className="ml-2 text-sm text-gray-400">
                    ({p.vertical.name})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-md border ${
                      statusColors[p.status] ?? statusColors.DRAFT
                    }`}
                  >
                    {p.status}
                  </span>
                  {p.status !== "PUBLISHED" && (
                    <button
                      onClick={() => handlePublish(p.id)}
                      className="text-xs bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded-md transition-colors duration-150"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Scheduled: {new Date(p.scheduledFor).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-300">
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
