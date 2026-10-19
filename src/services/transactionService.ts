import type {
  Transaction,
  TransactionType,
  TransactionCategory,
  TransactionFilter,
  FinancialSummary,
  DateFilterType,
  DaySummary,
} from '../types/transaction';
import { apiClient } from './apiClient';
import { getAuthToken } from '../lib/supabaseClient';

const STORAGE_KEY = 'setu_transactions';

/**
 * Returns YYYY-MM-DD for a date object using LOCAL calendar dates (not UTC).
 * Completely avoids off-by-one errors across timezones.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extracts YYYY-MM-DD from an ISO string using the user's local timezone.
 */
export function getTransactionLocalDateString(isoTimestamp: string): string {
  try {
    const d = new Date(isoTimestamp);
    if (isNaN(d.getTime())) return isoTimestamp.slice(0, 10);
    return getLocalDateString(d);
  } catch {
    return isoTimestamp.slice(0, 10);
  }
}

/**
 * Formats a local date string (YYYY-MM-DD) into an ISO string preserving local time components.
 */
export function formatLocalDatetimetoIso(dateStr: string, timeStr?: string): string {
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  const now = new Date();
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10) || now.getFullYear();
  const month = (parseInt(monthStr, 10) || now.getMonth() + 1) - 1;
  const day = parseInt(dayStr, 10) || now.getDate();

  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();

  if (timeStr) {
    const [h, m] = timeStr.split(':');
    hours = parseInt(h, 10) || 0;
    minutes = parseInt(m, 10) || 0;
    seconds = 0;
  }

  const localDate = new Date(year, month, day, hours, minutes, seconds);
  return localDate.toISOString();
}

/**
 * Computes financial snapshot for an arbitrary single calendar day (YYYY-MM-DD).
 */
export function computeDaySummary(
  transactions: Transaction[],
  dateStr: string = getLocalDateString()
): DaySummary {
  const dayTxs = transactions
    .filter((tx) => getTransactionLocalDateString(tx.timestamp) === dateStr)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  let income = 0;
  let expense = 0;

  dayTxs.forEach((tx) => {
    if (tx.type === 'income') {
      income += tx.amount;
    } else {
      expense += tx.amount;
    }
  });

  return {
    date: dateStr,
    income,
    expense,
    net: income - expense,
    count: dayTxs.length,
    transactions: dayTxs,
  };
}

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
 * Generates realistic transaction history spanning the past 5 days
 * dynamically anchored to the current date and time.
 * Stored in localStorage as real data for demo and calculation purposes.
 */
export function generateDemoPastTransactions(): Transaction[] {
  const now = new Date();
  const txs: Transaction[] = [];

  const createIso = (daysAgo: number, hours: number, minutes: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  // Day 0: Today
  txs.push(
    {
      id: 'tx_demo_0_1',
      type: 'income',
      amount: 450,
      category: 'work_earnings',
      description: 'Morning delivery shift (4 orders)',
      workRef: 'Zomato Partner',
      timestamp: createIso(0, 10, 30),
      createdAt: Date.now() - 5 * 3600 * 1000,
      updatedAt: Date.now() - 5 * 3600 * 1000,
    },
    {
      id: 'tx_demo_0_2',
      type: 'expense',
      amount: 160,
      category: 'travel_fuel',
      description: 'Petrol refill at HP pump',
      timestamp: createIso(0, 11, 15),
      createdAt: Date.now() - 4 * 3600 * 1000,
      updatedAt: Date.now() - 4 * 3600 * 1000,
    },
    {
      id: 'tx_demo_0_3',
      type: 'expense',
      amount: 45,
      category: 'food',
      description: 'Chai & snack break',
      timestamp: createIso(0, 13, 20),
      createdAt: Date.now() - 3 * 3600 * 1000,
      updatedAt: Date.now() - 3 * 3600 * 1000,
    },
    {
      id: 'tx_demo_0_4',
      type: 'income',
      amount: 380,
      category: 'work_earnings',
      description: 'Afternoon passenger trips (3 rides)',
      workRef: 'Uber Driver',
      timestamp: createIso(0, 14, 45),
      createdAt: Date.now() - 2 * 3600 * 1000,
      updatedAt: Date.now() - 2 * 3600 * 1000,
    },
    {
      id: 'tx_demo_0_5',
      type: 'income',
      amount: 60,
      category: 'tips_bonus',
      description: 'Customer tip for fast delivery',
      timestamp: createIso(0, 15, 10),
      createdAt: Date.now() - 3600 * 1000,
      updatedAt: Date.now() - 3600 * 1000,
    }
  );

  // Day 1: Yesterday
  txs.push(
    {
      id: 'tx_demo_1_1',
      type: 'expense',
      amount: 180,
      category: 'travel_fuel',
      description: 'Daily fuel refill',
      timestamp: createIso(1, 9, 30),
      createdAt: Date.now() - 28 * 3600 * 1000,
      updatedAt: Date.now() - 28 * 3600 * 1000,
    },
    {
      id: 'tx_demo_1_2',
      type: 'expense',
      amount: 110,
      category: 'food',
      description: 'Lunch thali at roadside eatery',
      timestamp: createIso(1, 13, 45),
      createdAt: Date.now() - 24 * 3600 * 1000,
      updatedAt: Date.now() - 24 * 3600 * 1000,
    },
    {
      id: 'tx_demo_1_3',
      type: 'income',
      amount: 820,
      category: 'work_earnings',
      description: 'Full day city passenger rides & parcel drops',
      workRef: 'Rapido & Dunzo',
      timestamp: createIso(1, 18, 30),
      createdAt: Date.now() - 20 * 3600 * 1000,
      updatedAt: Date.now() - 20 * 3600 * 1000,
    },
    {
      id: 'tx_demo_1_4',
      type: 'income',
      amount: 80,
      category: 'tips_bonus',
      description: 'Evening peak surge bonus',
      timestamp: createIso(1, 19, 15),
      createdAt: Date.now() - 19 * 3600 * 1000,
      updatedAt: Date.now() - 19 * 3600 * 1000,
    }
  );

  // Day 2: 2 days ago
  txs.push(
    {
      id: 'tx_demo_2_1',
      type: 'expense',
      amount: 210,
      category: 'travel_fuel',
      description: 'Full tank petrol top-up',
      timestamp: createIso(2, 10, 0),
      createdAt: Date.now() - 50 * 3600 * 1000,
      updatedAt: Date.now() - 50 * 3600 * 1000,
    },
    {
      id: 'tx_demo_2_2',
      type: 'expense',
      amount: 85,
      category: 'food',
      description: 'Tea and evening samosa snack',
      timestamp: createIso(2, 15, 30),
      createdAt: Date.now() - 46 * 3600 * 1000,
      updatedAt: Date.now() - 46 * 3600 * 1000,
    },
    {
      id: 'tx_demo_2_3',
      type: 'income',
      amount: 750,
      category: 'work_earnings',
      description: 'Grocery delivery batch (6 orders)',
      workRef: 'Zepto Partner',
      timestamp: createIso(2, 17, 0),
      createdAt: Date.now() - 44 * 3600 * 1000,
      updatedAt: Date.now() - 44 * 3600 * 1000,
    },
    {
      id: 'tx_demo_2_4',
      type: 'income',
      amount: 120,
      category: 'tips_bonus',
      description: 'Weekend completion milestone reward',
      timestamp: createIso(2, 20, 0),
      createdAt: Date.now() - 40 * 3600 * 1000,
      updatedAt: Date.now() - 40 * 3600 * 1000,
    }
  );

  // Day 3: 3 days ago
  txs.push(
    {
      id: 'tx_demo_3_1',
      type: 'expense',
      amount: 150,
      category: 'travel_fuel',
      description: 'CNG gas refill',
      timestamp: createIso(3, 11, 30),
      createdAt: Date.now() - 74 * 3600 * 1000,
      updatedAt: Date.now() - 74 * 3600 * 1000,
    },
    {
      id: 'tx_demo_3_2',
      type: 'expense',
      amount: 250,
      category: 'tools',
      description: 'Mobile bike mount bracket replacement',
      workRef: 'Vehicle Accessory',
      timestamp: createIso(3, 14, 0),
      createdAt: Date.now() - 70 * 3600 * 1000,
      updatedAt: Date.now() - 70 * 3600 * 1000,
    },
    {
      id: 'tx_demo_3_3',
      type: 'income',
      amount: 680,
      category: 'work_earnings',
      description: 'Courier dispatch deliveries',
      workRef: 'Porter Partner',
      timestamp: createIso(3, 16, 30),
      createdAt: Date.now() - 68 * 3600 * 1000,
      updatedAt: Date.now() - 68 * 3600 * 1000,
    }
  );

  // Day 4: 4 days ago
  txs.push(
    {
      id: 'tx_demo_4_1',
      type: 'expense',
      amount: 190,
      category: 'travel_fuel',
      description: 'Petrol refill',
      timestamp: createIso(4, 12, 0),
      createdAt: Date.now() - 98 * 3600 * 1000,
      updatedAt: Date.now() - 98 * 3600 * 1000,
    },
    {
      id: 'tx_demo_4_2',
      type: 'expense',
      amount: 120,
      category: 'food',
      description: 'Dinner meal on the route',
      timestamp: createIso(4, 20, 30),
      createdAt: Date.now() - 90 * 3600 * 1000,
      updatedAt: Date.now() - 90 * 3600 * 1000,
    },
    {
      id: 'tx_demo_4_3',
      type: 'income',
      amount: 890,
      category: 'work_earnings',
      description: 'Late evening airport return ride',
      workRef: 'Ola Cabs',
      timestamp: createIso(4, 21, 15),
      createdAt: Date.now() - 89 * 3600 * 1000,
      updatedAt: Date.now() - 89 * 3600 * 1000,
    }
  );

  return txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const AUTH_USER_KEY = '@setu/auth_user_id';

/**
 * Derives current storage key scoped to authenticated user to isolate records.
 */
export function getCurrentUserStorageKey(): string {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw && raw.trim()) {
      return `setu_transactions_${raw.trim()}`;
    }
  } catch {}
  return STORAGE_KEY;
}

/**
 * Sets or clears the active authenticated user ID for transaction scoping.
 */
export function setCurrentAuthUserId(userId: string | null): void {
  try {
    if (userId && userId.trim()) {
      localStorage.setItem(AUTH_USER_KEY, userId.trim());
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
    window.dispatchEvent(new Event('setu_transactions_changed'));
  } catch (err) {
    console.error('Failed to update auth user id for transaction storage', err);
  }
}

/**
 * Reset or seed stored transactions to demo data spanning the past 4-5 days.
 * Only called explicitly (e.g. by reviewer clicking "Load Sample Data").
 */
export function seedDemoTransactions(): Transaction[] {
  const demoData = generateDemoPastTransactions();
  saveStoredTransactions(demoData);
  return demoData;
}

/**
 * Safe local storage reader. Returns stored transactions for current active user.
 * Returns empty array [] if no transactions exist yet.
 * Never automatically injects demo data into a genuine user's account.
 */
export function getStoredTransactions(): Transaction[] {
  try {
    const key = getCurrentUserStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

/**
 * Save transactions to user-scoped localStorage and dispatch custom event.
 */
export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    const key = getCurrentUserStorageKey();
    localStorage.setItem(key, JSON.stringify(transactions));
    window.dispatchEvent(new Event('setu_transactions_changed'));
  } catch (err) {
    console.error('Failed to save transactions to localStorage', err);
  }
}


/**
 * Syncs offline/local transactions to remote backend (if logged in) and updates local store with remote data.
 */
export async function syncTransactionsWithCloud(): Promise<Transaction[]> {
  const token = await getAuthToken();
  if (!token) {
    return getStoredTransactions();
  }

  try {
    const local = getStoredTransactions();
    // Exclude synthetic demo records from committing to PostgreSQL
    const genuineLocal = local.filter(
      (tx) =>
        !tx.id.startsWith('tx_demo_') &&
        !tx.id.startsWith('sample_') &&
        !tx.description?.includes('[Dev Sample]')
    );

    if (genuineLocal.length > 0) {
      // Batch sync local transactions to cloud
      await apiClient.post('/transactions/batch-sync', {
        transactions: genuineLocal.map((tx) => ({
          clientTxId: tx.id,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          description: tx.description || '',
          workRef: tx.workRef || null,
          source: 'manual',
          timestamp: tx.timestamp,
        })),
      });
    }

    // Pull down authoritative transaction list from cloud
    const res = await apiClient.get('/transactions?limit=250');
    if (res.data?.transactions && Array.isArray(res.data.transactions)) {
      if (res.data.transactions.length > 0) {
        const remoteTxs: Transaction[] = res.data.transactions.map((item: any) => ({
          id: item.clientTxId || item.id,
          type: item.type as TransactionType,
          amount: Number(item.amount),
          category: item.category as TransactionCategory,
          description: item.description || '',
          workRef: item.workRef || undefined,
          timestamp: item.timestamp,
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || Date.now(),
        }));

        saveStoredTransactions(remoteTxs);
        return remoteTxs;
      }
    }
  } catch (err) {
    console.warn('[TransactionSync] Cloud sync failed or offline, continuing with local store:', err);
  }

  return getStoredTransactions();
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

  // Deduplication check: prevent duplicate rapid creation within 2 seconds
  const recentDuplicate = existing.find((t) => {
    const isRecent = Math.abs(now - (t.createdAt || 0)) < 2000;
    const sameFields =
      t.type === input.type &&
      t.amount === input.amount &&
      t.category === input.category &&
      (t.description || '') === (input.description || '');
    return isRecent && sameFields;
  });

  if (recentDuplicate) {
    console.warn('[TransactionService] Prevented duplicate transaction submission');
    return recentDuplicate;
  }

  const updated = [newTx, ...existing];
  saveStoredTransactions(updated);

  // Background cloud push (non-blocking)
  getAuthToken().then((token) => {
    if (token) {
      apiClient
        .post('/transactions', {
          clientTxId: newTx.id,
          type: newTx.type,
          amount: newTx.amount,
          category: newTx.category,
          description: newTx.description || '',
          workRef: newTx.workRef || null,
          source: 'manual',
          timestamp: newTx.timestamp,
        })
        .catch((err) => {
          console.warn('[TransactionService] Background push failed, transaction remains safe locally:', err);
        });
    }
  });

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

  // Background cloud push (non-blocking)
  getAuthToken().then((token) => {
    if (token && !id.startsWith('tx_demo_') && !id.startsWith('sample_')) {
      apiClient
        .put(`/transactions/${id}`, {
          type: updatedTx.type,
          amount: updatedTx.amount,
          category: updatedTx.category,
          description: updatedTx.description || '',
          workRef: updatedTx.workRef || null,
          timestamp: updatedTx.timestamp,
        })
        .catch((err) => {
          console.warn('[TransactionService] Background update failed:', err);
        });
    }
  });

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

  // Background cloud delete (non-blocking)
  getAuthToken().then((token) => {
    if (token && !id.startsWith('tx_demo_') && !id.startsWith('sample_')) {
      apiClient.delete(`/transactions/${id}`).catch((err) => {
        console.warn('[TransactionService] Background delete failed:', err);
      });
    }
  });

  return true;
}


/**
 * Clears all user transactions.
 */
export function clearAllTransactions(): void {
  const key = getCurrentUserStorageKey();
  localStorage.removeItem(key);
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
  const todayStr = getLocalDateString(now);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 86400000;

  return transactions.filter((tx) => {
    const txTime = new Date(tx.timestamp).getTime();
    const txDateStr = getTransactionLocalDateString(tx.timestamp);

    // 1. Date Filter
    if (filter.dateFilter === 'today') {
      if (txDateStr !== todayStr) return false;
    } else if (filter.dateFilter === 'this_week') {
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon = 0
      const startOfWeek = startOfToday - dayOfWeek * 86400000;
      const endOfWeek = startOfWeek + 7 * 86400000;
      if (txTime < startOfWeek || txTime >= endOfWeek) return false;
    } else if (filter.dateFilter === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
      if (txTime < startOfMonth || txTime >= endOfMonth) return false;
    } else if (filter.dateFilter === 'custom') {
      if (filter.customStartDate && txDateStr < filter.customStartDate) {
        return false;
      }
      if (filter.customEndDate && txDateStr > filter.customEndDate) {
        return false;
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
  const todayStr = getLocalDateString(now);

  let totalIncome = 0;
  let totalExpense = 0;
  let todayIncome = 0;
  let todayExpense = 0;

  const activeDates = new Set<string>();
  const categoryMap: Partial<Record<TransactionCategory, number>> = {};

  filtered.forEach((tx) => {
    const dateKey = getTransactionLocalDateString(tx.timestamp);
    activeDates.add(dateKey);

    if (tx.type === 'income') {
      totalIncome += tx.amount;
      if (dateKey === todayStr) {
        todayIncome += tx.amount;
      }
    } else {
      totalExpense += tx.amount;
      if (dateKey === todayStr) {
        todayExpense += tx.amount;
      }
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
    }
  });

  // Also check all transactions for today's net (even if viewing another period)
  let actualTodayIncome = 0;
  let actualTodayExpense = 0;
  transactions.forEach((tx) => {
    const dateKey = getTransactionLocalDateString(tx.timestamp);
    if (dateKey === todayStr) {
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
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = getLocalDateString(d);
    const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0, Sunday = 6

    let dayInc = 0;
    let dayExp = 0;

    transactions.forEach((tx) => {
      if (getTransactionLocalDateString(tx.timestamp) === dateStr) {
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
