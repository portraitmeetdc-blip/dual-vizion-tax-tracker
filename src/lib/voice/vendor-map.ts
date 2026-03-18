// Known vendor → category mapping for voice input auto-categorization
export const VENDOR_CATEGORY_MAP: Record<string, { categoryName: string; categoryId: number }> = {
  // Software/Subscriptions → Miscellaneous Expenses (id: 10)
  "adobe": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "adobe cloud": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "creative cloud": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "dropbox": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "vimeo": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "canva": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "pixieset": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "shootproof": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "artlist": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "epidemic sound": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "honeybook": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "quickbooks": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "google workspace": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "zoom": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "icloud": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "lightroom": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "later": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "tailwind": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "mileiq": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "chatgpt": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "grammarly": { categoryName: "Miscellaneous Expenses", categoryId: 10 },
  "cloudflare": { categoryName: "Miscellaneous Expenses", categoryId: 10 },

  // Communication → Communication Expenses (id: 2)
  "phone": { categoryName: "Communication Expenses", categoryId: 2 },
  "cell phone": { categoryName: "Communication Expenses", categoryId: 2 },
  "internet": { categoryName: "Communication Expenses", categoryId: 2 },
  "ipad": { categoryName: "Communication Expenses", categoryId: 2 },
  "modem": { categoryName: "Communication Expenses", categoryId: 2 },
  "att": { categoryName: "Communication Expenses", categoryId: 2 },
  "t-mobile": { categoryName: "Communication Expenses", categoryId: 2 },
  "verizon": { categoryName: "Communication Expenses", categoryId: 2 },
  "comcast": { categoryName: "Communication Expenses", categoryId: 2 },
  "xfinity": { categoryName: "Communication Expenses", categoryId: 2 },

  // Advertising (id: 3)
  "facebook": { categoryName: "Advertising Expenses", categoryId: 3 },
  "instagram": { categoryName: "Advertising Expenses", categoryId: 3 },
  "tiktok": { categoryName: "Advertising Expenses", categoryId: 3 },
  "popl": { categoryName: "Advertising Expenses", categoryId: 3 },
  "google ads": { categoryName: "Advertising Expenses", categoryId: 3 },

  // Professional (id: 4)
  "ppa": { categoryName: "Professional Expenses", categoryId: 4 },

  // Insurance (id: 12)
  "hiscox": { categoryName: "Business Insurance", categoryId: 12 },
  "insurance": { categoryName: "Business Insurance", categoryId: 12 },

  // Travel (id: 5, 8)
  "hotel": { categoryName: "Business Travel - Hotels", categoryId: 5 },
  "marriott": { categoryName: "Business Travel - Hotels", categoryId: 5 },
  "hilton": { categoryName: "Business Travel - Hotels", categoryId: 5 },
  "airbnb": { categoryName: "Business Travel - Hotels", categoryId: 5 },
  "flight": { categoryName: "Airfare", categoryId: 8 },
  "airline": { categoryName: "Airfare", categoryId: 8 },
  "delta": { categoryName: "Airfare", categoryId: 8 },
  "united": { categoryName: "Airfare", categoryId: 8 },
  "southwest": { categoryName: "Airfare", categoryId: 8 },
  "american airlines": { categoryName: "Airfare", categoryId: 8 },
  "uber": { categoryName: "Business Travel - Fees", categoryId: 6 },
  "lyft": { categoryName: "Business Travel - Fees", categoryId: 6 },
  "baggage": { categoryName: "Business Travel - Fees", categoryId: 6 },

  // Equipment Rental (id: 9)
  "lens rental": { categoryName: "Equipment Rental", categoryId: 9 },
  "lensrentals": { categoryName: "Equipment Rental", categoryId: 9 },
  "borrowlenses": { categoryName: "Equipment Rental", categoryId: 9 },
  "studio rental": { categoryName: "Equipment Rental", categoryId: 9 },
};

export function findVendorCategory(text: string): { categoryName: string; categoryId: number } | null {
  const lower = text.toLowerCase();
  // Check longer phrases first to avoid partial matches
  const sortedKeys = Object.keys(VENDOR_CATEGORY_MAP).sort((a, b) => b.length - a.length);
  for (const vendor of sortedKeys) {
    if (lower.includes(vendor)) {
      return VENDOR_CATEGORY_MAP[vendor];
    }
  }
  return null;
}
