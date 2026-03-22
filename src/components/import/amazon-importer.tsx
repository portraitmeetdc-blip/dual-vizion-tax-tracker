"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, ExternalLink, ChevronDown, ChevronRight, ShoppingCart, ArrowLeft } from "lucide-react";
import { parseAmazonCSV, type AmazonItem } from "@/lib/csv-parsers/amazon-parser";
import { ImportPreview } from "./import-preview";
import type { Category } from "@/db/schema";

const OFFICE_SUPPLIES_ID = 15;

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
  const [showSteps, setShowSteps] = useState(true);
  const [bulkCategoryId, setBulkCategoryId] = useState(OFFICE_SUPPLIES_ID);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyDefaultCategory = (items: AmazonItem[]): AmazonItem[] => {
    const defaultCat = categories.find((c) => c.id === OFFICE_SUPPLIES_ID);
    const defaultName = defaultCat?.name || "Office Supplies & Expenses";
    return items.map((item) => ({
      ...item,
      suggestedCategoryId: OFFICE_SUPPLIES_ID,
      suggestedCategory: defaultName,
    }));
  };

  const handleParse = () => {
    if (!csvText.trim()) return;
    const items = applyDefaultCategory(parseAmazonCSV(csvText));
    setParsedItems(items);
    setBulkCategoryId(OFFICE_SUPPLIES_ID);
    setIsParsed(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const items = applyDefaultCategory(parseAmazonCSV(text));
      setParsedItems(items);
      setBulkCategoryId(OFFICE_SUPPLIES_ID);
      setIsParsed(true);
    };
    reader.readAsText(file);
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

  const amazonBusinessReportsUrl = `https://www.amazon.com/b2b/aba/reports?reportType=items_report_1&dateSpanSelection=MONTH_TO_DATE&ref=ab_ppx_hpr_redirect_report`;
  const amazonDataRequestUrl = `https://www.amazon.com/hz/privacy-central/data-requests/preview.html`;
  const amazonOrderHistoryUrl = `https://www.amazon.com/your-orders/orders?timeFilter=year-${taxYear}`;

  if (isParsed && parsedItems.length > 0) {
    return (
      <div>
        {/* Bulk category selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Import all items to:
            </label>
            <select
              value={bulkCategoryId}
              onChange={(e) => handleBulkCategoryChange(parseInt(e.target.value))}
              className="border rounded px-3 py-1.5 text-sm flex-1 max-w-xs"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setIsParsed(false);
                setParsedItems([]);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
          </div>
        </div>

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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Download from Amazon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-base sm:text-lg font-semibold text-[#1a365d] flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Step 1: Download Your Amazon Order History
          </h3>
          {showSteps ? (
            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          )}
        </button>

        {showSteps && (
          <div className="mt-4 space-y-4">
            {/* Primary: Amazon Business Order Reports */}
            <a
              href={amazonBusinessReportsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#FF9900] text-[#111] rounded-lg font-bold text-sm hover:bg-[#e88b00] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Amazon Business Order Reports
            </a>

            {/* Step-by-step instructions */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-[#1a365d]">Once on Amazon, just 3 clicks:</p>

              <div className="space-y-2.5">
                <div className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1a365d] text-white text-xs font-bold shrink-0">1</span>
                  <p className="text-sm text-gray-700">Change the <strong>&quot;Order Date&quot;</strong> dropdown from &quot;Month to date&quot; to cover <strong>01/01/{taxYear} – 12/31/{taxYear}</strong>.</p>
                </div>

                <div className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#d69e2e] text-[#1a365d] text-xs font-bold shrink-0">2</span>
                  <p className="text-sm text-gray-700">Click the orange <strong>&quot;Generate report&quot;</strong> button.</p>
                </div>

                <div className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">3</span>
                  <p className="text-sm text-gray-700">Click <strong>&quot;Download order documents&quot;</strong> to save the CSV, then upload it in Step 2 below.</p>
                </div>
              </div>
            </div>

            {/* Quick reference: View orders by year */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Quick Reference: View {taxYear} Orders</p>
                  <p className="mb-2">Browse your {taxYear} orders on Amazon while the report generates:</p>
                  <a
                    href={amazonOrderHistoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-800 font-medium underline hover:text-blue-900"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View {taxYear} Order History
                  </a>
                </div>
              </div>
            </div>

            {/* Fallback: Request Your Data */}
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">Alternative: Request Your Data</p>
                  <p className="mb-2">If Business Order Reports aren&apos;t loading, you can use Amazon&apos;s data export instead (takes 1-3 days):</p>
                  <a
                    href={amazonDataRequestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-900 font-medium underline hover:text-amber-950"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Request Your Data &gt; Your Orders
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Upload & Import */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-[#1a365d] mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Step 2: Upload & Import
        </h3>

        <div className="space-y-4">
          {/* File Upload (primary action) */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#1a365d] text-white rounded-lg text-sm font-medium hover:bg-[#162d4e] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Amazon CSV File
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Or paste */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-sm text-gray-500">or paste CSV data</span>
            </div>
          </div>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Paste your Amazon order CSV data here...\n\nExpected columns: Date, Title/Description, Amount/Total`}
            className="w-full h-32 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1a365d] resize-y"
          />

          {/* Parse Button */}
          <button
            onClick={handleParse}
            disabled={!csvText.trim()}
            className="w-full py-2 bg-[#d69e2e] text-[#1a365d] rounded-lg font-bold hover:bg-[#c08d26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Parse & Preview
          </button>
        </div>
      </div>

      {/* Auto-categorization info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-[#1a365d] mb-3">Auto-Categorization</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-medium shrink-0">Assets</span>
            <span>lens, camera, gimbal, drone, laptop, strobe, or any item over $500</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium shrink-0">Supplies</span>
            <span>cables, batteries, memory cards, bags, cases, cleaning kits, gaffer tape</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium shrink-0">Office</span>
            <span>hard drives, monitors, keyboards, tripods, lights, backdrops, printer ink, frames</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium shrink-0">Software</span>
            <span>subscriptions, licenses, presets, plugins, LUTs, Adobe, Lightroom</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium shrink-0">Professional</span>
            <span>books, courses, tutorials, workshops, education, training</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-medium shrink-0">Repairs</span>
            <span>repair parts, replacement parts, calibration tools</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">You can reassign categories for any item in the preview before importing.</p>
      </div>
    </div>
  );
}
