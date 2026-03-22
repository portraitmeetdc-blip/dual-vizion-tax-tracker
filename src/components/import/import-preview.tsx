"use client";

import { X, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Category } from "@/db/schema";

interface PreviewItem {
  date: string;
  description: string;
  amount: number;
  suggestedCategory: string;
  suggestedCategoryId: number;
}

interface ImportPreviewProps {
  items: PreviewItem[];
  categories: Category[];
  onCategoryChange: (index: number, categoryId: number) => void;
  onRemove: (index: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  importing: boolean;
  title: string;
}

export function ImportPreview({
  items,
  categories,
  onCategoryChange,
  onRemove,
  onConfirm,
  onCancel,
  importing,
  title,
}: ImportPreviewProps) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-[#1a365d]">{title}</h3>
        <span className="text-xs sm:text-sm text-gray-500">
          {items.length} items | {formatCurrency(total)}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-600">Description</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600">Category</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 max-w-[200px] truncate">{item.description}</td>
                <td className="px-3 py-2 text-gray-600">{item.date || "—"}</td>
                <td className="px-3 py-2 text-right font-medium">
                  {formatCurrency(item.amount)}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={item.suggestedCategoryId}
                    onChange={(e) => onCategoryChange(idx, parseInt(e.target.value))}
                    className="border rounded px-2 py-1 text-xs w-full max-w-[200px]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => onRemove(idx)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden max-h-96 overflow-y-auto space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="border rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.description}</p>
                <p className="text-xs text-gray-500">{item.date || "No date"}</p>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <span className="text-sm font-bold">{formatCurrency(item.amount)}</span>
                <button
                  onClick={() => onRemove(idx)}
                  className="text-red-400 active:text-red-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <select
              value={item.suggestedCategoryId}
              onChange={(e) => onCategoryChange(idx, parseInt(e.target.value))}
              className="w-full border rounded px-2 py-1.5 text-xs"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onConfirm}
          disabled={importing || items.length === 0}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {importing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Import {items.length} Items
        </button>
        <button
          onClick={onCancel}
          className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
