import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  Transaction,
  TransactionType,
  FinancialSummary,
  DateFilterType,
} from '../types/transaction';
import {
  getStoredTransactions,
  addTransaction as apiAddTx,
  updateTransaction as apiUpdateTx,
  deleteTransaction as apiDeleteTx,
  clearAllTransactions as apiClearTx,
  loadSampleDevelopmentTransactions as apiLoadSample,
  computeFinancialSummary,
  syncTransactionsWithCloud,
} from '../services/transactionService';

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  selectedPeriod: DateFilterType;
  setSelectedPeriod: (period: DateFilterType) => void;
  summary: FinancialSummary;
  addTransaction: (
    tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  clearTransactions: () => void;
  loadSampleData: () => void;
  syncWithCloud: () => Promise<void>;
  // Modal controllers
  isAddModalOpen: boolean;
  openAddModal: (type?: TransactionType, date?: string) => void;
  closeAddModal: () => void;
  modalDefaultType: TransactionType;
  modalDefaultDate?: string;
  editingTransaction: Transaction | null;
  openEditModal: (tx: Transaction) => void;
  closeEditModal: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<DateFilterType>('this_week');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>('income');
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const refresh = useCallback(() => {
    const list = getStoredTransactions();
    setTransactions(list);
    setLoading(false);
  }, []);

  const syncWithCloud = useCallback(async () => {
    try {
      const synced = await syncTransactionsWithCloud();
      setTransactions(synced);
    } catch (err) {
      console.warn('[TransactionContext] Cloud sync error:', err);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Non-blocking background sync with Supabase PostgreSQL if authenticated
    syncWithCloud();

    const handleStorageChange = () => {
      refresh();
      syncWithCloud();
    };

    window.addEventListener('setu_transactions_changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('setu_transactions_changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refresh, syncWithCloud]);


  const summary = useMemo(() => {
    return computeFinancialSummary(transactions, selectedPeriod);
  }, [transactions, selectedPeriod]);

  const addTransaction = useCallback(
    async (input: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = apiAddTx(input);
      refresh();
      return res;
    },
    [refresh]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
      const res = apiUpdateTx(id, updates);
      refresh();
      return res;
    },
    [refresh]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const res = apiDeleteTx(id);
      refresh();
      return res;
    },
    [refresh]
  );

  const clearTransactions = useCallback(() => {
    apiClearTx();
    refresh();
  }, [refresh]);

  const loadSampleData = useCallback(() => {
    apiLoadSample();
    refresh();
  }, [refresh]);

  const openAddModal = useCallback((type: TransactionType = 'income', date?: string) => {
    setModalDefaultType(type);
    setModalDefaultDate(date);
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setModalDefaultDate(undefined);
  }, []);

  const openEditModal = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(false);
    setModalDefaultDate(undefined);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingTransaction(null);
  }, []);

  const value = useMemo(
    () => ({
      transactions,
      loading,
      selectedPeriod,
      setSelectedPeriod,
      summary,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      clearTransactions,
      loadSampleData,
      syncWithCloud,
      isAddModalOpen,
      openAddModal,
      closeAddModal,
      modalDefaultType,
      modalDefaultDate,
      editingTransaction,
      openEditModal,
      closeEditModal,
    }),
    [
      transactions,
      loading,
      selectedPeriod,
      summary,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      clearTransactions,
      loadSampleData,
      syncWithCloud,
      isAddModalOpen,
      openAddModal,
      closeAddModal,
      modalDefaultType,
      modalDefaultDate,
      editingTransaction,
      openEditModal,
      closeEditModal,
    ]

  );

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions(): TransactionContextType {
  const ctx = useContext(TransactionContext);
  if (!ctx) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return ctx;
}
