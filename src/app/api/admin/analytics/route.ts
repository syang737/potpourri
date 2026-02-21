import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    await requireAdmin();

    // Daily completed player counts for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const completedSummaries = await prisma.sessionPuzzleSummary.findMany({
      where: {
        completedAt: { gte: thirtyDaysAgo },
      },
      select: {
        completedAt: true,
      },
    });

    // Group by date
    const dailyCounts: Record<string, number> = {};
    for (const s of completedSummaries) {
      if (!s.completedAt) continue;
      const dateKey = s.completedAt.toISOString().split("T")[0];
      dailyCounts[dateKey] = (dailyCounts[dateKey] ?? 0) + 1;
    }

    // Build array for last 30 days (fill in zeros)
    const dailyPlayers: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyPlayers.push({ date: key, count: dailyCounts[key] ?? 0 });
    }

    // Today's puzzle score distribution
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPuzzle = await prisma.puzzle.findFirst({
      where: {
        status: "PUBLISHED",
        scheduledFor: { gte: today, lt: tomorrow },
      },
      include: {
        stats: true,
      },
    });

    let scoreHistogram: Record<string, number> | null = null;
    let todayTopic: string | null = null;
    let todayPlayers = 0;

    if (todayPuzzle?.stats) {
      scoreHistogram = todayPuzzle.stats.scoreHistogram as Record<string, number>;
      todayTopic = todayPuzzle.topic;
      todayPlayers = todayPuzzle.stats.numSessions;
    }

    return NextResponse.json({
      dailyPlayers,
      todayScoreHistogram: scoreHistogram,
      todayTopic,
      todayPlayers,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Admin analytics GET error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
