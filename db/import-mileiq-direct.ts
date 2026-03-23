import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import Papa from "papaparse";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const MILEAGE_CAT_ID = 1;
const RATE = 0.7;
const TAX_YEAR = 2025;

async function importMileIQ() {
  // Read from stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const rawText = Buffer.concat(chunks).toString("utf-8");

  // Find the DETAILED LOG section
  const headerIdx = rawText.indexOf("START_DATE*,END_DATE*");
  if (headerIdx === -1) {
    console.log("Could not find DETAILED LOG header");
    process.exit(1);
  }

  // Extract just the data rows (stop at "Totals")
  let csvSection = rawText.substring(headerIdx);
  const totalsIdx = csvSection.indexOf("\nTotals,");
  if (totalsIdx > 0) {
    csvSection = csvSection.substring(0, totalsIdx);
  }

  const result = Papa.parse(csvSection.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  let count = 0;
  let totalMiles = 0;
  let totalDeduction = 0;

  for (const row of result.data as Record<string, string>[]) {
    const startDate = (row["START_DATE*"] || "").trim();
    const start = (row["START*"] || "").trim();
    const stop = (row["STOP*"] || "").trim();
    const milesStr = (row["MILES*"] || "0").trim();
    const miles = parseFloat(milesStr) || 0;
    const parking = parseFloat((row["PARKING"] || "0").replace(/[^0-9.]/g, "")) || 0;
    const tolls = parseFloat((row["TOLLS"] || "0").replace(/[^0-9.]/g, "")) || 0;
    const purpose = (row["PURPOSE"] || "").trim();

    if (miles === 0) continue;

    // Parse date (format: MM/DD/YYYY HH:MM)
    let date = "";
    if (startDate) {
      const datePart = startDate.split(" ")[0];
      const d = new Date(datePart);
      if (!isNaN(d.getTime())) date = d.toISOString().split("T")[0];
    }

    const deduction = Math.round((miles * RATE + parking + tolls) * 100) / 100;
    const shortStart = start.split(",")[0];
    const shortStop = stop.split(",")[0];
    const description = `${shortStart} → ${shortStop}`;
    const notes = `${miles.toFixed(1)} mi @ $${RATE}/mi${purpose ? " | " + purpose : ""}`;

    await client.execute({
      sql: `INSERT INTO expenses (tax_year, category_id, description, date, amount, notes, is_recurring, recurrence_type, is_carried_forward) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, 0)`,
      args: [TAX_YEAR, MILEAGE_CAT_ID, description, date, deduction, notes],
    });

    count++;
    totalMiles += miles;
    totalDeduction += deduction;

    if (count % 100 === 0) {
      console.log(`  ...${count} trips imported`);
    }
  }

  console.log(`\nImported ${count} business trips into Mileage Expenses`);
  console.log(`Total miles: ${totalMiles.toFixed(1)}`);
  console.log(`Total deduction: $${totalDeduction.toFixed(2)} (at $${RATE}/mi)`);
}

importMileIQ().catch(console.error);
