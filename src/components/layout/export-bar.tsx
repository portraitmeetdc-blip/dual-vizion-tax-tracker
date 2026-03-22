"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer, Volume2, VolumeX, Loader2 } from "lucide-react";
import { downloadCSV, generateCSV } from "@/lib/export/csv-export";
import { downloadExcel } from "@/lib/export/excel-export";
import { downloadPDF } from "@/lib/export/pdf-export";
import { downloadTurboTaxGuide } from "@/lib/export/turbotax-guide-pdf";
import { readSummaryAloud, stopSpeaking } from "@/lib/speech-synthesis";

interface ExportBarProps {
  taxYear: number;
}

export function ExportBar({ taxYear }: ExportBarProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchExportData = async () => {
    const res = await fetch(`/api/export?year=${taxYear}`);
    return res.json();
  };

  const handleCSV = async () => {
    setExporting("csv");
    const data = await fetchExportData();
    const csv = generateCSV(data);
    downloadCSV(csv, `dual-vizion-expenses-${taxYear}.csv`);
    setExporting(null);
  };

  const handleExcel = async () => {
    setExporting("excel");
    const data = await fetchExportData();
    downloadExcel(data, `dual-vizion-expenses-${taxYear}.xlsx`);
    setExporting(null);
  };

  const handlePDF = async () => {
    setExporting("pdf");
    const data = await fetchExportData();
    downloadPDF(data, `dual-vizion-expenses-${taxYear}.pdf`);
    setExporting(null);
  };

  const handleTurboTaxGuide = async () => {
    setExporting("turbotax");
    const data = await fetchExportData();
    downloadTurboTaxGuide(data, `turbotax-guide-${taxYear}.pdf`);
    setExporting(null);
  };

  const handleReadAloud = async () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const data = await fetchExportData();
    setIsSpeaking(true);
    readSummaryAloud(
      taxYear,
      data.categories.map((c: { categoryName: string; total: number }) => ({
        categoryName: c.categoryName,
        total: c.total,
      })),
      data.grandTotal
    );

    // Listen for speech end
    if ("speechSynthesis" in window) {
      const checkSpeaking = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
          clearInterval(checkSpeaking);
        }
      }, 500);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      <span className="text-sm font-medium text-gray-600 mr-1 sm:mr-2">
        <Download className="w-4 h-4 inline mr-1" />
        <span className="hidden sm:inline">Export:</span>
      </span>

      <button
        onClick={handleCSV}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {exporting === "csv" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        CSV
      </button>

      <button
        onClick={handleExcel}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {exporting === "excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        Excel
      </button>

      <button
        onClick={handlePDF}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
      >
        {exporting === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
        Print / PDF
      </button>

      <button
        onClick={handleTurboTaxGuide}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#d69e2e] text-[#1a365d] rounded-lg text-sm font-bold hover:bg-[#c08d26] disabled:opacity-50 transition-colors"
      >
        {exporting === "turbotax" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        TurboTax Guide
      </button>

      <button
        onClick={handleReadAloud}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isSpeaking
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-rose-500 text-white hover:bg-rose-600"
        }`}
      >
        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        {isSpeaking ? "Stop" : "Read Aloud"}
      </button>
    </div>
  );
}
