"use client";

const VERTICAL_COLORS: Record<string, string> = {
  movies_tv: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  countries: "bg-green-500/15 text-green-400 border-green-500/20",
  fortune_500: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  sports: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  languages: "bg-pink-500/15 text-pink-400 border-pink-500/20",
};

export function VerticalBadge({ slug, name }: { slug: string; name: string }) {
  const colors =
    VERTICAL_COLORS[slug] ?? "bg-white/10 text-gray-300 border-white/10";
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${colors}`}
    >
      {name}
    </span>
  );
}
