"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
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
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

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
      setIsAdding(false);
    }
  };

  // Extract Schedule C line number for badge
  const lineMatch = category.scheduleCLine.match(/Line (\d+\w?)/);
  const lineNumber = lineMatch ? lineMatch[0] : "";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#1a365d] text-white hover:bg-[#162d4e] transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
          <span className="font-semibold text-lg">{category.name}</span>
          {lineNumber && (
            <span className="bg-[#d69e2e] text-[#1a365d] text-xs font-bold px-2 py-0.5 rounded">
              {lineNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">{category.turbotaxSection}</span>
          <span className="font-bold text-lg text-[#d69e2e]">
            {formatCurrency(total)}
          </span>
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_120px_120px_1fr_40px] gap-2 px-4 py-2 bg-gray-50 border-b text-sm font-medium text-gray-600">
            <span>Description</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Notes</span>
            <span></span>
          </div>

          {/* Expense Rows */}
          {expenses.length === 0 && !isAdding && (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              No expenses yet. Click &quot;+ Add&quot; to get started.
            </div>
          )}

          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}

          {/* Add New Row */}
          {isAdding && (
            <div className="grid grid-cols-[1fr_120px_120px_1fr_40px] gap-2 px-4 py-2 border-b bg-blue-50">
              <input
                type="text"
                placeholder="Description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") setIsAdding(false);
                }}
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
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
                  if (e.key === "Escape") setIsAdding(false);
                }}
              />
              <div className="flex gap-1">
                <button
                  onClick={handleAdd}
                  className="text-green-600 hover:text-green-800 text-sm font-bold"
                  title="Save"
                >
                  ✓
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Add Button */}
          <div className="px-4 py-2 border-t">
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 text-[#1a365d] hover:text-[#d69e2e] text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
