"use client";

import { useEffect, useState } from "react";
import { PuzzleView } from "./PuzzleView";
import Link from "next/link";
import { PotMascot } from "./PotMascot";

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
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const base = verticalSlug
      ? `/api/puzzle/today?vertical=${verticalSlug}`
      : "/api/puzzle/today";
    const url = `${base}${base.includes("?") ? "&" : "?"}tz=${encodeURIComponent(tz)}`;

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
        <div className="text-warm-brown/50 text-lg font-bold animate-pulse">
          Loading puzzle...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-lg mx-auto mt-20 px-6 py-10 rounded-3xl bg-surface border border-border shadow-lg text-center space-y-4">
          <PotMascot size={64} />
          <div className="text-sm font-bold text-accent uppercase tracking-wider">
            Today&apos;s Puzzle
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-warm-brown">
            No puzzle available today
          </h2>
          <p className="text-foreground/70 leading-relaxed font-semibold">
            Check back tomorrow for a new top ten challenge!
          </p>
          <Link
            href="/about"
            className="inline-block mt-2 border border-border text-warm-brown hover:bg-peach/30 rounded-full px-5 py-2 text-sm font-bold transition-colors duration-150"
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
