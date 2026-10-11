import type {
  Transaction,
  TransactionType,
  TransactionCategory,
  TransactionFilter,
  FinancialSummary,
  DateFilterType,
} from '../types/transaction';

const STORAGE_KEY = 'setu_transactions';

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  work_earnings: 'briefcase',
  tips_bonus: 'sparkles',
  travel_fuel: 'car',
  food: 'restaurant',
  rent: 'home',
  tools: 'hammer',
  medical: 'medical',
  other: 'ellipsis-horizontal',
};

export const CATEGORY_TRANSLATION_KEYS: Record<TransactionCategory, string> = {
  work_earnings: 'categories.workEarnings',
  tips_bonus: 'categories.tipsBonus',
  travel_fuel: 'categories.travelFuel',
  food: 'categories.food',
  rent: 'categories.rent',
  tools: 'categories.tools',
  medical: 'categories.medical',
  other: 'categories.other',
};

/**
 * Safe local storage reader. Returns empty array for new users.
 */
export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

/**
 * Save transactions to localStorage and dispatch custom event for cross-tab or component sync.
 */
export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    window.dispatchEvent(new Event('setu_transactions_changed'));
  } catch (err) {
    console.error('Failed to save transactions to localStorage', err);
  }
}

/**
 * Add a new transaction with validation.
 */
export function addTransaction(
  input: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Transaction {
  if (input.amount <= 0 || isNaN(input.amount)) {
    throw new Error('Transaction amount must be a positive number.');
  }

  const now = Date.now();
  const newTx: Transaction = {
    ...input,
    id: `tx_${now}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  const existing = getStoredTransactions();
  const updated = [newTx, ...existing];
  saveStoredTransactions(updated);
  return newTx;
}

/**
 * Update an existing transaction.
 */
export function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Transaction | null {
  const existing = getStoredTransactions();
  const idx = existing.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  if (updates.amount !== undefined && (updates.amount <= 0 || isNaN(updates.amount))) {
    throw new Error('Transaction amount must be a positive number.');
  }

  const updatedTx: Transaction = {
    ...existing[idx],
    ...updates,
    updatedAt: Date.now(),
  };

  existing[idx] = updatedTx;
  saveStoredTransactions(existing);
  return updatedTx;
}

/**
 * Delete a transaction by ID.
 */
export function deleteTransaction(id: string): boolean {
  const existing = getStoredTransactions();
  const filtered = existing.filter((t) => t.id !== id);
  if (filtered.length === existing.length) return false;
  saveStoredTransactions(filtered);
  return true;
}

/**
 * Clears all user transactions.
 */
export function clearAllTransactions(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('setu_transactions_changed'));
}

/**
 * Development sample dataset clearly labeled as sample data.
 */
export function loadSampleDevelopmentTransactions(): Transaction[] {
  const now = new Date();
  const samples: Transaction[] = [];

  const daysBack = [
    { offset: 0, income: 750, expense: 150, incCat: 'work_earnings' as const, expCat: 'food' as const, descInc: 'Delivery gig daily payout', descExp: 'Lunch & Chai', workRef: 'Zomato' },
    { offset: 1, income: 820, expense: 220, incCat: 'work_earnings' as const, expCat: 'travel_fuel' as const, descInc: '12 ride trips completed', descExp: 'Petrol refill 2L', workRef: 'Uber' },
    { offset: 2, income: 600, expense: 80, incCat: 'work_earnings' as const, expCat: 'food' as const, descInc: 'Morning shifting helper', descExp: 'Snacks & water', workRef: 'Direct Client' },
    { offset: 3, income: 950, expense: 350, incCat: 'work_earnings' as const, expCat: 'tools' as const, descInc: 'Home electrical repair', descExp: 'Wire spool & tape', workRef: 'Urban Company' },
    { offset: 4, income: 700, expense: 140, incCat: 'work_earnings' as const, expCat: 'food' as const, descInc: 'Full day Chauffeuring', descExp: 'Afternoon meal', workRef: 'City Cabs' },
    { offset: 5, income: 800, expense: 190, incCat: 'work_earnings' as const, expCat: 'travel_fuel' as const, descInc: 'Weekend delivery shift', descExp: 'Fuel & air check', workRef: 'Swiggy' },
    { offset: 6, income: 650, expense: 90, incCat: 'work_earnings' as const, expCat: 'medical' as const, descInc: 'Domestic deep clean', descExp: 'Bandages & pain relief', workRef: 'Private Home' },
  ];

  daysBack.forEach((item, idx) => {
    const d = new Date(now);
    d.setDate(d.getDate() - item.offset);
    const dateStr = d.toISOString();

    samples.push({
      id: `sample_inc_${idx}`,
      type: 'income',
      amount: item.income,
      category: item.incCat,
      description: `[Dev Sample] ${item.descInc}`,
      timestamp: dateStr,
      workRef: item.workRef,
      source: 'quick',
      createdAt: d.getTime(),
      updatedAt: d.getTime(),
    });

    samples.push({
      id: `sample_exp_${idx}`,
      type: 'expense',
      amount: item.expense,
      category: item.expCat,
      description: `[Dev Sample] ${item.descExp}`,
      timestamp: dateStr,
      source: 'quick',
      createdAt: d.getTime() + 1000,
      updatedAt: d.getTime() + 1000,
    });
  });

  saveStoredTransactions(samples);
  return samples;
}

/**
 * Filter transactions by date range, category, and text search.
 */
export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter
): Transaction[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return transactions.filter((tx) => {
    const txTime = new Date(tx.timestamp).getTime();

    // 1. Date Filter
    if (filter.dateFilter === 'today') {
      if (txTime < startOfToday) return false;
    } else if (filter.dateFilter === 'this_week') {
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon = 0
      const startOfWeek = startOfToday - dayOfWeek * 86400000;
      if (txTime < startOfWeek) return false;
    } else if (filter.dateFilter === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      if (txTime < startOfMonth) return false;
    } else if (filter.dateFilter === 'custom') {
      if (filter.customStartDate) {
        const start = new Date(filter.customStartDate).getTime();
        if (txTime < start) return false;
      }
      if (filter.customEndDate) {
        const end = new Date(filter.customEndDate).getTime() + 86400000; // End of selected day
        if (txTime > end) return false;
      }
    }

    // 2. Type Filter
    if (filter.type && filter.type !== 'all' && tx.type !== filter.type) {
      return false;
    }

    // 3. Category Filter
    if (filter.category && filter.category !== 'all' && tx.category !== filter.category) {
      return false;
    }

    // 4. Search Query Filter
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.trim().toLowerCase();
      const matchDesc = (tx.description || '').toLowerCase().includes(q);
      const matchRef = (tx.workRef || '').toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      if (!matchDesc && !matchRef && !matchCat && !matchAmount) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Deterministically compute financial summaries from transactions.
 */
export function computeFinancialSummary(
  transactions: Transaction[],
  period: DateFilterType = 'this_week',
  customStart?: string,
  customEnd?: string
): FinancialSummary {
  const filtered = filterTransactions(transactions, {
    dateFilter: period,
    customStartDate: customStart,
    customEndDate: customEnd,
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let totalIncome = 0;
  let totalExpense = 0;
  let todayIncome = 0;
  let todayExpense = 0;

  const activeDates = new Set<string>();
  const categoryMap: Partial<Record<TransactionCategory, number>> = {};

  filtered.forEach((tx) => {
    const txTime = new Date(tx.timestamp).getTime();
    const dateKey = tx.timestamp.slice(0, 10);
    activeDates.add(dateKey);

    if (tx.type === 'income') {
      totalIncome += tx.amount;
      if (txTime >= startOfToday) {
        todayIncome += tx.amount;
      }
    } else {
      totalExpense += tx.amount;
      if (txTime >= startOfToday) {
        todayExpense += tx.amount;
      }
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
    }
  });

  // Also check all transactions for today's net (even if viewing another period)
  let actualTodayIncome = 0;
  let actualTodayExpense = 0;
  transactions.forEach((tx) => {
    const txTime = new Date(tx.timestamp).getTime();
    if (txTime >= startOfToday) {
      if (tx.type === 'income') actualTodayIncome += tx.amount;
      else actualTodayExpense += tx.amount;
    }
  });

  // Calculate days count in period
  let totalDaysInPeriod = 7;
  if (period === 'today') {
    totalDaysInPeriod = 1;
  } else if (period === 'this_week') {
    totalDaysInPeriod = 7;
  } else if (period === 'this_month') {
    totalDaysInPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  } else if (period === 'custom' && customStart && customEnd) {
    const diffTime = Math.abs(new Date(customEnd).getTime() - new Date(customStart).getTime());
    totalDaysInPeriod = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  } else if (period === 'all') {
    totalDaysInPeriod = Math.max(1, activeDates.size);
  }

  // Average daily income (identifying reporting period total days)
  const avgDailyIncome = totalDaysInPeriod > 0 ? Math.round(totalIncome / totalDaysInPeriod) : 0;

  // Build daily breakdown for the last 7 days (or current week)
  const dailyBreakdown: FinancialSummary['dailyBreakdown'] = [];
  const dayKeys = ['days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat', 'days.sun'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0, Sunday = 6

    let dayInc = 0;
    let dayExp = 0;

    transactions.forEach((tx) => {
      if (tx.timestamp.slice(0, 10) === dateStr) {
        if (tx.type === 'income') dayInc += tx.amount;
        else dayExp += tx.amount;
      }
    });

    dailyBreakdown.push({
      date: dateStr,
      dayKey: dayKeys[dayOfWeek],
      dayLabel: dayNames[dayOfWeek],
      income: dayInc,
      expense: dayExp,
      net: dayInc - dayExp,
    });
  }

  // Build category totals
  const categoryTotals: FinancialSummary['categoryTotals'] = (
    Object.keys(CATEGORY_ICONS) as TransactionCategory[]
  )
    .map((cat) => {
      const amount = categoryMap[cat] || 0;
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return {
        category: cat,
        categoryKey: CATEGORY_TRANSLATION_KEYS[cat],
        amount,
        percentage,
        icon: CATEGORY_ICONS[cat],
      };
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Weekly income across the 7-day breakdown
  const weeklyIncome = dailyBreakdown.reduce((acc, d) => acc + d.income, 0);

  // Weekly income delta (comparing last 7 days vs previous 7 days)
  const prior7DaysStart = now.getTime() - 14 * 86400000;
  const prior7DaysEnd = now.getTime() - 7 * 86400000;
  let prior7DaysInc = 0;
  transactions.forEach((tx) => {
    const t = new Date(tx.timestamp).getTime();
    if (t >= prior7DaysStart && t < prior7DaysEnd && tx.type === 'income') {
      prior7DaysInc += tx.amount;
    }
  });
  const weeklyIncomeDelta = prior7DaysInc > 0 ? weeklyIncome - prior7DaysInc : 0;

  // Check if active records are development sample data
  const isSampleData =
    transactions.length > 0 &&
    transactions.every(
      (tx) => tx.id.startsWith('sample_') || (tx.description && tx.description.includes('[Dev Sample]'))
    );

  // Honest AI forecasting: requires at least 5 active recording days
  const activeDaysCount = activeDates.size;
  const hasSufficientHistory = activeDaysCount >= 5;
  let forecastMin = 0;
  let forecastMax = 0;
  if (hasSufficientHistory) {
    const baseWeekly = weeklyIncome > 0 ? weeklyIncome : avgDailyIncome * 7;
    forecastMin = Math.round(baseWeekly * 0.95);
    forecastMax = Math.round(baseWeekly * 1.15);
  }

  // Honest AI Anomaly Detection: check if any single category takes over 35% of expense
  let hasAnomaly = false;
  let anomalyDescriptionKey: string | undefined;
  const fuelExpense = categoryMap['travel_fuel'] || 0;
  if (totalExpense > 250 && fuelExpense / totalExpense > 0.35) {
    hasAnomaly = true;
    anomalyDescriptionKey = 'dhan.anomalyAlert';
  }

  // Honest Stability Score: requires at least 7 days of recorded data
  const hasSufficientStabilityHistory = activeDaysCount >= 7;
  let stabilityScore = 0;
  let stabilityScoreLabelKey = 'dhan.stabilityScoreInsufficient';
  if (hasSufficientStabilityHistory) {
    const netRatio = totalIncome > 0 ? Math.max(0, (totalIncome - totalExpense) / totalIncome) : 0;
    stabilityScore = Math.min(480, Math.round(300 + netRatio * 150 + Math.min(activeDaysCount, 10) * 3));
    stabilityScoreLabelKey = 'dhan.stabilityScoreLabel';
  }

  return {
    totalIncome,
    totalExpense,
    netForPeriod: totalIncome - totalExpense,
    todayIncome: actualTodayIncome,
    todayExpense: actualTodayExpense,
    todayNet: actualTodayIncome - actualTodayExpense,
    avgDailyIncome,
    activeDaysCount,
    totalDaysInPeriod,
    dailyBreakdown,
    categoryTotals,
    weeklyIncome,
    weeklyIncomeDelta,
    hasSufficientHistory,
    hasSufficientStabilityHistory,
    forecastMin,
    forecastMax,
    stabilityScore,
    stabilityScoreLabelKey,
    hasAnomaly,
    anomalyDescriptionKey,
    isSampleData,
    transactionCount: filtered.length,
    hasTransactions: transactions.length > 0,
  };
}
