import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSession } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: puzzleId } = await params;
    const sessionId = await getOrCreateSession();

    const puzzle = await prisma.puzzle.findUnique({
      where: { id: puzzleId },
      include: {
        vertical: true,
        answers: {
          include: { answerPoolItem: true },
          orderBy: { rank: "asc" },
        },
      },
    });

    if (!puzzle || puzzle.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    const summary = await prisma.sessionPuzzleSummary.findUnique({
      where: { puzzleId_sessionId: { puzzleId: puzzle.id, sessionId } },
    });

    const guesses = await prisma.guessLog.findMany({
      where: { puzzleId: puzzle.id, sessionId },
      orderBy: { guessOrder: "asc" },
    });

    const correctGuessIds = new Set(
      guesses.filter((g) => g.isCorrect).map((g) => g.answerPoolItemId)
    );

    const isCompleted = !!summary?.completedAt;
    const revealedAnswers = puzzle.answers.map((a) => ({
      rank: a.rank,
      answerPoolItemId: a.answerPoolItemId,
      label: isCompleted || correctGuessIds.has(a.answerPoolItemId)
        ? a.answerPoolItem.label
        : null,
      revealed: isCompleted || correctGuessIds.has(a.answerPoolItemId),
    }));

    return NextResponse.json({
      puzzle: {
        id: puzzle.id,
        topic: puzzle.topic,
        description: puzzle.description,
        source: puzzle.source,
        scheduledFor: puzzle.scheduledFor,
      },
      vertical: {
        id: puzzle.vertical.id,
        slug: puzzle.vertical.slug,
        name: puzzle.vertical.name,
      },
      sessionState: {
        numCorrect: summary?.numCorrect ?? 0,
        numGuesses: summary?.numGuesses ?? 0,
        completed: isCompleted,
        revealedAnswers,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Puzzle GET error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
