"use client";

import { useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { parseExpenseText } from "@/lib/voice/expense-nlp";
import { VoiceConfirm } from "./voice-confirm";
import type { Category } from "@/db/schema";

interface VoiceButtonProps {
  taxYear: number;
  categories: Category[];
  onAdd: (expense: {
    categoryId: number;
    description: string;
    amount: number;
    notes?: string;
  }) => Promise<boolean>;
}

export function VoiceButton({ taxYear, categories, onAdd }: VoiceButtonProps) {
  const { isListening, transcript, error, startListening, stopListening, resetTranscript, isSupported } =
    useVoiceInput();
  const [showConfirm, setShowConfirm] = useState(false);
  const [parsedResult, setParsedResult] = useState<ReturnType<typeof parseExpenseText> | null>(null);

  if (!isSupported) return null;

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      // Parse the transcript after stopping
      if (transcript) {
        const parsed = parseExpenseText(transcript);
        setParsedResult(parsed);
        setShowConfirm(true);
      }
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleConfirm = async (categoryId: number, description: string, amount: number) => {
    await onAdd({
      categoryId,
      description,
      amount,
      notes: `Voice input: "${transcript}"`,
    });
    setShowConfirm(false);
    setParsedResult(null);
    resetTranscript();
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setParsedResult(null);
    resetTranscript();
  };

  return (
    <>
      {/* Floating mic button */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${
          isListening
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : "bg-[#1a365d] hover:bg-[#162d4e]"
        }`}
        title={isListening ? "Stop recording" : "Voice input"}
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Listening indicator */}
      {isListening && (
        <div className="fixed bottom-24 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
            <span className="text-sm font-medium text-gray-700">Listening...</span>
          </div>
          {transcript && (
            <p className="text-sm text-gray-600 italic">&quot;{transcript}&quot;</p>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && parsedResult && (
        <VoiceConfirm
          parsed={parsedResult}
          categories={categories}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
