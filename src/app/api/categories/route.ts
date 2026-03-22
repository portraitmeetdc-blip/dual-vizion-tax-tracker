export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { categories } from "@/db/schema";
import { initializeDatabase } from "@/db/init";

export async function GET() {
  await initializeDatabase();
  const results = await db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder);

  return NextResponse.json(results);
}
