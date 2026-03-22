"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, Zap } from "lucide-react";
import { ExpenseRow } from "./expense-row";
import { formatCurrency } from "@/lib/utils";
import type { Expense, Category } from "@/db/schema";

interface ExpenseSectionProps {
  category: Category;
  expenses: Expense[];
  taxYear: number;
  onAdd: (expense: {
    categoryId: number;
    description: string;
    date?: string;
    amount: number;
    notes?: string;
    isRecurring?: boolean;
    recurrenceType?: string;
  }) => Promise<boolean>;
  onUpdate: (expense: Partial<Expense> & { id: number }) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export function ExpenseSection({
  category,
  expenses,
  taxYear,
  onAdd,
  onUpdate,
  onDelete,
}: ExpenseSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [rapidMode, setRapidMode] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const descInputRef = useRef<HTMLInputElement>(null);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Focus the description input when add row opens (including after rapid-mode save)
  useEffect(() => {
    if (isAdding && descInputRef.current) {
      descInputRef.current.focus();
    }
  }, [isAdding, newDesc]);

  const handleAdd = async () => {
    if (!newDesc.trim()) return;
    const success = await onAdd({
      categoryId: category.id,
      description: newDesc.trim(),
      date: newDate || undefined,
      amount: parseFloat(newAmount) || 0,
      notes: newNotes || undefined,
    });
    if (success) {
      setNewDesc("");
      setNewDate("");
      setNewAmount("");
      setNewNotes("");
      if (!rapidMode) {
        setIsAdding(false);
      }
    }
  };

  const handleDuplicate = (expense: Expense) => {
    const today = new Date().toISOString().split("T")[0];
    setNewDesc(expense.description);
    setNewDate(today);
    setNewAmount(String(expense.amount));
    setNewNotes(expense.notes || "");
    setIsAdding(true);
    setIsOpen(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setRapidMode(false);
    setNewDesc("");
    setNewDate("");
    setNewAmount("");
    setNewNotes("");
  };

  // Extract Schedule C line number for badge
  const lineMatch = category.scheduleCLine.match(/Line (\d+\w?)/);
  const lineNumber = lineMatch ? lineMatch[0] : "";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-[#1a365d] text-white hover:bg-[#162d4e] transition-colors ${
          rapidMode ? "border-l-4 border-l-[#d69e2e]" : ""
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 shrink-0" />
          )}
          <span className="font-semibold text-sm sm:text-lg truncate">{category.name}</span>
          {lineNumber && (
            <span className="bg-[#d69e2e] text-[#1a365d] text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded shrink-0 hidden sm:inline">
              {lineNumber}
            </span>
          )}
          {rapidMode && (
            <span className="bg-[#d69e2e] text-[#1a365d] text-xs font-bold px-1.5 py-0.5 rounded animate-pulse shrink-0">
              RAPID
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
          <span className="text-xs sm:text-sm text-gray-300 hidden lg:inline">{category.turbotaxSection}</span>
          <span className="font-bold text-sm sm:text-lg text-[#d69e2e]">
            {formatCurrency(total)}
          </span>
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-0">
          {/* Table Header (desktop only) */}
          <div className="hidden md:grid grid-cols-[1fr_120px_120px_1fr_70px] gap-2 px-4 py-2 bg-gray-50 border-b text-sm font-medium text-gray-600">
            <span>Description</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Notes</span>
            <span></span>
          </div>

          {/* Expense Rows */}
          {expenses.length === 0 && !isAdding && (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              No expenses yet. Tap &quot;+ Add&quot; to get started.
            </div>
          )}

          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onDuplicate={handleDuplicate}
            />
          ))}

          {/* Add New Row */}
          {isAdding && (
            <>
              {/* Desktop add row */}
              <div className={`hidden md:grid grid-cols-[1fr_120px_120px_1fr_70px] gap-2 px-4 py-2 border-b ${
                rapidMode ? "bg-amber-50 border-l-4 border-l-[#d69e2e]" : "bg-blue-50"
              }`}>
                <input
                  ref={descInputRef}
                  type="text"
                  placeholder="Description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") handleCancelAdd();
                  }}
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") handleCancelAdd();
                  }}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") handleCancelAdd();
                  }}
                />
                <input
                  type="text"
                  placeholder="Notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") handleCancelAdd();
                  }}
                />
                <div className="flex gap-1">
                  <button onClick={handleAdd} className="text-green-600 hover:text-green-800 text-sm font-bold" title="Save">✓</button>
                  <button onClick={handleCancelAdd} className="text-gray-400 hover:text-gray-600 text-sm" title="Cancel">✕</button>
                </div>
              </div>

              {/* Mobile add form */}
              <div className={`md:hidden px-4 py-3 border-b space-y-2 ${
                rapidMode ? "bg-amber-50 border-l-4 border-l-[#d69e2e]" : "bg-blue-50"
              }`}>
                <input
                  ref={descInputRef}
                  type="text"
                  placeholder="Description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-28 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-medium"
                  >
                    {rapidMode ? "Save & Next" : "Save"}
                  </button>
                  <button
                    onClick={handleCancelAdd}
                    className="flex-1 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Add Button + Rapid Entry Toggle */}
          <div className="px-3 sm:px-4 py-2 border-t flex items-center justify-between">
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 text-[#1a365d] hover:text-[#d69e2e] text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
            <button
              onClick={() => {
                const next = !rapidMode;
                setRapidMode(next);
                if (next) setIsAdding(true);
              }}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                rapidMode
                  ? "bg-[#d69e2e] text-[#1a365d] font-bold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title={rapidMode ? "Rapid entry ON - press Escape to exit" : "Enable rapid entry mode"}
            >
              <Zap className="w-3 h-3" />
              {rapidMode ? "Rapid Entry ON" : "Rapid Entry"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
