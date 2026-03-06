import { PotMascot } from "@/components/PotMascot";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <PotMascot size={48} />
        <h1 className="text-3xl font-extrabold text-warm-brown">About Potpourri</h1>
      </div>
      <p className="text-foreground/80 leading-relaxed font-semibold">
        Potpourri is a daily trivia game. Each day, a new
        puzzle challenges you to guess the top items for a given topic —
        from countries and languages to movies, sports, and Fortune 500
        companies.
      </p>

      <div className="border-t border-border mt-8 pt-6">
        <h2 className="text-xl font-extrabold text-warm-brown mb-4">How to Play</h2>
        <ul className="space-y-3 text-foreground/80 font-semibold">
          <li className="flex gap-3">
            <span className="text-accent font-extrabold flex-shrink-0">1.</span>
            Use the search dropdown to find and select your guesses from the
            answer pool.
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-extrabold flex-shrink-0">2.</span>
            Each correct guess reveals its position in the rankings.
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-extrabold flex-shrink-0">3.</span>
            You have 5 lives — each incorrect guess costs one. Run out and
            the answers are revealed!
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-extrabold flex-shrink-0">4.</span>
            After completing the puzzle, see how you scored compared to other
            players and share your results.
          </li>
        </ul>
      </div>

      <div className="border-t border-border mt-8 pt-6">
        <h2 className="text-xl font-extrabold text-warm-brown mb-4">Categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "Movies / TV Shows", color: "bg-lavender border-purple-200/40" },
            { name: "Countries", color: "bg-mint border-green-200/40" },
            { name: "Fortune 500", color: "bg-sky-soft border-blue-200/40" },
            { name: "Sports", color: "bg-peach border-orange-200/40" },
            { name: "Languages", color: "bg-pink-100 border-pink-200/40" },
          ].map((cat) => (
            <div
              key={cat.name}
              className={`px-4 py-3 rounded-2xl border text-foreground text-sm font-bold ${cat.color}`}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
