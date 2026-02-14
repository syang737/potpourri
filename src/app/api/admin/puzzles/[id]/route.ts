import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const puzzle = await prisma.puzzle.findUnique({ where: { id } });

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    if (puzzle.status !== "DRAFT" && puzzle.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Can only edit DRAFT or SCHEDULED puzzles" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { topic, description, scheduledFor, status } = body;

    const data: Record<string, unknown> = {};
    if (topic) data.topic = topic;
    if (description !== undefined) data.description = description;
    if (scheduledFor) data.scheduledFor = new Date(scheduledFor);
    if (status && ["DRAFT", "SCHEDULED"].includes(status)) data.status = status;

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
