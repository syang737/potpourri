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
      {answers.map((answer) => {
        const isJustRevealed = lastCorrectId === answer.answerPoolItemId;
        return (
          <div
            key={answer.rank}
            className={`flex items-center gap-3 p-3 md:p-3.5 rounded-xl border transition-all duration-300 ${
              answer.revealed
                ? isJustRevealed
                  ? "bg-green-500/15 border-green-500/30 animate-card-flip"
                  : "bg-green-500/10 border-green-500/20"
                : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"
            }`}
          >
            <span
              className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full font-bold text-sm transition-colors duration-300 ${
                answer.revealed
                  ? "bg-green-500/20 text-green-400"
                  : "bg-white/10 text-gray-500"
              }`}
            >
              {answer.rank}
            </span>
            <span
              className={`flex-1 text-sm md:text-base transition-colors duration-300 ${
                answer.revealed
                  ? "font-medium text-gray-100"
                  : "text-gray-600 italic"
              }`}
            >
              {answer.revealed ? answer.label : "???"}
            </span>
            {answer.revealed && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-400 flex-shrink-0"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
