"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ParsedExpense } from "@/lib/voice/expense-nlp";
import type { Category } from "@/db/schema";

interface VoiceConfirmProps {
  parsed: ParsedExpense;
  categories: Category[];
  onConfirm: (categoryId: number, description: string, amount: number) => void;
  onCancel: () => void;
}

export function VoiceConfirm({ parsed, categories, onConfirm, onCancel }: VoiceConfirmProps) {
  const [categoryId, setCategoryId] = useState(parsed.categoryId || categories[0]?.id || 1);
  const [description, setDescription] = useState(parsed.vendor || parsed.rawText);
  const [amount, setAmount] = useState(parsed.amount || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-[#1a365d] mb-4">Confirm Voice Input</h3>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">You said:</p>
          <p className="text-sm font-medium italic">&quot;{parsed.rawText}&quot;</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.scheduleCLine})
                </option>
              ))}
            </select>
            {parsed.categoryName && (
              <p className="text-xs text-green-600 mt-1">
                Auto-detected: {parsed.categoryName}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onConfirm(categoryId, description, amount)}
            disabled={!description || amount <= 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Check className="w-4 h-4" />
            Add Expense
          </button>
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
