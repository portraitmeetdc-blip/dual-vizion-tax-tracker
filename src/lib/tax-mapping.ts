export interface CategoryMapping {
  name: string;
  scheduleCLine: string;
  turbotaxSection: string;
  sortOrder: number;
}

export const CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    name: "Mileage Expenses",
    scheduleCLine: "Line 9: Car & Truck Expenses",
    turbotaxSection: "Vehicle Expenses",
    sortOrder: 1,
  },
  {
    name: "Communication Expenses",
    scheduleCLine: "Line 25: Utilities",
    turbotaxSection: "Utilities (apply business-use %)",
    sortOrder: 2,
  },
  {
    name: "Advertising Expenses",
    scheduleCLine: "Line 8: Advertising",
    turbotaxSection: "Advertising",
    sortOrder: 3,
  },
  {
    name: "Professional Expenses",
    scheduleCLine: "Line 27b: Other Expenses",
    turbotaxSection: "Other Expenses > Professional Dues",
    sortOrder: 4,
  },
  {
    name: "Business Travel - Hotels",
    scheduleCLine: "Line 24a: Travel",
    turbotaxSection: "Travel",
    sortOrder: 5,
  },
  {
    name: "Business Travel - Fees",
    scheduleCLine: "Line 24a: Travel",
    turbotaxSection: "Travel",
    sortOrder: 6,
  },
  {
    name: "Business Travel - Meals",
    scheduleCLine: "Line 24b: Meals",
    turbotaxSection: "Meals (50% deductible)",
    sortOrder: 7,
  },
  {
    name: "Airfare",
    scheduleCLine: "Line 24a: Travel",
    turbotaxSection: "Travel",
    sortOrder: 8,
  },
  {
    name: "Equipment Rental",
    scheduleCLine: "Line 20a: Rent/Lease",
    turbotaxSection: "Rent or Lease > Equipment",
    sortOrder: 9,
  },
  {
    name: "Miscellaneous Expenses",
    scheduleCLine: "Line 27b: Other Expenses",
    turbotaxSection: "Other Expenses > Software/Licensing",
    sortOrder: 10,
  },
  {
    name: "Repairs & Maintenance",
    scheduleCLine: "Line 21: Repairs",
    turbotaxSection: "Repairs and Maintenance",
    sortOrder: 11,
  },
  {
    name: "Business Insurance",
    scheduleCLine: "Line 15: Insurance",
    turbotaxSection: "Insurance (other than health)",
    sortOrder: 12,
  },
  {
    name: "Supplies Expenses",
    scheduleCLine: "Line 22: Supplies",
    turbotaxSection: "Supplies",
    sortOrder: 13,
  },
  {
    name: "Meals",
    scheduleCLine: "Line 24b: Meals",
    turbotaxSection: "Meals (50% deductible)",
    sortOrder: 14,
  },
  {
    name: "Office Supplies & Expenses",
    scheduleCLine: "Line 18: Office Expense",
    turbotaxSection: "Office Expenses",
    sortOrder: 15,
  },
  {
    name: "Assets",
    scheduleCLine: "Line 13: Depreciation",
    turbotaxSection: "Depreciation / Form 4562 (Section 179)",
    sortOrder: 16,
  },
];
