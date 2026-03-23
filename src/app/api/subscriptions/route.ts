export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { expenses, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { initializeDatabase } from "@/db/init";

export async function GET() {
  await initializeDatabase();

  // Get all recurring expenses across all years with category names
  const allRecurring = await db
    .select({
      id: expenses.id,
      taxYear: expenses.taxYear,
      categoryId: expenses.categoryId,
      description: expenses.description,
      amount: expenses.amount,
      isRecurring: expenses.isRecurring,
      recurrenceType: expenses.recurrenceType,
      categoryName: categories.name,
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(eq(expenses.isRecurring, true))
    .orderBy(expenses.description, expenses.taxYear);

  // Group by description + category to track price history
  const subscriptions: Record<string, {
    description: string;
    categoryId: number;
    categoryName: string;
    recurrenceType: string;
    years: Record<number, { amount: number; id: number }>;
  }> = {};

  for (const row of allRecurring) {
    const key = `${row.categoryId}-${row.description}`;
    if (!subscriptions[key]) {
      subscriptions[key] = {
        description: row.description,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        recurrenceType: row.recurrenceType || "yearly",
        years: {},
      };
    }
    // Store the amount per year (use the latest/highest if multiple entries)
    if (!subscriptions[key].years[row.taxYear] || row.amount > subscriptions[key].years[row.taxYear].amount) {
      subscriptions[key].years[row.taxYear] = { amount: row.amount, id: row.id };
    }
  }

  return NextResponse.json(Object.values(subscriptions));
}
