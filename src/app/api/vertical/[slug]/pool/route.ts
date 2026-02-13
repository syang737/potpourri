import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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
}
