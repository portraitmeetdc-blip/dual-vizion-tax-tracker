import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import Papa from "papaparse";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const OFFICE_SUPPLIES_ID = 15;
const TAX_YEAR = 2025;

async function importAmazon() {
  const csvPath = process.argv[2] || "/Users/michaeledwards/Downloads/orders_from_20250101_to_20251231_20260322_1307.csv";
  const csvText = fs.readFileSync(csvPath, "utf-8");

  const result = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  const rows = result.data as Record<string, string>[];

  // Deduplicate: same Order ID + Title = same item (multiple payment rows)
  const seen = new Map<string, { date: string; title: string; amount: number; category: string }>();

  for (const row of rows) {
    const status = row["Order Status"] || "";
    if (status === "Cancelled") continue;

    const orderId = row["Order ID"] || "";
    const title = (row["Title"] || "").trim();
    const amountStr = (row["Item Subtotal"] || row["Item Net Total"] || "0")
      .replace(/[$,""]/g, "");
    const amount = parseFloat(amountStr) || 0;
    const dateStr = row["Order Date"] || "";
    const amazonCategory = row["Amazon-Internal Product Category"] || "";

    if (!title || amount <= 0) continue;

    const key = `${orderId}::${title}`;
    if (seen.has(key)) continue;

    // Normalize date
    let date = "";
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        date = d.toISOString().split("T")[0];
      }
    }

    seen.set(key, { date, title, amount, category: amazonCategory });
  }

  console.log(`Parsed ${rows.length} rows → ${seen.size} unique items (after dedup & filtering)\n`);

  // Insert into database
  let count = 0;
  for (const [, item] of seen) {
    await client.execute({
      sql: `INSERT INTO expenses (tax_year, category_id, description, date, amount, notes, is_recurring, recurrence_type, is_carried_forward)
            VALUES (?, ?, ?, ?, ?, ?, 0, NULL, 0)`,
      args: [TAX_YEAR, OFFICE_SUPPLIES_ID, item.title, item.date, item.amount, `Amazon - ${item.category}`],
    });
    count++;
    if (count <= 10 || count % 20 === 0) {
      console.log(`  ${item.date} | $${item.amount.toFixed(2)} | ${item.title.substring(0, 60)}`);
    }
  }

  console.log(`\nImported ${count} items into Office Supplies & Expenses for ${TAX_YEAR}.`);

  const total = await client.execute(
    `SELECT COUNT(*) as cnt, SUM(amount) as total FROM expenses WHERE tax_year = ? AND notes LIKE 'Amazon%'`,
    [TAX_YEAR]
  );
  console.log(`Total Amazon items for ${TAX_YEAR}: ${total.rows[0].cnt} items, $${(total.rows[0].total as number).toFixed(2)}`);
}

importAmazon().catch(console.error);
