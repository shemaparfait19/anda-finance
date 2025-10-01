import type { CashbookEntry } from "./types";
import cashbookData from '@/data/cashbook.json';

// This file is now only used for data that is truly static
// and not meant to be modified by the application's CRUD operations.

export const income: CashbookEntry[] = cashbookData.income;
export const expenses: CashbookEntry[] = cashbookData.expenses;
export const chartData = [
  { month: "Jan", savings: 40000, loans: 24000 },
  { month: "Feb", savings: 30000, loans: 13980 },
  { month: "Mar", savings: 20000, loans: 98000 },
  { month: "Apr", savings: 27800, loans: 39080 },
  { month: "May", savings: 18900, loans: 48000 },
  { month: "Jun", savings: 23900, loans: 38000 },
  { month: "Jul", savings: 34900, loans: 43000 },
];
