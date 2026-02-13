import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const query = request.nextUrl.searchParams.get("query") ?? "";
  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
  const pageSize = 50;

  const where: Record<string, unknown> = { verticalId: id };
  if (query) {
    where.normalizedLabel = { contains: query.toLowerCase().trim() };
  }

  const [items, total] = await Promise.all([
    prisma.answerPoolItem.findMany({
      where,
      orderBy: { label: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.answerPoolItem.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: verticalId } = await params;
  const body = await request.json();
  const { label, metadata } = body;

  if (!label || typeof label !== "string") {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const normalizedLabel = label.toLowerCase().trim();

  const item = await prisma.answerPoolItem.create({
    data: { verticalId, label, normalizedLabel, metadata: metadata ?? null },
  });

  return NextResponse.json({ item }, { status: 201 });
}
