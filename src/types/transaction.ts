export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'work_earnings'
  | 'tips_bonus'
  | 'travel_fuel'
  | 'food'
  | 'rent'
  | 'tools'
  | 'medical'
  | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  timestamp: string; // ISO 8601 string, e.g. "2026-10-11T14:30:00.000Z"
  workRef?: string; // Optional job or client reference
  source?: 'manual' | 'voice' | 'quick';
  createdAt: number;
  updatedAt: number;
}

export type DateFilterType = 'today' | 'this_week' | 'this_month' | 'all' | 'custom';

export interface TransactionFilter {
  dateFilter: DateFilterType;
  customStartDate?: string;
  customEndDate?: string;
  category?: TransactionCategory | 'all';
  type?: TransactionType | 'all';
  searchQuery?: string;
}

export interface FinancialSummary {
  // Primary deterministic totals
  totalIncome: number;
  totalExpense: number;
  netForPeriod: number;
  todayIncome: number;
  todayExpense: number;
  todayNet: number;
  // Average daily metrics
  avgDailyIncome: number;
  activeDaysCount: number;
  totalDaysInPeriod: number;
  // Chart and breakdown data
  dailyBreakdown: {
    date: string;
    dayKey: string;
    dayLabel: string;
    income: number;
    expense: number;
    net: number;
  }[];
  categoryTotals: {
    category: TransactionCategory;
    categoryKey: string;
    amount: number;
    percentage: number;
    icon: string;
  }[];
  // 7-day / weekly totals
  weeklyIncome: number;
  weeklyIncomeDelta: number;
  // AI & Stability metrics (Deterministic)
  hasSufficientHistory: boolean;
  hasSufficientStabilityHistory: boolean;
  forecastMin: number;
  forecastMax: number;
  stabilityScore: number;
  stabilityScoreLabelKey: string;
  hasAnomaly: boolean;
  anomalyDescriptionKey?: string;
  isSampleData: boolean;
  // Count
  transactionCount: number;
  hasTransactions: boolean;
}
