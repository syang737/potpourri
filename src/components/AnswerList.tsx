"use client";

export interface RevealedAnswer {
  rank: number;
  answerPoolItemId: string;
  label: string | null;
  revealed: boolean;
  guessed?: boolean;
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
            className={`flex items-center gap-3 p-3 md:p-3.5 rounded-2xl border transition-all duration-300 ${
              answer.revealed
                ? isJustRevealed
                  ? "bg-mint border-green-300/40 animate-card-flip shadow-sm"
                  : "bg-mint/60 border-green-200/30"
                : "bg-surface border-border hover:bg-surface-light hover:shadow-sm"
            }`}
          >
            <span
              className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full font-extrabold text-sm transition-colors duration-300 ${
                answer.revealed
                  ? "bg-success/20 text-green-700"
                  : "bg-peach/50 text-warm-brown/50"
              }`}
            >
              {answer.rank}
            </span>
            <span
              className={`flex-1 text-sm md:text-base transition-colors duration-300 ${
                answer.revealed
                  ? "font-bold text-green-800"
                  : "text-warm-brown/40 italic font-semibold"
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
                className="text-success flex-shrink-0"
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
