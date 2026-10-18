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
    modalDefaultDate,
    editingTransaction,
    closeEditModal,
  } = useTransactions();
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: getJobs });
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealthResources });
  const moneyQuery = useQuery({ queryKey: ['money'], queryFn: getMoneyOverview });

  const savingsTarget = profile.savingsGoal && profile.savingsGoal > 0 ? profile.savingsGoal : 5000;
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
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-lg font-black text-white shadow-glass ring-2 ring-white/80 transition-transform hover:scale-105 active:scale-95 overflow-hidden"
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
                className="inline-flex items-center gap-1 rounded-full bg-white/70 backdrop-blur-md border border-[#F4EBDD] px-2.5 py-0.5 text-[11px] font-bold text-deepEmerald hover:bg-white transition-all shadow-xs"
                title={t('profileScreen.editProfile')}
              >
                <AppIcon name="create-outline" size={11} className="text-primary" />
                <span>{t('profileScreen.editProfile')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 backdrop-blur-xl shadow-glass border border-[#F4EBDD] hover:bg-white text-deepEmerald transition-all active:scale-95"
            aria-label="Notifications"
          >
            <AppIcon name="sparkles" size={18} className="text-saffronGold" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-saffron ring-2 ring-white" />
          </button>
          {/* Language button */}
          <LanguageSelector variant="icon" />
        </div>
      </header>

      {/* RESPONSIVE DESKTOP/LAPTOP 2-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* LEFT COLUMN: Financial Snapshot, Fast Entry, 4 AI ML Models, Recommended Jobs */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
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
                <div className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-[#F1F8F3] px-2.5 py-1 text-[11px] font-bold text-success border border-[#2E7D32]/30 self-start">
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
                    color="#B34A26"
                    trackColor="#FDF3EE"
                  />
                </div>
              </Card>
            </div>

            {/* Today's Summary & Fast Income/Expense Entry */}
            <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-2xl p-4 shadow-glass border border-[#F4EBDD] space-y-3">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF4E8] text-terracotta border border-warmAmber/30 shadow-xs">
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
              <div className="grid grid-cols-2 gap-2.5 pt-1.5 border-t border-[#F4EBDD]">
                <button
                  type="button"
                  onClick={() => openAddModal('income')}
                  className="emerald-gradient-btn flex items-center justify-center gap-1.5 sm:gap-2 rounded-full py-2.5 px-2.5 sm:px-3 min-h-[44px] shadow-lifted hover:brightness-105 active:scale-95 transition-all group"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-black text-white">
                    +
                  </span>
                  <span className="truncate text-xs sm:text-sm font-black text-white tracking-tight">
                    {t('home.addIncome')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openAddModal('expense')}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-white/95 backdrop-blur-xl py-2.5 px-2.5 sm:px-3 min-h-[44px] shadow-glass hover:bg-white hover:shadow-glassHover active:scale-95 transition-all border border-rose-300/80 group"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100/90 text-xs font-black text-rose-700 border border-rose-200">
                    −
                  </span>
                  <span className="truncate text-xs sm:text-sm font-black text-black tracking-tight">
                    {t('home.addExpense')}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>



          {/* SECTION: Recommended For You (2 Job Cards) */}
          <section className="pt-1">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} compact />
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Voice Assistant, Haq Setu Protection, Nearby Health Support, Profile Strength */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* COMPACT VOICE ACTION PILL */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-white via-[#FDF8F0] to-white border border-[#F1B96B]/50 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-xs">
                  <AppIcon name="mic" size={18} className="text-white drop-shadow" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5953E] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E5953E]" />
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1E2B3E] truncate">
                    {t('home.addByVoice', 'Voice Assistant')}
                  </h3>
                  <p className="text-[11px] text-[#231F20]/70 truncate">
                    {t('home.addByVoiceHint', 'Tap to record income, expense or question')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVoiceModalVisible(true)}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#B34A26] to-[#7C2D16] hover:brightness-105 transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
                aria-label="Talk to Setu"
              >
                <AppIcon name="mic" size={13} />
                <span>Talk to Setu</span>
              </button>
            </div>
          </motion.div>

          {/* Haq Setu Compact Shortcut */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-[#FDF8F0] to-white border border-[#F4EBDD] p-3.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDF8F0] border border-[#F1B96B]/60 text-[#B34A26]">
                  <AppIcon name="shield-checkmark" size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1E2B3E] font-serif truncate">
                    Need help with a work problem?
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#231F20]/75 truncate">
                    Get help with account issues, payments and worker rights.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/haq')}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#B34A26] hover:bg-[#7C2D16] transition-all shadow-sm active:scale-95 flex items-center gap-1"
              >
                <span>Open Haq Setu</span>
                <AppIcon name="arrow-forward" size={13} />
              </button>
            </div>
          </motion.div>

          {/* SECTION: Nearby Health Support Card */}
          {nearby && (
            <section className="pt-1">
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
                className="flex items-center gap-3 p-3.5 cursor-pointer hover:border-[#E5953E]/60 mb-0"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EFF7F8] text-[#3A757D]">
                  <AppIcon name="medical" size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-deepEmerald truncate">
                    {nearby.nameKey ? t(nearby.nameKey) : nearby.name}
                  </h3>
                  <p className="text-xs text-textSecondary mt-0.5">
                    {nearby.distance} • {nearby.servicesKey ? t(nearby.servicesKey) : (nearby.services?.[0] || nearby.categoryLabel)}
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
              className="p-4 cursor-pointer mb-0"
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
                  <span className="rounded-full bg-warmAmber/20 border border-warmAmber/40 px-2 py-0.5 text-[10px] font-black text-terracotta">
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
                color="#B34A26"
                trackColor="#FDF3EE"
              />
            </Card>
          </section>
        </div>
      </div>

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
        initialDate={modalDefaultDate}
        editingTx={editingTransaction}
      />
    </div>
  );
}
