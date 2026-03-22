"use client";

import { useState, useRef } from "react";
import { Upload, MapPin, X, Check, Loader2, ExternalLink, AlertCircle, ChevronDown, ChevronRight, Smartphone } from "lucide-react";
import { parseMileIQData, type MileIQEntry } from "@/lib/csv-parsers/mileiq-parser";
import { formatCurrency } from "@/lib/utils";
import { IRS_MILEAGE_RATES } from "@/lib/constants";

interface MileIQImporterProps {
  taxYear: number;
  onImport: (entries: MileIQEntry[]) => Promise<void>;
}

export function MileIQImporter({ taxYear, onImport }: MileIQImporterProps) {
  const [entries, setEntries] = useState<MileIQEntry[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showSteps, setShowSteps] = useState(true);
  const [pasteText, setPasteText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    if (!pasteText.trim()) return;
    const parsed = parseMileIQData(pasteText, taxYear);
    setEntries(parsed);
    setIsParsed(true);
  };

  const rate = IRS_MILEAGE_RATES[taxYear] || 0.7;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseMileIQData(text, taxYear);
      setEntries(parsed);
      setIsParsed(true);
    };
    reader.readAsText(file);
  };

  const handleRemove = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    setImporting(true);
    await onImport(entries);
    setImporting(false);
    setEntries([]);
    setIsParsed(false);
  };

  const totalMiles = entries.reduce((sum, e) => sum + e.miles, 0);
  const totalDeduction = entries.reduce((sum, e) => sum + e.deductionAmount, 0);

  if (isParsed && entries.length > 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-[#1a365d]">MileIQ Import Preview</h3>
          <div className="text-xs sm:text-sm text-gray-500 flex flex-wrap gap-2 sm:gap-4">
            <span>{entries.length} trips</span>
            <span>{totalMiles.toFixed(1)} miles</span>
            <span className="font-medium text-[#1a365d]">
              Deduction: {formatCurrency(totalDeduction)}
            </span>
          </div>
        </div>

        <div className="mb-2 text-xs text-gray-500">
          IRS rate for {taxYear}: ${rate}/mile
        </div>

        {/* Desktop table */}
        <div className="hidden md:block border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">From</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">To</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Miles</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Parking</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Tolls</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Deduction</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Purpose</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-600">{entry.date}</td>
                  <td className="px-3 py-2 max-w-[120px] truncate">{entry.startLocation}</td>
                  <td className="px-3 py-2 max-w-[120px] truncate">{entry.stopLocation}</td>
                  <td className="px-3 py-2 text-right">{entry.miles.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">
                    {entry.parking > 0 ? formatCurrency(entry.parking) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {entry.tolls > 0 ? formatCurrency(entry.tolls) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatCurrency(entry.deductionAmount)}
                  </td>
                  <td className="px-3 py-2 max-w-[120px] truncate text-gray-500">
                    {entry.purpose}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleRemove(idx)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden max-h-96 overflow-y-auto space-y-2">
          {entries.map((entry, idx) => (
            <div key={idx} className="border rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{entry.date}</span>
                    <span className="text-xs font-medium">{entry.miles.toFixed(1)} mi</span>
                  </div>
                  <p className="text-sm truncate mt-0.5">{entry.startLocation} → {entry.stopLocation}</p>
                  {entry.purpose && (
                    <p className="text-xs text-gray-400 truncate">{entry.purpose}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className="text-sm font-bold text-[#1a365d]">{formatCurrency(entry.deductionAmount)}</span>
                  <button
                    onClick={() => handleRemove(idx)}
                    className="text-red-400 active:text-red-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleImport}
            disabled={importing || entries.length === 0}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Import {entries.length} Trips
          </button>
          <button
            onClick={() => {
              setIsParsed(false);
              setEntries([]);
            }}
            className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Export from MileIQ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-base sm:text-lg font-semibold text-[#1a365d] flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Step 1: Export from MileIQ App
          </h3>
          {showSteps ? (
            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          )}
        </button>

        {showSteps && (
          <div className="mt-4 space-y-4">
            {/* Step-by-step instructions */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-[#1a365d]">On your phone, open the MileIQ app:</p>

              <div className="space-y-2.5">
                <div className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1a365d] text-white text-xs font-bold shrink-0">1</span>
                  <p className="text-sm text-gray-700">Open the <strong>MileIQ app</strong> on your phone and tap the <strong>menu</strong> (three lines or gear icon).</p>
                </div>

                <div className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1a365d] text-white text-xs font-bold shrink-0">2</span>
                  <p className="text-sm text-gray-700">Tap <strong>&quot;Reports&quot;</strong> and then <strong>&quot;Create Report&quot;</strong> or <strong>&quot;New Report&quot;</strong>.</p>
                </div>

                <div className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1a365d] text-white text-xs font-bold shrink-0">3</span>
                  <p className="text-sm text-gray-700">Set the date range to <strong>Jan 1, {taxYear}</strong> through <strong>Dec 31, {taxYear}</strong>. Filter for <strong>Business drives only</strong>.</p>
                </div>

                <div className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#d69e2e] text-[#1a365d] text-xs font-bold shrink-0">4</span>
                  <p className="text-sm text-gray-700">Tap <strong>&quot;Share&quot;</strong> or <strong>&quot;Export&quot;</strong> and choose <strong>&quot;CSV&quot;</strong> format. Either save to <strong>Files</strong> or <strong>email it to yourself</strong>.</p>
                </div>

                <div className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">5</span>
                  <p className="text-sm text-gray-700">Upload the CSV file in <strong>Step 2</strong> below. You can do this right from your phone.</p>
                </div>
              </div>
            </div>

            {/* MileIQ web dashboard link */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Prefer using a computer?</p>
                  <p className="mb-2">You can also export from the MileIQ web dashboard:</p>
                  <a
                    href="https://dashboard.mileiq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-800 font-medium underline hover:text-blue-900"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open MileIQ Dashboard
                  </a>
                </div>
              </div>
            </div>

            {/* IRS rate info */}
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">IRS Standard Mileage Rate for {taxYear}</p>
                  <p>The current rate is <strong>${rate}/mile</strong>. The app automatically calculates your deduction using this rate, plus any parking and tolls from your MileIQ data.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Upload or Paste */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-[#1a365d] mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Step 2: Upload or Paste MileIQ Data
        </h3>

        <div className="space-y-4">
          {/* Upload button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#1a365d] text-white rounded-lg text-sm font-medium hover:bg-[#162d4e] transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload MileIQ File (CSV or JSON)
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Or paste */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-sm text-gray-500">or paste MileIQ data</span>
            </div>
          </div>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your MileIQ CSV or report data here..."
            className="w-full h-32 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1a365d] resize-y"
          />

          <button
            onClick={handleParse}
            disabled={!pasteText.trim()}
            className="w-full py-2 bg-[#d69e2e] text-[#1a365d] rounded-lg font-bold hover:bg-[#c08d26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Parse & Preview
          </button>
        </div>
      </div>
    </div>
  );
}
