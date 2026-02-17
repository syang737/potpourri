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
      guessed: a.guessed ?? a.revealed, // on initial load, revealed answers were guessed
    }))
  );
  const [lastCorrectId, setLastCorrectId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statsKey, setStatsKey] = useState(0); // for pulse animation

  // Lives system - calculate initial lives from existing incorrect guesses
  const initialIncorrect = initialState.numGuesses - initialState.numCorrect;
  const [lives, setLives] = useState(
    initialState.completed ? 0 : Math.max(0, MAX_LIVES - initialIncorrect)
  );
  const [lastLostLifeIndex, setLastLostLifeIndex] = useState<number | null>(null);

  // How-to-Play panel - show if puzzle hasn't started yet
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
      // During normal guessing, all revealed answers were guessed by the user
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
        setLastLostLifeIndex(newLives); // index of the life that was just lost
        setLives(newLives);
        setFeedback("Incorrect!");
        setTimeout(() => {
          setFeedback(null);
          setLastLostLifeIndex(null);
        }, 1500);

        // Out of lives - auto reveal
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
      // Snapshot which answers the user had already guessed before revealing
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
        <div className="text-center space-y-3">
          <VerticalBadge slug={vertical.slug} name={vertical.name} />
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {puzzle.topic}
          </h2>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h3 className="text-lg font-semibold text-white">How to Play</h3>
          <ul className="space-y-3 text-gray-300 text-sm">
            <li className="flex gap-3">
              <span className="text-sky-400 font-bold flex-shrink-0">1.</span>
              Guess the top 10 items for today&apos;s topic using the search box.
            </li>
            <li className="flex gap-3">
              <span className="text-sky-400 font-bold flex-shrink-0">2.</span>
              You have <span className="font-bold text-red-400">5 lives</span> — each incorrect guess costs one life.
            </li>
            <li className="flex gap-3">
              <span className="text-sky-400 font-bold flex-shrink-0">3.</span>
              Correct guesses reveal their rank. Duplicates are not counted.
            </li>
            <li className="flex gap-3">
              <span className="text-sky-400 font-bold flex-shrink-0">4.</span>
              Find all 10 or run out of lives to see your results and compare with other players.
            </li>
          </ul>
        </div>

        <button
          onClick={() => setShowHowToPlay(false)}
          className="w-full py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-lg transition-colors duration-150 active:scale-[0.98]"
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
        <h2 className="text-2xl md:text-3xl font-semibold text-white">
          {puzzle.topic}
        </h2>
      </div>

      {/* Stats row */}
      <div
        key={statsKey}
        className={`flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-white/5 border border-white/10 ${
          statsKey > 0 ? "animate-stat-pulse" : ""
        }`}
      >
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">{numCorrect}/10</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Correct</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="text-lg font-bold text-gray-200">{numGuesses}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Guess{numGuesses !== 1 ? "es" : ""}
          </div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <LivesIndicator lives={lives} lastLostIndex={lastLostLifeIndex} />
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Lives</div>
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
          className={`text-center py-2.5 px-4 rounded-xl font-medium text-sm animate-slide-up ${
            feedback.startsWith("Correct")
              ? "bg-green-500/15 text-green-400 border border-green-500/20"
              : feedback.startsWith("Incorrect")
                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Answer list */}
      <AnswerList answers={answers} lastCorrectId={lastCorrectId} />

      {/* Give Up button (replaces Reveal Answers) */}
      {gameActive && (
        <button
          onClick={handleGiveUp}
          className="w-full py-3.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl font-medium transition-all duration-150 active:scale-[0.98]"
        >
          Give Up?
        </button>
      )}

      {/* View Results button */}
      {completed && !showStats && (
        <button
          onClick={() => setShowStats(true)}
          className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-colors duration-150 active:scale-[0.98]"
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
        answers={answers}
      />
    </div>
  );
}
