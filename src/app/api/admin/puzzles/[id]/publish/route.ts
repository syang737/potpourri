import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const puzzle = await prisma.puzzle.findUnique({
      where: { id },
      include: { answers: true },
    });

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    if (puzzle.answers.length < 1) {
      return NextResponse.json(
        { error: "Puzzle must have at least 1 answer to publish" },
        { status: 400 }
      );
    }

    const updated = await prisma.puzzle.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        scheduledFor: puzzle.scheduledFor ?? new Date(),
      },
      include: {
        answers: { include: { answerPoolItem: true }, orderBy: { rank: "asc" } },
        vertical: true,
      },
    });

    // Initialize puzzle stats with dynamic score histogram based on answer count
    const scoreHistogram: Record<string, number> = {};
    for (let i = 0; i <= puzzle.answers.length; i++) {
      scoreHistogram[String(i)] = 0;
    }
    await prisma.puzzleStats.upsert({
      where: { puzzleId: id },
      create: {
        puzzleId: id,
        numSessions: 0,
        scoreHistogram,
        guessHistogram: {},
      },
      update: {},
    });

    return NextResponse.json({ puzzle: updated });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Admin puzzle publish error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
