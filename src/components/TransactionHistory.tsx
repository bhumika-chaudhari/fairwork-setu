import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../lib/icons';
import { formatInr } from '../localization';
import type { Transaction, DateFilterType, TransactionCategory, TransactionType } from '../types/transaction';
import { CATEGORY_ICONS, CATEGORY_TRANSLATION_KEYS } from '../services/transactionService';
import Card from './Card';

interface Props {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export default function TransactionHistory({
  transactions,
  onEdit,
  onDelete,
  onAddIncome,
  onAddExpense,
}: Props) {
  const { t } = useTranslation();

  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter transactions
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const filtered = transactions.filter((tx) => {
    const txTime = new Date(tx.timestamp).getTime();

    // Date Filter
    if (dateFilter === 'today') {
      if (txTime < startOfToday) return false;
    } else if (dateFilter === 'this_week') {
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const startOfWeek = startOfToday - dayOfWeek * 86400000;
      if (txTime < startOfWeek) return false;
    } else if (dateFilter === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      if (txTime < startOfMonth) return false;
    } else if (dateFilter === 'custom') {
      if (customStart) {
        const start = new Date(customStart).getTime();
        if (txTime < start) return false;
      }
      if (customEnd) {
        const end = new Date(customEnd).getTime() + 86400000;
        if (txTime > end) return false;
      }
    }

    // Type Filter
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

    // Category Filter
    if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchDesc = (tx.description || '').toLowerCase().includes(q);
      const matchRef = (tx.workRef || '').toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      if (!matchDesc && !matchRef && !matchCat && !matchAmount) return false;
    }

    return true;
  });

  const formatDateLabel = (iso: string) => {
    try {
      const d = new Date(iso);
      const isToday = d.getTime() >= startOfToday;
      const isYesterday = d.getTime() >= startOfToday - 86400000 && d.getTime() < startOfToday;
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isToday) return `${t('transactions.today')}, ${timeStr}`;
      if (isYesterday) return `${t('transactions.yesterday')}, ${timeStr}`;
      return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${timeStr}`;
    } catch {
      return iso.slice(0, 10);
    }
  };

  const hasActiveFilters =
    dateFilter !== 'this_week' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    searchQuery.trim() !== '' ||
    customStart !== '' ||
    customEnd !== '';

  const clearFilters = () => {
    setDateFilter('this_week');
    setTypeFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
    setCustomStart('');
    setCustomEnd('');
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Title & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-extrabold text-deepEmerald leading-tight">
            {t('transactions.historyTitle')}
          </h2>
          <p className="text-xs text-textSecondary font-medium">
            {filtered.length} {t('transactions.entriesCount')}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onAddIncome}
            className="emerald-gradient-btn flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-lifted hover:brightness-105 active:scale-95 transition-all"
          >
            <span>+</span>
            <span>{t('transactions.incomeAction')}</span>
          </button>
          <button
            type="button"
            onClick={onAddExpense}
            className="flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-xl border border-rose-300/80 px-3.5 py-1.5 text-xs font-black text-black hover:bg-white shadow-xs active:scale-95 transition-all"
          >
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-rose-100/90 text-[9px] font-black text-rose-700 border border-rose-200">
              −
            </span>
            <span className="text-black font-black">
              {t('transactions.expenseAction')}
            </span>
          </button>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {[
          { id: 'today', label: t('transactions.filterToday') },
          { id: 'this_week', label: t('transactions.filterWeek') },
          { id: 'this_month', label: t('transactions.filterMonth') },
          { id: 'all', label: t('transactions.filterAll') },
          { id: 'custom', label: t('transactions.filterCustom') },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setDateFilter(tab.id as DateFilterType)}
            className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              dateFilter === tab.id
                ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-dockActive border border-[#E5953E]/50'
                : 'bg-white/70 hover:bg-white text-textSecondary border border-[#F4EBDD] shadow-xs'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      {dateFilter === 'custom' && (
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-glass animate-fade-in">
          <div>
            <label className="text-[10px] font-bold text-textMuted uppercase block mb-1">
              {t('transactions.startDate')}
            </label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full rounded-xl border border-white/80 bg-white/80 backdrop-blur-md px-2.5 py-1.5 text-xs font-medium text-textPrimary shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-textMuted uppercase block mb-1">
              {t('transactions.endDate')}
            </label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full rounded-xl border border-white/80 bg-white/80 backdrop-blur-md px-2.5 py-1.5 text-xs font-medium text-textPrimary shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      )}

      {/* Type & Search Filters Row */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          aria-label="Filter transactions by type"
          className="rounded-xl border border-white/70 bg-white/70 backdrop-blur-md px-2.5 py-1.5 font-bold text-deepEmerald shadow-glass focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">{t('transactions.allTypes')}</option>
          <option value="income">{t('transactions.typeIncome')}</option>
          <option value="expense">{t('transactions.typeExpense')}</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as any)}
          aria-label="Filter transactions by category"
          className="rounded-xl border border-white/70 bg-white/70 backdrop-blur-md px-2.5 py-1.5 font-bold text-deepEmerald shadow-glass focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">{t('transactions.allCategories')}</option>
          {(Object.keys(CATEGORY_ICONS) as TransactionCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {t(CATEGORY_TRANSLATION_KEYS[cat])}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[130px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('transactions.searchPlaceholder')}
            className="w-full rounded-xl border border-white/70 bg-white/70 backdrop-blur-md px-2.5 py-1.5 text-xs font-medium text-textPrimary shadow-glass placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1.5 text-textMuted hover:text-deepEmerald"
            >
              ✕
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-bold text-danger hover:underline whitespace-nowrap"
          >
            {t('common.clear')} ✕
          </button>
        )}
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-[#F4EBDD] bg-white/50 backdrop-blur-md p-6 text-center space-y-3 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF4E8] text-[#B34A26] border border-[#E5953E]/30 shadow-xs">
            <AppIcon name="receipt-outline" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-deepEmerald">
              {hasActiveFilters ? t('transactions.noMatching') : t('transactions.emptyHistoryTitle')}
            </h3>
            <p className="text-xs text-textSecondary mt-1 max-w-xs mx-auto">
              {hasActiveFilters ? t('transactions.noMatchingSub') : t('transactions.emptyHistorySub')}
            </p>
          </div>
          {!hasActiveFilters && (
            <div className="flex justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onAddIncome}
                className="emerald-gradient-btn flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-black text-white shadow-lifted hover:brightness-105 active:scale-95 transition-all"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-black text-white">+</span>
                <span>{t('transactions.addIncome')}</span>
              </button>
              <button
                type="button"
                onClick={onAddExpense}
                className="flex items-center justify-center gap-1.5 rounded-full bg-white/95 backdrop-blur-xl border border-rose-300/80 px-4 py-2 text-xs sm:text-sm font-black text-black hover:bg-white shadow-glass active:scale-95 transition-all"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100/90 text-[10px] font-black text-rose-700 border border-rose-200">−</span>
                <span>{t('transactions.addExpense')}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[#F4EBDD]">
          {filtered.map((tx) => {
            const isIncome = tx.type === 'income';
            const iconName = CATEGORY_ICONS[tx.category] || 'ellipsis-horizontal';
            const catLabel = t(CATEGORY_TRANSLATION_KEYS[tx.category]);

            return (
              <div
                key={tx.id}
                className="py-3 px-2 rounded-xl transition-all hover:bg-white/40 backdrop-blur-xs flex items-start justify-between gap-3 first:pt-2 last:pb-2 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-glass ${
                      isIncome
                        ? 'bg-[#F1F8F3] text-success border border-[#2E7D32]/30'
                        : 'bg-[#FDF3EE] text-danger border border-[#B34A26]/30'
                    }`}
                  >
                    <AppIcon name={iconName} size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-deepEmerald truncate">
                        {tx.description || catLabel}
                      </span>
                      {tx.workRef && (
                        <span className="rounded-md bg-white/60 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-semibold text-textMuted border border-white/80 shadow-xs">
                          {tx.workRef}
                        </span>
                      )}
                      {tx.source === 'voice' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary">
                          <AppIcon name="mic" size={10} />
                          <span>{t('transactions.voiceSource')}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-textMuted mt-0.5">
                      <span>{catLabel}</span>
                      <span>•</span>
                      <span>{formatDateLabel(tx.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-black block leading-tight ${
                      isIncome ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {isIncome ? '+' : '−'}₹{formatInr(tx.amount)}
                  </span>

                  {/* Actions: Edit & Delete */}
                  <div className="mt-1 flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEdit(tx)}
                      className="p-1 rounded-md text-textMuted hover:text-deepEmerald hover:bg-surfaceAlt transition-colors"
                      title={t('common.edit')}
                    >
                      <AppIcon name="create-outline" size={13} />
                    </button>
                    {deleteConfirmId === tx.id ? (
                      <div className="flex items-center gap-1 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(tx.id);
                            setDeleteConfirmId(null);
                          }}
                          className="rounded-md bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs"
                        >
                          {t('common.confirm')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded-md bg-surfaceAlt px-1.5 py-0.5 text-[10px] font-bold text-textSecondary"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(tx.id)}
                        className="p-1 rounded-md text-textMuted hover:text-danger hover:bg-red-50 transition-colors"
                        title={t('common.delete')}
                      >
                        <AppIcon name="trash-outline" size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
