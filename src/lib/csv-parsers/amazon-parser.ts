import Papa from "papaparse";

export interface AmazonItem {
  date: string;
  description: string;
  amount: number;
  suggestedCategory: string;
  suggestedCategoryId: number;
}

// Keyword → category mapping for auto-categorization
const KEYWORD_CATEGORY_MAP: { keywords: string[]; category: string; categoryId: number }[] = [
  { keywords: ["lens", "camera body", "camera kit"], category: "Assets", categoryId: 16 },
  { keywords: ["gimbal", "stabilizer", "drone"], category: "Assets", categoryId: 16 },
  { keywords: ["cable", "adapter", "mount", "filter", "cap", "strap"], category: "Supplies Expenses", categoryId: 13 },
  { keywords: ["battery", "charger"], category: "Supplies Expenses", categoryId: 13 },
  { keywords: ["hard drive", "ssd", "keyboard", "headphone", "mouse", "monitor"], category: "Office Supplies & Expenses", categoryId: 15 },
  { keywords: ["light", "softbox", "tripod", "backdrop", "reflector", "diffuser"], category: "Office Supplies & Expenses", categoryId: 15 },
  { keywords: ["ink", "paper", "envelope", "label", "tape", "printer"], category: "Office Supplies & Expenses", categoryId: 15 },
  { keywords: ["cleaning", "cloth", "wipe"], category: "Supplies Expenses", categoryId: 13 },
  { keywords: ["bag", "case", "pouch", "backpack"], category: "Supplies Expenses", categoryId: 13 },
  { keywords: ["book", "guide", "course"], category: "Professional Expenses", categoryId: 4 },
  { keywords: ["software", "license", "subscription"], category: "Miscellaneous Expenses", categoryId: 10 },
];

export function categorizeItem(description: string, amount: number): { category: string; categoryId: number } {
  const lower = description.toLowerCase();

  for (const mapping of KEYWORD_CATEGORY_MAP) {
    for (const keyword of mapping.keywords) {
      if (lower.includes(keyword)) {
        // Items over $500 that aren't already "Assets" should be checked
        if (amount > 500 && mapping.categoryId !== 16) {
          return { category: "Assets", categoryId: 16 };
        }
        return { category: mapping.category, categoryId: mapping.categoryId };
      }
    }
  }

  // Default: Office Supplies for items under $500, Assets for over
  if (amount > 500) {
    return { category: "Assets", categoryId: 16 };
  }
  return { category: "Office Supplies & Expenses", categoryId: 15 };
}

export function parseAmazonCSV(csvText: string): AmazonItem[] {
  const result = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase(),
  });

  const items: AmazonItem[] = [];

  for (const row of result.data as Record<string, string>[]) {
    const date = row["date"] || row["order date"] || row["ship date"] || "";
    const description =
      row["description"] || row["title"] || row["product name"] || row["item"] || "";
    const amountStr = row["amount"] || row["total"] || row["price"] || row["item total"] || "0";
    const amount = parseFloat(amountStr.replace(/[$,]/g, "")) || 0;

    if (!description && !amount) continue;

    const { category, categoryId } = categorizeItem(description, amount);

    items.push({
      date: normalizeDate(date),
      description: description.trim(),
      amount,
      suggestedCategory: category,
      suggestedCategoryId: categoryId,
    });
  }

  return items;
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  // Try to parse various date formats
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return dateStr;
}
