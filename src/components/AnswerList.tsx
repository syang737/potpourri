"use client";

export interface RevealedAnswer {
  rank: number;
  answerPoolItemId: string;
  label: string | null;
  revealed: boolean;
}

export function AnswerList({
  answers,
  lastCorrectId,
}: {
  answers: RevealedAnswer[];
  lastCorrectId?: string | null;
}) {
  return (
    <div className="space-y-2">
      {answers.map((answer) => (
        <div
          key={answer.rank}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
            answer.revealed
              ? lastCorrectId === answer.answerPoolItemId
                ? "bg-green-500/15 border-green-500/30 scale-[1.02]"
                : "bg-green-500/10 border-green-500/20"
              : "bg-white/5 border-white/10"
          }`}
        >
          <span
            className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
              answer.revealed
                ? "bg-green-500/20 text-green-400"
                : "bg-white/10 text-gray-500"
            }`}
          >
            {answer.rank}
          </span>
          <span
            className={`flex-1 ${
              answer.revealed
                ? "font-medium text-gray-100"
                : "text-gray-600 italic"
            }`}
          >
            {answer.revealed ? answer.label : "???"}
          </span>
        </div>
      ))}
    </div>
  );
}
