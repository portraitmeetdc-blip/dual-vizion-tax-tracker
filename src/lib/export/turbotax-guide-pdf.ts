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

export function generateTurboTaxGuide(data: ExportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title page
  doc.setFontSize(22);
  doc.setTextColor(26, 54, 93);
  doc.text("TurboTax Entry Guide", pageWidth / 2, 30, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(214, 158, 46);
  doc.text("Dual Vizion Photography", pageWidth / 2, 42, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(26, 54, 93);
  doc.text(`Tax Year ${data.taxYear}`, pageWidth / 2, 54, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Schedule C - Profit or Loss From Business`, pageWidth / 2, 64, { align: "center" });
  doc.text(`Grand Total Expenses: ${fmt(data.grandTotal)}`, pageWidth / 2, 72, { align: "center" });

  // Instructions
  doc.setFontSize(11);
  doc.setTextColor(26, 54, 93);
  doc.text("How to use this guide:", 14, 90);
  doc.setFontSize(9);
  doc.setTextColor(60);
  const instructions = [
    "1. Open TurboTax Self-Employed",
    "2. Navigate to: Federal > Income & Expenses > Self-Employment",
    "3. Select your business (Dual Vizion Photography)",
    "4. Go to Business Expenses",
    "5. For each section below, navigate to the indicated TurboTax section",
    "6. Enter the total amount shown, or individual line items as needed",
  ];
  instructions.forEach((line, i) => {
    doc.text(line, 20, 98 + i * 7);
  });

  // Each category as a section
  let pageNum = 1;
  for (const cat of data.categories) {
    if (cat.total === 0) continue;

    doc.addPage();
    pageNum++;

    // Category header
    doc.setFillColor(26, 54, 93);
    doc.rect(0, 10, pageWidth, 18, "F");
    doc.setFontSize(14);
    doc.setTextColor(255);
    doc.text(`${cat.scheduleCLine.toUpperCase()}`, 14, 22);
    doc.setFontSize(16);
    doc.text(fmt(cat.total), pageWidth - 14, 22, { align: "right" });

    // TurboTax navigation path
    doc.setFontSize(10);
    doc.setTextColor(214, 158, 46);
    doc.text(`TurboTax: Self-Employment > Expenses > ${cat.turbotaxSection}`, 14, 38);

    // Category name
    doc.setFontSize(12);
    doc.setTextColor(26, 54, 93);
    doc.text(cat.categoryName, 14, 48);

    // Items breakdown
    if (cat.items.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(60);
      doc.text("Breakdown:", 14, 58);

      // Consolidate items by description (sum monthly entries)
      const consolidated = new Map<string, number>();
      for (const item of cat.items) {
        const existing = consolidated.get(item.description) || 0;
        consolidated.set(item.description, existing + item.amount);
      }

      autoTable(doc, {
        startY: 62,
        head: [["Description", "Annual Total"]],
        body: Array.from(consolidated.entries()).map(([desc, total]) => [desc, fmt(total)]),
        foot: [["CATEGORY TOTAL", fmt(cat.total)]],
        theme: "plain",
        headStyles: { fillColor: [235, 244, 255], textColor: [26, 54, 93], fontStyle: "bold" },
        footStyles: {
          fillColor: [214, 158, 46],
          textColor: [26, 54, 93],
          fontStyle: "bold",
          fontSize: 10,
        },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { halign: "right", cellWidth: 40 },
        },
      });
    }

    // Special notes for certain categories
    const lastY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;

    if (cat.categoryName.includes("Meals")) {
      doc.setFontSize(9);
      doc.setTextColor(200, 50, 50);
      doc.text("NOTE: Meals are 50% deductible. TurboTax will automatically apply the 50% limit.", 14, lastY + 10);
    }

    if (cat.categoryName === "Assets") {
      doc.setFontSize(9);
      doc.setTextColor(200, 50, 50);
      doc.text("NOTE: These items qualify for Section 179 deduction. Select 'Section 179' when prompted.", 14, lastY + 10);
      doc.text("TurboTax will guide you through Form 4562 for each asset.", 14, lastY + 17);
    }

    if (cat.categoryName.includes("Communication")) {
      doc.setFontSize(9);
      doc.setTextColor(200, 50, 50);
      doc.text("NOTE: Apply your business-use percentage when entering these in TurboTax.", 14, lastY + 10);
    }
  }

  return doc;
}

export function downloadTurboTaxGuide(data: ExportData, filename: string) {
  const doc = generateTurboTaxGuide(data);
  doc.save(filename);
}
