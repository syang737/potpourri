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
  answers: RevealedAnswer[];
}

function buildEmojiGrid(answers: RevealedAnswer[]): string {
  // Each answer: green square if user guessed it, black square if not
  return answers
    .map((a) => (a.revealed ? "\u{1F7E9}" : "\u{2B1B}"))
    .join("");
}

function getSummaryMessage(numCorrect: number): string {
  if (numCorrect === 10) return "Perfect score!";
  if (numCorrect >= 8) return "Impressive!";
  if (numCorrect >= 5) return "Nice work!";
  if (numCorrect >= 3) return "Good effort!";
  return "Better luck next time!";
}

export function StatsModal({
  isOpen,
  onClose,
  numCorrect,
  numGuesses,
  percentile,
  topic,
  answers,
}: StatsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const emojiGrid = buildEmojiGrid(answers);
  const gameUrl = typeof window !== "undefined" ? window.location.origin : "";

  const shareText = [
    `Potpourri: "${topic}"`,
    `${emojiGrid} ${numCorrect}/10`,
    `${gameUrl}`,
  ].join("\n");

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl max-w-md w-full p-6 md:p-8 space-y-5 border border-white/10 shadow-2xl animate-fade-in">
        {/* Summary message */}
        <div className="text-center">
          <div className="text-lg font-semibold text-white mb-1">
            {getSummaryMessage(numCorrect)}
          </div>
          <div className="text-sm text-gray-400">{topic}</div>
        </div>

        {/* Score */}
        <div className="text-center space-y-2">
          <div className="text-5xl font-bold text-green-400">
            {numCorrect}/10
          </div>
          <div className="text-gray-400">
            in {numGuesses} guess{numGuesses !== 1 ? "es" : ""}
          </div>
        </div>

        {/* Percentile */}
        {percentile !== null && (
          <div className="text-center text-base text-gray-200 py-2 px-4 rounded-xl bg-white/5 border border-white/10">
            Better than{" "}
            <span className="font-bold text-sky-400">{percentile}%</span> of
            players
          </div>
        )}

        {/* Emoji grid preview */}
        <div className="text-center space-y-2">
          <div className="text-2xl tracking-wider">{emojiGrid}</div>
          <div className="text-xs text-gray-500">Tap Share to copy your results</div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 bg-accent hover:bg-accent-hover text-white py-3 px-4 rounded-xl text-sm font-semibold transition-colors duration-150 active:scale-[0.98]"
          >
            {copied ? "Copied!" : "Share"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-white/20 text-gray-100 hover:bg-white/10 py-3 px-4 rounded-xl text-sm font-medium transition-colors duration-150 active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
