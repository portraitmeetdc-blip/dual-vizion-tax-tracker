export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { expenses, mileageLog } from "@/db/schema";
import { initializeDatabase } from "@/db/init";
import { IRS_MILEAGE_RATES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  await initializeDatabase();
  const body = await request.json();
  const { type, items, taxYear } = body;

  if (type === "amazon") {
    let count = 0;
    for (const item of items) {
      await db.insert(expenses).values({
        taxYear,
        categoryId: item.categoryId,
        description: item.description,
        date: item.date || null,
        amount: item.amount || 0,
        notes: item.notes || "Imported from Amazon",
        isRecurring: false,
        recurrenceType: null,
        isCarriedForward: false,
      });
      count++;
    }
    return NextResponse.json({ success: true, imported: count });
  }

  if (type === "csv") {
    let count = 0;
    for (const item of items) {
      await db.insert(expenses).values({
        taxYear,
        categoryId: item.categoryId,
        description: item.description,
        date: item.date || null,
        amount: item.amount || 0,
        notes: item.notes || "Imported from CSV",
        isRecurring: false,
        recurrenceType: null,
        isCarriedForward: false,
      });
      count++;
    }
    return NextResponse.json({ success: true, imported: count });
  }

  if (type === "mileiq") {
    const rate = IRS_MILEAGE_RATES[taxYear] || 0.7;
    let count = 0;
    for (const item of items) {
      const deduction = (item.miles || 0) * rate + (item.parking || 0) + (item.tolls || 0);
      await db.insert(mileageLog).values({
        taxYear,
        date: item.date,
        startLocation: item.startLocation || null,
        stopLocation: item.stopLocation || null,
        miles: item.miles || 0,
        parking: item.parking || 0,
        tolls: item.tolls || 0,
        purpose: item.purpose || null,
        deductionAmount: deduction,
      });
      count++;
    }
    return NextResponse.json({ success: true, imported: count });
  }

  return NextResponse.json({ error: "Unknown import type" }, { status: 400 });
}
