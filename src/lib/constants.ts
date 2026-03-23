export const IRS_MILEAGE_RATES: Record<number, number> = {
  2023: 0.655,
  2024: 0.67,
  2025: 0.7,
  2026: 0.7, // placeholder until IRS announces
};

export const MEAL_DEDUCTION_PCT = 0.5; // 50% deductible

export const SECTION_179_LIMITS: Record<number, number> = {
  2023: 1160000,
  2024: 1220000,
  2025: 1250000,
  2026: 1250000,
};

export const ASSET_THRESHOLD = 500; // Items > $500 go to Assets/Depreciation

export const TAX_YEARS = [2023, 2024, 2025, 2026];

// Sub-groups for categories (categoryId -> group names)
export const CATEGORY_GROUPS: Record<number, string[]> = {
  15: ["Lighting", "Camera Equipment", "Video Equipment", "Storage", "Accessories", "General Office Supplies"],
  // Add more categories here as needed
};
