import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    return NextResponse.json(
      { error: "CSV must have a header row and at least one data row" },
      { status: 400 }
    );
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const labelIndex = headers.indexOf("label");
  if (labelIndex === -1) {
    return NextResponse.json(
      { error: "CSV must have a 'label' column" },
      { status: 400 }
    );
  }

  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const label = cols[labelIndex]?.trim();
    if (!label) {
      skipped++;
      continue;
    }

    const normalizedLabel = label.toLowerCase().trim();

    // Build metadata from remaining columns
    const metadata: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (idx !== labelIndex && cols[idx]) {
        metadata[h] = cols[idx].trim();
      }
    });

    try {
      await prisma.answerPoolItem.upsert({
        where: {
          verticalId_normalizedLabel: { verticalId, normalizedLabel },
        },
        create: {
          verticalId,
          label,
          normalizedLabel,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        },
        update: {
          label,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ imported, skipped });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
