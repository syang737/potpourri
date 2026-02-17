"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PuzzleView } from "@/components/PuzzleView";
import Link from "next/link";
import { PotMascot } from "@/components/PotMascot";

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

export default function PuzzleByIdPage() {
  const params = useParams();
  const puzzleId = params.id as string;
  const [data, setData] = useState<PuzzleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!puzzleId) return;

    fetch(`/api/puzzle/${puzzleId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Puzzle not found");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [puzzleId]);

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
          <h2 className="text-2xl md:text-3xl font-extrabold text-warm-brown">
            Puzzle not found
          </h2>
          <p className="text-foreground/70 leading-relaxed font-semibold">
            This puzzle may no longer be available.
          </p>
          <Link
            href="/"
            className="inline-block mt-2 bg-accent hover:bg-accent-hover text-white rounded-full px-5 py-2 text-sm font-bold transition-colors duration-150 shadow-sm"
          >
            Play Today&apos;s Puzzle
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
