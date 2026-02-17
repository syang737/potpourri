import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expandQuery } from "@/lib/aliases";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const query = request.nextUrl.searchParams.get("query") ?? "";
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10),
      50
    );

    const vertical = await prisma.vertical.findUnique({
      where: { slug },
    });

    if (!vertical) {
      return NextResponse.json({ error: "Vertical not found" }, { status: 404 });
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return NextResponse.json({ items: [] });
    }

    // Expand query with aliases for loose matching
    const queries = expandQuery(trimmed);

    // Search for all expanded queries
    const items = await prisma.answerPoolItem.findMany({
      where: {
        verticalId: vertical.id,
        OR: queries.map((q) => ({
          normalizedLabel: { contains: q.toLowerCase() },
        })),
      },
      select: { id: true, label: true, normalizedLabel: true, metadata: true },
      take: limit,
      orderBy: { label: "asc" },
    });

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return NextResponse.json({ items: unique });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Vertical search GET error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
