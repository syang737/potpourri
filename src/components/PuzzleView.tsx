"use client";

import { useState, useEffect, useCallback } from "react";
import { VerticalBadge } from "./VerticalBadge";
import { GuessInputDropdown } from "./GuessInputDropdown";
import { AnswerList, RevealedAnswer } from "./AnswerList";
import { StatsModal } from "./StatsModal";

interface PuzzleData {
  id: string;
  topic: string;
}

interface VerticalData {
  id: string;
  slug: string;
  name: string;
}

interface SessionState {
  numCorrect: number;
  numGuesses: number;
  completed: boolean;
  revealedAnswers: RevealedAnswer[];
}

interface AnswerOption {
  id: string;
  label: string;
  normalizedLabel: string;
}

const SMALL_POOL_VERTICALS = ["countries", "languages"];

export function PuzzleView({
  puzzle: initialPuzzle,
  vertical: initialVertical,
  sessionState: initialState,
}: {
  puzzle: PuzzleData;
  vertical: VerticalData;
  sessionState: SessionState;
}) {
  const [puzzle] = useState(initialPuzzle);
  const [vertical] = useState(initialVertical);
  const [numCorrect, setNumCorrect] = useState(initialState.numCorrect);
  const [numGuesses, setNumGuesses] = useState(initialState.numGuesses);
  const [completed, setCompleted] = useState(initialState.completed);
  const [answers, setAnswers] = useState<RevealedAnswer[]>(
    initialState.revealedAnswers
  );
  const [lastCorrectId, setLastCorrectId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Pool for small verticals
  const [clientPool, setClientPool] = useState<AnswerOption[] | undefined>();
  const isSmallPool = SMALL_POOL_VERTICALS.includes(vertical.slug);

  const guessedIds = new Set(
    answers.filter((a) => a.revealed).map((a) => a.answerPoolItemId)
  );

  useEffect(() => {
    if (isSmallPool) {
      fetch(`/api/vertical/${vertical.slug}/pool`)
        .then((res) => res.json())
        .then((data) => setClientPool(data.items))
        .catch(() => {});
    }
  }, [vertical.slug, isSmallPool]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/puzzle/${puzzle.id}/stats`);
      const data = await res.json();
      setPercentile(data.percentile);
    } catch {
      /* ignore */
    }
  }, [puzzle.id]);

  useEffect(() => {
    if (completed) {
      fetchStats();
    }
  }, [completed, fetchStats]);

  const handleGuess = async (answerPoolItemId: string) => {
    try {
      const res = await fetch(`/api/puzzle/${puzzle.id}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerPoolItemId }),
      });

      if (!res.ok) {
        const err = await res.json();
        setFeedback(err.error || "Error submitting guess");
        setTimeout(() => setFeedback(null), 2000);
        return;
      }

      const data = await res.json();
      setNumCorrect(data.numCorrect);
      setNumGuesses(data.numGuesses);
      setAnswers(data.revealedAnswers);

      if (data.isCorrect) {
        setLastCorrectId(answerPoolItemId);
        setFeedback(`Correct! #${data.rank}: ${data.label}`);
        setTimeout(() => {
          setFeedback(null);
          setLastCorrectId(null);
        }, 1500);
      } else {
        setFeedback("Incorrect, try again!");
        setTimeout(() => setFeedback(null), 1500);
      }

      if (data.puzzleComplete) {
        setCompleted(true);
        setTimeout(() => setShowStats(true), 1000);
      }
    } catch {
      setFeedback("Network error");
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const handleReveal = async () => {
    try {
      const res = await fetch(`/api/puzzle/${puzzle.id}/reveal`, {
        method: "POST",
      });
      const data = await res.json();
      setCompleted(true);
      setAnswers(
        data.answers.map((a: { rank: number; answerPoolItemId: string; label: string }) => ({
          ...a,
          revealed: true,
        }))
      );
      setTimeout(() => setShowStats(true), 500);
    } catch {
      setFeedback("Error revealing answers");
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <VerticalBadge slug={vertical.slug} name={vertical.name} />
        <h2 className="text-2xl font-bold text-gray-900">{puzzle.topic}</h2>
        <div className="text-sm text-gray-500">
          {numCorrect}/10 correct &middot; {numGuesses} guess
          {numGuesses !== 1 ? "es" : ""}
        </div>
      </div>

      {!completed && (
        <GuessInputDropdown
          verticalSlug={vertical.slug}
          dataSource={isSmallPool ? "client" : "server"}
          clientOptions={clientPool}
          onSubmitGuess={handleGuess}
          disabled={completed}
          guessedIds={guessedIds}
        />
      )}

      {feedback && (
        <div
          className={`text-center py-2 px-4 rounded-lg font-medium ${
            feedback.startsWith("Correct")
              ? "bg-green-100 text-green-800"
              : feedback.startsWith("Incorrect")
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {feedback}
        </div>
      )}

      <AnswerList answers={answers} lastCorrectId={lastCorrectId} />

      {!completed && (
        <button
          onClick={handleReveal}
          className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
        >
          Reveal Answers
        </button>
      )}

      {completed && !showStats && (
        <button
          onClick={() => setShowStats(true)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Results
        </button>
      )}

      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        numCorrect={numCorrect}
        numGuesses={numGuesses}
        percentile={percentile}
        topic={puzzle.topic}
      />
    </div>
  );
}
