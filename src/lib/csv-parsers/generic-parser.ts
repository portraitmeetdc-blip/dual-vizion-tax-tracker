import Papa from "papaparse";

export interface GenericParsedRow {
  description: string;
  date: string;
  amount: number;
  notes: string;
  suggestedCategory: string;
  suggestedCategoryId: number;
}

export interface ColumnMapping {
  descriptionCol: number | null;
  dateCol: number | null;
  amountCol: number | null;
  notesCol: number | null;
}

const DESCRIPTION_HEADERS = ["description", "title", "item", "name", "memo", "payee", "merchant", "vendor", "transaction", "product"];
const DATE_HEADERS = ["date", "posted", "transaction date", "post date", "trans date", "order date"];
const AMOUNT_HEADERS = ["amount", "total", "price", "debit", "cost", "charge", "payment", "sum"];
const NOTES_HEADERS = ["notes", "note", "memo", "category", "reference", "details", "type"];

export function detectColumns(headers: string[]): { mapping: ColumnMapping; confident: boolean } {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const mapping: ColumnMapping = {
    descriptionCol: null,
    dateCol: null,
    amountCol: null,
    notesCol: null,
  };

  for (let i = 0; i < lower.length; i++) {
    if (mapping.descriptionCol === null && DESCRIPTION_HEADERS.some((h) => lower[i].includes(h))) {
      mapping.descriptionCol = i;
    } else if (mapping.dateCol === null && DATE_HEADERS.some((h) => lower[i].includes(h))) {
      mapping.dateCol = i;
    } else if (mapping.amountCol === null && AMOUNT_HEADERS.some((h) => lower[i].includes(h))) {
      mapping.amountCol = i;
    } else if (mapping.notesCol === null && NOTES_HEADERS.some((h) => lower[i].includes(h))) {
      mapping.notesCol = i;
    }
  }

  const confident = mapping.descriptionCol !== null && mapping.amountCol !== null;
  return { mapping, confident };
}

export function parseGenericCSV(rawRows: string[][], mapping: ColumnMapping, defaultCategoryId: number, defaultCategoryName: string): GenericParsedRow[] {
  const items: GenericParsedRow[] = [];

  for (const row of rawRows) {
    const description = mapping.descriptionCol !== null ? (row[mapping.descriptionCol] || "").trim() : "";
    const dateRaw = mapping.dateCol !== null ? (row[mapping.dateCol] || "").trim() : "";
    const amountRaw = mapping.amountCol !== null ? (row[mapping.amountCol] || "").trim() : "0";
    const notes = mapping.notesCol !== null ? (row[mapping.notesCol] || "").trim() : "";

    // Parse amount: strip $, commas, handle parentheses for negatives
    let amountStr = amountRaw.replace(/[$,]/g, "");
    if (amountStr.startsWith("(") && amountStr.endsWith(")")) {
      amountStr = "-" + amountStr.slice(1, -1);
    }
    const amount = parseFloat(amountStr) || 0;

    if (!description && amount === 0) continue;

    items.push({
      description: description || "Unnamed item",
      date: normalizeDate(dateRaw),
      amount: Math.abs(amount),
      notes,
      suggestedCategory: defaultCategoryName,
      suggestedCategoryId: defaultCategoryId,
    });
  }

  return items;
}

export function parseRawCSV(csvText: string): { headers: string[]; rows: string[][] } {
  const result = Papa.parse(csvText.trim(), {
    header: false,
    skipEmptyLines: true,
  });

  const data = result.data as string[][];
  if (data.length === 0) return { headers: [], rows: [] };

  return {
    headers: data[0],
    rows: data.slice(1),
  };
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return dateStr;
}
