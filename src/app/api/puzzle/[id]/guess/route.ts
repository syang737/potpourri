import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSession } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: puzzleId } = await params;
  const sessionId = await getOrCreateSession();

  const body = await request.json();
  const { answerPoolItemId } = body;

  if (!answerPoolItemId || typeof answerPoolItemId !== "string") {
    return NextResponse.json(
      { error: "answerPoolItemId is required" },
      { status: 400 }
    );
  }

  const puzzle = await prisma.puzzle.findUnique({
    where: { id: puzzleId },
    include: { answers: true },
  });

  if (!puzzle || puzzle.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  }

  // Check the answer belongs to the same vertical
  const answerItem = await prisma.answerPoolItem.findUnique({
    where: { id: answerPoolItemId },
  });
  if (!answerItem || answerItem.verticalId !== puzzle.verticalId) {
    return NextResponse.json(
      { error: "Invalid answer for this puzzle" },
      { status: 400 }
    );
  }

  // Check if puzzle already completed for this session
  const existingSummary = await prisma.sessionPuzzleSummary.findUnique({
    where: { puzzleId_sessionId: { puzzleId, sessionId } },
  });
  if (existingSummary?.completedAt) {
    return NextResponse.json(
      { error: "Puzzle already completed" },
      { status: 400 }
    );
  }

  // Check if already guessed this answer correctly
  const alreadyGuessed = await prisma.guessLog.findFirst({
    where: { puzzleId, sessionId, answerPoolItemId, isCorrect: true },
  });
  if (alreadyGuessed) {
    return NextResponse.json(
      { error: "Already guessed this answer correctly" },
      { status: 400 }
    );
  }

  // Determine guess order
  const guessCount = await prisma.guessLog.count({
    where: { puzzleId, sessionId },
  });

  // Check if correct
  const puzzleAnswer = puzzle.answers.find(
    (a) => a.answerPoolItemId === answerPoolItemId
  );
  const isCorrect = !!puzzleAnswer;

  // Create guess log
  await prisma.guessLog.create({
    data: {
      puzzleId,
      sessionId,
      answerPoolItemId,
      isCorrect,
      guessOrder: guessCount + 1,
    },
  });

  // Upsert summary
  const currentCorrect = existingSummary?.numCorrect ?? 0;
  const newCorrect = isCorrect ? currentCorrect + 1 : currentCorrect;
  const newGuesses = (existingSummary?.numGuesses ?? 0) + 1;
  const puzzleComplete = newCorrect === 10;

  await prisma.sessionPuzzleSummary.upsert({
    where: { puzzleId_sessionId: { puzzleId, sessionId } },
    create: {
      puzzleId,
      sessionId,
      numCorrect: isCorrect ? 1 : 0,
      numGuesses: 1,
      completedAt: puzzleComplete ? new Date() : null,
    },
    update: {
      numCorrect: newCorrect,
      numGuesses: newGuesses,
      completedAt: puzzleComplete ? new Date() : undefined,
    },
  });

  // Update puzzle stats if completed
  if (puzzleComplete) {
    await updatePuzzleStats(puzzleId);
  }

  // Build revealed answers
  const allGuesses = await prisma.guessLog.findMany({
    where: { puzzleId, sessionId, isCorrect: true },
  });
  const correctIds = new Set(allGuesses.map((g) => g.answerPoolItemId));

  const answers = await prisma.puzzleAnswer.findMany({
    where: { puzzleId },
    include: { answerPoolItem: true },
    orderBy: { rank: "asc" },
  });

  const revealedAnswers = answers.map((a) => ({
    rank: a.rank,
    answerPoolItemId: a.answerPoolItemId,
    label: correctIds.has(a.answerPoolItemId)
      ? a.answerPoolItem.label
      : null,
    revealed: correctIds.has(a.answerPoolItemId),
  }));

  return NextResponse.json({
    isCorrect,
    rank: puzzleAnswer?.rank ?? null,
    label: isCorrect ? answerItem.label : null,
    numCorrect: newCorrect,
    numGuesses: newGuesses,
    puzzleComplete,
    revealedAnswers,
  });
}

async function updatePuzzleStats(puzzleId: string) {
  const summaries = await prisma.sessionPuzzleSummary.findMany({
    where: { puzzleId, completedAt: { not: null } },
  });

  const scoreHistogram: Record<string, number> = {};
  const guessHistogram: Record<string, number> = {};
  for (let i = 0; i <= 10; i++) scoreHistogram[String(i)] = 0;

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
