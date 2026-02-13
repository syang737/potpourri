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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Puzzles</h1>
        <Link
          href="/admin/puzzles/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Puzzle
        </Link>
      </div>

      <div className="space-y-3">
        {puzzles.length === 0 ? (
          <p className="text-gray-500">No puzzles yet.</p>
        ) : (
          puzzles.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-lg border space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{p.topic}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({p.vertical.name})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      p.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : p.status === "SCHEDULED"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {p.status}
                  </span>
                  {p.status !== "PUBLISHED" && (
                    <button
                      onClick={() => handlePublish(p.id)}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Scheduled: {new Date(p.scheduledFor).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">
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
