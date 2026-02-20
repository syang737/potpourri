import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const vertical = await prisma.vertical.findUnique({ where: { id } });

    if (!vertical) {
      return NextResponse.json({ error: "Vertical not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;

    const updated = await prisma.vertical.update({
      where: { id },
      data,
    });

    return NextResponse.json({ vertical: updated });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Admin vertical PUT error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
