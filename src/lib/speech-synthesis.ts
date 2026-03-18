"use client";

interface CategorySummary {
  categoryName: string;
  total: number;
}

export function readSummaryAloud(
  taxYear: number,
  categories: CategorySummary[],
  grandTotal: number
) {
  if (!("speechSynthesis" in window)) {
    alert("Text-to-speech is not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const lines: string[] = [
    `Dual Vizion Photography, Tax Year ${taxYear}, Expense Summary.`,
  ];

  for (const cat of categories) {
    if (cat.total > 0) {
      const dollars = Math.floor(cat.total);
      const cents = Math.round((cat.total - dollars) * 100);
      let amountText = `${dollars} dollars`;
      if (cents > 0) amountText += ` and ${cents} cents`;
      lines.push(`${cat.categoryName}: ${amountText}.`);
    }
  }

  const grandDollars = Math.floor(grandTotal);
  const grandCents = Math.round((grandTotal - grandDollars) * 100);
  let grandText = `${grandDollars} dollars`;
  if (grandCents > 0) grandText += ` and ${grandCents} cents`;
  lines.push(`Grand Total: ${grandText}.`);

  const utterance = new SpeechSynthesisUtterance(lines.join(" "));
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.lang = "en-US";

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
