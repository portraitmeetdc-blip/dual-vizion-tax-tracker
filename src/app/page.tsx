"use client";

import { useState, useEffect, useCallback } from "react";
import { ExpenseSection } from "@/components/expenses/expense-section";
import { AmazonImporter } from "@/components/import/amazon-importer";
import { MileIQImporter } from "@/components/import/mileiq-importer";
import { CSVImporter } from "@/components/import/csv-importer";
import { ReceiptScanner } from "@/components/import/receipt-scanner";
import { VoiceButton } from "@/components/voice/voice-button";
import { ExportBar } from "@/components/layout/export-bar";
import { formatCurrency } from "@/lib/utils";
import { TAX_YEARS } from "@/lib/constants";
import type { Expense, Category } from "@/db/schema";
import type { AmazonItem } from "@/lib/csv-parsers/amazon-parser";
import type { MileIQEntry } from "@/lib/csv-parsers/mileiq-parser";
import type { GenericParsedRow } from "@/lib/csv-parsers/generic-parser";
import {
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  MapPin,
  BarChart3,
  Settings,
  RefreshCw,
  Camera,
  ScanLine,
  TableProperties,
} from "lucide-react";

type ViewMode = "expenses" | "import-amazon" | "import-mileiq" | "import-csv" | "scan-receipt" | "schedule-c" | "settings";

export default function Dashboard() {
  const [taxYear, setTaxYear] = useState(2025);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("expenses");
  const [businessName, setBusinessName] = useState("Dual Vizion Photography");
  const [ownerName, setOwnerName] = useState("M. Edwards");
  const [allCollapsed, setAllCollapsed] = useState(false);

  // Settings state
  const [phoneBusinessPct, setPhoneBusinessPct] = useState(100);
  const [internetBusinessPct, setInternetBusinessPct] = useState(100);
  const [mileageMethod, setMileageMethod] = useState("standard");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/expenses?year=${taxYear}`);
    const data = await res.json();
    setExpenses(data);
    setLoading(false);
  }, [taxYear]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setBusinessName(data.businessName);
    setOwnerName(data.ownerName);
    setPhoneBusinessPct(data.phoneBusinessPct);
    setInternetBusinessPct(data.internetBusinessPct);
    setMileageMethod(data.mileageMethod);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchSettings();
  }, [fetchCategories, fetchSettings]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddExpense = async (expense: {
    categoryId: number;
    description: string;
    date?: string;
    amount: number;
    notes?: string;
    isRecurring?: boolean;
    recurrenceType?: string;
  }) => {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...expense, taxYear }),
    });
    if (res.ok) {
      await fetchExpenses();
      return true;
    }
    return false;
  };

  const handleUpdateExpense = async (expense: Partial<Expense> & { id: number }) => {
    const res = await fetch("/api/expenses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    if (res.ok) {
      await fetchExpenses();
      return true;
    }
    return false;
  };

  const handleDeleteExpense = async (id: number) => {
    const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchExpenses();
      return true;
    }
    return false;
  };

  const handleAmazonImport = async (items: AmazonItem[]) => {
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "amazon",
        taxYear,
        items: items.map((item) => ({
          categoryId: item.suggestedCategoryId,
          description: item.description,
          date: item.date,
          amount: item.amount,
          notes: `Amazon import - ${item.suggestedCategory}`,
        })),
      }),
    });
    if (res.ok) {
      await fetchExpenses();
      setViewMode("expenses");
    }
  };

  const handleMileIQImport = async (entries: MileIQEntry[]) => {
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "mileiq", taxYear, items: entries }),
    });
    if (res.ok) {
      await fetchExpenses();
      setViewMode("expenses");
    }
  };

  const handleCSVImport = async (items: GenericParsedRow[]) => {
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "csv",
        taxYear,
        items: items.map((item) => ({
          categoryId: item.suggestedCategoryId,
          description: item.description,
          date: item.date,
          amount: item.amount,
          notes: item.notes || `CSV import`,
        })),
      }),
    });
    if (res.ok) {
      await fetchExpenses();
      setViewMode("expenses");
    }
  };

  const handleRollover = async () => {
    const toYear = taxYear + 1;
    if (!confirm(`Copy all recurring expenses from ${taxYear} to ${toYear}?`)) return;

    const res = await fetch("/api/years/rollover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromYear: taxYear, toYear }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      setTaxYear(toYear);
    } else {
      alert(data.error || "Rollover failed");
    }
  };

  const handleSaveSettings = async () => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName,
        ownerName,
        currentTaxYear: taxYear,
        phoneBusinessPct,
        internetBusinessPct,
        mileageMethod,
      }),
    });
    if (res.ok) {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    }
  };

  // Group expenses by category
  const expensesByCategory = categories.map((cat) => ({
    category: cat,
    expenses: expenses.filter((e) => e.categoryId === cat.id),
  }));

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Schedule C grouped data
  const scheduleCData = categories.reduce(
    (acc, cat) => {
      const catExpenses = expenses.filter((e) => e.categoryId === cat.id);
      const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
      const lineKey = cat.scheduleCLine;

      if (!acc[lineKey]) {
        acc[lineKey] = { line: lineKey, section: cat.turbotaxSection, categories: [], total: 0 };
      }
      acc[lineKey].categories.push({ name: cat.name, total, items: catExpenses });
      acc[lineKey].total += total;
      return acc;
    },
    {} as Record<
      string,
      {
        line: string;
        section: string;
        categories: { name: string; total: number; items: Expense[] }[];
        total: number;
      }
    >
  );

  return (
    <div className="min-h-screen bg-[#ebf4ff]">
      {/* Top Header Bar */}
      <header className="bg-[#1a365d] text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8 text-[#d69e2e]" />
              <div>
                <h1 className="text-xl font-bold">{businessName}</h1>
                <p className="text-xs text-gray-300">Tax Expense Tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Business Name (editable) */}
              <div className="hidden md:block">
                <label className="text-xs text-gray-300">Business</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onBlur={handleSaveSettings}
                  className="block bg-white/10 border border-white/20 rounded px-2 py-1 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-[#d69e2e]"
                />
              </div>

              {/* Owner */}
              <div className="hidden md:block">
                <label className="text-xs text-gray-300">Owner</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  onBlur={handleSaveSettings}
                  className="block bg-white/10 border border-white/20 rounded px-2 py-1 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-[#d69e2e]"
                />
              </div>

              {/* Tax Year */}
              <div>
                <label className="text-xs text-gray-300">Tax Year</label>
                <select
                  value={taxYear}
                  onChange={(e) => setTaxYear(parseInt(e.target.value))}
                  className="block bg-white/10 border border-white/20 rounded px-3 py-1 text-sm font-bold text-[#d69e2e] focus:outline-none focus:ring-1 focus:ring-[#d69e2e] cursor-pointer"
                >
                  {TAX_YEARS.map((y) => (
                    <option key={y} value={y} className="text-gray-900">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b shadow-sm sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          {[
            { key: "expenses", label: "Expenses", icon: FileSpreadsheet },
            { key: "import-amazon", label: "Amazon Import", icon: FileSpreadsheet },
            { key: "import-mileiq", label: "MileIQ Import", icon: MapPin },
            { key: "import-csv", label: "CSV Import", icon: TableProperties },
            { key: "scan-receipt", label: "Scan Receipt", icon: ScanLine },
            { key: "schedule-c", label: "Schedule C", icon: BarChart3 },
            { key: "settings", label: "Settings", icon: Settings },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key as ViewMode)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                viewMode === key
                  ? "border-[#d69e2e] text-[#1a365d]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* ===== EXPENSES VIEW ===== */}
        {viewMode === "expenses" && (
          <>
            {/* Grand Total + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1a365d]">
                  {taxYear} Expenses
                </h2>
                <p className="text-sm text-gray-500">
                  {expenses.length} items across {categories.length} categories
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <button
                  onClick={() => setAllCollapsed(!allCollapsed)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-[#1a365d] transition-colors"
                >
                  {allCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                  {allCollapsed ? "Expand All" : "Collapse All"}
                </button>
                <button
                  onClick={handleRollover}
                  className="hidden sm:flex items-center gap-1 px-3 py-2 bg-[#1a365d] text-white rounded-lg text-sm font-medium hover:bg-[#162d4e] transition-colors"
                  title={`Copy recurring items to ${taxYear + 1}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Rollover to {taxYear + 1}
                </button>
                <div className="bg-[#1a365d] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg">
                  <div className="text-xs text-gray-300">Grand Total</div>
                  <div className="text-lg sm:text-xl font-bold text-[#d69e2e]">
                    {formatCurrency(grandTotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* Export Bar */}
            <ExportBar taxYear={taxYear} />

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a365d]"></div>
                <span className="ml-3 text-gray-500">Loading expenses...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {expensesByCategory.map(({ category, expenses: catExpenses }) => (
                  <ExpenseSection
                    key={category.id}
                    category={category}
                    expenses={catExpenses}
                    taxYear={taxYear}
                    onAdd={handleAddExpense}
                    onUpdate={handleUpdateExpense}
                    onDelete={handleDeleteExpense}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== AMAZON IMPORT VIEW ===== */}
        {viewMode === "import-amazon" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1a365d] mb-6">
              Import Amazon Purchases - {taxYear}
            </h2>
            <AmazonImporter
              taxYear={taxYear}
              categories={categories}
              onImport={handleAmazonImport}
            />
          </div>
        )}

        {/* ===== MILEIQ IMPORT VIEW ===== */}
        {viewMode === "import-mileiq" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1a365d] mb-6">
              Import MileIQ Data - {taxYear}
            </h2>
            <MileIQImporter taxYear={taxYear} onImport={handleMileIQImport} />
          </div>
        )}

        {/* ===== CSV IMPORT VIEW ===== */}
        {viewMode === "import-csv" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1a365d] mb-6">
              Import CSV / Spreadsheet Data - {taxYear}
            </h2>
            <CSVImporter
              taxYear={taxYear}
              categories={categories}
              onImport={handleCSVImport}
            />
          </div>
        )}

        {/* ===== SCAN RECEIPT VIEW ===== */}
        {viewMode === "scan-receipt" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1a365d] mb-6">
              Scan Receipt - {taxYear}
            </h2>
            <ReceiptScanner
              taxYear={taxYear}
              categories={categories}
              onImport={async (items) => {
                const res = await fetch("/api/import", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "csv", taxYear, items }),
                });
                if (res.ok) {
                  await fetchExpenses();
                  setViewMode("expenses");
                }
              }}
            />
          </div>
        )}

        {/* ===== SCHEDULE C PREVIEW ===== */}
        {viewMode === "schedule-c" && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1a365d]">
                  Schedule C Preview - {taxYear}
                </h2>
                <p className="text-sm text-gray-500">
                  Profit or Loss From Business (Sole Proprietorship)
                </p>
              </div>
              <div className="bg-[#1a365d] text-white px-6 py-3 rounded-lg">
                <div className="text-xs text-gray-300">Total Expenses</div>
                <div className="text-xl font-bold text-[#d69e2e]">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {Object.values(scheduleCData)
                .filter((line) => line.total > 0)
                .sort((a, b) => {
                  const numA = parseInt(a.line.match(/\d+/)?.[0] || "0");
                  const numB = parseInt(b.line.match(/\d+/)?.[0] || "0");
                  return numA - numB;
                })
                .map((line) => (
                  <ScheduleCLineItem key={line.line} data={line} />
                ))}
            </div>

            {/* Grand total bar */}
            <div className="mt-6 bg-[#1a365d] rounded-lg p-4 flex items-center justify-between text-white">
              <span className="text-lg font-semibold">
                TOTAL SCHEDULE C EXPENSES
              </span>
              <span className="text-2xl font-bold text-[#d69e2e]">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        )}

        {/* ===== SETTINGS VIEW ===== */}
        {viewMode === "settings" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1a365d] mb-6">Settings</h2>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#1a365d] mb-4">
                  Business Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1a365d] mb-4">
                  Business-Use Percentages
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Business Use %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={phoneBusinessPct}
                      onChange={(e) => setPhoneBusinessPct(parseInt(e.target.value) || 0)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Internet Business Use %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={internetBusinessPct}
                      onChange={(e) => setInternetBusinessPct(parseInt(e.target.value) || 0)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1a365d] mb-4">
                  Mileage Method
                </h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mileageMethod"
                      value="standard"
                      checked={mileageMethod === "standard"}
                      onChange={(e) => setMileageMethod(e.target.value)}
                      className="accent-[#1a365d]"
                    />
                    <span className="text-sm">Standard Mileage Rate</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mileageMethod"
                      value="actual"
                      checked={mileageMethod === "actual"}
                      onChange={(e) => setMileageMethod(e.target.value)}
                      className="accent-[#1a365d]"
                    />
                    <span className="text-sm">Actual Expense Method</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1a365d] mb-4">
                  Year Management
                </h3>
                <button
                  onClick={handleRollover}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-[#162d4e] transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start New Tax Year ({taxYear + 1})
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  This copies all recurring subscriptions and monthly expenses from {taxYear} to{" "}
                  {taxYear + 1} with the same amounts. You can then adjust as needed.
                </p>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-2 bg-[#d69e2e] text-[#1a365d] rounded-lg font-bold hover:bg-[#c08d26] transition-colors"
              >
                {settingsSaved ? "Saved!" : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Voice Input Button */}
      <VoiceButton
        taxYear={taxYear}
        categories={categories}
        onAdd={async (exp) => {
          const success = await handleAddExpense(exp);
          return success;
        }}
      />
    </div>
  );
}

// Schedule C Line Item Component
function ScheduleCLineItem({
  data,
}: {
  data: {
    line: string;
    section: string;
    categories: { name: string; total: number; items: Expense[] }[];
    total: number;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400 rotate-180" />
          )}
          <span className="font-semibold text-[#1a365d]">{data.line}</span>
          <span className="text-sm text-gray-500">— {data.section}</span>
        </div>
        <span className="font-bold text-lg text-[#1a365d]">
          {formatCurrency(data.total)}
        </span>
      </button>

      {isOpen && (
        <div className="border-t px-4 py-3 bg-gray-50">
          {data.categories
            .filter((cat) => cat.total > 0)
            .map((cat) => {
              // Consolidate items by description
              const consolidated = new Map<string, number>();
              for (const item of cat.items) {
                const existing = consolidated.get(item.description) || 0;
                consolidated.set(item.description, existing + item.amount);
              }

              return (
                <div key={cat.name} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    <span className="text-sm font-semibold">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="pl-4 space-y-0.5">
                    {Array.from(consolidated.entries()).map(([desc, total]) => (
                      <div
                        key={desc}
                        className="flex items-center justify-between text-xs text-gray-500"
                      >
                        <span>{desc}</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
