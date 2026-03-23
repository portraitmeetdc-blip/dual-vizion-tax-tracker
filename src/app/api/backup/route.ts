export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { expenses, categories, mileageLog, businessSettings } from "@/db/schema";
import { initializeDatabase } from "@/db/init";

export async function GET() {
  await initializeDatabase();

  const allExpenses = await db.select().from(expenses);
  const allCategories = await db.select().from(categories);
  const allMileage = await db.select().from(mileageLog);
  const settings = await db.select().from(businessSettings).limit(1);

  const backup = {
    exportDate: new Date().toISOString(),
    appName: "DVP Tax Tracker",
    version: "1.0.0",
    data: {
      categories: allCategories,
      expenses: allExpenses,
      mileageLog: allMileage,
      settings: settings[0] || null,
    },
  };

  return NextResponse.json(backup);
}
