export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-semibold text-white">About Potpourri</h1>
      <p className="text-gray-200 leading-relaxed">
        Potpourri is a daily &ldquo;top ten&rdquo; trivia game. Each day, a new
        puzzle challenges you to guess the top ten items for a given topic --
        from countries and languages to movies, sports, and Fortune 500
        companies.
      </p>

      <div className="border-t border-white/5 mt-8 pt-6">
        <h2 className="text-xl font-semibold text-white mb-4">How to Play</h2>
        <ul className="space-y-3 text-gray-200">
          <li className="flex gap-3">
            <span className="text-sky-400 flex-shrink-0">1.</span>
            Use the search dropdown to find and select your guesses from the
            answer pool.
          </li>
          <li className="flex gap-3">
            <span className="text-sky-400 flex-shrink-0">2.</span>
            Each correct guess reveals its position in the top ten.
          </li>
          <li className="flex gap-3">
            <span className="text-sky-400 flex-shrink-0">3.</span>
            Try to get all 10 correct, or click &ldquo;Reveal Answers&rdquo; to
            see the full list.
          </li>
          <li className="flex gap-3">
            <span className="text-sky-400 flex-shrink-0">4.</span>
            After completing the puzzle, see how you scored compared to other
            players.
          </li>
        </ul>
      </div>

      <div className="border-t border-white/5 mt-8 pt-6">
        <h2 className="text-xl font-semibold text-white mb-4">Categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            "Movies / TV Shows",
            "Countries",
            "Fortune 500 Companies",
            "Sports",
            "Languages",
          ].map((cat) => (
            <div
              key={cat}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm"
            >
              {cat}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
