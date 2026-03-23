"use client";

import { useState } from "react";
import { X, RefreshCw, Copy, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/db/schema";

interface ExpenseRowProps {
  expense: Expense;
  onUpdate: (expense: Partial<Expense> & { id: number }) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onDuplicate: (expense: Expense) => void;
}

export function ExpenseRow({ expense, onUpdate, onDelete, onDuplicate }: ExpenseRowProps) {
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
      <>
        {/* Desktop edit */}
        <div className="hidden md:grid grid-cols-[1fr_120px_120px_1fr_90px] gap-2 px-4 py-2 border-b bg-yellow-50">
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

        {/* Mobile edit */}
        <div className="md:hidden px-4 py-3 border-b bg-yellow-50 space-y-2">
          <input
            type="text"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Description"
            className="w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setIsEditing(false);
            }}
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="flex-1 border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
            />
            <input
              type="number"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-28 border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <input
            type="text"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Notes"
            className="w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setIsEditing(false);
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop row */}
      <div
        className="hidden md:grid grid-cols-[1fr_120px_120px_1fr_90px] gap-2 px-4 py-2 border-b hover:bg-gray-50 cursor-pointer group"
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-blue-600"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDuplicate(expense)}
            className="text-gray-400 hover:text-blue-600"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600"
            title="Delete"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile card */}
      <div className="md:hidden px-4 py-3 border-b hover:bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium truncate">{expense.description}</span>
              {expense.isCarriedForward && (
                <RefreshCw className="w-3 h-3 text-blue-400 shrink-0" />
              )}
              {expense.isRecurring && !expense.isCarriedForward && (
                <span className="text-xs text-green-600 font-medium shrink-0">↻</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">
                {expense.date ? new Date(expense.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              </span>
              {expense.notes && (
                <span className="text-xs text-gray-400 truncate">{expense.notes}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <span className="text-sm font-bold text-[#1a365d]">{formatCurrency(expense.amount)}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 active:text-blue-600 p-1"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDuplicate(expense)}
                className="text-gray-400 active:text-blue-600 p-1"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="text-gray-400 active:text-red-600 p-1"
                title="Delete"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
