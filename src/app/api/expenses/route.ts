export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { expenses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { initializeDatabase } from "@/db/init";

export async function GET(request: NextRequest) {
  await initializeDatabase();
  const { searchParams } = new URL(request.url);
  const taxYear = parseInt(searchParams.get("year") || "2025");

  const results = await db
    .select()
    .from(expenses)
    .where(eq(expenses.taxYear, taxYear))
    .orderBy(expenses.categoryId, expenses.date);

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  await initializeDatabase();
  const body = await request.json();
  const result = await db.insert(expenses).values({
    taxYear: body.taxYear,
    categoryId: body.categoryId,
    description: body.description,
    date: body.date || null,
    amount: body.amount || 0,
    notes: body.notes || null,
    isRecurring: body.isRecurring || false,
    recurrenceType: body.recurrenceType || null,
    isCarriedForward: false,
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}

export async function PUT(request: NextRequest) {
  await initializeDatabase();
  const body = await request.json();
  const result = await db
    .update(expenses)
    .set({
      description: body.description,
      date: body.date,
      amount: body.amount,
      notes: body.notes,
      isRecurring: body.isRecurring,
      recurrenceType: body.recurrenceType,
    })
    .where(eq(expenses.id, body.id))
    .returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(request: NextRequest) {
  await initializeDatabase();
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await db.delete(expenses).where(eq(expenses.id, id));
  return NextResponse.json({ success: true });
}
