import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, { ok: boolean; error?: string; ms?: number; hint?: string }> =
    {};

  const dbUrl = process.env.DATABASE_URL;

  // Check DATABASE_URL is set and looks valid
  checks.env = {
    ok: !!dbUrl,
    error: dbUrl ? undefined : "DATABASE_URL is not set",
    // Show redacted preview: protocol + host only, mask credentials
    hint: dbUrl
      ? (() => {
          try {
            const u = new URL(dbUrl);
            return `${u.protocol}//${u.username ? "***@" : ""}${u.host}${u.pathname}`;
          } catch {
            return `invalid URL (length=${dbUrl.length}, starts="${dbUrl.substring(0, 15)}...")`;
          }
        })()
      : undefined,
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
