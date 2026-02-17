"use client";

import { useEffect, useState } from "react";
import { PuzzleView } from "./PuzzleView";
import Link from "next/link";

interface PuzzleResponse {
  puzzle: { id: string; topic: string; description?: string | null; scheduledFor: string };
  vertical: { id: string; slug: string; name: string };
  sessionState: {
    numCorrect: number;
    numGuesses: number;
    completed: boolean;
    revealedAnswers: {
      rank: number;
      answerPoolItemId: string;
      label: string | null;
      revealed: boolean;
    }[];
  };
}

export function GamePage({ verticalSlug }: { verticalSlug?: string }) {
  const [data, setData] = useState<PuzzleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = verticalSlug
      ? `/api/puzzle/today?vertical=${verticalSlug}`
      : "/api/puzzle/today";

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("No puzzle available");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [verticalSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-lg animate-pulse">
          Loading puzzle...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-lg mx-auto mt-20 px-6 py-10 rounded-2xl bg-white/5 border border-white/10 shadow-xl text-center space-y-4">
          <div className="text-sm font-medium text-sky-400 uppercase tracking-wider">
            Today&apos;s Puzzle
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            No puzzle available today
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Check back tomorrow for a new top ten challenge.
          </p>
          <Link
            href="/about"
            className="inline-block mt-2 border border-white/20 text-gray-100 hover:bg-white/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150"
          >
            Learn how it works
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PuzzleView
      puzzle={data.puzzle}
      vertical={data.vertical}
      sessionState={data.sessionState}
    />
  );
}
