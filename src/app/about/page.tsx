export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">About Potpourri</h1>
      <p className="text-gray-700 leading-relaxed">
        Potpourri is a daily &ldquo;top ten&rdquo; trivia game. Each day, a new
        puzzle challenges you to guess the top ten items for a given topic --
        from countries and languages to movies, sports, and Fortune 500
        companies.
      </p>
      <h2 className="text-xl font-semibold">How to Play</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        <li>
          Use the search dropdown to find and select your guesses from the
          answer pool.
        </li>
        <li>Each correct guess reveals its position in the top ten.</li>
        <li>
          Try to get all 10 correct, or click &ldquo;Reveal Answers&rdquo; to
          see the full list.
        </li>
        <li>
          After completing the puzzle, see how you scored compared to other
          players.
        </li>
      </ul>
      <h2 className="text-xl font-semibold">Categories</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700">
        <li>Movies / TV Shows</li>
        <li>Countries</li>
        <li>Fortune 500 Companies</li>
        <li>Sports</li>
        <li>Languages</li>
      </ul>
    </div>
  );
}
