"use client";

import { useEffect, useState } from "react";
import { PuzzleView } from "./PuzzleView";

interface PuzzleResponse {
  puzzle: { id: string; topic: string; scheduledFor: string };
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
        <div className="text-gray-500 text-lg">Loading puzzle...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-gray-400 text-6xl">?</div>
          <div className="text-gray-600 text-lg">
            No puzzle available today. Check back later!
          </div>
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
