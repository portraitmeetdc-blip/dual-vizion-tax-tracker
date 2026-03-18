import Papa from "papaparse";
import { IRS_MILEAGE_RATES } from "@/lib/constants";

export interface MileIQEntry {
  date: string;
  startLocation: string;
  stopLocation: string;
  miles: number;
  parking: number;
  tolls: number;
  purpose: string;
  deductionAmount: number;
}

export function parseMileIQCSV(csvText: string, taxYear: number): MileIQEntry[] {
  const rate = IRS_MILEAGE_RATES[taxYear] || 0.7;

  const result = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase(),
  });

  const entries: MileIQEntry[] = [];

  for (const row of result.data as Record<string, string>[]) {
    const date = row["date"] || row["drive date"] || "";
    const start = row["start"] || row["start location"] || row["from"] || "";
    const stop = row["stop"] || row["end location"] || row["end"] || row["to"] || "";
    const milesStr = row["miles"] || row["distance"] || row["total miles"] || "0";
    const parkingStr = row["parking"] || row["parking fees"] || "0";
    const tollsStr = row["tolls"] || row["toll fees"] || "0";
    const purpose = row["purpose"] || row["reason"] || row["notes"] || "";

    const miles = parseFloat(milesStr.replace(/[^0-9.]/g, "")) || 0;
    const parking = parseFloat(parkingStr.replace(/[$,]/g, "")) || 0;
    const tolls = parseFloat(tollsStr.replace(/[$,]/g, "")) || 0;

    if (miles === 0 && parking === 0 && tolls === 0) continue;

    const deductionAmount = miles * rate + parking + tolls;

    entries.push({
      date: normalizeDate(date),
      startLocation: start.trim(),
      stopLocation: stop.trim(),
      miles,
      parking,
      tolls,
      purpose: purpose.trim(),
      deductionAmount: Math.round(deductionAmount * 100) / 100,
    });
  }

  return entries;
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return dateStr;
}
