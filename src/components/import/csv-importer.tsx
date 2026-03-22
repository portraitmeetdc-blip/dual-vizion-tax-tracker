"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { parseRawCSV, detectColumns, parseGenericCSV, type ColumnMapping, type GenericParsedRow } from "@/lib/csv-parsers/generic-parser";
import { ImportPreview } from "./import-preview";
import type { Category } from "@/db/schema";

interface CSVImporterProps {
  taxYear: number;
  categories: Category[];
  onImport: (items: GenericParsedRow[]) => Promise<void>;
}

type Step = "paste" | "map" | "preview";

const COLUMN_ROLES = ["Skip", "Description", "Date", "Amount", "Notes"] as const;

export function CSVImporter({ taxYear, categories, onImport }: CSVImporterProps) {
  const [csvText, setCsvText] = useState("");
  const [step, setStep] = useState<Step>("paste");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnRoles, setColumnRoles] = useState<string[]>([]);
  const [parsedItems, setParsedItems] = useState<GenericParsedRow[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState<number>(0);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    if (!csvText.trim()) return;
    const { headers, rows } = parseRawCSV(csvText);
    if (rows.length === 0) return;

    setRawHeaders(headers);
    setRawRows(rows);

    const { mapping, confident } = detectColumns(headers);

    // Build role array from detected mapping
    const roles = headers.map(() => "Skip");
    if (mapping.descriptionCol !== null) roles[mapping.descriptionCol] = "Description";
    if (mapping.dateCol !== null) roles[mapping.dateCol] = "Date";
    if (mapping.amountCol !== null) roles[mapping.amountCol] = "Amount";
    if (mapping.notesCol !== null) roles[mapping.notesCol] = "Notes";
    setColumnRoles(roles);

    if (confident) {
      // Auto-detect worked well, go straight to mapping to confirm
      setStep("map");
    } else {
      setStep("map");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleColumnRoleChange = (colIndex: number, role: string) => {
    const updated = [...columnRoles];
    // If assigning a unique role, clear it from any other column first
    if (role !== "Skip") {
      for (let i = 0; i < updated.length; i++) {
        if (updated[i] === role) updated[i] = "Skip";
      }
    }
    updated[colIndex] = role;
    setColumnRoles(updated);
  };

  const handleContinueToPreview = () => {
    const mapping: ColumnMapping = {
      descriptionCol: columnRoles.indexOf("Description") >= 0 ? columnRoles.indexOf("Description") : null,
      dateCol: columnRoles.indexOf("Date") >= 0 ? columnRoles.indexOf("Date") : null,
      amountCol: columnRoles.indexOf("Amount") >= 0 ? columnRoles.indexOf("Amount") : null,
      notesCol: columnRoles.indexOf("Notes") >= 0 ? columnRoles.indexOf("Notes") : null,
    };

    if (mapping.descriptionCol === null && mapping.amountCol === null) return;

    const defaultCat = categories[0];
    const items = parseGenericCSV(rawRows, mapping, defaultCat.id, defaultCat.name);
    setParsedItems(items);
    setBulkCategoryId(defaultCat.id);
    setStep("preview");
  };

  const handleBulkCategoryChange = (categoryId: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    setBulkCategoryId(categoryId);
    setParsedItems(
      parsedItems.map((item) => ({
        ...item,
        suggestedCategoryId: categoryId,
        suggestedCategory: cat.name,
      }))
    );
  };

  const handleCategoryChange = (index: number, categoryId: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const updated = [...parsedItems];
    updated[index] = {
      ...updated[index],
      suggestedCategoryId: categoryId,
      suggestedCategory: cat.name,
    };
    setParsedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems(parsedItems.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    setImporting(true);
    await onImport(parsedItems);
    setImporting(false);
    resetAll();
  };

  const resetAll = () => {
    setCsvText("");
    setStep("paste");
    setRawHeaders([]);
    setRawRows([]);
    setColumnRoles([]);
    setParsedItems([]);
    setBulkCategoryId(0);
  };

  // ===== STEP: COLUMN MAPPING =====
  if (step === "map") {
    const previewRows = rawRows.slice(0, 5);
    const hasDescription = columnRoles.includes("Description");
    const hasAmount = columnRoles.includes("Amount");

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-[#1a365d] mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Map Your Columns
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Assign each column a role. At minimum, select Description and Amount.
        </p>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {/* Role selectors */}
              <tr className="bg-blue-50">
                {rawHeaders.map((_, colIdx) => (
                  <th key={colIdx} className="px-3 py-2">
                    <select
                      value={columnRoles[colIdx]}
                      onChange={(e) => handleColumnRoleChange(colIdx, e.target.value)}
                      className={`border rounded px-2 py-1 text-xs w-full ${
                        columnRoles[colIdx] !== "Skip"
                          ? "bg-[#1a365d] text-white font-bold"
                          : "bg-white text-gray-600"
                      }`}
                    >
                      {COLUMN_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </th>
                ))}
              </tr>
              {/* Original headers */}
              <tr className="bg-gray-50 border-b">
                {rawHeaders.map((header, colIdx) => (
                  <th
                    key={colIdx}
                    className={`px-3 py-2 text-left font-medium text-gray-600 ${
                      columnRoles[colIdx] === "Skip" ? "opacity-40" : ""
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-t">
                  {row.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-3 py-2 ${
                        columnRoles[colIdx] === "Skip" ? "opacity-40 text-gray-400" : "text-gray-800"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rawRows.length > 5 && (
          <p className="text-xs text-gray-400 mt-1">
            Showing 5 of {rawRows.length} rows
          </p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleContinueToPreview}
            disabled={!hasDescription && !hasAmount}
            className="flex items-center gap-2 px-6 py-2 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-[#162d4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Preview
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStep("paste")}
            className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {!hasDescription && !hasAmount && (
          <p className="text-xs text-red-500 mt-2">
            Please assign at least Description or Amount to a column.
          </p>
        )}
      </div>
    );
  }

  // ===== STEP: PREVIEW =====
  if (step === "preview" && parsedItems.length > 0) {
    return (
      <div>
        {/* Bulk category selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Set all items to category:
            </label>
            <select
              value={bulkCategoryId}
              onChange={(e) => handleBulkCategoryChange(parseInt(e.target.value))}
              className="border rounded px-3 py-1 text-sm flex-1 max-w-xs"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setStep("map")}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to mapping
            </button>
          </div>
        </div>

        <ImportPreview
          items={parsedItems}
          categories={categories}
          onCategoryChange={handleCategoryChange}
          onRemove={handleRemoveItem}
          onConfirm={handleImport}
          onCancel={resetAll}
          importing={importing}
          title="CSV Import Preview"
        />
      </div>
    );
  }

  // ===== STEP: PASTE =====
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-[#1a365d] mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        CSV / Spreadsheet Import
      </h3>

      <div className="space-y-4">
        {/* Paste Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paste your CSV, TSV, or spreadsheet data:
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Description, Date, Amount, Notes\nAdobe Creative Cloud, 2025-01-15, 54.99, Monthly subscription\nCamera Lens Rental, 2025-02-01, 150.00, Weekend shoot`}
            className="w-full h-40 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1a365d] resize-y"
          />
        </div>

        {/* File Upload */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">OR</span>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload CSV File
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Parse Button */}
        <button
          onClick={handleParse}
          disabled={!csvText.trim()}
          className="w-full py-2 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-[#162d4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Parse & Map Columns
        </button>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Works with any spreadsheet format:</p>
              <p>Bank exports, Numbers/Excel copy-paste, or any CSV/TSV file. Column headers are auto-detected, and you can manually assign them in the next step.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
