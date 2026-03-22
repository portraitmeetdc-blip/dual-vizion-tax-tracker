import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function consolidate() {
  // Find all monthly recurring groups (same description + category + year)
  const groups = await client.execute(`
    SELECT tax_year, category_id, description,
           COUNT(*) as cnt, SUM(amount) as total,
           MIN(id) as keep_id, MIN(notes) as notes
    FROM expenses
    WHERE is_recurring = 1 AND recurrence_type = 'monthly'
    GROUP BY tax_year, category_id, description
    HAVING COUNT(*) > 1
    ORDER BY tax_year, category_id
  `);

  console.log("Found " + groups.rows.length + " groups of monthly duplicates to consolidate:\n");

  let totalDeleted = 0;

  for (const row of groups.rows) {
    const { tax_year, category_id, description, cnt, total, keep_id, notes } = row;
    console.log(`  ${tax_year} | ${description}: ${cnt} entries -> 1 (total: $${(total as number).toFixed(2)})`);

    // Update the kept entry with the annual total
    await client.execute({
      sql: `UPDATE expenses SET amount = ?, date = ?, notes = ?, recurrence_type = 'yearly' WHERE id = ?`,
      args: [
        total as number,
        `${tax_year}-12-31`,
        notes ? `${notes} (${cnt} months consolidated)` : `${cnt} months x $${((total as number) / (cnt as number)).toFixed(2)}/mo`,
        keep_id as number,
      ],
    });

    // Delete the duplicates (keep only the one with keep_id)
    const deleted = await client.execute({
      sql: `DELETE FROM expenses WHERE tax_year = ? AND category_id = ? AND description = ? AND is_recurring = 1 AND recurrence_type = 'monthly' AND id != ?`,
      args: [tax_year as number, category_id as number, description as string, keep_id as number],
    });

    totalDeleted += deleted.rowsAffected;
  }

  console.log("\nDone! Deleted " + totalDeleted + " duplicate rows.");

  const remaining = await client.execute("SELECT COUNT(*) as cnt FROM expenses");
  console.log("Remaining expenses: " + remaining.rows[0].cnt);
}

consolidate().catch(console.error);
