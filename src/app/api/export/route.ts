import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { expenses, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { initializeDatabase } from "@/db/init";

initializeDatabase();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taxYear = parseInt(searchParams.get("year") || "2025");
  const format = searchParams.get("format") || "json";

  const allExpenses = await db
    .select({
      id: expenses.id,
      taxYear: expenses.taxYear,
      description: expenses.description,
      date: expenses.date,
      amount: expenses.amount,
      notes: expenses.notes,
      isRecurring: expenses.isRecurring,
      recurrenceType: expenses.recurrenceType,
      categoryName: categories.name,
      scheduleCLine: categories.scheduleCLine,
      turbotaxSection: categories.turbotaxSection,
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(eq(expenses.taxYear, taxYear))
    .orderBy(categories.sortOrder, expenses.date);

  if (format === "csv") {
    const header = "Category,Schedule C Line,Description,Date,Amount,Notes\n";
    const rows = allExpenses
      .map(
        (e) =>
          `"${e.categoryName}","${e.scheduleCLine}","${e.description}","${e.date || ""}",${e.amount},"${e.notes || ""}"`
      )
      .join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tax-expenses-${taxYear}.csv"`,
      },
    });
  }

  // JSON format - grouped by category for Schedule C preview
  const grouped: Record<
    string,
    {
      categoryName: string;
      scheduleCLine: string;
      turbotaxSection: string;
      total: number;
      items: typeof allExpenses;
    }
  > = {};

  for (const exp of allExpenses) {
    if (!grouped[exp.categoryName]) {
      grouped[exp.categoryName] = {
        categoryName: exp.categoryName,
        scheduleCLine: exp.scheduleCLine,
        turbotaxSection: exp.turbotaxSection,
        total: 0,
        items: [],
      };
    }
    grouped[exp.categoryName].total += exp.amount;
    grouped[exp.categoryName].items.push(exp);
  }

  const grandTotal = allExpenses.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({
    taxYear,
    grandTotal,
    categories: Object.values(grouped),
  });
}
