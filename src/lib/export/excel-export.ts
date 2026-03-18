import * as XLSX from "xlsx";

interface ExportData {
  taxYear: number;
  grandTotal: number;
  categories: {
    categoryName: string;
    scheduleCLine: string;
    turbotaxSection: string;
    total: number;
    items: { description: string; date: string | null; amount: number; notes: string | null }[];
  }[];
}

export function generateExcel(data: ExportData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["Dual Vizion Photography - Tax Expense Summary"],
    [`Tax Year: ${data.taxYear}`],
    [],
    ["Category", "Schedule C Line", "TurboTax Section", "Total"],
    ...data.categories.map((cat) => [
      cat.categoryName,
      cat.scheduleCLine,
      cat.turbotaxSection,
      cat.total,
    ]),
    [],
    ["GRAND TOTAL", "", "", data.grandTotal],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 35 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // Individual category sheets
  for (const cat of data.categories) {
    if (cat.items.length === 0) continue;

    const sheetData = [
      [cat.categoryName],
      [cat.scheduleCLine],
      [`TurboTax: ${cat.turbotaxSection}`],
      [],
      ["Description", "Date", "Amount", "Notes"],
      ...cat.items.map((item) => [
        item.description,
        item.date || "",
        item.amount,
        item.notes || "",
      ]),
      [],
      ["TOTAL", "", cat.total, ""],
    ];

    // Truncate sheet name to 31 chars (Excel limit)
    const sheetName = cat.categoryName.substring(0, 31);
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    sheet["!cols"] = [{ wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  }

  return wb;
}

export function downloadExcel(data: ExportData, filename: string) {
  const wb = generateExcel(data);
  XLSX.writeFile(wb, filename);
}
