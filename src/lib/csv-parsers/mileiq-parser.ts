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

export function parseMileIQData(text: string, taxYear: number): MileIQEntry[] {
  const trimmed = text.trim();

  // Detect if it's JSON (starts with [ or {)
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return parseMileIQJSON(trimmed, taxYear);
  }

  // Otherwise treat as CSV
  return parseMileIQCSV(trimmed, taxYear);
}

function parseMileIQJSON(jsonText: string, taxYear: number): MileIQEntry[] {
  const rate = IRS_MILEAGE_RATES[taxYear] || 0.7;
  const entries: MileIQEntry[] = [];

  let data = JSON.parse(jsonText);

  // Handle both array and object with a data/drives/trips key
  if (!Array.isArray(data)) {
    data = data.data || data.drives || data.trips || data.results || data.items || [];
  }

  for (const row of data) {
    // Try various MileIQ JSON field names (camelCase, snake_case, etc.)
    const date = row.date || row.driveDate || row.drive_date || row.startDate || row.start_date || "";
    const start = row.startLocation || row.start_location || row.start || row.from || row.startName || row.start_name || "";
    const stop = row.stopLocation || row.stop_location || row.stop || row.end || row.to || row.endLocation || row.end_location || row.endName || row.end_name || "";
    const miles = parseFloat(row.miles || row.distance || row.totalMiles || row.total_miles || row.distanceMiles || row.distance_miles || 0) || 0;
    const parking = parseFloat(row.parking || row.parkingFees || row.parking_fees || row.parkingCost || row.parking_cost || 0) || 0;
    const tolls = parseFloat(row.tolls || row.tollFees || row.toll_fees || row.tollCost || row.toll_cost || 0) || 0;
    const purpose = row.purpose || row.reason || row.notes || row.category || row.businessPurpose || row.business_purpose || "";

    if (miles === 0 && parking === 0 && tolls === 0) continue;

    const deductionAmount = miles * rate + parking + tolls;

    entries.push({
      date: normalizeDate(String(date)),
      startLocation: String(start).trim(),
      stopLocation: String(stop).trim(),
      miles,
      parking,
      tolls,
      purpose: String(purpose).trim(),
      deductionAmount: Math.round(deductionAmount * 100) / 100,
    });
  }

  return entries;
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
