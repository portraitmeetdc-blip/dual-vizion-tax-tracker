export function generateCSV(data: {
  categories: {
    categoryName: string;
    scheduleCLine: string;
    items: { description: string; date: string | null; amount: number; notes: string | null }[];
  }[];
}): string {
  const rows = ["Category,Schedule C Line,Description,Date,Amount,Notes"];

  for (const cat of data.categories) {
    for (const item of cat.items) {
      rows.push(
        [
          `"${cat.categoryName}"`,
          `"${cat.scheduleCLine}"`,
          `"${item.description}"`,
          `"${item.date || ""}"`,
          item.amount.toFixed(2),
          `"${(item.notes || "").replace(/"/g, '""')}"`,
        ].join(",")
      );
    }
  }

  return rows.join("\n");
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
