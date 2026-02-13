import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSession } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: puzzleId } = await params;
  const sessionId = await getOrCreateSession();

  const stats = await prisma.puzzleStats.findUnique({
    where: { puzzleId },
  });

  const summary = await prisma.sessionPuzzleSummary.findUnique({
    where: { puzzleId_sessionId: { puzzleId, sessionId } },
  });

  let percentile: number | null = null;
  if (stats && summary) {
    const histogram = stats.scoreHistogram as Record<string, number>;
    const totalSessions = stats.numSessions;
    const userScore = summary.numCorrect;

    let numLeq = 0;
    for (let k = 0; k <= userScore; k++) {
      numLeq += histogram[String(k)] ?? 0;
    }

    percentile =
      totalSessions > 0 ? Math.round((numLeq / totalSessions) * 100) : null;
  }

  return NextResponse.json({
    numSessions: stats?.numSessions ?? 0,
    scoreHistogram: stats?.scoreHistogram ?? {},
    guessHistogram: stats?.guessHistogram ?? {},
    userScore: summary?.numCorrect ?? null,
    userGuesses: summary?.numGuesses ?? null,
    percentile,
  });
}
