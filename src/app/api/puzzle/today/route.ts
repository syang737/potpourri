import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const sessionId = await getOrCreateSession();
    const verticalSlug = request.nextUrl.searchParams.get("vertical");
    const tz = request.nextUrl.searchParams.get("tz") || "UTC";

    // Compute "today" in the user's local timezone
    const nowInTz = new Date(
      new Date().toLocaleString("en-US", { timeZone: tz })
    );
    const today = new Date(
      Date.UTC(nowInTz.getFullYear(), nowInTz.getMonth(), nowInTz.getDate())
    );
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
      scheduledFor: { gte: today, lt: tomorrow },
    };

    if (verticalSlug) {
      const vertical = await prisma.vertical.findUnique({
        where: { slug: verticalSlug },
      });
      if (!vertical) {
        return NextResponse.json({ error: "Vertical not found" }, { status: 404 });
      }
      where.verticalId = vertical.id;
    }

    let puzzle = await prisma.puzzle.findFirst({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        vertical: true,
        answers: {
          include: { answerPoolItem: true },
          orderBy: { rank: "asc" },
        },
      },
    });

    // Fallback to most recent published puzzle
    if (!puzzle) {
      const fallbackWhere: Record<string, unknown> = { status: "PUBLISHED" };
      if (verticalSlug) {
        const vertical = await prisma.vertical.findUnique({
          where: { slug: verticalSlug },
        });
        if (vertical) fallbackWhere.verticalId = vertical.id;
      }
      puzzle = await prisma.puzzle.findFirst({
        where: fallbackWhere,
        orderBy: { scheduledFor: "desc" },
        include: {
          vertical: true,
          answers: {
            include: { answerPoolItem: true },
            orderBy: { rank: "asc" },
          },
        },
      });
    }

    if (!puzzle) {
      return NextResponse.json({ error: "No puzzle available" }, { status: 404 });
    }

    // Get session state
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

    // Only reveal answers the user has correctly guessed (or all if completed)
    const isCompleted = !!summary?.completedAt;
    const revealedAnswers = puzzle.answers.map((a) => ({
      rank: a.rank,
      answerPoolItemId: a.answerPoolItemId,
      label: isCompleted || correctGuessIds.has(a.answerPoolItemId)
        ? a.answerPoolItem.label
        : null,
      revealed: isCompleted || correctGuessIds.has(a.answerPoolItemId),
      guessed: correctGuessIds.has(a.answerPoolItemId),
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
    console.error("Puzzle today GET error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
