export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { initializeDatabase } from "@/db/init";

export async function GET() {
  await initializeDatabase();
  const results = await db.select().from(businessSettings).limit(1);
  if (results.length === 0) {
    return NextResponse.json({
      id: 0,
      businessName: "Dual Vizion Photography",
      ownerName: "M. Edwards",
      currentTaxYear: 2025,
      phoneBusinessPct: 100,
      internetBusinessPct: 100,
      mileageMethod: "standard",
    });
  }
  return NextResponse.json(results[0]);
}

export async function PUT(request: NextRequest) {
  await initializeDatabase();
  const body = await request.json();
  const existing = await db.select().from(businessSettings).limit(1);

  if (existing.length === 0) {
    const result = await db.insert(businessSettings).values({
      businessName: body.businessName,
      ownerName: body.ownerName,
      currentTaxYear: body.currentTaxYear,
      phoneBusinessPct: body.phoneBusinessPct,
      internetBusinessPct: body.internetBusinessPct,
      mileageMethod: body.mileageMethod,
    }).returning();
    return NextResponse.json(result[0]);
  }

  const result = await db
    .update(businessSettings)
    .set({
      businessName: body.businessName,
      ownerName: body.ownerName,
      currentTaxYear: body.currentTaxYear,
      phoneBusinessPct: body.phoneBusinessPct,
      internetBusinessPct: body.internetBusinessPct,
      mileageMethod: body.mileageMethod,
    })
    .where(eq(businessSettings.id, existing[0].id))
    .returning();

  return NextResponse.json(result[0]);
}
