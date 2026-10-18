import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import IncomeChart from '../components/IncomeChart';
import ProgressRing from '../components/ProgressRing';
import DisclaimerText from '../components/DisclaimerText';
import ListenButton from '../components/ListenButton';
import TransactionHistory from '../components/TransactionHistory';
import TransactionModal from '../components/TransactionModal';
import LanguageSelector from '../components/LanguageSelector';
import { buildFinancialSpeechText } from '../lib/speechContextualContent';
import { AppIcon } from '../lib/icons';
import { formatInr } from '../localization';
import { useTransactions } from '../hooks/TransactionContext';
import { useProfile } from '../hooks/ProfileContext';
import {
  getLocalDateString,
  getTransactionLocalDateString,
  computeDaySummary,
  CATEGORY_ICONS,
  CATEGORY_TRANSLATION_KEYS,
} from '../services/transactionService';
import {
  forecastIncomeHorizon,
  detectTransactionAnomalies,
  type Model2Forecast,
  type Model3AnomalyResult,
} from '../services/aiModelsClient';

export default function DhanPage() {

  const { t, i18n } = useTranslation();
  const { profile } = useProfile();
  const {
    transactions,
    summary,
    openAddModal,
    isAddModalOpen,
    closeAddModal,
    modalDefaultType,
    modalDefaultDate,
    editingTransaction,
    openEditModal,
    closeEditModal,
    deleteTransaction,
    clearTransactions,
    loadSampleData,
  } = useTransactions();

  // Selected calendar date (defaults to user's local date)
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [activeTab, setActiveTab] = useState<'day' | 'week'>('day');
  const [selectedExpenseCat, setSelectedExpenseCat] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Model 2 & Model 3 Live States
  const [model2Forecast, setModel2Forecast] = useState<Model2Forecast | null>(null);
  const [model3Anomalies, setModel3Anomalies] = useState<Model3AnomalyResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    forecastIncomeHorizon(7)
      .then((data) => {
        if (isMounted) setModel2Forecast(data);
      })
      .catch(() => {});

    if (transactions.length > 0) {
      detectTransactionAnomalies(transactions)
        .then((data) => {
          if (isMounted) setModel3Anomalies(data);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [transactions]);


  // Derive savings from user profile goal & total recorded income
  const savingsTarget = profile.savingsGoal && profile.savingsGoal > 0 ? profile.savingsGoal : 4200;
  const savingsSaved = summary.totalIncome > 0
    ? Math.min(savingsTarget, Math.round(summary.totalIncome * 0.25))
    : 0;
  const savingsPercent = savingsTarget > 0 ? Math.min(100, Math.round((savingsSaved / savingsTarget) * 100)) : 0;

  // Build audio contextual speech
  const financialSpeech = buildFinancialSpeechText(
    {
      todayIncome: summary.todayIncome,
      weeklyIncome: summary.weeklyIncome,
      todayExpense: summary.todayExpense,
      netInHand: summary.todayNet,
      savingsSaved,
      savingsTarget,
      stabilityScore: summary.stabilityScore,
      forecastMin: summary.forecastMin,
      forecastMax: summary.forecastMax,
    },
    i18n.language
  );
  const financialTrack = {
    id: 'dhan-overview',
    title: financialSpeech.title,
    speech: financialSpeech.speech,
    lang: i18n.language,
  };

  // Date badges and navigation
  const todayStr = getLocalDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  const isToday = selectedDate === todayStr;
  const isYesterday = selectedDate === yesterdayStr;

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(getLocalDateString(prev));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    setSelectedDate(getLocalDateString(next));
  };

  const handleToday = () => {
    setSelectedDate(getLocalDateString());
  };

  const formattedDateLabel = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(i18n.language === 'en' ? 'en-IN' : i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [selectedDate, i18n.language]);

  // 7-day strip anchored around selectedDate
  const dateStrip = useMemo(() => {
    const list: Array<{
      dateStr: string;
      dayNum: number;
      dayLabel: string;
      isToday: boolean;
      isSelected: boolean;
      hasTransactions: boolean;
      income: number;
      expense: number;
      net: number;
    }> = [];

    const [y, m, d] = selectedDate.split('-').map(Number);
    const centerDate = new Date(y, m - 1, d);

    for (let offset = -3; offset <= 3; offset++) {
      const target = new Date(centerDate.getFullYear(), centerDate.getMonth(), centerDate.getDate() + offset);
      const dateStr = getLocalDateString(target);
      const dayTxs = transactions.filter((tx) => getTransactionLocalDateString(tx.timestamp) === dateStr);
      let dayInc = 0;
      let dayExp = 0;
      dayTxs.forEach((t) => {
        if (t.type === 'income') dayInc += t.amount;
        else dayExp += t.amount;
      });

      list.push({
        dateStr,
        dayNum: target.getDate(),
        dayLabel: target.toLocaleDateString(i18n.language === 'en' ? 'en-IN' : i18n.language, { weekday: 'short' }),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasTransactions: dayTxs.length > 0,
        income: dayInc,
        expense: dayExp,
        net: dayInc - dayExp,
      });
    }
    return list;
  }, [selectedDate, transactions, i18n.language, todayStr]);

  // Day financial summary for selectedDate
  const daySummary = useMemo(() => {
    return computeDaySummary(transactions, selectedDate);
  }, [transactions, selectedDate]);

  const formatTxTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-4 px-4 pt-3 pb-8">
      {/* Header */}
      <header className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white font-black text-base shadow-glass border border-[#F1B96B]/40">
            D
          </div>
          <h1 className="text-xl font-extrabold text-deepEmerald">
            {t('dhan.title')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ListenButton track={financialTrack} size="sm" />
          <div className="md:hidden">
            <LanguageSelector variant="icon" />
          </div>
        </div>
      </header>

      {/* DEV / DEMO SAMPLE DATA BANNER */}
      {summary.isSampleData && (
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 backdrop-blur-md p-3.5 shadow-glass flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200/90 text-amber-900 shadow-xs">
              <AppIcon name="sparkles" size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black text-amber-900 truncate">
                {t('dhan.sampleDataBanner')}
              </h2>
              <p className="text-[11px] text-amber-800 line-clamp-1">
                {t('dhan.sampleDataSub')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearTransactions}
            className="shrink-0 rounded-full bg-white/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-amber-900 border border-amber-400/60 shadow-xs hover:bg-white transition-all active:scale-95"
          >
            {t('dhan.clearSampleData')}
          </button>
        </div>
      )}

      {/* EMPTY DATA DEV HELPER: Load sample data or start fresh */}
      {!summary.isSampleData && transactions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#F4EBDD] bg-white/60 backdrop-blur-md p-3.5 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AppIcon name="receipt-outline" size={16} className="text-primary shrink-0" />
            <span className="text-xs text-textSecondary font-medium">
              {t('dhan.sampleDataPrompt')}
            </span>
          </div>
          <button
            type="button"
            onClick={loadSampleData}
            className="rounded-full bg-white/80 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-deepEmerald border border-[#F4EBDD] hover:bg-white transition-all shrink-0 shadow-xs active:scale-95"
          >
            {t('dhan.loadSampleData')}
          </button>
        </div>
      )}

      {/* CALENDAR & DATE SELECTOR COMPONENT */}
      <Card className="p-3.5 space-y-3">
        {/* Date Navigator Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevDay}
              aria-label="Previous day"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 hover:bg-white border border-[#F4EBDD] shadow-xs text-textPrimary active:scale-95 transition-all"
            >
              <AppIcon name="chevron-back" size={16} />
            </button>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-extrabold text-deepEmerald tracking-tight">
                {formattedDateLabel}
              </span>
              {isToday ? (
                <span className="rounded-full bg-[#F1F8F3] text-success border border-[#2E7D32]/35 px-2 py-0.5 text-[10px] font-black uppercase">
                  {t('transactions.today', 'Today')}
                </span>
              ) : isYesterday ? (
                <span className="rounded-full bg-[#EFF7F8] text-[#3A757D] border border-[#3A757D]/35 px-2 py-0.5 text-[10px] font-black uppercase">
                  {t('transactions.yesterday', 'Yesterday')}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleNextDay}
              aria-label="Next day"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 hover:bg-white border border-[#F4EBDD] shadow-xs text-textPrimary active:scale-95 transition-all"
            >
              <AppIcon name="chevron-forward" size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isToday && (
              <button
                type="button"
                onClick={handleToday}
                className="rounded-full emerald-gradient-btn text-white px-2.5 py-1 text-[11px] font-black shadow-xs hover:brightness-105 active:scale-95 transition-all"
              >
                {t('dhan.jumpToToday', 'Today')}
              </button>
            )}

            {/* Native Date Picker trigger overlay */}
            <label className="relative flex items-center justify-center h-8 px-2.5 rounded-xl bg-white/80 hover:bg-white border border-[#F4EBDD] text-deepEmerald cursor-pointer shadow-xs active:scale-95 transition-all text-xs font-bold gap-1">
              <AppIcon name="calendar" size={15} className="text-primary" />
              <span className="hidden sm:inline">{t('dhan.chooseDate', 'Pick Date')}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Pick calendar date"
              />
            </label>
          </div>
        </div>

        {/* 7-Day Quick-Select Date Strip */}
        <div className="grid grid-cols-7 gap-1 pt-0.5">
          {dateStrip.map((item) => (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => setSelectedDate(item.dateStr)}
              className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all border text-center ${
                item.isSelected
                  ? 'bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white border-[#B34A26] shadow-glass font-black scale-[1.02]'
                  : 'bg-white/70 text-textSecondary border-[#F4EBDD] hover:bg-white hover:text-textPrimary'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold leading-none ${item.isSelected ? 'text-saffronGold' : 'text-textMuted'}`}>
                {item.dayLabel}
              </span>
              <span className="text-sm font-black mt-0.5 leading-tight">
                {item.dayNum}
              </span>
              <span className="h-1.5 w-1.5 rounded-full mt-1 flex items-center justify-center">
                {item.hasTransactions ? (
                  <span className={`h-1.5 w-1.5 rounded-full ${item.isSelected ? 'bg-saffronGold' : 'bg-primary'}`} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Day Financial Snapshot Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-[#FEF4E8]/90 via-white/85 to-[#FDF8F0]/70 p-3 border border-[#E5953E]/30 shadow-xs flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider block">
              {isToday ? t('dhan.todaySummary', "Today's Summary") : `${t('dhan.dayBalance', 'Day Balance')} (${formattedDateLabel})`}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-xl font-black ${daySummary.net >= 0 ? 'text-deepEmerald' : 'text-danger'}`}>
                {daySummary.net >= 0 ? '+' : '−'}₹{formatInr(Math.abs(daySummary.net))}
              </span>
              <span className="text-[11px] text-textMuted font-semibold">
                ({daySummary.count} {t('transactions.entriesCount', 'entries')})
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-success font-bold">
                +{t('common.currency', { amount: formatInr(daySummary.income) })}
              </span>
              <span className="text-danger font-bold">
                −{t('common.currency', { amount: formatInr(daySummary.expense) })}
              </span>
            </div>
          </div>

          {/* Date-Specific Add Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => openAddModal('income', selectedDate)}
              className="emerald-gradient-btn flex items-center justify-center gap-1 rounded-xl text-white px-3 py-2 text-xs font-black shadow-xs hover:brightness-105 active:scale-95 transition-all"
            >
              <span>+</span>
              <span>{t('transactions.addIncome', 'Add Income')}</span>
            </button>
            <button
              type="button"
              onClick={() => openAddModal('expense', selectedDate)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white/95 backdrop-blur-xl border border-rose-300/80 px-3 py-2 text-xs font-black text-black shadow-glass hover:bg-white active:scale-95 transition-all group"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100/90 text-[10px] font-black text-rose-700 border border-rose-200">
                −
              </span>
              <span className="text-black font-black tracking-tight">
                {t('transactions.addExpense', 'Add Expense')}
              </span>
            </button>
          </div>
        </div>
      </Card>

      {/* VIEW SEGMENT CONTROL: Day Entries vs Weekly Analytics & AI */}
      <div className="flex rounded-2xl bg-white/70 backdrop-blur-md p-1 border border-[#F4EBDD] shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('day')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'day'
              ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-glass'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          📅 {t('dhan.dayView', 'Day View')} ({daySummary.count})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('week')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'week'
              ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-glass'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          📊 {t('dhan.weekView', 'Weekly Analytics & AI')}
        </button>
      </div>

      {/* TAB CONTENT: Day View */}
      {activeTab === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Day's Transactions List */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-deepEmerald">
                  {formattedDateLabel}
                </h2>
                <p className="text-[11px] text-textSecondary">
                  {daySummary.count} {t('transactions.entriesCount', 'entries')} on this date
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openAddModal('income', selectedDate)}
                  className="rounded-full bg-warmAmber/20 text-terracotta border border-warmAmber/60 px-2.5 py-1 text-[11px] font-bold hover:bg-warmAmber/30 active:scale-95 transition-all"
                >
                  + {t('transactions.incomeAction', 'Income')}
                </button>
                <button
                  type="button"
                  onClick={() => openAddModal('expense', selectedDate)}
                  className="flex items-center gap-1 rounded-full bg-white/95 text-black border border-rose-300/80 px-2.5 py-1 text-[11px] font-black hover:bg-white shadow-xs active:scale-95 transition-all"
                >
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-rose-100/90 text-[9px] font-black text-rose-700 border border-rose-200">
                    −
                  </span>
                  <span className="text-black font-black">
                    {t('transactions.expenseAction', 'Expense')}
                  </span>
                </button>
              </div>
            </div>

            {daySummary.transactions.length > 0 ? (
              <div className="space-y-2 pt-1">
                {daySummary.transactions.map((tx) => {
                  const iconName = CATEGORY_ICONS[tx.category] || 'ellipsis-horizontal';
                  const translationKey = CATEGORY_TRANSLATION_KEYS[tx.category] || 'categories.other';
                  const isIncome = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      className="rounded-2xl border border-softBorder bg-cleanWhite/85 backdrop-blur-md p-3 shadow-xs hover:shadow-glass transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs border ${
                            isIncome
                              ? 'bg-warmAmber/20 text-terracotta border-warmAmber/50'
                              : 'bg-rose-500/15 text-rose-700 border-rose-300/60'
                          }`}
                        >
                          <AppIcon name={iconName} size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-deepEmerald">
                              {t(translationKey)}
                            </span>
                            {tx.workRef && (
                              <span className="rounded-md bg-primarySoft px-1.5 py-0.2 text-[10px] font-semibold text-primary truncate max-w-[120px]">
                                {tx.workRef}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-textSecondary line-clamp-1 mt-0.5">
                            {tx.description || t(translationKey)}
                          </p>
                          <span className="text-[10px] text-textMuted font-medium block mt-0.5">
                            {formatTxTime(tx.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <span
                            className={`text-sm font-black block leading-tight ${
                              isIncome ? 'text-success' : 'text-textPrimary'
                            }`}
                          >
                            {isIncome ? '+' : '−'}₹{formatInr(tx.amount)}
                          </span>
                        </div>

                        {/* Inline Edit & Delete Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(tx)}
                            aria-label="Edit transaction"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 hover:bg-white text-textSecondary hover:text-deepEmerald border border-border/60 shadow-xs active:scale-95 transition-all"
                          >
                            <AppIcon name="pencil" size={13} />
                          </button>
                          {deleteConfirmId === tx.id ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(tx.id)}
                              aria-label="Confirm delete"
                              className="rounded-lg bg-danger text-white px-2 py-1 text-[10px] font-bold shadow-xs active:scale-95 transition-all"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(tx.id)}
                              aria-label="Delete transaction"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 hover:bg-rose-50 text-textSecondary hover:text-danger border border-border/60 shadow-xs active:scale-95 transition-all"
                            >
                              <AppIcon name="trash" size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-white/30 backdrop-blur-md p-6 text-center space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint/20 text-primary mx-auto">
                  <AppIcon name="calendar" size={20} />
                </div>
                <h3 className="text-xs font-extrabold text-warmCocoa">
                  {t('dhan.noDayTransactions', 'No transactions recorded for this day')}
                </h3>
                <p className="text-[11px] text-textSecondary max-w-xs mx-auto">
                  {t('dhan.noDayTransactionsSub', 'Tap Add Income or Add Expense to log earnings or costs for this date.')}
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openAddModal('income', selectedDate)}
                    className="rounded-xl emerald-gradient-btn text-white px-3.5 py-1.5 text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all"
                  >
                    + {t('transactions.addIncome', 'Add Income')}
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddModal('expense', selectedDate)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-white/95 backdrop-blur-xl border border-rose-300/80 px-3.5 py-1.5 text-xs font-black text-black shadow-xs hover:bg-white active:scale-95 transition-all"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100/90 text-[10px] font-black text-rose-700 border border-rose-200">
                      −
                    </span>
                    <span className="text-black font-black tracking-tight">
                      {t('transactions.addExpense', 'Add Expense')}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </Card>
          </div>

          {/* Full Transaction History Component with Filters */}
          <div className="lg:col-span-7 xl:col-span-7">
            <TransactionHistory
              transactions={transactions}
              onEdit={openEditModal}
              onDelete={deleteTransaction}
              onAddIncome={() => openAddModal('income', selectedDate)}
              onAddExpense={() => openAddModal('expense', selectedDate)}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: Weekly Analytics & AI Insights View */}
      {activeTab === 'week' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left Column: Top Stats, Net for Period, 7-Day Chart, Stability Score */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            {/* TOP STATS: 2 Cards Side-by-Side */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-2 gap-3"
            >
              {/* Card 1: Weekly Income */}
              <Card className="mb-0 p-3.5">
                <span className="text-xs font-semibold text-textMuted">
                  {t('dhan.weeklyIncome')}
                </span>
                <p className="text-2xl md:text-3xl font-black text-warmCocoa mt-1">
                  {t('common.currency', { amount: formatInr(summary.weeklyIncome) })}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#F1F8F3] px-2.5 py-0.5 text-[11px] font-bold text-success border border-[#2E7D32]/30">
                  <span>{summary.weeklyIncomeDelta >= 0 ? '↑' : '↓'}</span>
                  <span>
                    {summary.weeklyIncomeDelta >= 0 ? '+' : '−'}
                    {t('common.currency', { amount: formatInr(Math.abs(summary.weeklyIncomeDelta)) })} {t('dhan.fromLastWeek')}
                  </span>
                </div>
              </Card>

              {/* Card 2: Avg Daily Income */}
              <Card className="mb-0 p-3.5">
                <span className="text-xs font-semibold text-textMuted">
                  {t('dhan.avgDailyIncome')}
                </span>
                <p className="text-2xl md:text-3xl font-black text-warmCocoa mt-1">
                  {t('common.currency', { amount: formatInr(summary.avgDailyIncome) })}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-warmAmber/20 px-2.5 py-0.5 text-[11px] font-bold text-terracotta border border-warmAmber/40">
                  <span>•</span>
                  <span>{t('dhan.basedOn7Days')}</span>
                </div>
              </Card>
            </motion.div>

            {/* NET FOR PERIOD SUMMARY BANNER */}
            <div className="relative overflow-hidden rounded-2xl bg-cleanWhite/90 backdrop-blur-2xl p-4 shadow-card border border-softBorder flex items-center justify-between">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta/15 text-terracotta border border-warmAmber/30 shadow-xs">
                  <AppIcon name="wallet" size={17} />
                </div>
                <div>
                  <span className="text-xs font-bold text-warmCocoa block leading-tight">
                    {t('dhan.netForPeriod')}
                  </span>
                  <p className="text-[11px] text-textSecondary mt-0.5">
                    <span className="text-success font-semibold">+{t('common.currency', { amount: formatInr(summary.totalIncome) })}</span>{' '}
                    <span className="text-danger font-semibold">−{t('common.currency', { amount: formatInr(summary.totalExpense) })}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-textMuted block">
                  {t('dhan.netForPeriod')}
                </span>
                <span className={`text-base font-black ${summary.netForPeriod >= 0 ? 'text-warmCocoa' : 'text-danger'}`}>
                  {summary.netForPeriod >= 0 ? '+' : '−'}{t('common.currency', { amount: formatInr(Math.abs(summary.netForPeriod)) })}
                </span>
              </div>
            </div>

            {/* 7-DAY INCOME & EXPENSE CHART */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-warmCocoa">
                  {t('dhan.last7Days')}
                </h2>
                <span className="text-xs font-semibold text-textMuted">{t('dhan.monSun')}</span>
              </div>
              <IncomeChart days={summary.dailyBreakdown} />
            </Card>

            {/* HONEST FINANCIAL STABILITY SCORE GAUGE CARD */}
            <Card variant="emerald" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-warmCocoa">
                    {t('dhan.stabilityScore')}
                  </h3>
                  <p className="text-xs text-textMuted mt-0.5">
                    {t('dhan.stabilityHint')}
                  </p>
                </div>
                {summary.hasSufficientStabilityHistory ? (
                  <div className="text-right">
                    <span className="text-2xl font-black text-warmCocoa">{summary.stabilityScore}</span>
                    <span className="block text-[10px] font-bold text-success uppercase">
                      {t(summary.stabilityScoreLabelKey)}
                    </span>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-xs font-bold text-textMuted bg-surfaceAlt px-2 py-1 rounded-lg">
                      {t('dhan.buildingScore')}
                    </span>
                  </div>
                )}
              </div>

              {/* Stability Progress Bar */}
              {summary.hasSufficientStabilityHistory ? (
                <div className="mt-3 h-2.5 w-full rounded-full bg-softBorder overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#F1B96B] via-[#E5953E] to-[#B34A26] transition-all duration-500"
                    style={{ width: `${Math.min((summary.stabilityScore / 500) * 100, 100)}%` }}
                  />
                </div>
              ) : (
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs text-textSecondary">
                    {t('dhan.stabilityScoreInsufficient')}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-textMuted">
                    <span>{t('dhan.activeDaysProgress', { count: summary.activeDaysCount })}</span>
                    <div className="flex-1 h-2 rounded-full bg-softBorder overflow-hidden">
                      <div
                        className="h-full bg-saffronGold rounded-full transition-all"
                        style={{ width: `${Math.min((summary.activeDaysCount / 7) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Expense Categories, Savings Progress, AI Models */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
            {/* SECTION: Expense Categories Chips */}
            {summary.categoryTotals.length > 0 && (
              <div>
                <h2 className="text-sm font-extrabold text-warmCocoa mb-2.5">
                  {t('dhan.expenseCategories')}
                </h2>
                <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                  {summary.categoryTotals.map((cat) => {
                    const isSelected = selectedExpenseCat === cat.category;
                    return (
                      <button
                        key={cat.category}
                        type="button"
                        onClick={() =>
                          setSelectedExpenseCat(isSelected ? null : cat.category)
                        }
                        className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition-all shadow-glass border whitespace-nowrap ${
                          isSelected
                            ? 'bg-terracotta text-white border-transparent'
                            : 'bg-cleanWhite text-earthyCharcoal border-softBorder hover:bg-warmCream/60'
                        }`}
                      >
                        <AppIcon name={cat.icon} size={15} className={isSelected ? 'text-saffronGold' : 'text-terracotta'} />
                        <span>{t(cat.categoryKey)}</span>
                        <span className={`font-semibold ${isSelected ? 'text-saffronGold' : 'text-textMuted'}`}>
                          ₹{formatInr(cat.amount)} ({cat.percentage}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EMERGENCY SAVINGS PROGRESS CARD */}
            <Card variant="success" className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-textMuted">
                  {t('dhan.savingsGoal')}
                </span>
                <p className="text-xl font-black text-warmCocoa mt-0.5">
                  {t('common.currency', { amount: formatInr(savingsSaved) })} / {t('common.currency', { amount: formatInr(savingsTarget) })}
                </p>
                <span className="text-xs font-bold text-success block mt-1">
                  {savingsPercent}% complete
                </span>
              </div>
              <div className="shrink-0 pl-3">
                <ProgressRing
                  progress={savingsPercent / 100}
                  size={56}
                  stroke={5}
                  color="#B34A26"
                  trackColor="#FDF3EE"
                />
              </div>
            </Card>

            {/* MODEL 2: AI INCOME FORECAST CARD */}
            <Card variant="accent" className="p-4 border border-[#E5953E]/40 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warmAmber/20 text-terracotta mt-0.5">
                  <AppIcon name="trending-up" size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-warmCocoa">
                      {t('dhan.expectedIncome')} (7-Day Horizon)
                    </span>
                    <span className="rounded-full bg-saffronGold/20 px-2 py-0.5 text-[10px] font-black text-warmCocoa border border-saffronGold/30">
                      Model 2 (RF Lag)
                    </span>
                  </div>
                  {model2Forecast ? (
                    <div className="mt-1">
                      <p className="text-lg font-black text-warmCocoa">
                        ₹{formatInr(model2Forecast.total_predicted_income)}
                        <span className="text-xs font-normal text-textMuted ml-1.5">
                          (~₹{formatInr(model2Forecast.average_daily_income)}/day)
                        </span>
                      </p>
                      <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1">
                        {model2Forecast.forecast.slice(0, 5).map((f) => (
                          <div
                            key={f.date}
                            className={`rounded-lg px-2 py-1 text-[10px] font-bold text-center shrink-0 border ${
                              f.is_weekend
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-black'
                                : 'bg-white/80 text-textSecondary border-stone-200'
                            }`}
                          >
                            <span className="block text-[9px] text-textMuted">{f.date.slice(5)}</span>
                            <span>₹{Math.round(f.predicted_income)}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                        ✓ 47.1% error reduction over baseline (MAE: ₹{model2Forecast.model_metrics.mae})
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-lg font-black text-warmCocoa">
                        ₹{formatInr(summary.forecastMin)} – ₹{formatInr(summary.forecastMax)}
                      </p>
                      <p className="text-[11px] text-textSecondary mt-0.5">
                        {t('dhan.projectionBasedOn', { count: summary.activeDaysCount })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* MODEL 3: AI ANOMALY DETECTION CARD */}
            <Card
              variant={(model3Anomalies && model3Anomalies.flagged_count > 0) || summary.hasAnomaly ? 'warning' : 'glass'}
              className="p-4 border border-[#E5953E]/30"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5 ${
                    (model3Anomalies && model3Anomalies.flagged_count > 0) || summary.hasAnomaly
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <AppIcon name="sparkles" size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-warmCocoa">
                      AI Transaction Anomaly Monitor
                    </h3>
                    <span className="text-[10px] font-mono text-textMuted">Model 3 (IsoForest)</span>
                  </div>
                  {model3Anomalies && model3Anomalies.flagged_count > 0 ? (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs font-bold text-rose-800">
                        ⚠️ {model3Anomalies.flagged_count} Unusual Transaction(s) Detected
                      </p>
                      <p className="text-[11px] text-rose-700">
                        {model3Anomalies.anomalies[0].reason}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-emerald-800">
                      ✓ All recent transactions conform to expected gig earning and spending patterns.
                    </p>
                  )}
                </div>
              </div>
            </Card>

          </div>
        </div>
      )}

      {/* Regulatory Disclaimer */}
      <div className="pt-2">
        <DisclaimerText text={t('dhan.disclaimer')} variant="warning" />
      </div>

      {/* TRANSACTION ENTRY & EDIT MODAL */}
      <TransactionModal
        isOpen={isAddModalOpen || !!editingTransaction}
        onClose={() => {
          closeAddModal();
          closeEditModal();
        }}
        initialType={modalDefaultType}
        initialDate={modalDefaultDate}
        editingTx={editingTransaction}
      />
    </div>
  );
}
