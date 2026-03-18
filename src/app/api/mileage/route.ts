import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { mileageLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { initializeDatabase } from "@/db/init";

initializeDatabase();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taxYear = parseInt(searchParams.get("year") || "2025");

  const results = await db
    .select()
    .from(mileageLog)
    .where(eq(mileageLog.taxYear, taxYear))
    .orderBy(mileageLog.date);

  return NextResponse.json(results);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await db.delete(mileageLog).where(eq(mileageLog.id, id));
  return NextResponse.json({ success: true });
}
