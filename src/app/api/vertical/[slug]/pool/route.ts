import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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

    return NextResponse.json({ items });
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
