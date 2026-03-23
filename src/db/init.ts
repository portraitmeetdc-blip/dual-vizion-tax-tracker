import { client } from "./index";

let initPromise: Promise<void> | null = null;

export function initializeDatabase() {
  if (!initPromise) {
    initPromise = doInit();
  }
  return initPromise;
}

async function doInit() {
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
      business_name TEXT NOT NULL DEFAULT 'Dual Vizion Photography',
      owner_name TEXT NOT NULL DEFAULT 'M. Edwards',
      current_tax_year INTEGER NOT NULL DEFAULT 2025,
      phone_business_pct INTEGER NOT NULL DEFAULT 100,
      internet_business_pct INTEGER NOT NULL DEFAULT 100,
      mileage_method TEXT NOT NULL DEFAULT 'standard'
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_year ON expenses(tax_year);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
    CREATE INDEX IF NOT EXISTS idx_mileage_year ON mileage_log(tax_year);
  `);

  // Add group_name column if it doesn't exist (migration)
  try {
    await client.execute("ALTER TABLE expenses ADD COLUMN group_name TEXT");
  } catch {
    // Column already exists, ignore
  }
}
