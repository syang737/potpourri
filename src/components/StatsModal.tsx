"use client";

import { useState } from "react";
import { RevealedAnswer } from "./AnswerList";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  numCorrect: number;
  numGuesses: number;
  percentile: number | null;
  topic: string;
  puzzleId: string;
  scheduledFor?: string;
  answers: RevealedAnswer[];
}

function buildEmojiGrid(answers: RevealedAnswer[]): string {
  return answers
    .map((a) => (a.guessed ? "\u{1F7E9}" : "\u{2B1C}"))
    .join("");
}

function getSummaryMessage(numCorrect: number): string {
  if (numCorrect === 10) return "Perfect score!";
  if (numCorrect >= 8) return "Impressive!";
  if (numCorrect >= 5) return "Nice work!";
  if (numCorrect >= 3) return "Good effort!";
  return "Better luck next time!";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function StatsModal({
  isOpen,
  onClose,
  numCorrect,
  numGuesses,
  percentile,
  topic,
  puzzleId,
  scheduledFor,
  answers,
}: StatsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const emojiGrid = buildEmojiGrid(answers);
  const dateLabel = formatDate(scheduledFor);
  const gameUrl = typeof window !== "undefined"
    ? `${window.location.origin}/puzzle/${puzzleId}`
    : "";

  const shareText = [
    `Potpourri ${dateLabel}`,
    `${emojiGrid} ${numCorrect}/10`,
    gameUrl,
  ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 border border-border shadow-xl animate-fade-in">
        {/* Summary message */}
        <div className="text-center">
          <div className="text-xl font-extrabold text-warm-brown mb-1">
            {getSummaryMessage(numCorrect)}
          </div>
          <div className="text-sm font-semibold text-warm-brown/50">{dateLabel}</div>
        </div>

        {/* Score */}
        <div className="text-center space-y-2">
          <div className="text-5xl font-extrabold text-success">
            {numCorrect}/10
          </div>
          <div className="text-warm-brown/60 font-semibold">
            in {numGuesses} guess{numGuesses !== 1 ? "es" : ""}
          </div>
        </div>

        {/* Percentile */}
        {percentile !== null && (
          <div className="text-center text-base font-bold text-warm-brown py-2.5 px-4 rounded-2xl bg-peach/50 border border-accent/20">
            Better than{" "}
            <span className="text-accent">{percentile}%</span> of
            players
          </div>
        )}

        {/* Emoji grid preview */}
        <div className="text-center space-y-2 py-3 px-4 rounded-2xl bg-surface-light border border-border">
          <div className="text-2xl tracking-wider">{emojiGrid}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 bg-accent hover:bg-accent-hover text-white py-3 px-4 rounded-2xl text-sm font-extrabold transition-colors duration-150 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Copied!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                Copy Results
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-border text-warm-brown hover:bg-peach/30 py-3 px-4 rounded-2xl text-sm font-bold transition-colors duration-150 active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
