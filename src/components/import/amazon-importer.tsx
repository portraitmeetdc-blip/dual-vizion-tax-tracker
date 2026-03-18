"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { parseAmazonCSV, type AmazonItem } from "@/lib/csv-parsers/amazon-parser";
import { ImportPreview } from "./import-preview";
import type { Category } from "@/db/schema";

interface AmazonImporterProps {
  taxYear: number;
  categories: Category[];
  onImport: (items: AmazonItem[]) => Promise<void>;
}

export function AmazonImporter({ taxYear, categories, onImport }: AmazonImporterProps) {
  const [csvText, setCsvText] = useState("");
  const [parsedItems, setParsedItems] = useState<AmazonItem[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    if (!csvText.trim()) return;
    const items = parseAmazonCSV(csvText);
    setParsedItems(items);
    setIsParsed(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const items = parseAmazonCSV(text);
      setParsedItems(items);
      setIsParsed(true);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    await onImport(parsedItems);
    setImporting(false);
    setCsvText("");
    setParsedItems([]);
    setIsParsed(false);
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

  if (isParsed && parsedItems.length > 0) {
    return (
      <ImportPreview
        items={parsedItems}
        categories={categories}
        onCategoryChange={handleCategoryChange}
        onRemove={handleRemoveItem}
        onConfirm={handleImport}
        onCancel={() => {
          setIsParsed(false);
          setParsedItems([]);
        }}
        importing={importing}
        title="Amazon Purchase Import Preview"
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-[#1a365d] mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Amazon Purchase Import
      </h3>

      <div className="space-y-4">
        {/* Paste Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paste your Amazon order CSV data:
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Date, Description, Amount, Category\n01/15/2024, USB-C Cable, 12.99, Supplies\n02/01/2024, External Hard Drive 4TB, 119.99, Office`}
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
            accept=".csv,.txt"
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
          Parse & Preview
        </button>

        {/* Supported Categories */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Auto-categorization keywords:</p>
              <p>lens, camera → Assets | cable, battery, filter → Supplies | hard drive, keyboard → Office Supplies | software → Miscellaneous</p>
              <p className="mt-1">Items over $500 are automatically categorized as Assets (Section 179).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
