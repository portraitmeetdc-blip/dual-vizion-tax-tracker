import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  scheduleCLine: text("schedule_c_line").notNull(),
  turbotaxSection: text("turbotax_section").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taxYear: integer("tax_year").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  description: text("description").notNull(),
  date: text("date"),
  amount: real("amount").notNull().default(0),
  notes: text("notes"),
  isRecurring: integer("is_recurring", { mode: "boolean" })
    .notNull()
    .default(false),
  recurrenceType: text("recurrence_type"), // 'monthly' | 'yearly'
  groupName: text("group_name"), // sub-group within a category (e.g. "Lighting", "Camera Equipment")
  isCarriedForward: integer("is_carried_forward", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const mileageLog = sqliteTable("mileage_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taxYear: integer("tax_year").notNull(),
  date: text("date").notNull(),
  startLocation: text("start_location"),
  stopLocation: text("stop_location"),
  miles: real("miles").notNull().default(0),
  parking: real("parking").notNull().default(0),
  tolls: real("tolls").notNull().default(0),
  purpose: text("purpose"),
  deductionAmount: real("deduction_amount").notNull().default(0),
});

export const businessSettings = sqliteTable("business_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessName: text("business_name")
    .notNull()
    .default("Dual Vizion Photography"),
  ownerName: text("owner_name").notNull().default("M. Edwards"),
  currentTaxYear: integer("current_tax_year").notNull().default(2025),
  phoneBusinessPct: integer("phone_business_pct").notNull().default(100),
  internetBusinessPct: integer("internet_business_pct").notNull().default(100),
  mileageMethod: text("mileage_method").notNull().default("standard"), // 'standard' | 'actual'
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type MileageEntry = typeof mileageLog.$inferSelect;
export type NewMileageEntry = typeof mileageLog.$inferInsert;
export type BusinessSettings = typeof businessSettings.$inferSelect;
