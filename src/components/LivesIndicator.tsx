"use client";

const MAX_LIVES = 5;

export function LivesIndicator({
  lives,
  lastLostIndex,
}: {
  lives: number;
  lastLostIndex: number | null;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: MAX_LIVES }, (_, i) => {
        const isAlive = i < lives;
        const justLost = lastLostIndex === i;
        return (
          <span
            key={i}
            className={`inline-block text-lg transition-all duration-300 ${
              justLost ? "animate-life-loss" : ""
            } ${isAlive ? "opacity-100" : "opacity-25 grayscale"}`}
            role="img"
            aria-label={isAlive ? "life remaining" : "life lost"}
          >
            {isAlive ? "\u2764\uFE0F" : "\u{1F5A4}"}
          </span>
        );
      })}
    </div>
  );
}
