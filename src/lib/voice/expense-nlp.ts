import { findVendorCategory } from "./vendor-map";

export interface ParsedExpense {
  amount: number | null;
  vendor: string | null;
  categoryName: string | null;
  categoryId: number | null;
  rawText: string;
}

/**
 * Parses spoken text to extract expense details.
 * Examples:
 *   "spent $183 on Adobe Cloud" → { amount: 183, vendor: "Adobe Cloud", category: "Miscellaneous Expenses" }
 *   "paid 250 for Instagram ads" → { amount: 250, vendor: "Instagram", category: "Advertising Expenses" }
 *   "$45 Uber ride" → { amount: 45, vendor: "Uber", category: "Business Travel - Fees" }
 */
export function parseExpenseText(text: string): ParsedExpense {
  const result: ParsedExpense = {
    amount: null,
    vendor: null,
    categoryName: null,
    categoryId: null,
    rawText: text,
  };

  // Extract amount - look for dollar amounts or plain numbers
  const amountPatterns = [
    /\$\s?([\d,]+(?:\.\d{2})?)/,           // $183 or $183.00 or $ 183
    /(\d+(?:\.\d{2})?)\s*dollars/i,         // 183 dollars
    /(?:spent|paid|cost|charged)\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,  // spent 183
    /(\d+(?:\.\d{2})?)\s*(?:for|on|to)/i,   // 183 for / 183 on
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.amount = parseFloat(match[1].replace(/,/g, ""));
      break;
    }
  }

  // If no match yet, try to find any number
  if (result.amount === null) {
    const numMatch = text.match(/(\d+(?:\.\d{2})?)/);
    if (numMatch) {
      result.amount = parseFloat(numMatch[1]);
    }
  }

  // Extract vendor using keyword matching
  const vendorResult = findVendorCategory(text);
  if (vendorResult) {
    result.categoryName = vendorResult.categoryName;
    result.categoryId = vendorResult.categoryId;

    // Try to extract vendor name from text
    const lower = text.toLowerCase();
    // Find the matching vendor keyword to use as vendor name
    const vendorWords = text.split(/\s+/);
    // Use the part after "on", "for", "to", or "at" as vendor name
    const prepositions = ["on", "for", "to", "at"];
    for (const prep of prepositions) {
      const prepIdx = lower.indexOf(` ${prep} `);
      if (prepIdx !== -1) {
        let vendorPart = text.substring(prepIdx + prep.length + 2).trim();
        // Remove trailing amount if present
        vendorPart = vendorPart.replace(/\$?\s*[\d,]+(?:\.\d{2})?\s*$/, "").trim();
        if (vendorPart) {
          result.vendor = vendorPart;
          break;
        }
      }
    }

    if (!result.vendor) {
      // Fallback: use the matched category name as rough vendor
      result.vendor = vendorResult.categoryName;
    }
  } else {
    // No vendor match - try to extract text after prepositions
    const lower = text.toLowerCase();
    const prepositions = ["on", "for", "to", "at"];
    for (const prep of prepositions) {
      const prepIdx = lower.indexOf(` ${prep} `);
      if (prepIdx !== -1) {
        let vendorPart = text.substring(prepIdx + prep.length + 2).trim();
        vendorPart = vendorPart.replace(/\$?\s*[\d,]+(?:\.\d{2})?\s*$/, "").trim();
        if (vendorPart) {
          result.vendor = vendorPart;
          break;
        }
      }
    }
  }

  return result;
}
