"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2, AlertCircle } from "lucide-react";
import { ImportPreview } from "./import-preview";
import type { Category } from "@/db/schema";

interface ReceiptScannerProps {
  taxYear: number;
  categories: Category[];
  onImport: (items: { categoryId: number; description: string; date: string; amount: number; notes: string }[]) => Promise<void>;
}

interface ScannedItem {
  description: string;
  amount: number;
  date: string;
  suggestedCategory: string;
  suggestedCategoryId: number;
}

const OFFICE_SUPPLIES_ID = 15;

export function ReceiptScanner({ taxYear, categories, onImport }: ReceiptScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setError("");
    setScanning(true);
    setScannedItems([]);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target?.result as string);
    reader.readAsDataURL(file);

    // Convert to base64
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const mediaType = file.type || "image/jpeg";

    try {
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to scan receipt");
        setScanning(false);
        return;
      }

      const defaultCat = categories.find((c) => c.id === OFFICE_SUPPLIES_ID);
      const defaultName = defaultCat?.name || "Office Supplies & Expenses";

      const items: ScannedItem[] = data.items.map((item: { description: string; amount: number; date: string }) => ({
        description: item.description,
        amount: item.amount || 0,
        date: item.date || "",
        suggestedCategory: defaultName,
        suggestedCategoryId: OFFICE_SUPPLIES_ID,
      }));

      setScannedItems(items);
    } catch {
      setError("Failed to connect to receipt scanner. Please try again.");
    }

    setScanning(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleCategoryChange = (index: number, categoryId: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const updated = [...scannedItems];
    updated[index] = {
      ...updated[index],
      suggestedCategoryId: categoryId,
      suggestedCategory: cat.name,
    };
    setScannedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    setImporting(true);
    await onImport(
      scannedItems.map((item) => ({
        categoryId: item.suggestedCategoryId,
        description: item.description,
        date: item.date,
        amount: item.amount,
        notes: "Scanned from receipt",
      }))
    );
    setImporting(false);
    setScannedItems([]);
    setPreviewImage(null);
  };

  const handleReset = () => {
    setScannedItems([]);
    setPreviewImage(null);
    setError("");
  };

  // Show preview if items were scanned
  if (scannedItems.length > 0) {
    return (
      <div>
        {/* Receipt thumbnail */}
        {previewImage && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-4">
              <img
                src={previewImage}
                alt="Scanned receipt"
                className="w-20 h-20 object-cover rounded border"
              />
              <div>
                <p className="text-sm font-medium text-[#1a365d]">Receipt scanned successfully</p>
                <p className="text-xs text-gray-500">{scannedItems.length} items found</p>
              </div>
            </div>
          </div>
        )}

        <ImportPreview
          items={scannedItems}
          categories={categories}
          onCategoryChange={handleCategoryChange}
          onRemove={handleRemoveItem}
          onConfirm={handleImport}
          onCancel={handleReset}
          importing={importing}
          title="Scanned Receipt Items"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-[#1a365d] mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5" />
        Scan Receipt
      </h3>

      <div className="space-y-4">
        {/* Camera capture (mobile primary) */}
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={scanning}
          className="flex items-center justify-center gap-2 w-full py-4 bg-[#1a365d] text-white rounded-lg text-sm font-medium hover:bg-[#162d4e] disabled:opacity-50 transition-colors"
        >
          {scanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scanning receipt...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Take Photo of Receipt
            </>
          )}
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* File upload (desktop) */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm text-gray-500">or upload an image</span>
          </div>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Receipt Image
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Scanning indicator with preview */}
        {scanning && previewImage && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <img
              src={previewImage}
              alt="Scanning..."
              className="w-16 h-16 object-cover rounded border animate-pulse"
            />
            <div>
              <p className="text-sm font-medium text-blue-800">Reading receipt...</p>
              <p className="text-xs text-blue-600">Claude is extracting line items, dates, and prices</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Tips for best results:</p>
              <ul className="space-y-0.5 list-disc pl-3">
                <li>Lay the receipt flat on a dark surface</li>
                <li>Make sure all text is visible and in focus</li>
                <li>Works with store receipts, invoices, and printed bills</li>
                <li>Each scan costs about $0.01-0.03 from your API credits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
