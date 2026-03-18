import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "tax-tracker.db");

// Delete existing DB to start fresh
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Create tables
sqlite.exec(`
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

// Seed categories
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

const insertCategory = sqlite.prepare(
  "INSERT INTO categories (name, schedule_c_line, turbotax_section, sort_order) VALUES (?, ?, ?, ?)"
);

for (const cat of categoryData) {
  insertCategory.run(cat.name, cat.line, cat.section, cat.order);
}

// Seed business settings
sqlite.prepare(
  "INSERT INTO business_settings (business_name, owner_name, current_tax_year) VALUES (?, ?, ?)"
).run("Dual Vizion Photography", "M. Edwards", 2025);

// Helper to insert expense
const insertExpense = sqlite.prepare(
  `INSERT INTO expenses (tax_year, category_id, description, date, amount, notes, is_recurring, recurrence_type, is_carried_forward)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

// Category ID lookup helper
function catId(name: string): number {
  const row = sqlite.prepare("SELECT id FROM categories WHERE name = ?").get(name) as { id: number };
  return row.id;
}

// ========== 2024 SEED DATA ==========
// Based on typical Dual Vizion Photography expenses

const year = 2024;

// --- Communication Expenses (monthly recurring) ---
const commId = catId("Communication Expenses");
const commItems = [
  { desc: "Cell Phone (Line 1)", amount: 35, type: "monthly" },
  { desc: "Cell Phone (Line 2)", amount: 35, type: "monthly" },
  { desc: "iPad Data Plan", amount: 20, type: "monthly" },
  { desc: "Wearable Data Plan", amount: 10, type: "monthly" },
  { desc: "Internet Service", amount: 69.99, type: "monthly" },
  { desc: "Modem Rental", amount: 25, type: "monthly" },
];

for (const item of commItems) {
  for (let month = 1; month <= 12; month++) {
    const date = `${year}-${String(month).padStart(2, "0")}-01`;
    insertExpense.run(year, commId, item.desc, date, item.amount, null, 1, item.type, 0);
  }
}

// --- Advertising Expenses (yearly) ---
const adId = catId("Advertising Expenses");
const adItems = [
  { desc: "Popl Subscription", amount: 145, date: "2024-01-15" },
  { desc: "Popl Device", amount: 100, date: "2024-01-15" },
  { desc: "TikTok Advertising", amount: 300, date: "2024-06-01" },
  { desc: "Instagram Advertising", amount: 400, date: "2024-03-01" },
  { desc: "Facebook Advertising", amount: 250, date: "2024-04-01" },
];
for (const item of adItems) {
  insertExpense.run(year, adId, item.desc, item.date, item.amount, null, 1, "yearly", 0);
}

// --- Professional Expenses (monthly) ---
const proId = catId("Professional Expenses");
for (let month = 1; month <= 12; month++) {
  const date = `${year}-${String(month).padStart(2, "0")}-01`;
  insertExpense.run(year, proId, "PPA Membership", date, 29, null, 1, "monthly", 0);
}

// --- Business Travel - Hotels ---
const hotelId = catId("Business Travel - Hotels");
const hotelItems = [
  { desc: "WPPI Conference - Las Vegas", amount: 892, date: "2024-02-25" },
  { desc: "Imaging USA - Louisville", amount: 645, date: "2024-01-20" },
];
for (const item of hotelItems) {
  insertExpense.run(year, hotelId, item.desc, item.date, item.amount, null, 0, null, 0);
}

// --- Business Travel - Fees ---
const feesId = catId("Business Travel - Fees");
const feeItems = [
  { desc: "Baggage Fee - WPPI", amount: 70, date: "2024-02-24" },
  { desc: "Uber to Airport", amount: 45, date: "2024-02-24" },
  { desc: "Uber from Airport", amount: 42, date: "2024-03-01" },
  { desc: "Baggage Fee - Imaging USA", amount: 70, date: "2024-01-19" },
  { desc: "Uber - Imaging USA", amount: 38, date: "2024-01-19" },
];
for (const item of feeItems) {
  insertExpense.run(year, feesId, item.desc, item.date, item.amount, null, 0, null, 0);
}

// --- Business Travel - Meals ---
const travelMealsId = catId("Business Travel - Meals");
const travelMealItems = [
  { desc: "Meals - WPPI Las Vegas", amount: 285, date: "2024-02-27" },
  { desc: "Meals - Imaging USA Louisville", amount: 195, date: "2024-01-22" },
];
for (const item of travelMealItems) {
  insertExpense.run(year, travelMealsId, item.desc, item.date, item.amount, "50% deductible", 0, null, 0);
}

// --- Airfare ---
const airId = catId("Airfare");
const airItems = [
  { desc: "Flight to WPPI - Las Vegas", amount: 385, date: "2024-02-24" },
  { desc: "Flight to Imaging USA - Louisville", amount: 295, date: "2024-01-19" },
];
for (const item of airItems) {
  insertExpense.run(year, airId, item.desc, item.date, item.amount, null, 0, null, 0);
}

// --- Equipment Rental ---
const rentalId = catId("Equipment Rental");
insertExpense.run(year, rentalId, "Lens Rental - WPPI", "2024-02-25", 175, "Canon 70-200mm", 0, null, 0);
insertExpense.run(year, rentalId, "Studio Rental", "2024-06-15", 250, "Portrait session", 0, null, 0);

// --- Miscellaneous Expenses (subscriptions) ---
const miscId = catId("Miscellaneous Expenses");
const miscItems = [
  { desc: "Adobe Creative Cloud", amount: 54.99, type: "monthly" },
  { desc: "Dropbox Plus", amount: 11.99, type: "monthly" },
  { desc: "Vimeo Pro", amount: 20, type: "monthly" },
  { desc: "Canva Pro", amount: 12.99, type: "monthly" },
  { desc: "Pixieset", amount: 15, type: "monthly" },
  { desc: "ShootProof", amount: 10, type: "monthly" },
  { desc: "ArtList Music License", amount: 199, type: "yearly" },
  { desc: "Epidemic Sound", amount: 149, type: "yearly" },
  { desc: "Honeybook CRM", amount: 39, type: "monthly" },
  { desc: "QuickBooks Self-Employed", amount: 15, type: "monthly" },
  { desc: "Google Workspace", amount: 12, type: "monthly" },
  { desc: "Zoom Pro", amount: 13.33, type: "monthly" },
  { desc: "iCloud+", amount: 2.99, type: "monthly" },
  { desc: "Lightroom Mobile (Extra)", amount: 9.99, type: "monthly" },
  { desc: "Later (Social Scheduling)", amount: 25, type: "monthly" },
  { desc: "Tailwind (Pinterest)", amount: 14.99, type: "monthly" },
  { desc: "MileIQ", amount: 5.99, type: "monthly" },
  { desc: "ChatGPT Plus", amount: 20, type: "monthly" },
  { desc: "Grammarly Premium", amount: 12, type: "monthly" },
  { desc: "CloudFlare (Website)", amount: 20, type: "monthly" },
];
for (const item of miscItems) {
  if (item.type === "monthly") {
    for (let month = 1; month <= 12; month++) {
      const date = `${year}-${String(month).padStart(2, "0")}-01`;
      insertExpense.run(year, miscId, item.desc, date, item.amount, null, 1, "monthly", 0);
    }
  } else {
    insertExpense.run(year, miscId, item.desc, `${year}-01-01`, item.amount, null, 1, "yearly", 0);
  }
}

// --- Repairs & Maintenance ---
const repairId = catId("Repairs & Maintenance");
insertExpense.run(year, repairId, "Camera Sensor Cleaning", "2024-03-15", 125, null, 0, null, 0);
insertExpense.run(year, repairId, "Lens Calibration", "2024-07-20", 85, null, 0, null, 0);

// --- Business Insurance ---
const insId = catId("Business Insurance");
insertExpense.run(year, insId, "HISCOX Business Insurance", "2024-01-01", 625, "Annual premium", 1, "yearly", 0);

// --- Supplies Expenses ---
const supId = catId("Supplies Expenses");
const supItems = [
  { desc: "Memory Cards (SD)", amount: 89, date: "2024-02-10" },
  { desc: "USB-C Cables", amount: 25, date: "2024-04-05" },
  { desc: "Lens Cleaning Kit", amount: 18, date: "2024-01-15" },
  { desc: "Camera Batteries", amount: 65, date: "2024-03-20" },
  { desc: "Gaffer Tape", amount: 15, date: "2024-05-10" },
  { desc: "Backdrop Clips", amount: 12, date: "2024-06-01" },
];
for (const item of supItems) {
  insertExpense.run(year, supId, item.desc, item.date, item.amount, null, 0, null, 0);
}

// --- Meals (weekly estimate + conference) ---
const mealsId = catId("Meals");
insertExpense.run(year, mealsId, "Weekly Business Meals (est.)", "2024-12-31", 2600, "50 weeks x $52/wk average, 50% deductible", 1, "yearly", 0);

// --- Office Supplies & Expenses ---
const officeId = catId("Office Supplies & Expenses");
const officeItems = [
  { desc: "External Hard Drive 4TB", amount: 120, date: "2024-01-10" },
  { desc: "Printer Ink", amount: 65, date: "2024-03-15" },
  { desc: "Shipping Supplies (prints)", amount: 45, date: "2024-04-20" },
  { desc: "Business Cards", amount: 50, date: "2024-02-01" },
  { desc: "USB Hub", amount: 35, date: "2024-05-10" },
];
for (const item of officeItems) {
  insertExpense.run(year, officeId, item.desc, item.date, item.amount, null, 0, null, 0);
}

// --- Assets ---
const assetId = catId("Assets");
const assetItems = [
  { desc: "Canon R6 Mark II Body", amount: 2499, date: "2024-03-01", notes: "Section 179" },
  { desc: "RF 24-70mm f/2.8L Lens", amount: 2299, date: "2024-03-01", notes: "Section 179" },
  { desc: "DJI RS3 Pro Gimbal", amount: 699, date: "2024-06-15", notes: "Section 179" },
  { desc: "Godox AD600Pro Flash", amount: 749, date: "2024-04-10", notes: "Section 179" },
];
for (const item of assetItems) {
  insertExpense.run(year, assetId, item.desc, item.date, item.amount, item.notes, 0, null, 0);
}

// --- Mileage Expenses (parking/tolls summary) ---
const mileId = catId("Mileage Expenses");
insertExpense.run(year, mileId, "Parking - Various Shoots", "2024-12-31", 340, null, 0, null, 0);
insertExpense.run(year, mileId, "Tolls - Various Shoots", "2024-12-31", 185, null, 0, null, 0);
insertExpense.run(year, mileId, "Car Loan Interest (business %)", "2024-12-31", 420, "If using actual expense method", 0, null, 0);

// ========== 2025 SEED DATA (partial - year in progress) ==========
const year25 = 2025;

// Copy recurring communication items for 2025
for (const item of commItems) {
  for (let month = 1; month <= 12; month++) {
    const date = `${year25}-${String(month).padStart(2, "0")}-01`;
    insertExpense.run(year25, commId, item.desc, date, item.amount, null, 1, item.type, 1);
  }
}

// Copy recurring advertising for 2025
for (const item of adItems) {
  const date25 = item.date.replace("2024", "2025");
  insertExpense.run(year25, adId, item.desc, date25, item.amount, null, 1, "yearly", 1);
}

// Copy PPA for 2025
for (let month = 1; month <= 12; month++) {
  const date = `${year25}-${String(month).padStart(2, "0")}-01`;
  insertExpense.run(year25, proId, "PPA Membership", date, 29, null, 1, "monthly", 1);
}

// Copy recurring misc subscriptions for 2025
for (const item of miscItems) {
  if (item.type === "monthly") {
    for (let month = 1; month <= 12; month++) {
      const date = `${year25}-${String(month).padStart(2, "0")}-01`;
      insertExpense.run(year25, miscId, item.desc, date, item.amount, null, 1, "monthly", 1);
    }
  } else {
    insertExpense.run(year25, miscId, item.desc, `${year25}-01-01`, item.amount, null, 1, "yearly", 1);
  }
}

// Insurance for 2025
insertExpense.run(year25, insId, "HISCOX Business Insurance", "2025-01-01", 625, "Annual premium", 1, "yearly", 1);

// Meals for 2025
insertExpense.run(year25, mealsId, "Weekly Business Meals (est.)", "2025-12-31", 2600, "50 weeks x $52/wk average, 50% deductible", 1, "yearly", 1);

// Some 2025-specific expenses
insertExpense.run(year25, supId, "Memory Cards (CFexpress)", "2025-01-20", 199, null, 0, null, 0);
insertExpense.run(year25, officeId, "External SSD 2TB", "2025-02-15", 180, null, 0, null, 0);

// ========== 2023 SEED DATA (complete year) ==========
const year23 = 2023;

// Communication 2023
for (const item of commItems) {
  for (let month = 1; month <= 12; month++) {
    const date = `${year23}-${String(month).padStart(2, "0")}-01`;
    insertExpense.run(year23, commId, item.desc, date, item.amount, null, 1, item.type, 0);
  }
}

// Advertising 2023
const adItems23 = [
  { desc: "Popl Subscription", amount: 120, date: "2023-01-15" },
  { desc: "Instagram Advertising", amount: 350, date: "2023-04-01" },
  { desc: "Facebook Advertising", amount: 200, date: "2023-05-01" },
];
for (const item of adItems23) {
  insertExpense.run(year23, adId, item.desc, item.date, item.amount, null, 1, "yearly", 0);
}

// PPA 2023
for (let month = 1; month <= 12; month++) {
  const date = `${year23}-${String(month).padStart(2, "0")}-01`;
  insertExpense.run(year23, proId, "PPA Membership", date, 28, null, 1, "monthly", 0);
}

// Misc subscriptions 2023 (fewer)
const miscItems23 = [
  { desc: "Adobe Creative Cloud", amount: 52.99, type: "monthly" },
  { desc: "Dropbox Plus", amount: 11.99, type: "monthly" },
  { desc: "Vimeo Pro", amount: 20, type: "monthly" },
  { desc: "Canva Pro", amount: 12.99, type: "monthly" },
  { desc: "Pixieset", amount: 15, type: "monthly" },
  { desc: "ShootProof", amount: 10, type: "monthly" },
  { desc: "ArtList Music License", amount: 199, type: "yearly" },
  { desc: "Honeybook CRM", amount: 35, type: "monthly" },
  { desc: "Google Workspace", amount: 12, type: "monthly" },
  { desc: "iCloud+", amount: 2.99, type: "monthly" },
  { desc: "MileIQ", amount: 5.99, type: "monthly" },
  { desc: "CloudFlare (Website)", amount: 20, type: "monthly" },
];
for (const item of miscItems23) {
  if (item.type === "monthly") {
    for (let month = 1; month <= 12; month++) {
      const date = `${year23}-${String(month).padStart(2, "0")}-01`;
      insertExpense.run(year23, miscId, item.desc, date, item.amount, null, 1, "monthly", 0);
    }
  } else {
    insertExpense.run(year23, miscId, item.desc, `${year23}-01-01`, item.amount, null, 1, "yearly", 0);
  }
}

// Insurance 2023
insertExpense.run(year23, insId, "HISCOX Business Insurance", "2023-01-01", 580, "Annual premium", 1, "yearly", 0);

// Meals 2023
insertExpense.run(year23, mealsId, "Weekly Business Meals (est.)", "2023-12-31", 2400, "48 weeks x $50/wk average, 50% deductible", 1, "yearly", 0);

// Assets 2023
insertExpense.run(year23, assetId, "Canon R6 Body", "2023-01-15", 2499, "Section 179", 0, null, 0);
insertExpense.run(year23, assetId, "RF 50mm f/1.2L Lens", "2023-04-01", 2299, "Section 179", 0, null, 0);

// Office Supplies 2023
insertExpense.run(year23, officeId, "External Hard Drive 2TB", "2023-02-10", 89, null, 0, null, 0);
insertExpense.run(year23, officeId, "Printer Ink", "2023-06-15", 55, null, 0, null, 0);
insertExpense.run(year23, officeId, "Business Cards", "2023-01-20", 40, null, 0, null, 0);

// Supplies 2023
insertExpense.run(year23, supId, "Memory Cards (SD)", "2023-03-05", 75, null, 0, null, 0);
insertExpense.run(year23, supId, "Camera Batteries", "2023-05-20", 55, null, 0, null, 0);
insertExpense.run(year23, supId, "Lens Cleaning Kit", "2023-01-10", 15, null, 0, null, 0);

// Mileage 2023
insertExpense.run(year23, mileId, "Parking - Various Shoots", "2023-12-31", 280, null, 0, null, 0);
insertExpense.run(year23, mileId, "Tolls - Various Shoots", "2023-12-31", 150, null, 0, null, 0);

// Travel 2023
insertExpense.run(year23, hotelId, "Imaging USA - Nashville", "2023-01-22", 580, null, 0, null, 0);
insertExpense.run(year23, airId, "Flight to Imaging USA", "2023-01-20", 275, null, 0, null, 0);
insertExpense.run(year23, feesId, "Baggage Fee - Imaging USA", "2023-01-20", 70, null, 0, null, 0);
insertExpense.run(year23, feesId, "Uber - Imaging USA", "2023-01-20", 35, null, 0, null, 0);
insertExpense.run(year23, travelMealsId, "Meals - Imaging USA Nashville", "2023-01-23", 175, "50% deductible", 0, null, 0);

// Repairs 2023
insertExpense.run(year23, repairId, "Camera Sensor Cleaning", "2023-06-10", 100, null, 0, null, 0);

console.log("✅ Database seeded successfully!");
console.log("   Categories: 16");

const expCount = sqlite.prepare("SELECT COUNT(*) as cnt FROM expenses").get() as { cnt: number };
console.log(`   Expenses: ${expCount.cnt}`);

const yearCounts = sqlite.prepare(
  "SELECT tax_year, COUNT(*) as cnt FROM expenses GROUP BY tax_year ORDER BY tax_year"
).all() as { tax_year: number; cnt: number }[];
for (const yc of yearCounts) {
  console.log(`   ${yc.tax_year}: ${yc.cnt} expenses`);
}

sqlite.close();
