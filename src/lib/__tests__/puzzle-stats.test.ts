import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing the module under test
const mockFindMany = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sessionPuzzleSummary: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    puzzleStats: { upsert: (...args: unknown[]) => mockUpsert(...args) },
  },
}));

import { updatePuzzleStats } from "@/lib/puzzle-stats";

describe("updatePuzzleStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({});
  });

  it("builds a score histogram with all 11 buckets (0-10) initialized to 0", async () => {
    mockFindMany.mockResolvedValue([]);

    await updatePuzzleStats("puzzle-1");

    const upsertCall = mockUpsert.mock.calls[0][0];
    const histogram = upsertCall.create.scoreHistogram;

    // All 11 buckets should exist
    for (let i = 0; i <= 10; i++) {
      expect(histogram[String(i)]).toBe(0);
    }
    expect(Object.keys(histogram)).toHaveLength(11);
  });

  it("correctly counts sessions by score", async () => {
    mockFindMany.mockResolvedValue([
      { numCorrect: 7, numGuesses: 10, completedAt: new Date() },
      { numCorrect: 7, numGuesses: 12, completedAt: new Date() },
      { numCorrect: 10, numGuesses: 10, completedAt: new Date() },
      { numCorrect: 3, numGuesses: 8, completedAt: new Date() },
    ]);

    await updatePuzzleStats("puzzle-1");

    const upsertCall = mockUpsert.mock.calls[0][0];
    const scoreHistogram = upsertCall.create.scoreHistogram;

    expect(scoreHistogram["7"]).toBe(2);
    expect(scoreHistogram["10"]).toBe(1);
    expect(scoreHistogram["3"]).toBe(1);
    expect(scoreHistogram["0"]).toBe(0);
    expect(scoreHistogram["5"]).toBe(0);
  });

  it("builds a guess histogram from session data", async () => {
    mockFindMany.mockResolvedValue([
      { numCorrect: 10, numGuesses: 10, completedAt: new Date() },
      { numCorrect: 5, numGuesses: 10, completedAt: new Date() },
      { numCorrect: 8, numGuesses: 13, completedAt: new Date() },
    ]);

    await updatePuzzleStats("puzzle-1");

    const upsertCall = mockUpsert.mock.calls[0][0];
    const guessHistogram = upsertCall.create.guessHistogram;

    expect(guessHistogram["10"]).toBe(2);
    expect(guessHistogram["13"]).toBe(1);
  });

  it("upserts with correct numSessions count", async () => {
    mockFindMany.mockResolvedValue([
      { numCorrect: 5, numGuesses: 8, completedAt: new Date() },
      { numCorrect: 3, numGuesses: 6, completedAt: new Date() },
    ]);

    await updatePuzzleStats("puzzle-1");

    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.create.numSessions).toBe(2);
    expect(upsertCall.update.numSessions).toBe(2);
    expect(upsertCall.where.puzzleId).toBe("puzzle-1");
  });

  it("queries only completed sessions", async () => {
    mockFindMany.mockResolvedValue([]);

    await updatePuzzleStats("puzzle-1");

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { puzzleId: "puzzle-1", completedAt: { not: null } },
    });
  });

  it("handles sessions with 0 correct answers (give-up with no guesses)", async () => {
    mockFindMany.mockResolvedValue([
      { numCorrect: 0, numGuesses: 0, completedAt: new Date() },
      { numCorrect: 0, numGuesses: 3, completedAt: new Date() },
    ]);

    await updatePuzzleStats("puzzle-1");

    const upsertCall = mockUpsert.mock.calls[0][0];
    const scoreHistogram = upsertCall.create.scoreHistogram;

    expect(scoreHistogram["0"]).toBe(2);
    expect(scoreHistogram["1"]).toBe(0);
  });
});
