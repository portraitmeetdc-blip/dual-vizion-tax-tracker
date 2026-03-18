"use client";

import { useState, useEffect, useCallback } from "react";
import type { Expense, Category } from "@/db/schema";

export function useExpenses(taxYear: number) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/expenses?year=${taxYear}`);
    const data = await res.json();
    setExpenses(data);
    setLoading(false);
  }, [taxYear]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expense: {
    taxYear: number;
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
      body: JSON.stringify(expense),
    });
    if (res.ok) {
      await fetchExpenses();
    }
    return res.ok;
  };

  const updateExpense = async (expense: Partial<Expense> & { id: number }) => {
    const res = await fetch("/api/expenses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    if (res.ok) {
      await fetchExpenses();
    }
    return res.ok;
  };

  const deleteExpense = async (id: number) => {
    const res = await fetch(`/api/expenses?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchExpenses();
    }
    return res.ok;
  };

  return { expenses, loading, fetchExpenses, addExpense, updateExpense, deleteExpense };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      });
  }, []);

  return { categories, loading };
}

export function useSettings() {
  const [settings, setSettings] = useState({
    id: 0,
    businessName: "Dual Vizion Photography",
    ownerName: "M. Edwards",
    currentTaxYear: 2025,
    phoneBusinessPct: 100,
    internetBusinessPct: 100,
    mileageMethod: "standard",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then(setSettings);
  }, []);

  const updateSettings = async (newSettings: typeof settings) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
    }
    return res.ok;
  };

  return { settings, updateSettings };
}
