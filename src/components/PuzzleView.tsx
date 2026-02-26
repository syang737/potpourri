"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { VerticalBadge } from "./VerticalBadge";
import { GuessInputDropdown } from "./GuessInputDropdown";
import { AnswerList, RevealedAnswer } from "./AnswerList";
import { StatsModal } from "./StatsModal";
import { LivesIndicator } from "./LivesIndicator";

interface PuzzleData {
  id: string;
  topic: string;
  description?: string | null;
  source?: string | null;
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

// Toast messages
const CORRECT_TOASTS = ["Nice!", "Got it!", "On the board!", "Nailed it!", "Yes!"];
const INCORRECT_TOASTS = ["Nope", "Not quite", "Try again", "Off the mark", "Swing and a miss"];
const DUPLICATE_TOASTS = ["Already guessed!", "You tried that one!", "Pick something new!"];
const STREAK_TOASTS: Record<number, string> = {
  3: "3 in a row!",
  4: "On fire!",
  5: "Hot streak!",
};

function getRandomToast(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Confetti particle
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotSpeed: number;
}

function ConfettiBurst({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ["#FF8B5E", "#66BB6A", "#FFD54F", "#42A5F5", "#AB47BC", "#EF5350"];
    const particles: Particle[] = [];

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 15,
      });
    }

    let frame = 0;
    const maxFrames = 60;
    let rafId: number;

    const animate = () => {
      frame++;
      if (frame > maxFrames) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const opacity = 1 - frame / maxFrames;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-30"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// Progress bar
function ProgressBar({ found, total }: { found: number; total: number }) {
  return (
    <div className="flex gap-[2px] h-2 rounded-full overflow-hidden bg-warm-brown/10">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`flex-1 transition-all duration-300 ${
            i < found ? "bg-success" : "bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

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
  const totalAnswers = initialState.revealedAnswers.length;
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
  const [justRevealedId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [scoreHistogram, setScoreHistogram] = useState<Record<string, number> | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "correct" | "incorrect" | "duplicate" } | null>(null);
  const [statsKey, setStatsKey] = useState(0);

  // Track all attempted answer IDs to prevent duplicate guesses
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(() => {
    // Initialize with already-guessed correct IDs from session state
    return new Set(
      initialState.revealedAnswers
        .filter((a) => a.guessed)
        .map((a) => a.answerPoolItemId)
    );
  });

  // Screen flash
  const [flash, setFlash] = useState<"correct" | "incorrect" | null>(null);
  // Screen shake
  const [shake, setShake] = useState(false);
  // Confetti
  const [confetti, setConfetti] = useState(false);
  // Streak tracking
  const [streak, setStreak] = useState(0);
  // Input wobble on incorrect
  const [inputWobble, setInputWobble] = useState(false);

  // Sound
  const [soundEnabled, setSoundEnabled] = useState(false);

  const playSound = useCallback((type: "correct" | "incorrect") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      if (type === "correct") {
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.value = 0.12;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      } else {
        osc.type = "square";
        osc.frequency.value = 220;
        gain.gain.value = 0.08;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (type === "correct" ? 0.15 : 0.2));
    } catch {
      // Audio not available
    }
  }, [soundEnabled]);

  const triggerHaptic = useCallback((type: "correct" | "incorrect") => {
    if (!navigator.vibrate) return;
    if (type === "correct") {
      navigator.vibrate(30);
    } else {
      navigator.vibrate([20, 30, 20]);
    }
  }, []);

  // Lives system
  const initialIncorrect = initialState.numGuesses - initialState.numCorrect;
  const [lives, setLives] = useState(
    initialState.completed ? 0 : Math.max(0, MAX_LIVES - initialIncorrect)
  );
  const [lastLostLifeIndex, setLastLostLifeIndex] = useState<number | null>(null);
  const [livesPulse, setLivesPulse] = useState(false);

  // How-to-Play panel
  const [showHowToPlay, setShowHowToPlay] = useState(
    !initialState.completed && initialState.numGuesses === 0
  );

  // Answer pool loaded once for client-side search
  const [clientPool, setClientPool] = useState<AnswerOption[] | undefined>();

  const guessedIds = new Set(
    answers.filter((a) => a.revealed).map((a) => a.answerPoolItemId)
  );

  useEffect(() => {
    fetch(`/api/vertical/${vertical.slug}/pool`)
      .then((res) => res.json())
      .then((data) => setClientPool(data.items))
      .catch(() => {});
  }, [vertical.slug]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/puzzle/${puzzle.id}/stats`);
      const data = await res.json();
      setPercentile(data.percentile);
      setScoreHistogram(data.scoreHistogram ?? null);
    } catch {
      /* ignore */
    }
  }, [puzzle.id]);

  useEffect(() => {
    if (completed) {
      fetchStats();
    }
  }, [completed, fetchStats]);

  const showToastMsg = (text: string, type: "correct" | "incorrect" | "duplicate") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2400);
  };

  const handleGuess = async (answerPoolItemId: string) => {
    // Client-side duplicate check
    if (attemptedIds.has(answerPoolItemId)) {
      showToastMsg(getRandomToast(DUPLICATE_TOASTS), "duplicate");
      return;
    }

    try {
      const res = await fetch(`/api/puzzle/${puzzle.id}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerPoolItemId }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToastMsg(err.error || "Error", "incorrect");
        return;
      }

      const data = await res.json();

      // Server-side duplicate fallback
      if (data.duplicate) {
        setAttemptedIds((prev) => new Set(prev).add(answerPoolItemId));
        showToastMsg(getRandomToast(DUPLICATE_TOASTS), "duplicate");
        return;
      }

      // Track this attempt
      setAttemptedIds((prev) => new Set(prev).add(answerPoolItemId));

      setNumCorrect(data.numCorrect);
      setNumGuesses(data.numGuesses);
      setAnswers(
        data.revealedAnswers.map((a: RevealedAnswer) => ({
          ...a,
          guessed: a.guessed ?? a.revealed,
        }))
      );
      setStatsKey((k) => k + 1);

      if (data.isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);

        // Screen flash green
        setFlash("correct");
        setTimeout(() => setFlash(null), 500);

        // Sound + haptics
        playSound("correct");
        triggerHaptic("correct");

        // Lives pulse green
        setLivesPulse(true);
        setTimeout(() => setLivesPulse(false), 800);

        // Answer row animation
        setLastCorrectId(answerPoolItemId);
        setTimeout(() => setLastCorrectId(null), 3000);

        // Confetti on 1st, middle, and last answer
        const midpoint = Math.ceil(totalAnswers / 2);
        if (data.numCorrect === 1 || data.numCorrect === midpoint || data.numCorrect === totalAnswers) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 2400);
        }

        // Toast with streaks
        const streakMsg = STREAK_TOASTS[newStreak];
        showToastMsg(streakMsg || getRandomToast(CORRECT_TOASTS), "correct");
      } else {
        setStreak(0);

        // Screen flash red + shake
        setFlash("incorrect");
        setShake(true);
        setTimeout(() => setFlash(null), 500);
        setTimeout(() => setShake(false), 300);

        // Sound + haptics
        playSound("incorrect");
        triggerHaptic("incorrect");

        // Input wobble
        setInputWobble(true);
        setTimeout(() => setInputWobble(false), 800);

        // Toast
        showToastMsg(getRandomToast(INCORRECT_TOASTS), "incorrect");

        const newLives = lives - 1;
        setLastLostLifeIndex(newLives);
        setLives(newLives);
        setTimeout(() => setLastLostLifeIndex(null), 3000);

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
      showToastMsg("Network error", "incorrect");
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
      showToastMsg("Error revealing answers", "incorrect");
    }
  };

  const handleGiveUp = () => {
    handleReveal();
  };

  // Source info popup
  const [showSource, setShowSource] = useState(false);
  const sourceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSource) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sourceRef.current && !sourceRef.current.contains(e.target as Node)) {
        setShowSource(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSource]);

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
              Guess the top {totalAnswers} items for today&apos;s topic using the search box.
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-extrabold flex-shrink-0">2.</span>
              <span>Incorrect guesses cost a life. You only get <span className="font-bold text-error">5 lives</span>.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-extrabold flex-shrink-0">3.</span>
              Correct guesses reveal their rank. Duplicates are not counted.
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-extrabold flex-shrink-0">4.</span>
              Find all {totalAnswers} or run out of lives to see your results!
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
    <div className={`relative max-w-lg mx-auto space-y-5 ${shake ? "animate-shake" : ""}`}>
      {/* Screen flash overlay */}
      {flash && (
        <div
          className={`fixed inset-0 pointer-events-none z-40 ${
            flash === "correct" ? "bg-green-400/15" : "bg-red-400/15"
          }`}
          style={{ animation: "flashFade 500ms ease-out forwards" }}
        />
      )}

      {/* Correct glow */}
      {flash === "correct" && (
        <div
          className="fixed inset-0 pointer-events-none z-40"
          style={{
            background: "radial-gradient(circle at center, rgba(102,187,106,0.15) 0%, transparent 60%)",
            animation: "flashFade 600ms ease-out forwards",
          }}
        />
      )}

      {/* Confetti */}
      <ConfettiBurst active={confetti} />

      {/* Header */}
      <div className="text-center space-y-3">
        <VerticalBadge slug={vertical.slug} name={vertical.name} />
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-warm-brown">
            {puzzle.topic}
          </h2>
          {puzzle.source && (
            <div className="relative" ref={sourceRef}>
              <button
                onClick={() => setShowSource((v) => !v)}
                className="flex items-center justify-center w-6 h-6 rounded-full text-warm-brown/40 hover:text-accent hover:bg-peach/30 transition-colors duration-150"
                aria-label="View source"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </button>
              {showSource && (
                <div className="absolute z-20 top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-4 bg-surface border border-border rounded-2xl shadow-lg text-left">
                  <p className="text-xs font-bold text-warm-brown/50 uppercase tracking-wider mb-2">Source</p>
                  <a
                    href={puzzle.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-accent hover:text-accent-hover underline underline-offset-2 break-all transition-colors duration-150"
                  >
                    {puzzle.source}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div
        key={statsKey}
        className={`flex items-center justify-center gap-6 py-3 px-4 rounded-2xl bg-surface border border-border shadow-sm ${
          statsKey > 0 ? "animate-stat-pulse" : ""
        }`}
      >
        <div className="text-center">
          <div className="text-xl font-extrabold text-success">{numCorrect}/{totalAnswers}</div>
          <div className="text-xs font-bold text-warm-brown/50 uppercase tracking-wider">Correct</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className={`text-center ${livesPulse ? "animate-lives-pulse" : ""}`}>
          <LivesIndicator lives={lives} lastLostIndex={lastLostLifeIndex} />
          <div className="text-xs font-bold text-warm-brown/50 uppercase tracking-wider mt-0.5">Lives</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <button
          onClick={() => setSoundEnabled((v) => !v)}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150 ${
            soundEnabled ? "text-accent bg-peach/40" : "text-warm-brown/30 hover:text-warm-brown/50"
          }`}
          aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          )}
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar found={numCorrect} total={totalAnswers} />

      {/* Guess input */}
      {gameActive && (
        <div className={inputWobble ? "animate-wobble" : ""}>
          <GuessInputDropdown
            verticalSlug={vertical.slug}
            clientOptions={clientPool}
            onSubmitGuess={handleGuess}
            disabled={completed}
            guessedIds={guessedIds}
          />
        </div>
      )}

      {/* Toast feedback */}
      {toast && (
        <div
          className={`text-center py-2 px-4 rounded-2xl font-bold text-sm animate-toast ${
            toast.type === "correct"
              ? "bg-mint text-green-700 border border-green-300/40"
              : toast.type === "duplicate"
                ? "bg-lemon text-amber-700 border border-amber-300/40"
                : "bg-red-50 text-red-600 border border-red-200/40"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Answer list */}
      <AnswerList answers={answers} lastCorrectId={lastCorrectId} justRevealedId={justRevealedId} />

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
        totalAnswers={totalAnswers}
        numGuesses={numGuesses}
        percentile={percentile}
        scoreHistogram={scoreHistogram}
        topic={puzzle.topic}
        puzzleId={puzzle.id}
        scheduledFor={puzzle.scheduledFor}
        answers={answers}
      />
    </div>
  );
}
