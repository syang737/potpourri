import { prisma } from "@/lib/prisma";

export async function updatePuzzleStats(puzzleId: string) {
  const summaries = await prisma.sessionPuzzleSummary.findMany({
    where: { puzzleId, completedAt: { not: null } },
  });

  // Get the puzzle's answer count for histogram range
  const puzzle = await prisma.puzzle.findUnique({
    where: { id: puzzleId },
    include: { answers: true },
  });
  const totalAnswers = puzzle?.answers.length ?? 10;

  const scoreHistogram: Record<string, number> = {};
  const guessHistogram: Record<string, number> = {};
  for (let i = 0; i <= totalAnswers; i++) scoreHistogram[String(i)] = 0;

  for (const s of summaries) {
    const key = String(s.numCorrect);
    scoreHistogram[key] = (scoreHistogram[key] ?? 0) + 1;
    const gKey = String(s.numGuesses);
    guessHistogram[gKey] = (guessHistogram[gKey] ?? 0) + 1;
  }

  await prisma.puzzleStats.upsert({
    where: { puzzleId },
    create: {
      puzzleId,
      numSessions: summaries.length,
      scoreHistogram,
      guessHistogram,
    },
    update: {
      numSessions: summaries.length,
      scoreHistogram,
      guessHistogram,
    },
  });
}
