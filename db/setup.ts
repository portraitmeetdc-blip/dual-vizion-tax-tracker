/**
 * Clean setup script - creates tables and categories only (no sample data).
 * Use this when deploying a fresh instance for a new user.
 *
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx db/setup.ts
 */
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function setup() {
  // Create tables
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      schedule_c_line TEXT NOT NULL,
      turbotax_section TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tax_year INTEGER NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      description TEXT NOT NULL,
      date TEXT,
      amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurrence_type TEXT,
      is_carried_forward INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mileage_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tax_year INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_location TEXT,
      stop_location TEXT,
      miles REAL NOT NULL DEFAULT 0,
      parking REAL NOT NULL DEFAULT 0,
      tolls REAL NOT NULL DEFAULT 0,
      purpose TEXT,
      deduction_amount REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS business_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL DEFAULT 'My Business',
      owner_name TEXT NOT NULL DEFAULT 'Owner',
      current_tax_year INTEGER NOT NULL DEFAULT 2025,
      phone_business_pct INTEGER NOT NULL DEFAULT 100,
      internet_business_pct INTEGER NOT NULL DEFAULT 100,
      mileage_method TEXT NOT NULL DEFAULT 'standard'
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_year ON expenses(tax_year);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
    CREATE INDEX IF NOT EXISTS idx_mileage_year ON mileage_log(tax_year);
  `);

  // Check if categories already exist
  const existing = await client.execute("SELECT COUNT(*) as cnt FROM categories");
  if ((existing.rows[0].cnt as number) > 0) {
    console.log("Categories already exist, skipping seed.");
    return;
  }

  // Seed the 16 Schedule C categories
  const categoryData = [
    { name: "Mileage Expenses", line: "Line 9: Car & Truck Expenses", section: "Vehicle Expenses", order: 1 },
    { name: "Communication Expenses", line: "Line 25: Utilities", section: "Utilities (apply business-use %)", order: 2 },
    { name: "Advertising Expenses", line: "Line 8: Advertising", section: "Advertising", order: 3 },
    { name: "Professional Expenses", line: "Line 27b: Other Expenses", section: "Other Expenses > Professional Dues", order: 4 },
    { name: "Business Travel - Hotels", line: "Line 24a: Travel", section: "Travel", order: 5 },
    { name: "Business Travel - Fees", line: "Line 24a: Travel", section: "Travel", order: 6 },
    { name: "Business Travel - Meals", line: "Line 24b: Meals", section: "Meals (50% deductible)", order: 7 },
    { name: "Airfare", line: "Line 24a: Travel", section: "Travel", order: 8 },
    { name: "Equipment Rental", line: "Line 20a: Rent/Lease", section: "Rent or Lease > Equipment", order: 9 },
    { name: "Miscellaneous Expenses", line: "Line 27b: Other Expenses", section: "Other Expenses > Software/Licensing", order: 10 },
    { name: "Repairs & Maintenance", line: "Line 21: Repairs", section: "Repairs and Maintenance", order: 11 },
    { name: "Business Insurance", line: "Line 15: Insurance", section: "Insurance (other than health)", order: 12 },
    { name: "Supplies Expenses", line: "Line 22: Supplies", section: "Supplies", order: 13 },
    { name: "Meals", line: "Line 24b: Meals", section: "Meals (50% deductible)", order: 14 },
    { name: "Office Supplies & Expenses", line: "Line 18: Office Expense", section: "Office Expenses", order: 15 },
    { name: "Assets", line: "Line 13: Depreciation", section: "Depreciation / Form 4562 (Section 179)", order: 16 },
  ];

  for (const cat of categoryData) {
    await client.execute({
      sql: "INSERT INTO categories (name, schedule_c_line, turbotax_section, sort_order) VALUES (?, ?, ?, ?)",
      args: [cat.name, cat.line, cat.section, cat.order],
    });
  }

  // Seed default business settings
  await client.execute({
    sql: "INSERT INTO business_settings (business_name, owner_name, current_tax_year) VALUES (?, ?, ?)",
    args: ["My Business", "Owner", new Date().getFullYear()],
  });

  console.log("Setup complete!");
  console.log("  16 Schedule C categories created");
  console.log("  Default business settings created");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Go to Settings in the app to enter your business name");
  console.log("  2. Start adding expenses!");
}

setup().catch(console.error);
