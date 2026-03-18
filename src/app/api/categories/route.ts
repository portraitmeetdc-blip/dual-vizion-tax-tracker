import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { categories } from "@/db/schema";
import { initializeDatabase } from "@/db/init";

initializeDatabase();

export async function GET() {
  const results = await db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder);

  return NextResponse.json(results);
}
