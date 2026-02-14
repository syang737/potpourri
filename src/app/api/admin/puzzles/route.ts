import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const verticalId = request.nextUrl.searchParams.get("verticalId");
    const status = request.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (verticalId) where.verticalId = verticalId;
    if (status) where.status = status;

    const puzzles = await prisma.puzzle.findMany({
      where,
      include: {
        vertical: true,
        answers: { include: { answerPoolItem: true }, orderBy: { rank: "asc" } },
      },
      orderBy: { scheduledFor: "desc" },
    });

    return NextResponse.json({ puzzles });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Admin puzzles GET error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { verticalId, topic, description, scheduledFor, status, answers } = body;

    if (!verticalId || !topic || !scheduledFor || !answers) {
      return NextResponse.json(
        { error: "verticalId, topic, scheduledFor, and answers are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers) || answers.length !== 10) {
      return NextResponse.json(
        { error: "Exactly 10 answers are required" },
        { status: 400 }
      );
    }

    // Validate answers belong to the vertical
    const answerIds = answers.map(
      (a: { answerPoolItemId: string }) => a.answerPoolItemId
    );
    const poolItems = await prisma.answerPoolItem.findMany({
      where: { id: { in: answerIds }, verticalId },
    });
    if (poolItems.length !== 10) {
      return NextResponse.json(
        { error: "All answers must belong to the specified vertical" },
        { status: 400 }
      );
    }

    // Validate ranks 1-10
    const ranks = answers.map((a: { rank: number }) => a.rank).sort();
    const expectedRanks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) {
      return NextResponse.json(
        { error: "Answers must have unique ranks 1 through 10" },
        { status: 400 }
      );
    }

    const puzzleStatus = status === "SCHEDULED" ? "SCHEDULED" : "DRAFT";

    const puzzle = await prisma.puzzle.create({
      data: {
        verticalId,
        topic,
        description,
        scheduledFor: new Date(scheduledFor),
        status: puzzleStatus,
        answers: {
          create: answers.map(
            (a: { answerPoolItemId: string; rank: number }) => ({
              answerPoolItemId: a.answerPoolItemId,
              rank: a.rank,
            })
          ),
        },
      },
      include: {
        answers: { include: { answerPoolItem: true }, orderBy: { rank: "asc" } },
        vertical: true,
      },
    });

    return NextResponse.json({ puzzle }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Admin puzzles POST error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
