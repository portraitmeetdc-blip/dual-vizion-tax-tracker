import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function generatePDF(data: ExportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(26, 54, 93); // navy
  doc.text("Dual Vizion Photography", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(14);
  doc.text(`Tax Year ${data.taxYear} - Expense Report`, pageWidth / 2, 30, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 37, { align: "center" });

  let yPos = 47;

  // Summary table
  doc.setFontSize(12);
  doc.setTextColor(26, 54, 93);
  doc.text("Expense Summary", 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [["Category", "Schedule C Line", "Total"]],
    body: data.categories.map((cat) => [cat.categoryName, cat.scheduleCLine, fmt(cat.total)]),
    foot: [["GRAND TOTAL", "", fmt(data.grandTotal)]],
    theme: "grid",
    headStyles: { fillColor: [26, 54, 93], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [214, 158, 46], textColor: [26, 54, 93], fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      2: { halign: "right" },
    },
  });

  // Detail pages for each category
  for (const cat of data.categories) {
    if (cat.items.length === 0) continue;

    doc.addPage();

    doc.setFontSize(14);
    doc.setTextColor(26, 54, 93);
    doc.text(cat.categoryName, 14, 20);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(cat.scheduleCLine, 14, 27);
    doc.text(`TurboTax: ${cat.turbotaxSection}`, 14, 33);

    autoTable(doc, {
      startY: 40,
      head: [["Description", "Date", "Amount", "Notes"]],
      body: cat.items.map((item) => [
        item.description,
        item.date || "",
        fmt(item.amount),
        item.notes || "",
      ]),
      foot: [["TOTAL", "", fmt(cat.total), ""]],
      theme: "striped",
      headStyles: { fillColor: [26, 54, 93], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: [26, 54, 93], fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 60 },
        2: { halign: "right", cellWidth: 25 },
      },
    });
  }

  return doc;
}

export function downloadPDF(data: ExportData, filename: string) {
  const doc = generatePDF(data);
  doc.save(filename);
}
