import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const puzzle = await prisma.puzzle.findUnique({
      where: { id },
      include: {
        vertical: true,
        answers: { include: { answerPoolItem: true }, orderBy: { rank: "asc" } },
      },
    });

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    return NextResponse.json({ puzzle });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const puzzle = await prisma.puzzle.findUnique({
      where: { id },
      include: { vertical: true },
    });

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    const body = await request.json();
    const { topic, description, source, scheduledFor, status, answers } = body;

    const data: Record<string, unknown> = {};
    if (topic) data.topic = topic;
    if (description !== undefined) data.description = description;
    if (source !== undefined) data.source = source;
    if (scheduledFor) data.scheduledFor = new Date(scheduledFor);
    if (status && ["DRAFT", "SCHEDULED"].includes(status)) data.status = status;

    // If answers provided, validate and replace them
    if (answers !== undefined) {
      if (!Array.isArray(answers) || answers.length !== 10) {
        return NextResponse.json(
          { error: "Exactly 10 answers are required" },
          { status: 400 }
        );
      }

      const answerIds = answers.map(
        (a: { answerPoolItemId: string }) => a.answerPoolItemId
      );
      const poolItems = await prisma.answerPoolItem.findMany({
        where: { id: { in: answerIds }, verticalId: puzzle.verticalId },
      });
      if (poolItems.length !== 10) {
        return NextResponse.json(
          { error: "All answers must belong to the puzzle's vertical" },
          { status: 400 }
        );
      }

      const ranks = answers
        .map((a: { rank: number }) => a.rank)
        .sort((a: number, b: number) => a - b);
      const expectedRanks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) {
        return NextResponse.json(
          { error: "Answers must have unique ranks 1 through 10" },
          { status: 400 }
        );
      }

      // Delete existing answers and recreate
      await prisma.puzzleAnswer.deleteMany({ where: { puzzleId: id } });
      data.answers = {
        create: answers.map((a: { answerPoolItemId: string; rank: number }) => ({
          answerPoolItemId: a.answerPoolItemId,
          rank: a.rank,
        })),
      };
    }

    const updated = await prisma.puzzle.update({
      where: { id },
      data,
      include: {
        answers: { include: { answerPoolItem: true }, orderBy: { rank: "asc" } },
        vertical: true,
      },
    });

    return NextResponse.json({ puzzle: updated });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Admin puzzle PUT error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
