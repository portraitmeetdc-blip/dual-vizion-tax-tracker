import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { expenses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { initializeDatabase } from "@/db/init";

initializeDatabase();

export async function POST(request: NextRequest) {
  const { fromYear, toYear } = await request.json();

  // Check if target year already has expenses
  const existing = await db
    .select()
    .from(expenses)
    .where(eq(expenses.taxYear, toYear))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: `Year ${toYear} already has expenses. Delete them first to rollover.` },
      { status: 400 }
    );
  }

  // Get all recurring items from source year
  const recurring = await db
    .select()
    .from(expenses)
    .where(
      and(eq(expenses.taxYear, fromYear), eq(expenses.isRecurring, true))
    );

  // Group by description+category to avoid duplicates from monthly entries
  const seen = new Map<string, typeof recurring[0]>();
  for (const exp of recurring) {
    const key = `${exp.categoryId}-${exp.description}-${exp.recurrenceType}`;
    if (!seen.has(key)) {
      seen.set(key, exp);
    }
  }

  let count = 0;
  for (const [, exp] of seen) {
    if (exp.recurrenceType === "monthly") {
      // Create 12 monthly entries
      for (let month = 1; month <= 12; month++) {
        const date = `${toYear}-${String(month).padStart(2, "0")}-01`;
        await db.insert(expenses).values({
          taxYear: toYear,
          categoryId: exp.categoryId,
          description: exp.description,
          date,
          amount: exp.amount,
          notes: exp.notes,
          isRecurring: true,
          recurrenceType: "monthly",
          isCarriedForward: true,
        });
        count++;
      }
    } else {
      // Yearly: create one entry
      const date = exp.date
        ? exp.date.replace(String(fromYear), String(toYear))
        : `${toYear}-01-01`;
      await db.insert(expenses).values({
        taxYear: toYear,
        categoryId: exp.categoryId,
        description: exp.description,
        date,
        amount: exp.amount,
        notes: exp.notes,
        isRecurring: true,
        recurrenceType: "yearly",
        isCarriedForward: true,
      });
      count++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `Rolled over ${seen.size} recurring items (${count} total entries) from ${fromYear} to ${toYear}`,
    itemsCopied: count,
  });
}
