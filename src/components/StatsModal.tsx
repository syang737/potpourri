"use client";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  numCorrect: number;
  numGuesses: number;
  percentile: number | null;
  topic: string;
}

export function StatsModal({
  isOpen,
  onClose,
  numCorrect,
  numGuesses,
  percentile,
  topic,
}: StatsModalProps) {
  if (!isOpen) return null;

  const shareText = `I got ${numCorrect}/10 on Potpourri: "${topic}"`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl max-w-md w-full p-8 space-y-6 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-white">Results</h2>

        <div className="text-center space-y-2">
          <div className="text-5xl font-bold text-green-400">
            {numCorrect}/10
          </div>
          <div className="text-gray-400">
            in {numGuesses} guess{numGuesses !== 1 ? "es" : ""}
          </div>
        </div>

        {percentile !== null && (
          <div className="text-center text-lg text-gray-200">
            You scored better than{" "}
            <span className="font-bold text-sky-400">{percentile}%</span> of
            players.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 bg-sky-500 hover:bg-sky-400 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-150"
          >
            Share
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-white/20 text-gray-100 hover:bg-white/10 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
