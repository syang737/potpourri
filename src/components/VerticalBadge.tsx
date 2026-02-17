"use client";

const VERTICAL_COLORS: Record<string, string> = {
  movies_tv: "bg-lavender text-purple-700 border-purple-200/40",
  countries: "bg-mint text-green-700 border-green-200/40",
  fortune_500: "bg-sky-soft text-blue-700 border-blue-200/40",
  sports: "bg-peach text-orange-700 border-orange-200/40",
  languages: "bg-pink-100 text-pink-700 border-pink-200/40",
};

export function VerticalBadge({ slug, name }: { slug: string; name: string }) {
  const colors =
    VERTICAL_COLORS[slug] ?? "bg-surface-light text-warm-brown border-border";
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${colors}`}
    >
      {name}
    </span>
  );
}
