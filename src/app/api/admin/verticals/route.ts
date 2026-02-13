import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const verticals = await prisma.vertical.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ verticals });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, name, description } = body;

  if (!slug || !name) {
    return NextResponse.json(
      { error: "slug and name are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9_]+$/.test(slug)) {
    return NextResponse.json(
      { error: "slug must be lowercase alphanumeric with underscores" },
      { status: 400 }
    );
  }

  const vertical = await prisma.vertical.create({
    data: { slug, name, description },
  });

  return NextResponse.json({ vertical }, { status: 201 });
}
