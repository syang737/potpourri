-- CreateEnum
CREATE TYPE "PuzzleStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('EDITOR', 'ADMIN');

-- CreateTable
CREATE TABLE "Vertical" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vertical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerPoolItem" (
    "id" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "normalizedLabel" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerPoolItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Puzzle" (
    "id" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "PuzzleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Puzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuzzleAnswer" (
    "puzzleId" TEXT NOT NULL,
    "answerPoolItemId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "PuzzleAnswer_pkey" PRIMARY KEY ("puzzleId","answerPoolItemId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuessLog" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "answerPoolItemId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "guessOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPuzzleSummary" (
    "puzzleId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "numCorrect" INTEGER NOT NULL DEFAULT 0,
    "numGuesses" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SessionPuzzleSummary_pkey" PRIMARY KEY ("puzzleId","sessionId")
);

-- CreateTable
CREATE TABLE "PuzzleStats" (
    "puzzleId" TEXT NOT NULL,
    "numSessions" INTEGER NOT NULL DEFAULT 0,
    "scoreHistogram" JSONB NOT NULL,
    "guessHistogram" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PuzzleStats_pkey" PRIMARY KEY ("puzzleId")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vertical_slug_key" ON "Vertical"("slug");

-- CreateIndex
CREATE INDEX "AnswerPoolItem_verticalId_normalizedLabel_idx" ON "AnswerPoolItem"("verticalId", "normalizedLabel");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerPoolItem_verticalId_normalizedLabel_key" ON "AnswerPoolItem"("verticalId", "normalizedLabel");

-- CreateIndex
CREATE INDEX "Puzzle_verticalId_scheduledFor_status_idx" ON "Puzzle"("verticalId", "scheduledFor", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleAnswer_puzzleId_rank_key" ON "PuzzleAnswer"("puzzleId", "rank");

-- CreateIndex
CREATE INDEX "GuessLog_puzzleId_sessionId_idx" ON "GuessLog"("puzzleId", "sessionId");

-- CreateIndex
CREATE INDEX "GuessLog_sessionId_idx" ON "GuessLog"("sessionId");

-- CreateIndex
CREATE INDEX "SessionPuzzleSummary_puzzleId_idx" ON "SessionPuzzleSummary"("puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "AnswerPoolItem" ADD CONSTRAINT "AnswerPoolItem_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Puzzle" ADD CONSTRAINT "Puzzle_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleAnswer" ADD CONSTRAINT "PuzzleAnswer_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleAnswer" ADD CONSTRAINT "PuzzleAnswer_answerPoolItemId_fkey" FOREIGN KEY ("answerPoolItemId") REFERENCES "AnswerPoolItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuessLog" ADD CONSTRAINT "GuessLog_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuessLog" ADD CONSTRAINT "GuessLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuessLog" ADD CONSTRAINT "GuessLog_answerPoolItemId_fkey" FOREIGN KEY ("answerPoolItemId") REFERENCES "AnswerPoolItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPuzzleSummary" ADD CONSTRAINT "SessionPuzzleSummary_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPuzzleSummary" ADD CONSTRAINT "SessionPuzzleSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleStats" ADD CONSTRAINT "PuzzleStats_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
