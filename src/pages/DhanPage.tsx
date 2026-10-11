import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
    editingTransaction,
    openEditModal,
    closeEditModal,
    deleteTransaction,
    clearTransactions,
    loadSampleData,
  } = useTransactions();

  const [selectedExpenseCat, setSelectedExpenseCat] = useState<string | null>(null);

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

  return (
    <div className="space-y-4 px-4 pt-3 pb-8">
      {/* Header */}
      <header className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#073B3A] to-[#087F73] text-white font-black text-base shadow-sm">
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
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-3 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
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
            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-amber-900 border border-amber-400 shadow-xs hover:bg-amber-100 transition-colors"
          >
            {t('dhan.clearSampleData')}
          </button>
        </div>
      )}

      {/* EMPTY DATA DEV HELPER: Load sample data or start fresh */}
      {!summary.isSampleData && transactions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-mint/60 bg-surfaceAlt/60 p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppIcon name="receipt-outline" size={16} className="text-primary shrink-0" />
            <span className="text-xs text-textSecondary font-medium">
              {t('dhan.sampleDataPrompt')}
            </span>
          </div>
          <button
            type="button"
            onClick={loadSampleData}
            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-deepEmerald border border-border/80 hover:bg-mint/10 transition-colors shrink-0 shadow-xs"
          >
            {t('dhan.loadSampleData')}
          </button>
        </div>
      )}

      {/* PRIMARY ACTIONS: Add Income & Add Expense */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => openAddModal('income')}
          className="emerald-gradient-btn flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs font-black text-white shadow-clay hover:brightness-105 active:scale-95 transition-all"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-sm font-black">
            +
          </span>
          <span>{t('transactions.addIncome')}</span>
        </button>
        <button
          type="button"
          onClick={() => openAddModal('expense')}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 px-4 text-xs font-black text-danger border border-danger/40 shadow-glass hover:bg-danger/5 active:scale-95 transition-all"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger/10 text-sm font-black">
            −
          </span>
          <span>{t('transactions.addExpense')}</span>
        </button>
      </div>

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
          <p className="text-2xl md:text-3xl font-black text-deepEmerald mt-1">
            {t('common.currency', { amount: formatInr(summary.weeklyIncome) })}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#E2FAF2] px-2.5 py-0.5 text-[11px] font-bold text-success border border-mint/40">
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
          <p className="text-2xl md:text-3xl font-black text-deepEmerald mt-1">
            {t('common.currency', { amount: formatInr(summary.avgDailyIncome) })}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primarySoft px-2.5 py-0.5 text-[11px] font-bold text-primary border border-mint/30">
            <span>•</span>
            <span>{t('dhan.basedOn7Days')}</span>
          </div>
        </Card>
      </motion.div>

      {/* NET FOR PERIOD SUMMARY BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/95 via-[rgba(244,253,250,0.90)] to-[rgba(114,229,194,0.18)] p-3.5 shadow-glass border border-[rgba(8,127,115,0.18)] flex items-center justify-between">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primarySoft text-primary shadow-xs">
            <AppIcon name="wallet" size={17} />
          </div>
          <div>
            <span className="text-xs font-bold text-deepEmerald block leading-tight">
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
          <span className={`text-base font-black ${summary.netForPeriod >= 0 ? 'text-deepEmerald' : 'text-danger'}`}>
            {summary.netForPeriod >= 0 ? '+' : '−'}{t('common.currency', { amount: formatInr(Math.abs(summary.netForPeriod)) })}
          </span>
        </div>
      </div>

      {/* 7-DAY INCOME & EXPENSE CHART */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-deepEmerald">
            {t('dhan.last7Days')}
          </h2>
          <span className="text-xs font-semibold text-textMuted">{t('dhan.monSun')}</span>
        </div>
        <IncomeChart days={summary.dailyBreakdown} />
      </Card>

      {/* SECTION: Expense Categories Chips */}
      {summary.categoryTotals.length > 0 && (
        <div>
          <h2 className="text-sm font-extrabold text-deepEmerald mb-2.5">
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
                      ? 'bg-deepEmerald text-white border-transparent'
                      : 'bg-gradient-to-br from-white/95 via-[rgba(244,253,250,0.88)] to-[rgba(114,229,194,0.14)] text-textPrimary border-[rgba(8,127,115,0.16)] hover:bg-white'
                  }`}
                >
                  <AppIcon name={cat.icon} size={15} className={isSelected ? 'text-mint' : 'text-primary'} />
                  <span>{t(cat.categoryKey)}</span>
                  <span className={`font-semibold ${isSelected ? 'text-mint' : 'text-textMuted'}`}>
                    ₹{formatInr(cat.amount)} ({cat.percentage}%)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* REAL TRANSACTION HISTORY COMPONENT */}
      <TransactionHistory
        transactions={transactions}
        onEdit={openEditModal}
        onDelete={deleteTransaction}
        onAddIncome={() => openAddModal('income')}
        onAddExpense={() => openAddModal('expense')}
      />

      {/* EMERGENCY SAVINGS PROGRESS CARD */}
      <Card variant="success" className="p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-textMuted">
            {t('dhan.savingsGoal')}
          </span>
          <p className="text-xl font-black text-deepEmerald mt-0.5">
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
            color="#087F73"
            trackColor="#E0F8F0"
          />
        </div>
      </Card>

      {/* HONEST AI INCOME ESTIMATE CARD */}
      <Card variant="accent" className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accentSoft text-[#D97706] mt-0.5">
            <AppIcon name="trending-up" size={22} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-deepEmerald">
                {t('dhan.expectedIncome')}
              </span>
              <span className="rounded-full bg-saffron/20 px-2 py-0.5 text-[10px] font-black text-[#B45309]">
                {t('dhan.aiModel')}
              </span>
            </div>
            {summary.hasSufficientHistory ? (
              <div className="mt-1">
                <p className="text-lg font-black text-deepEmerald">
                  ₹{formatInr(summary.forecastMin)} – ₹{formatInr(summary.forecastMax)}
                </p>
                <p className="text-[11px] text-textSecondary mt-0.5">
                  {t('dhan.projectionBasedOn', { count: summary.activeDaysCount })}
                </p>
              </div>
            ) : (
              <div className="mt-1.5 space-y-1.5">
                <p className="text-xs text-textSecondary leading-relaxed">
                  {t('dhan.aiForecastInsufficient')}
                </p>
                <div className="flex items-center gap-2 text-[11px] font-bold text-textMuted">
                  <span>{t('dhan.forecastProgress', { count: summary.activeDaysCount })}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min((summary.activeDaysCount / 5) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* HONEST AI ANOMALY DETECTION CARD */}
      <Card variant={summary.hasAnomaly ? 'warning' : 'glass'} className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5 ${
              summary.hasAnomaly ? 'bg-saffron/20 text-[#D97706]' : 'bg-primarySoft text-primary'
            }`}
          >
            <AppIcon name="sparkles" size={18} />
          </div>
          <div className="flex-1">
            <h3
              className={`text-xs font-bold uppercase tracking-wide ${
                summary.hasAnomaly ? 'text-[#92400E]' : 'text-deepEmerald'
              }`}
            >
              {t('dhan.aiSpendingAnalysis')}
            </h3>
            <p className="mt-1 text-xs text-textPrimary leading-relaxed">
              {summary.hasAnomaly
                ? t(summary.anomalyDescriptionKey || 'dhan.anomalyAlert')
                : t('dhan.noSpikesDetected')}
            </p>
            {summary.hasAnomaly && (
              <button
                type="button"
                onClick={() => setSelectedExpenseCat('travel_fuel')}
                className="mt-2 text-xs font-bold text-[#B45309] hover:underline"
              >
                {t('dhan.reviewDeductions')} →
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* HONEST FINANCIAL STABILITY SCORE GAUGE CARD */}
      <Card variant="emerald" className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-extrabold text-deepEmerald">
              {t('dhan.stabilityScore')}
            </h3>
            <p className="text-xs text-textMuted mt-0.5">
              {t('dhan.stabilityHint')}
            </p>
          </div>
          {summary.hasSufficientStabilityHistory ? (
            <div className="text-right">
              <span className="text-2xl font-black text-deepEmerald">{summary.stabilityScore}</span>
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
          <div className="mt-3 h-2.5 w-full rounded-full bg-primarySoft overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#72E5C2] to-[#087F73] transition-all duration-500"
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
              <div className="flex-1 h-2 rounded-full bg-surfaceAlt overflow-hidden">
                <div
                  className="h-full bg-mint rounded-full transition-all"
                  style={{ width: `${Math.min((summary.activeDaysCount / 7) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Regulatory Disclaimer */}
        <div className="mt-3.5 pt-3 border-t border-border/50">
          <DisclaimerText text={t('dhan.disclaimer')} variant="warning" />
        </div>
      </Card>

      {/* TRANSACTION ENTRY & EDIT MODAL */}
      <TransactionModal
        isOpen={isAddModalOpen || !!editingTransaction}
        onClose={() => {
          closeAddModal();
          closeEditModal();
        }}
        initialType={modalDefaultType}
        editingTx={editingTransaction}
      />
    </div>
  );
}
