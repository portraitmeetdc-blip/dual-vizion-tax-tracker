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
    const MILEAGE_CATEGORY_ID = 1; // Mileage Expenses - Line 9: Car & Truck Expenses
    const rate = IRS_MILEAGE_RATES[taxYear] || 0.7;
    let count = 0;
    for (const item of items) {
      const deduction = (item.miles || 0) * rate + (item.parking || 0) + (item.tolls || 0);
      const description = item.startLocation && item.stopLocation
        ? `${item.startLocation} → ${item.stopLocation}`
        : item.purpose || "Business drive";
      const parts = [];
      parts.push(`${(item.miles || 0).toFixed(1)} mi @ $${rate}/mi`);
      if (item.parking > 0) parts.push(`Parking: $${item.parking.toFixed(2)}`);
      if (item.tolls > 0) parts.push(`Tolls: $${item.tolls.toFixed(2)}`);
      if (item.purpose) parts.push(item.purpose);

      // Insert into expenses table under Mileage Expenses category
      await db.insert(expenses).values({
        taxYear,
        categoryId: MILEAGE_CATEGORY_ID,
        description,
        date: item.date || null,
        amount: deduction,
        notes: parts.join(" | "),
        isRecurring: false,
        recurrenceType: null,
        isCarriedForward: false,
      });

      // Also keep in mileage_log for detailed records
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
