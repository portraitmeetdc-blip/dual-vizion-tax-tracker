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
  // Assets (Section 179) - big ticket items
  { keywords: ["lens", "camera body", "camera kit", "mirrorless", "dslr"], category: "Assets", categoryId: 16 },
  { keywords: ["gimbal", "stabilizer", "drone", "mavic", "ronin"], category: "Assets", categoryId: 16 },
  { keywords: ["macbook", "laptop", "imac", "ipad pro", "desktop computer"], category: "Assets", categoryId: 16 },
  { keywords: ["strobe", "monolight", "studio flash", "flash kit"], category: "Assets", categoryId: 16 },

  // Supplies Expenses
  { keywords: ["cable", "adapter", "mount", "filter", "cap", "strap", "connector", "hdmi", "usb-c", "usb c", "thunderbolt"], category: "Supplies Expenses", categoryId: 13 },
  { keywords: ["battery", "charger", "power bank", "ac adapter"], category: "Supplies Expenses", categoryId: 13 },
  { keywords: ["cleaning", "cloth", "wipe", "blower", "sensor clean"], category: "Supplies Expenses", categoryId: 13 },
  { keywords: ["bag", "case", "pouch", "backpack", "roller", "sling", "holster"], category: "Supplies Expenses", categoryId: 13 },
  { keywords: ["memory card", "sd card", "cf card", "cfexpress", "micro sd", "card reader"], category: "Supplies Expenses", categoryId: 13 },
  { keywords: ["gaffer", "velcro", "clamp", "clip", "hook", "sandbag"], category: "Supplies Expenses", categoryId: 13 },
  { keywords: ["rain cover", "lens hood", "lens pen", "screen protector"], category: "Supplies Expenses", categoryId: 13 },

  // Office Supplies & Expenses
  { keywords: ["hard drive", "ssd", "external drive", "flash drive", "thumb drive", "nas", "storage drive"], category: "Office Supplies & Expenses", categoryId: 15 },
  { keywords: ["keyboard", "headphone", "mouse", "monitor", "webcam", "microphone", "mic stand", "audio interface"], category: "Office Supplies & Expenses", categoryId: 15 },
  { keywords: ["light", "softbox", "tripod", "backdrop", "reflector", "diffuser", "light stand", "c-stand", "boom arm"], category: "Office Supplies & Expenses", categoryId: 15 },
  { keywords: ["ink", "paper", "envelope", "label", "tape", "printer", "toner", "photo paper", "matte paper", "glossy paper"], category: "Office Supplies & Expenses", categoryId: 15 },
  { keywords: ["desk", "chair", "shelf", "organizer", "drawer", "filing"], category: "Office Supplies & Expenses", categoryId: 15 },
  { keywords: ["frame", "matte board", "mat board", "portfolio", "album", "proof box"], category: "Office Supplies & Expenses", categoryId: 15 },

  // Professional Expenses
  { keywords: ["book", "guide", "course", "tutorial", "workshop", "masterclass", "education", "training"], category: "Professional Expenses", categoryId: 4 },
  { keywords: ["business card", "brochure", "flyer", "marketing material"], category: "Advertising Expenses", categoryId: 3 },

  // Miscellaneous Expenses (software/subscriptions)
  { keywords: ["software", "license", "subscription", "app", "plugin", "preset", "lut", "action"], category: "Miscellaneous Expenses", categoryId: 10 },
  { keywords: ["adobe", "lightroom", "photoshop", "capture one", "luminar"], category: "Miscellaneous Expenses", categoryId: 10 },

  // Repairs & Maintenance
  { keywords: ["repair", "replacement part", "spare part", "calibration tool"], category: "Repairs & Maintenance", categoryId: 11 },
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
    const date = row["date"] || row["order date"] || row["ship date"] || row["order placed"] || "";
    const description =
      row["description"] || row["title"] || row["product name"] || row["item"] || row["items ordered"] || "";
    const amountStr =
      row["amount"] || row["total"] || row["price"] || row["item total"] ||
      row["total charged"] || row["item subtotal"] || row["grand total"] || "0";
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
