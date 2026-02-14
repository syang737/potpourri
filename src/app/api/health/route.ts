import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, { ok: boolean; error?: string; ms?: number }> =
    {};

  // Check DATABASE_URL is set
  checks.env = {
    ok: !!process.env.DATABASE_URL,
    error: process.env.DATABASE_URL
      ? undefined
      : "DATABASE_URL is not set",
  };

  // Check database connectivity
  if (checks.env.ok) {
    const start = Date.now();
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      checks.database = { ok: true, ms: Date.now() - start };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      checks.database = { ok: false, error: message, ms: Date.now() - start };
    }
  } else {
    checks.database = { ok: false, error: "Skipped — no DATABASE_URL" };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { status: allOk ? "healthy" : "unhealthy", checks },
    { status: allOk ? 200 : 503 }
  );
}
