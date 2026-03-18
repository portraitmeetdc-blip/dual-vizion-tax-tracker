"use client";

import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/db/schema";

interface ExpenseRowProps {
  expense: Expense;
  onUpdate: (expense: Partial<Expense> & { id: number }) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export function ExpenseRow({ expense, onUpdate, onDelete }: ExpenseRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(expense.description);
  const [editDate, setEditDate] = useState(expense.date || "");
  const [editAmount, setEditAmount] = useState(String(expense.amount));
  const [editNotes, setEditNotes] = useState(expense.notes || "");

  const handleSave = async () => {
    await onUpdate({
      id: expense.id,
      description: editDesc,
      date: editDate || null,
      amount: parseFloat(editAmount) || 0,
      notes: editNotes || null,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(expense.id);
  };

  if (isEditing) {
    return (
      <div className="grid grid-cols-[1fr_120px_120px_1fr_40px] gap-2 px-4 py-2 border-b bg-yellow-50">
        <input
          type="text"
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setIsEditing(false);
          }}
        />
        <input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
        />
        <input
          type="number"
          step="0.01"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />
        <input
          type="text"
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setIsEditing(false);
          }}
        />
        <button
          onClick={handleSave}
          className="text-green-600 hover:text-green-800 text-sm font-bold"
        >
          ✓
        </button>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-[1fr_120px_120px_1fr_40px] gap-2 px-4 py-2 border-b hover:bg-gray-50 cursor-pointer group"
      onDoubleClick={() => setIsEditing(true)}
    >
      <span className="text-sm flex items-center gap-1">
        {expense.description}
        {expense.isCarriedForward && (
          <span title="Carried forward from previous year">
            <RefreshCw className="w-3 h-3 text-blue-400" />
          </span>
        )}
        {expense.isRecurring && !expense.isCarriedForward && (
          <span className="text-xs text-green-600 font-medium" title="Recurring">
            ↻
          </span>
        )}
      </span>
      <span className="text-sm text-gray-600">
        {expense.date ? new Date(expense.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
      </span>
      <span className="text-sm font-medium">{formatCurrency(expense.amount)}</span>
      <span className="text-sm text-gray-500 truncate">{expense.notes || ""}</span>
      <button
        onClick={handleDelete}
        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
