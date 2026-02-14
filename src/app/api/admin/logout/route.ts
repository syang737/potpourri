import { NextResponse } from "next/server";
import { adminLogout } from "@/lib/admin-auth";

export async function POST() {
  try {
    await adminLogout();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Admin logout error:", err);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
