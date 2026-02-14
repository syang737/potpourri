import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSession } from "@/lib/session";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: puzzleId } = await params;
    const sessionId = await getOrCreateSession();

    const puzzle = await prisma.puzzle.findUnique({
      where: { id: puzzleId },
      include: {
        answers: {
          include: { answerPoolItem: true },
          orderBy: { rank: "asc" },
        },
      },
    });

    if (!puzzle || puzzle.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    // Upsert summary and mark completed
    const existing = await prisma.sessionPuzzleSummary.findUnique({
      where: { puzzleId_sessionId: { puzzleId, sessionId } },
    });

    if (existing) {
      if (!existing.completedAt) {
        await prisma.sessionPuzzleSummary.update({
          where: { puzzleId_sessionId: { puzzleId, sessionId } },
          data: { completedAt: new Date() },
        });
      }
    } else {
      await prisma.sessionPuzzleSummary.create({
        data: {
          puzzleId,
          sessionId,
          numCorrect: 0,
          numGuesses: 0,
          completedAt: new Date(),
        },
      });
    }

    const answers = puzzle.answers.map((a) => ({
      rank: a.rank,
      answerPoolItemId: a.answerPoolItemId,
      label: a.answerPoolItem.label,
    }));

    return NextResponse.json({ answers });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Puzzle reveal POST error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
