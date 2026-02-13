"use client";

const VERTICAL_COLORS: Record<string, string> = {
  movies_tv: "bg-purple-100 text-purple-800",
  countries: "bg-green-100 text-green-800",
  fortune_500: "bg-blue-100 text-blue-800",
  sports: "bg-orange-100 text-orange-800",
  languages: "bg-pink-100 text-pink-800",
};

export function VerticalBadge({ slug, name }: { slug: string; name: string }) {
  const colors = VERTICAL_COLORS[slug] ?? "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors}`}>
      {name}
    </span>
  );
}
