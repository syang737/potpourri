import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const normalized = query.toLowerCase().trim();
    if (!normalized) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.answerPoolItem.findMany({
      where: {
        verticalId: vertical.id,
        normalizedLabel: { contains: normalized },
      },
      select: { id: true, label: true, normalizedLabel: true, metadata: true },
      take: limit,
      orderBy: { label: "asc" },
    });

    return NextResponse.json({ items });
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
