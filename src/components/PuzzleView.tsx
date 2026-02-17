"use client";

import { useState, useEffect, useCallback } from "react";
import { VerticalBadge } from "./VerticalBadge";
import { GuessInputDropdown } from "./GuessInputDropdown";
import { AnswerList, RevealedAnswer } from "./AnswerList";
import { StatsModal } from "./StatsModal";
import { LivesIndicator } from "./LivesIndicator";

interface PuzzleData {
  id: string;
  topic: string;
  description?: string | null;
  scheduledFor?: string;
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

const MAX_LIVES = 5;
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
    initialState.revealedAnswers.map((a) => ({
      ...a,
      guessed: a.guessed ?? a.revealed,
    }))
  );
  const [lastCorrectId, setLastCorrectId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statsKey, setStatsKey] = useState(0);

  // Lives system
  const initialIncorrect = initialState.numGuesses - initialState.numCorrect;
  const [lives, setLives] = useState(
    initialState.completed ? 0 : Math.max(0, MAX_LIVES - initialIncorrect)
  );
  const [lastLostLifeIndex, setLastLostLifeIndex] = useState<number | null>(null);

  // How-to-Play panel
  const [showHowToPlay, setShowHowToPlay] = useState(
    !initialState.completed && initialState.numGuesses === 0
  );

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
      setAnswers(
        data.revealedAnswers.map((a: RevealedAnswer) => ({
          ...a,
          guessed: a.revealed,
        }))
      );
      setStatsKey((k) => k + 1);

      if (data.isCorrect) {
        setLastCorrectId(answerPoolItemId);
        setFeedback(`Correct! #${data.rank}: ${data.label}`);
        setTimeout(() => {
          setFeedback(null);
          setLastCorrectId(null);
        }, 1500);
      } else {
        const newLives = lives - 1;
        setLastLostLifeIndex(newLives);
        setLives(newLives);
        setFeedback("Incorrect!");
        setTimeout(() => {
          setFeedback(null);
          setLastLostLifeIndex(null);
        }, 1500);

        if (newLives <= 0) {
          setTimeout(() => handleReveal(), 1000);
          return;
        }
      }

      if (data.puzzleComplete) {
        setCompleted(true);
        setLives(0);
        setTimeout(() => setShowStats(true), 1000);
      }
    } catch {
      setFeedback("Network error");
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const handleReveal = async () => {
    try {
      const previouslyGuessedIds = new Set(
        answers.filter((a) => a.revealed).map((a) => a.answerPoolItemId)
      );

      const res = await fetch(`/api/puzzle/${puzzle.id}/reveal`, {
        method: "POST",
      });
      const data = await res.json();
      setCompleted(true);
      setLives(0);
      setAnswers(
        data.answers.map((a: { rank: number; answerPoolItemId: string; label: string }) => ({
          ...a,
          revealed: true,
          guessed: previouslyGuessedIds.has(a.answerPoolItemId),
        }))
      );
      setTimeout(() => setShowStats(true), 500);
    } catch {
      setFeedback("Error revealing answers");
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const handleGiveUp = () => {
    handleReveal();
  };

  const gameActive = !completed && lives > 0;

  // How-to-Play panel
  if (showHowToPlay) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-warm-brown">How to Play</h3>
          <ul className="space-y-3 text-foreground/80 text-sm">
            <li className="flex gap-3">
              <span className="text-accent font-extrabold flex-shrink-0">1.</span>
              Guess the top 10 items for today&apos;s topic using the search box.
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-extrabold flex-shrink-0">2.</span>
              Incorrect guesses cost a life. You only get <span className="font-bold text-error whitespace-nowrap">5 lives</span>.
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-extrabold flex-shrink-0">3.</span>
              Correct guesses reveal their rank. Duplicates are not counted.
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-extrabold flex-shrink-0">4.</span>
              Find all 10 or run out of lives to see your results!
            </li>
          </ul>
        </div>

        <button
          onClick={() => setShowHowToPlay(false)}
          className="w-full py-4 bg-accent hover:bg-accent-hover text-white rounded-2xl font-extrabold text-lg transition-colors duration-150 active:scale-[0.98] shadow-md"
        >
          Play Today&apos;s Potpourri
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="text-center space-y-3">
        <VerticalBadge slug={vertical.slug} name={vertical.name} />
        <h2 className="text-2xl md:text-3xl font-extrabold text-warm-brown">
          {puzzle.topic}
        </h2>
      </div>

      {/* Stats row - Correct + Lives only */}
      <div
        key={statsKey}
        className={`flex items-center justify-center gap-8 py-3 px-4 rounded-2xl bg-surface border border-border shadow-sm ${
          statsKey > 0 ? "animate-stat-pulse" : ""
        }`}
      >
        <div className="text-center">
          <div className="text-xl font-extrabold text-success">{numCorrect}/10</div>
          <div className="text-xs font-bold text-warm-brown/50 uppercase tracking-wider">Correct</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <LivesIndicator lives={lives} lastLostIndex={lastLostLifeIndex} />
          <div className="text-xs font-bold text-warm-brown/50 uppercase tracking-wider mt-0.5">Lives</div>
        </div>
      </div>

      {/* Guess input */}
      {gameActive && (
        <GuessInputDropdown
          verticalSlug={vertical.slug}
          dataSource={isSmallPool ? "client" : "server"}
          clientOptions={clientPool}
          onSubmitGuess={handleGuess}
          disabled={completed}
          guessedIds={guessedIds}
        />
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`text-center py-2.5 px-4 rounded-2xl font-bold text-sm animate-slide-up ${
            feedback.startsWith("Correct")
              ? "bg-mint text-green-700 border border-green-300/40"
              : feedback.startsWith("Incorrect")
                ? "bg-red-50 text-red-600 border border-red-200/40"
                : "bg-lemon text-yellow-700 border border-yellow-300/40"
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Answer list */}
      <AnswerList answers={answers} lastCorrectId={lastCorrectId} />

      {/* Give Up button */}
      {gameActive && (
        <button
          onClick={handleGiveUp}
          className="w-full py-3.5 bg-red-50 border border-red-200/50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-2xl font-bold transition-all duration-150 active:scale-[0.98]"
        >
          Give Up?
        </button>
      )}

      {/* View Results button */}
      {completed && !showStats && (
        <button
          onClick={() => setShowStats(true)}
          className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white rounded-2xl font-extrabold transition-colors duration-150 active:scale-[0.98] shadow-md"
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
        puzzleId={puzzle.id}
        scheduledFor={puzzle.scheduledFor}
        answers={answers}
      />
    </div>
  );
}
