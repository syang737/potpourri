import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CachedPool {
  items: { id: string; label: string; normalizedLabel: string; metadata: unknown }[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const poolCache = new Map<string, CachedPool>();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const now = Date.now();
    const cached = poolCache.get(slug);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json(
        { items: cached.items },
        {
          headers: {
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=1800",
          },
        }
      );
    }

    const vertical = await prisma.vertical.findUnique({
      where: { slug },
    });

    if (!vertical) {
      return NextResponse.json({ error: "Vertical not found" }, { status: 404 });
    }

    const items = await prisma.answerPoolItem.findMany({
      where: { verticalId: vertical.id },
      select: { id: true, label: true, normalizedLabel: true, metadata: true },
      orderBy: { label: "asc" },
    });

    poolCache.set(slug, { items, fetchedAt: now });

    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Vertical pool GET error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
