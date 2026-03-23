"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Search,
  X,
  Sun,
  Moon,
  Download,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

type ViewMode = "expenses" | "import-amazon" | "import-mileiq" | "import-csv" | "scan-receipt" | "dashboard" | "schedule-c" | "settings";

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

  // Feature 2: Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Feature 4: Year-over-Year state
  const [prevYearExpenses, setPrevYearExpenses] = useState<Expense[]>([]);

  // Feature 5: Missing Category Alert
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Feature 7: Dark Mode
  const [darkMode, setDarkMode] = useState(false);

  // Feature 8: Global Search
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const globalSearchRef = useRef<HTMLInputElement>(null);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dvp-dark-mode");
    if (stored === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("dvp-dark-mode", String(next));
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

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

  // Feature 4: Fetch previous year data
  const fetchPrevYearExpenses = useCallback(async () => {
    const prevYear = taxYear - 1;
    if (prevYear < 2023) return;
    const res = await fetch(`/api/expenses?year=${prevYear}`);
    const data = await res.json();
    setPrevYearExpenses(data);
  }, [taxYear]);

  useEffect(() => {
    fetchCategories();
    fetchSettings();
  }, [fetchCategories, fetchSettings]);

  useEffect(() => {
    fetchExpenses();
    fetchPrevYearExpenses();
    setAlertDismissed(false);
  }, [fetchExpenses, fetchPrevYearExpenses]);

  // Focus global search when opened
  useEffect(() => {
    if (globalSearchOpen && globalSearchRef.current) {
      globalSearchRef.current.focus();
    }
  }, [globalSearchOpen]);

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

  // Feature 6: Data Backup
  const handleBackup = async () => {
    const res = await fetch("/api/backup");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `dvp-tax-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Group expenses by category
  const expensesByCategory = categories.map((cat) => ({
    category: cat,
    expenses: expenses.filter((e) => e.categoryId === cat.id),
  }));

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Feature 2: Filtered expenses
  const filteredExpensesByCategory = useMemo(() => {
    if (!searchQuery && !dateFrom && !dateTo) return expensesByCategory;

    const query = searchQuery.toLowerCase();
    return expensesByCategory
      .map(({ category, expenses: catExpenses }) => ({
        category,
        expenses: catExpenses.filter((e) => {
          const matchesSearch = !query ||
            e.description.toLowerCase().includes(query) ||
            (e.notes && e.notes.toLowerCase().includes(query));
          const matchesDateFrom = !dateFrom || (e.date && e.date >= dateFrom);
          const matchesDateTo = !dateTo || (e.date && e.date <= dateTo);
          return matchesSearch && matchesDateFrom && matchesDateTo;
        }),
      }))
      .filter(({ expenses: catExpenses }) => catExpenses.length > 0 || (!searchQuery && !dateFrom && !dateTo));
  }, [expensesByCategory, searchQuery, dateFrom, dateTo]);

  const isFiltering = searchQuery || dateFrom || dateTo;
  const filteredTotal = isFiltering
    ? filteredExpensesByCategory.reduce((sum, { expenses: ce }) => sum + ce.reduce((s, e) => s + e.amount, 0), 0)
    : grandTotal;

  // Feature 5: Missing categories
  const emptyCategories = useMemo(() => {
    return expensesByCategory
      .filter(({ expenses: catExpenses }) => catExpenses.length === 0)
      .map(({ category }) => category.name);
  }, [expensesByCategory]);

  // Feature 8: Global search results
  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const q = globalSearchQuery.toLowerCase();
    return expenses
      .filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      )
      .slice(0, 15)
      .map((e) => ({
        ...e,
        categoryName: categories.find((c) => c.id === e.categoryId)?.name || "Unknown",
      }));
  }, [globalSearchQuery, expenses, categories]);

  // Feature 3: Dashboard stats
  const dashboardStats = useMemo(() => {
    const categoryTotals = expensesByCategory
      .map(({ category, expenses: ce }) => ({
        name: category.name,
        total: ce.reduce((s, e) => s + e.amount, 0),
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);

    const top5 = categoryTotals.slice(0, 5);
    const maxCatTotal = top5.length > 0 ? top5[0].total : 1;

    // Monthly trend
    const monthlyTotals: Record<string, number> = {};
    for (const e of expenses) {
      if (e.date) {
        const month = e.date.substring(0, 7); // YYYY-MM
        monthlyTotals[month] = (monthlyTotals[month] || 0) + e.amount;
      }
    }
    const months = Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
    const maxMonthTotal = months.length > 0 ? Math.max(...months.map((m) => m.total)) : 1;

    // Key stats
    const categoriesWithData = categoryTotals.length;
    const avgPerCategory = categoriesWithData > 0 ? grandTotal / categoriesWithData : 0;
    const largestExpense = expenses.length > 0 ? Math.max(...expenses.map((e) => e.amount)) : 0;
    const largestExpenseItem = expenses.find((e) => e.amount === largestExpense);

    return {
      top5,
      maxCatTotal,
      months,
      maxMonthTotal,
      categoriesWithData,
      avgPerCategory,
      largestExpense,
      largestExpenseDesc: largestExpenseItem?.description || "N/A",
    };
  }, [expensesByCategory, expenses, grandTotal]);

  // Feature 4: Year-over-Year data
  const yoyData = useMemo(() => {
    const currentByLine: Record<string, number> = {};
    const prevByLine: Record<string, number> = {};

    for (const cat of categories) {
      const key = cat.scheduleCLine;
      const currTotal = expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
      currentByLine[key] = (currentByLine[key] || 0) + currTotal;

      const prevTotal = prevYearExpenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
      prevByLine[key] = (prevByLine[key] || 0) + prevTotal;
    }

    const allLines = new Set([...Object.keys(currentByLine), ...Object.keys(prevByLine)]);
    return Array.from(allLines)
      .map((line) => ({
        line,
        current: currentByLine[line] || 0,
        previous: prevByLine[line] || 0,
        diff: (currentByLine[line] || 0) - (prevByLine[line] || 0),
      }))
      .filter((l) => l.current > 0 || l.previous > 0)
      .sort((a, b) => {
        const numA = parseInt(a.line.match(/\d+/)?.[0] || "0");
        const numB = parseInt(b.line.match(/\d+/)?.[0] || "0");
        return numA - numB;
      });
  }, [categories, expenses, prevYearExpenses]);

  const prevYearTotal = prevYearExpenses.reduce((s, e) => s + e.amount, 0);

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
    <div className="min-h-screen bg-[#ebf4ff] dark:bg-gray-900 transition-colors">
      {/* Top Header Bar */}
      <header className="bg-[#1a365d] dark:bg-gray-800 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8 text-[#d69e2e]" />
              <div>
                <h1 className="text-xl font-bold">{businessName}</h1>
                <p className="text-xs text-gray-300">Tax Expense Tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              {/* Feature 8: Global Search Toggle */}
              <div className="relative">
                {globalSearchOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={globalSearchRef}
                      type="text"
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      placeholder="Search all expenses..."
                      className="w-40 sm:w-64 bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#d69e2e]"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setGlobalSearchOpen(false);
                          setGlobalSearchQuery("");
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        setGlobalSearchOpen(false);
                        setGlobalSearchQuery("");
                      }}
                      className="text-gray-300 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Global search results dropdown */}
                    {globalSearchQuery.trim() && (
                      <div className="absolute top-full right-0 mt-2 w-72 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 max-h-80 overflow-y-auto z-50">
                        {globalSearchResults.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            No results found
                          </div>
                        ) : (
                          globalSearchResults.map((r) => (
                            <div
                              key={r.id}
                              className="px-4 py-2.5 border-b dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {r.description}
                                </span>
                                <span className="text-sm font-bold text-[#1a365d] dark:text-[#d69e2e] ml-2 shrink-0">
                                  {formatCurrency(r.amount)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-[#d69e2e]">{r.categoryName}</span>
                                {r.date && (
                                  <span className="text-xs text-gray-400">
                                    {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setGlobalSearchOpen(true)}
                    className="text-gray-300 hover:text-[#d69e2e] transition-colors"
                    title="Search all expenses"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Feature 7: Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="text-gray-300 hover:text-[#d69e2e] transition-colors"
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

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
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          {[
            { key: "expenses", label: "Expenses", icon: FileSpreadsheet },
            { key: "dashboard", label: "Dashboard", icon: TrendingUp },
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
                  ? "border-[#d69e2e] text-[#1a365d] dark:text-[#d69e2e]"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300"
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
                <h2 className="text-xl sm:text-2xl font-bold text-[#1a365d] dark:text-white">
                  {taxYear} Expenses
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {expenses.length} items across {categories.length} categories
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <button
                  onClick={() => setAllCollapsed(!allCollapsed)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-[#1a365d] dark:hover:text-[#d69e2e] transition-colors"
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
                  className="hidden sm:flex items-center gap-1 px-3 py-2 bg-[#1a365d] dark:bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-[#162d4e] dark:hover:bg-gray-600 transition-colors"
                  title={`Copy recurring items to ${taxYear + 1}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Rollover to {taxYear + 1}
                </button>
                <div className="bg-[#1a365d] dark:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg">
                  <div className="text-xs text-gray-300">Grand Total</div>
                  <div className="text-lg sm:text-xl font-bold text-[#d69e2e]">
                    {formatCurrency(grandTotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* Export Bar */}
            <ExportBar taxYear={taxYear} />

            {/* Feature 5: Missing Category Alert */}
            {emptyCategories.length > 0 && !alertDismissed && (
              <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {emptyCategories.length} {emptyCategories.length === 1 ? "category has" : "categories have"} no expenses yet
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {emptyCategories.join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => setAlertDismissed(true)}
                  className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Feature 2: Search & Filter Bar */}
            <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search expenses by description or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a365d] dark:focus:ring-[#d69e2e]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-gray-500 dark:text-gray-400 shrink-0">From:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a365d] dark:focus:ring-[#d69e2e]"
                  />
                  <label className="text-xs text-gray-500 dark:text-gray-400 shrink-0">To:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a365d] dark:focus:ring-[#d69e2e]"
                  />
                  {isFiltering && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setDateFrom("");
                        setDateTo("");
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {isFiltering && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Showing {filteredExpensesByCategory.reduce((s, c) => s + c.expenses.length, 0)} matching expenses
                  {" "}({formatCurrency(filteredTotal)} total)
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a365d]"></div>
                <span className="ml-3 text-gray-500 dark:text-gray-400">Loading expenses...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {(isFiltering ? filteredExpensesByCategory : expensesByCategory).map(({ category, expenses: catExpenses }) => (
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

        {/* ===== DASHBOARD VIEW (Feature 3) ===== */}
        {viewMode === "dashboard" && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1a365d] dark:text-white">
                  Dashboard - {taxYear}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Spending overview and trends</p>
              </div>
              <div className="bg-[#1a365d] dark:bg-gray-700 text-white px-6 py-3 rounded-lg">
                <div className="text-xs text-gray-300">Grand Total</div>
                <div className="text-xl font-bold text-[#d69e2e]">{formatCurrency(grandTotal)}</div>
              </div>
            </div>

            {/* Key Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Expenses</div>
                <div className="text-2xl font-bold text-[#1a365d] dark:text-[#d69e2e] mt-1">{formatCurrency(grandTotal)}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{expenses.length} items</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active Categories</div>
                <div className="text-2xl font-bold text-[#1a365d] dark:text-[#d69e2e] mt-1">{dashboardStats.categoriesWithData}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">of {categories.length} total</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg / Category</div>
                <div className="text-2xl font-bold text-[#1a365d] dark:text-[#d69e2e] mt-1">{formatCurrency(dashboardStats.avgPerCategory)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Largest Expense</div>
                <div className="text-2xl font-bold text-[#1a365d] dark:text-[#d69e2e] mt-1">{formatCurrency(dashboardStats.largestExpense)}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{dashboardStats.largestExpenseDesc}</div>
              </div>
            </div>

            {/* Top 5 Categories Bar Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 sm:p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#1a365d] dark:text-white mb-4">Top 5 Categories</h3>
              {dashboardStats.top5.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No expense data yet</p>
              ) : (
                <div className="space-y-3">
                  {dashboardStats.top5.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mr-2">{cat.name}</span>
                        <span className="text-sm font-bold text-[#1a365d] dark:text-[#d69e2e] shrink-0">{formatCurrency(cat.total)}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-4 rounded-full bg-gradient-to-r from-[#1a365d] to-[#2a5298] dark:from-[#d69e2e] dark:to-[#e8b84a]"
                          style={{ width: `${(cat.total / dashboardStats.maxCatTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Spending Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#1a365d] dark:text-white mb-4">Monthly Spending Trend</h3>
              {dashboardStats.months.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No dated expenses yet</p>
              ) : (
                <div className="flex items-end gap-1 sm:gap-2 h-48 overflow-x-auto pb-2">
                  {dashboardStats.months.map((m) => {
                    const [, monthNum] = m.month.split("-");
                    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                    const label = monthNames[parseInt(monthNum) - 1] || m.month;
                    const pct = (m.total / dashboardStats.maxMonthTotal) * 100;
                    return (
                      <div key={m.month} className="flex flex-col items-center flex-1 min-w-[40px]">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {formatCurrency(m.total)}
                        </div>
                        <div className="w-full flex items-end justify-center" style={{ height: "140px" }}>
                          <div
                            className="w-full max-w-[40px] bg-gradient-to-t from-[#1a365d] to-[#2a5298] dark:from-[#d69e2e] dark:to-[#e8b84a] rounded-t"
                            style={{ height: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{label}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== AMAZON IMPORT VIEW ===== */}
        {viewMode === "import-amazon" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1a365d] dark:text-white mb-6">
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
            <h2 className="text-2xl font-bold text-[#1a365d] dark:text-white mb-6">
              Import MileIQ Data - {taxYear}
            </h2>
            <MileIQImporter taxYear={taxYear} onImport={handleMileIQImport} />
          </div>
        )}

        {/* ===== CSV IMPORT VIEW ===== */}
        {viewMode === "import-csv" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1a365d] dark:text-white mb-6">
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
            <h2 className="text-xl sm:text-2xl font-bold text-[#1a365d] dark:text-white mb-6">
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
                <h2 className="text-2xl font-bold text-[#1a365d] dark:text-white">
                  Schedule C Preview - {taxYear}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Profit or Loss From Business (Sole Proprietorship)
                </p>
              </div>
              <div className="bg-[#1a365d] dark:bg-gray-700 text-white px-6 py-3 rounded-lg">
                <div className="text-xs text-gray-300">Total Expenses</div>
                <div className="text-xl font-bold text-[#d69e2e]">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>

            {/* Feature 4: Year-over-Year Comparison */}
            {taxYear > 2023 && prevYearExpenses.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 sm:p-6 mb-6">
                <h3 className="text-lg font-semibold text-[#1a365d] dark:text-white mb-4">
                  Year-over-Year: {taxYear} vs {taxYear - 1}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-2 pr-4 text-gray-600 dark:text-gray-400 font-medium">Schedule C Line</th>
                        <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">{taxYear - 1}</th>
                        <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">{taxYear}</th>
                        <th className="text-right py-2 pl-2 text-gray-600 dark:text-gray-400 font-medium">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yoyData.map((row) => (
                        <tr key={row.line} className="border-b dark:border-gray-700 last:border-b-0">
                          <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{row.line}</td>
                          <td className="py-2 px-2 text-right text-gray-500 dark:text-gray-400">{formatCurrency(row.previous)}</td>
                          <td className="py-2 px-2 text-right font-medium text-gray-900 dark:text-gray-100">{formatCurrency(row.current)}</td>
                          <td className={`py-2 pl-2 text-right font-medium ${
                            row.diff > 0 ? "text-red-600 dark:text-red-400" : row.diff < 0 ? "text-green-600 dark:text-green-400" : "text-gray-400"
                          }`}>
                            {row.diff > 0 ? "+" : ""}{formatCurrency(row.diff)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 dark:border-gray-600 font-bold">
                        <td className="py-2 pr-4 text-[#1a365d] dark:text-white">TOTAL</td>
                        <td className="py-2 px-2 text-right text-gray-500 dark:text-gray-400">{formatCurrency(prevYearTotal)}</td>
                        <td className="py-2 px-2 text-right text-[#1a365d] dark:text-[#d69e2e]">{formatCurrency(grandTotal)}</td>
                        <td className={`py-2 pl-2 text-right ${
                          grandTotal - prevYearTotal > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                        }`}>
                          {grandTotal - prevYearTotal > 0 ? "+" : ""}{formatCurrency(grandTotal - prevYearTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

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
            <div className="mt-6 bg-[#1a365d] dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between text-white">
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
            <h2 className="text-2xl font-bold text-[#1a365d] dark:text-white mb-6">Settings</h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#1a365d] dark:text-white mb-4">
                  Business Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a365d] dark:focus:ring-[#d69e2e]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a365d] dark:focus:ring-[#d69e2e]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1a365d] dark:text-white mb-4">
                  Business-Use Percentages
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Business Use %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={phoneBusinessPct}
                      onChange={(e) => setPhoneBusinessPct(parseInt(e.target.value) || 0)}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a365d] dark:focus:ring-[#d69e2e]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Internet Business Use %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={internetBusinessPct}
                      onChange={(e) => setInternetBusinessPct(parseInt(e.target.value) || 0)}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a365d] dark:focus:ring-[#d69e2e]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1a365d] dark:text-white mb-4">
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
                      className="accent-[#1a365d] dark:accent-[#d69e2e]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Standard Mileage Rate</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mileageMethod"
                      value="actual"
                      checked={mileageMethod === "actual"}
                      onChange={(e) => setMileageMethod(e.target.value)}
                      className="accent-[#1a365d] dark:accent-[#d69e2e]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Actual Expense Method</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1a365d] dark:text-white mb-4">
                  Year Management
                </h3>
                <button
                  onClick={handleRollover}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a365d] dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-[#162d4e] dark:hover:bg-gray-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start New Tax Year ({taxYear + 1})
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This copies all recurring subscriptions and monthly expenses from {taxYear} to{" "}
                  {taxYear + 1} with the same amounts. You can then adjust as needed.
                </p>
              </div>

              {/* Feature 6: Data Backup */}
              <div>
                <h3 className="text-lg font-semibold text-[#1a365d] dark:text-white mb-4">
                  Data Backup
                </h3>
                <button
                  onClick={handleBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Full Backup (JSON)
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Downloads all expenses, categories, mileage logs, and settings as a JSON file.
                  Keep this file safe for data recovery.
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400 rotate-180" />
          )}
          <span className="font-semibold text-[#1a365d] dark:text-white">{data.line}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">— {data.section}</span>
        </div>
        <span className="font-bold text-lg text-[#1a365d] dark:text-[#d69e2e]">
          {formatCurrency(data.total)}
        </span>
      </button>

      {isOpen && (
        <div className="border-t dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900">
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
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="pl-4 space-y-0.5">
                    {Array.from(consolidated.entries()).map(([desc, total]) => (
                      <div
                        key={desc}
                        className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
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
