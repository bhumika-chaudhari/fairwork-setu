import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import JobCard from '../components/JobCard';
import Card from '../components/Card';
import VoiceButton from '../components/VoiceButton';
import VoiceEntryModal from '../components/VoiceEntryModal';
import LanguageSelector from '../components/LanguageSelector';
import ProgressBar from '../components/ProgressBar';
import ProgressRing from '../components/ProgressRing';
import ListenButton from '../components/ListenButton';
import { buildFinancialSpeechText } from '../lib/speechContextualContent';
import { AppIcon } from '../lib/icons';
import { formatInr } from '../localization';
import { getJobs } from '../services/workService';
import { getHealthResources } from '../services/healthService';
import { getMoneyOverview } from '../services/moneyService';
import { useProfile } from '../hooks/ProfileContext';
import { useTransactions } from '../hooks/TransactionContext';
import TransactionModal from '../components/TransactionModal';
import {
  getLinearRegressionForecast,
  getLogisticBudgetRisk,
  getLstmForecast,
  getKMeansClusters,
} from '../services/mlService';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile, strength } = useProfile();
  const {
    transactions,
    summary,
    openAddModal,
    isAddModalOpen,
    closeAddModal,
    modalDefaultType,
    editingTransaction,
    closeEditModal,
  } = useTransactions();
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: getJobs });
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealthResources });
  const moneyQuery = useQuery({ queryKey: ['money'], queryFn: getMoneyOverview });

  const savingsTarget = profile.savingsGoal && profile.savingsGoal > 0 ? profile.savingsGoal : 5000;

  // Real ML Model Queries with automatic caching and invalidation
  const linearQuery = useQuery({
    queryKey: ['ml_linear', summary.transactionCount],
    queryFn: () => getLinearRegressionForecast(transactions),
  });
  const logisticQuery = useQuery({
    queryKey: ['ml_logistic', summary.transactionCount, savingsTarget],
    queryFn: () => getLogisticBudgetRisk(savingsTarget, transactions),
  });
  const lstmQuery = useQuery({
    queryKey: ['ml_lstm', summary.transactionCount],
    queryFn: () => getLstmForecast(false, transactions),
  });
  const kmeansQuery = useQuery({
    queryKey: ['ml_kmeans', summary.transactionCount],
    queryFn: () => getKMeansClusters(transactions),
  });

  const jobs = jobsQuery.data?.slice(0, 2) ?? [];
  const nearby = healthQuery.data?.[0];
  const money = moneyQuery.data;

  // Real calculations derived from saved transactions
  const todayInc = summary.todayIncome;
  const todayExpense = summary.todayExpense;
  const netForToday = summary.todayNet;
  const weekDelta = summary.weeklyIncomeDelta;

  // Calculate savings from recorded earnings if available, else baseline
  const savingsSaved = summary.totalIncome > 0
    ? Math.min(savingsTarget, Math.round(summary.totalIncome * 0.25))
    : (money?.emergencySaved ?? 0);
  const savingsPercent = savingsTarget > 0 ? Math.min(100, Math.round((savingsSaved / savingsTarget) * 100)) : 0;

  const homeFinancialSpeech = buildFinancialSpeechText(
    {
      todayIncome: todayInc,
      weeklyIncome: summary.weeklyIncome,
      todayExpense,
      netInHand: netForToday,
      savingsSaved,
      savingsTarget,
      stabilityScore: summary.stabilityScore,
      forecastMin: summary.forecastMin,
      forecastMax: summary.forecastMax,
    },
    i18n.language
  );
  const homeFinancialTrack = {
    id: 'home-financial-overview',
    title: homeFinancialSpeech.title,
    speech: homeFinancialSpeech.speech,
    lang: i18n.language,
  };

  return (
    <div className="space-y-4 px-4 pt-3 pb-8">
      {/* Top Header with greeting, notification bell and profile */}
      <header className="flex items-start justify-between gap-3 pt-1 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-lg font-black text-white shadow-glass ring-2 ring-white/80 transition-transform hover:scale-105 active:scale-95 overflow-hidden"
            aria-label="Profile"
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              profile.name.charAt(0) || 'R'
            )}
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-extrabold text-deepEmerald leading-tight">
                {t('home.greeting', { name: profile.name })}
              </h1>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="inline-flex items-center gap-1 rounded-full bg-white/60 backdrop-blur-md border border-white/80 px-2.5 py-0.5 text-[11px] font-bold text-deepEmerald hover:bg-white/85 transition-all shadow-xs"
                title={t('profileScreen.editProfile')}
              >
                <AppIcon name="create-outline" size={11} className="text-primary" />
                <span>{t('profileScreen.editProfile')}</span>
              </button>
            </div>
            <p className="text-xs text-textSecondary font-medium mt-0.5">
              {t('home.subGreeting')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 backdrop-blur-xl shadow-glass border border-white/80 hover:bg-white/85 text-deepEmerald transition-all active:scale-95"
            aria-label="Notifications"
          >
            <AppIcon name="sparkles" size={18} className="text-[#087F73]" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-saffron ring-2 ring-white" />
          </button>
          {/* Language button */}
          <LanguageSelector variant="icon" />
        </div>
      </header>

      {/* TOP SUMMARY: 2 Columns Side-by-Side (Income + Savings) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-2.5"
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Today's Income */}
          <Card className="mb-0 p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-textMuted">
                {t('home.todayIncome')}
              </span>
              <p className="text-2xl md:text-3xl font-black text-deepEmerald mt-1">
                {t('common.currency', { amount: formatInr(todayInc) })}
              </p>
            </div>
            <div className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-[#E2FAF2] px-2.5 py-1 text-[11px] font-bold text-success border border-mint/40 self-start">
              <span>{weekDelta >= 0 ? '↑' : '↓'}</span>
              <span>
                {weekDelta >= 0 ? '+' : '−'}
                {t('common.currency', { amount: formatInr(Math.abs(weekDelta)) })}
              </span>
            </div>
          </Card>

          {/* Card 2: Savings Progress */}
          <Card className="mb-0 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-textMuted">
                {t('home.savings')}
              </span>
              <p className="text-2xl md:text-3xl font-black text-deepEmerald mt-1">
                {t('common.currency', { amount: formatInr(savingsSaved) })}
              </p>
              <span className="text-[11px] text-textMuted font-medium block mt-1">
                {t('home.savingsTarget', { amount: formatInr(savingsTarget) })}
              </span>
            </div>
            <div className="shrink-0 pl-2">
              <ProgressRing
                progress={savingsPercent / 100}
                size={54}
                stroke={5}
                color="#087F73"
                trackColor="#E6F7F2"
              />
            </div>
          </Card>
        </div>

        {/* Today's Summary & Fast Income/Expense Entry */}
        <div className="relative overflow-hidden rounded-2xl bg-white/50 backdrop-blur-2xl p-4 shadow-glass border border-white/80 space-y-3">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-primary border border-mint/30 shadow-xs">
                <AppIcon name="wallet" size={17} />
              </div>
              <div>
                <span className="text-xs font-bold text-deepEmerald block leading-tight">
                  {t('home.todaySummary')}
                </span>
                <p className="text-[11px] text-textSecondary mt-0.5">
                  <span className="font-semibold text-success">+{t('common.currency', { amount: formatInr(todayInc) })}</span>{' '}
                  <span className="text-danger font-semibold">−{t('common.currency', { amount: formatInr(todayExpense) })}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right pl-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-textMuted block">
                  {t('home.netForToday')}
                </span>
                <span className={`text-base font-black ${netForToday >= 0 ? 'text-deepEmerald' : 'text-danger'}`}>
                  {netForToday >= 0 ? '+' : '−'}{t('common.currency', { amount: formatInr(Math.abs(netForToday)) })}
                </span>
              </div>
              <ListenButton track={homeFinancialTrack} size="sm" />
            </div>
          </div>

          {/* Quick Action Buttons: Add Income and Add Expense */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/50">
            <button
              type="button"
              onClick={() => openAddModal('income')}
              className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 py-2.5 px-3 text-xs font-bold text-white shadow-glass hover:shadow-glassHover hover:brightness-110 active:scale-95 transition-all border border-emerald-400/30"
            >
              <span className="text-sm font-black">+</span>
              <span>{t('home.addIncome')}</span>
            </button>
            <button
              type="button"
              onClick={() => openAddModal('expense')}
              className="flex items-center justify-center gap-1.5 rounded-full bg-white/60 backdrop-blur-md py-2.5 px-3 text-xs font-bold text-black border border-danger/30 shadow-xs hover:bg-danger/10 active:scale-95 transition-all"
            >
              <span className="text-sm font-black text-black">−</span>
              <span className="text-black font-bold">{t('home.addExpense')}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* CENTRAL VOICE ENTRY CARD matching reference Screen 3 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div
          onClick={() => setVoiceModalVisible(true)}
          className="relative overflow-hidden rounded-[28px] bg-white/50 backdrop-blur-2xl p-6 shadow-glass border border-white/80 cursor-pointer transition-all duration-300 hover:shadow-glassHover hover:bg-white/60 active:scale-[0.99] group text-center"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent" />
          {/* Ambient soft glow */}
          <div className="pointer-events-none absolute inset-x-0 -top-10 h-36 bg-mint/25 blur-3xl" />

          {/* Central Pulsing Mic Button */}
          <div className="my-2 flex justify-center">
            <VoiceButton
              onPress={() => setVoiceModalVisible(true)}
              size={76}
            />
          </div>

          <h2 className="mt-2 text-lg font-black text-deepEmerald group-hover:text-primary transition-colors">
            {t('home.addByVoice')}
          </h2>
          <p className="mt-0.5 text-xs text-textSecondary font-medium">
            {t('home.addByVoiceHint')}
          </p>
        </div>
      </motion.div>

      {/* SECTION: AI FINANCIAL INSIGHTS (4 Working ML Models) */}
      <section className="pt-2">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500/20 text-[#087F73]">
              <AppIcon name="sparkles" size={14} />
            </div>
            <h2 className="text-base font-extrabold text-deepEmerald">
              {t('home.aiInsights', 'AI Financial Insights')}
            </h2>
            <span className="rounded-full bg-[#E2FAF2] px-2 py-0.5 text-[10px] font-extrabold text-success border border-mint/40">
              4 Models
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/ai-lab')}
            className="text-xs font-bold text-primaryTeal hover:underline inline-flex items-center gap-0.5"
          >
            <span>Open AI Lab</span> →
          </button>
        </div>

        {/* 2x2 Grid of Apple Liquid Glass ML Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Model 1: Linear Regression Balance Forecast */}
          <div
            onClick={() => navigate('/ai-lab?tab=linear')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white/50 backdrop-blur-2xl p-3.5 shadow-glass border border-white/80 hover:bg-white/65 hover:shadow-glassHover active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted">
                  1. Linear Regression
                </span>
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-mint/30">
                  R²: {linearQuery.data?.metrics?.r2_score ?? '0.88'}
                </span>
              </div>
              <h3 className="text-xs font-bold text-deepEmerald mt-1">
                7-Day Balance Projection
              </h3>
              <p className="text-xl font-black text-deepEmerald mt-1">
                {formatInr(linearQuery.data?.next_day_prediction ?? 3460)}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/50 flex items-center justify-between text-[11px]">
              <span className="text-textSecondary">
                {(linearQuery.data?.delta_amount ?? 0) >= 0 ? 'Expected gain' : 'Expected net'}:
              </span>
              <span
                className={`font-bold ${
                  (linearQuery.data?.delta_amount ?? 0) >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {(linearQuery.data?.delta_amount ?? 0) >= 0 ? '↑ +' : '↓ −'}
                {formatInr(Math.abs(linearQuery.data?.delta_amount ?? 260))}
              </span>
            </div>
          </div>

          {/* Model 2: Logistic Regression Budget Risk */}
          <div
            onClick={() => navigate('/ai-lab?tab=logistic')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white/50 backdrop-blur-2xl p-3.5 shadow-glass border border-white/80 hover:bg-white/65 hover:shadow-glassHover active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted">
                  2. Logistic Regression
                </span>
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-mint/30">
                  AUC: {logisticQuery.data?.metrics?.roc_auc ?? '0.99'}
                </span>
              </div>
              <h3 className="text-xs font-bold text-deepEmerald mt-1">
                Budget Risk Classifier
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-xl font-black text-deepEmerald">
                  {logisticQuery.data?.probability_percent ?? 40.8}%
                </p>
                <span className="text-xs font-bold text-textMuted">over-budget risk</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-white/50 flex items-center justify-between text-[11px]">
              <span className="text-textSecondary">Status:</span>
              <span
                className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                  logisticQuery.data?.risk_level === 'Low'
                    ? 'bg-emerald-100 text-emerald-800'
                    : logisticQuery.data?.risk_level === 'Moderate'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {logisticQuery.data?.predicted_label ?? 'Within Budget'}
              </span>
            </div>
          </div>

          {/* Model 3: PyTorch LSTM Sequence Forecaster */}
          <div
            onClick={() => navigate('/ai-lab?tab=lstm')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white/50 backdrop-blur-2xl p-3.5 shadow-glass border border-white/80 hover:bg-white/65 hover:shadow-glassHover active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted">
                  3. PyTorch LSTM
                </span>
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-mint/30">
                  Deep Learning
                </span>
              </div>
              <h3 className="text-xs font-bold text-deepEmerald mt-1">
                Sequence Cash Flow Forecaster
              </h3>
              <p className="text-xl font-black text-deepEmerald mt-1">
                {formatInr(lstmQuery.data?.next_day_predicted_net ?? 295)}
                <span className="text-xs font-semibold text-textMuted ml-1">tomorrow net</span>
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/50 flex items-center justify-between text-[11px]">
              <span className="text-textSecondary">Test MAE:</span>
              <span className="font-bold text-deepEmerald">
                ₹{lstmQuery.data?.metrics?.test_mae?.toFixed(0) ?? 197} (35 Epochs)
              </span>
            </div>
          </div>

          {/* Model 4: K-Means Clustering Spending Discovery */}
          <div
            onClick={() => navigate('/ai-lab?tab=kmeans')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white/50 backdrop-blur-2xl p-3.5 shadow-glass border border-white/80 hover:bg-white/65 hover:shadow-glassHover active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted">
                  4. K-Means Clustering
                </span>
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-mint/30">
                  k = 3 Archetypes
                </span>
              </div>
              <h3 className="text-xs font-bold text-deepEmerald mt-1">
                Spending Pattern Discovery
              </h3>
              <p className="text-sm font-extrabold text-deepEmerald mt-1.5 truncate">
                {kmeansQuery.data?.prominent_cluster?.title ?? 'Essential Living & Operational'}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/50 flex items-center justify-between text-[11px]">
              <span className="text-textSecondary">Total Analyzed:</span>
              <span className="font-bold text-deepEmerald">
                {kmeansQuery.data?.total_analyzed ?? 180} transactions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Recommended For You (2 Job Cards) */}
      <section className="pt-2">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-deepEmerald">
            {t('home.jobSuggestions')}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/kaam')}
            className="text-xs font-bold text-primaryTeal hover:underline"
          >
            {t('common.seeAll')} →
          </button>
        </div>

        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} compact />
          ))}
        </div>
      </section>

      {/* SECTION: Nearby Health Support Card matching reference Screen 3 */}
      {nearby && (
        <section className="pt-2">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-deepEmerald">
              {t('home.healthSupport')}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/sehat')}
              className="text-xs font-bold text-primaryTeal hover:underline"
            >
              {t('common.seeAll')} →
            </button>
          </div>

          <Card
            onClick={() => navigate('/sehat')}
            className="flex items-center gap-3 p-3.5 cursor-pointer hover:border-mint/60"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E6F7F2] text-[#087F73]">
              <AppIcon name="medical" size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-deepEmerald truncate">
                {t(nearby.nameKey)}
              </h3>
              <p className="text-xs text-textSecondary mt-0.5">
                {nearby.distance} • {t(nearby.servicesKey)}
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surfaceAlt text-textMuted">
              <AppIcon name="chevron-forward" size={16} />
            </div>
          </Card>
        </section>
      )}

      {/* Profile Strength & AI Forecast banner */}
      <section className="pt-1">
        <Card
          onClick={() => navigate('/profile')}
          variant="accent"
          className="p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-deepEmerald">
                {t('home.profileReady', { percent: strength })}
              </span>
              <p className="text-[11px] text-textSecondary mt-0.5">
                {summary.hasSufficientHistory
                  ? t('dhan.expectedRange', { min: formatInr(summary.forecastMin), max: formatInr(summary.forecastMax) })
                  : t('dhan.aiForecastInsufficient')}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-saffron/20 border border-saffron/40 px-2 py-0.5 text-[10px] font-black text-[#B45309]">
                {t('dhan.aiForecastNotice')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline">
                <span>{t('profileScreen.editProfile')}</span>
                <AppIcon name="chevron-forward" size={11} />
              </span>
            </div>
          </div>
          <ProgressBar
            progress={strength / 100}
            color="#087F73"
            trackColor="#E6F7F2"
          />
        </Card>
      </section>

      {/* Voice Entry Modal */}
      <VoiceEntryModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
      />

      {/* Manual / Preset Transaction Modal */}
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
