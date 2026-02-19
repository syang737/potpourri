import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma and session
const mockStatsFindUnique = vi.fn();
const mockSummaryFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    puzzleStats: { findUnique: (...args: unknown[]) => mockStatsFindUnique(...args) },
    sessionPuzzleSummary: { findUnique: (...args: unknown[]) => mockSummaryFindUnique(...args) },
  },
}));

vi.mock("@/lib/session", () => ({
  getOrCreateSession: () => Promise.resolve("session-1"),
}));

import { GET } from "@/app/api/puzzle/[id]/stats/route";

function makeRequest(puzzleId: string) {
  const request = new Request(`http://localhost/api/puzzle/${puzzleId}/stats`);
  const params = Promise.resolve({ id: puzzleId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return GET(request as any, { params });
}

describe("GET /api/puzzle/[id]/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns scoreHistogram and percentile when stats exist", async () => {
    const scoreHistogram: Record<string, number> = {};
    for (let i = 0; i <= 10; i++) scoreHistogram[String(i)] = 0;
    scoreHistogram["3"] = 2;
    scoreHistogram["7"] = 5;
    scoreHistogram["10"] = 3;

    mockStatsFindUnique.mockResolvedValue({
      puzzleId: "p1",
      numSessions: 10,
      scoreHistogram,
      guessHistogram: {},
    });
    mockSummaryFindUnique.mockResolvedValue({
      puzzleId: "p1",
      sessionId: "session-1",
      numCorrect: 7,
      numGuesses: 12,
    });

    const res = await makeRequest("p1");
    const body = await res.json();

    expect(body.scoreHistogram).toEqual(scoreHistogram);
    expect(body.userScore).toBe(7);
    expect(body.numSessions).toBe(10);
    // Percentile: scores <= 7 are buckets 0-7.
    // 0+0+0+2+0+0+0+5 = 7 out of 10 → 70%
    expect(body.percentile).toBe(70);
  });

  it("returns empty histogram and null percentile when no stats exist", async () => {
    mockStatsFindUnique.mockResolvedValue(null);
    mockSummaryFindUnique.mockResolvedValue(null);

    const res = await makeRequest("p1");
    const body = await res.json();

    expect(body.scoreHistogram).toEqual({});
    expect(body.percentile).toBeNull();
    expect(body.userScore).toBeNull();
    expect(body.numSessions).toBe(0);
  });

  it("returns null percentile when stats exist but user has no summary", async () => {
    mockStatsFindUnique.mockResolvedValue({
      puzzleId: "p1",
      numSessions: 5,
      scoreHistogram: { "10": 5 },
      guessHistogram: {},
    });
    mockSummaryFindUnique.mockResolvedValue(null);

    const res = await makeRequest("p1");
    const body = await res.json();

    expect(body.numSessions).toBe(5);
    expect(body.percentile).toBeNull();
    expect(body.userScore).toBeNull();
  });

  it("computes 100% percentile for perfect score when all scored 10", async () => {
    const scoreHistogram: Record<string, number> = {};
    for (let i = 0; i <= 10; i++) scoreHistogram[String(i)] = 0;
    scoreHistogram["10"] = 5;

    mockStatsFindUnique.mockResolvedValue({
      puzzleId: "p1",
      numSessions: 5,
      scoreHistogram,
      guessHistogram: {},
    });
    mockSummaryFindUnique.mockResolvedValue({
      numCorrect: 10,
      numGuesses: 10,
    });

    const res = await makeRequest("p1");
    const body = await res.json();

    // All 5 sessions scored <= 10, so 5/5 = 100%
    expect(body.percentile).toBe(100);
  });

  it("computes correct percentile for lowest score", async () => {
    const scoreHistogram: Record<string, number> = {};
    for (let i = 0; i <= 10; i++) scoreHistogram[String(i)] = 0;
    scoreHistogram["0"] = 1;
    scoreHistogram["5"] = 4;
    scoreHistogram["10"] = 5;

    mockStatsFindUnique.mockResolvedValue({
      puzzleId: "p1",
      numSessions: 10,
      scoreHistogram,
      guessHistogram: {},
    });
    mockSummaryFindUnique.mockResolvedValue({
      numCorrect: 0,
      numGuesses: 5,
    });

    const res = await makeRequest("p1");
    const body = await res.json();

    // Only 1 session scored <= 0, so 1/10 = 10%
    expect(body.percentile).toBe(10);
  });
});
