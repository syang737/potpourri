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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-2xl font-bold text-center">Results</h2>

        <div className="text-center space-y-2">
          <div className="text-5xl font-bold text-green-600">
            {numCorrect}/10
          </div>
          <div className="text-gray-500">
            in {numGuesses} guess{numGuesses !== 1 ? "es" : ""}
          </div>
        </div>

        {percentile !== null && (
          <div className="text-center text-lg">
            You scored better than{" "}
            <span className="font-bold text-blue-600">{percentile}%</span> of
            players.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Share
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
