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
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
            answer.revealed
              ? lastCorrectId === answer.answerPoolItemId
                ? "bg-green-100 border-green-400 scale-[1.02]"
                : "bg-green-50 border-green-300"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-bold text-sm">
            {answer.rank}
          </span>
          <span className={`flex-1 ${answer.revealed ? "font-medium text-gray-900" : "text-gray-400 italic"}`}>
            {answer.revealed ? answer.label : "???"}
          </span>
        </div>
      ))}
    </div>
  );
}
