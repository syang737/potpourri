import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const puzzle = await prisma.puzzle.findUnique({
    where: { id },
    include: { answers: true },
  });

  if (!puzzle) {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  }

  if (puzzle.answers.length !== 10) {
    return NextResponse.json(
      { error: "Puzzle must have exactly 10 answers to publish" },
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

  // Initialize puzzle stats
  await prisma.puzzleStats.upsert({
    where: { puzzleId: id },
    create: {
      puzzleId: id,
      numSessions: 0,
      scoreHistogram: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0 },
      guessHistogram: {},
    },
    update: {},
  });

  return NextResponse.json({ puzzle: updated });
}
