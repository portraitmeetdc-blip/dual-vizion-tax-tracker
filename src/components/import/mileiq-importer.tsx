"use client";

import { useState, useRef } from "react";
import { Upload, MapPin, X, Check, Loader2 } from "lucide-react";
import { parseMileIQCSV, type MileIQEntry } from "@/lib/csv-parsers/mileiq-parser";
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
  const fileRef = useRef<HTMLInputElement>(null);

  const rate = IRS_MILEAGE_RATES[taxYear] || 0.7;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseMileIQCSV(text, taxYear);
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1a365d]">MileIQ Import Preview</h3>
          <div className="text-sm text-gray-500 space-x-4">
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

        <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
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

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleImport}
            disabled={importing || entries.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
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
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-[#1a365d] mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        MileIQ Import
      </h3>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Upload your MileIQ CSV export to import mileage data. The IRS standard mileage rate
          for {taxYear} is <strong>${rate}/mile</strong>.
        </p>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#1a365d] transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const text = ev.target?.result as string;
                const parsed = parseMileIQCSV(text, taxYear);
                setEntries(parsed);
                setIsParsed(true);
              };
              reader.readAsText(file);
            }
          }}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Click to upload or drag & drop your MileIQ CSV file
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Expected columns: Date, Start, Stop, Miles, Parking, Tolls, Purpose
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
