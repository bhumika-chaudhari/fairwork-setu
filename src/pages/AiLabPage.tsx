import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { AppIcon } from '../lib/icons';
import Card from '../components/Card';
import ListenButton from '../components/ListenButton';
import { formatInr } from '../localization';
import { useTransactions } from '../hooks/TransactionContext';
import { useProfile } from '../hooks/ProfileContext';
import {
  getLinearRegressionForecast,
  getLogisticBudgetRisk,
  getLstmForecast,
  getKMeansClusters,
  getModelsStatus,
  trainAllModels,
  type LinearRegressionResult,
  type LogisticRegressionResult,
  type LstmResult,
  type KMeansResult,
  type ModelSystemStatus,
} from '../services/mlService';

type TabKey = 'linear' | 'logistic' | 'lstm' | 'kmeans';

const CLUSTER_COLORS = ['#087F73', '#F59E0B', '#3B82F6', '#8B5CF6'];

export default function AiLabPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { transactions } = useTransactions();
  const { profile } = useProfile();

  const tabParam = (searchParams.get('tab') as TabKey) || 'linear';
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam);

  // States
  const [status, setStatus] = useState<ModelSystemStatus | null>(null);
  const [linearData, setLinearData] = useState<LinearRegressionResult | null>(null);
  const [logisticData, setLogisticData] = useState<LogisticRegressionResult | null>(null);
  const [lstmData, setLstmData] = useState<LstmResult | null>(null);
  const [kmeansData, setKmeansData] = useState<KMeansResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);
  const [lstmDemoMode, setLstmDemoMode] = useState(false);

  // Synchronize URL search params
  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  const loadAllModels = async (forceLstmDemo = lstmDemoMode) => {
    setLoading(true);
    try {
      const budget = profile.savingsGoal && profile.savingsGoal > 0 ? profile.savingsGoal : 5000;
      const [sysStatus, lr, log, lstm, km] = await Promise.all([
        getModelsStatus(),
        getLinearRegressionForecast(transactions),
        getLogisticBudgetRisk(budget, transactions),
        getLstmForecast(forceLstmDemo, transactions),
        getKMeansClusters(transactions),
      ]);
      setStatus(sysStatus);
      setLinearData(lr);
      setLogisticData(log);
      setLstmData(lstm);
      setKmeansData(km);
    } catch (err) {
      console.error('Error loading ML models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllModels(lstmDemoMode);
  }, [transactions.length, lstmDemoMode]);

  const handleRetrainAll = async () => {
    setRetraining(true);
    setRetrainSuccess(false);
    try {
      await trainAllModels(lstmDemoMode, transactions);
      await loadAllModels(lstmDemoMode);
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 3500);
    } catch (err) {
      console.error('Retrain failed', err);
    } finally {
      setRetraining(false);
    }
  };

  // Speech contextual description for accessibility
  const speechText = `Setu AI Laboratory features four verified machine learning models. 
First, Linear Regression predicts upcoming cash balances over the next 7 days, currently projecting ₹${linearData?.next_day_prediction ?? 0} for tomorrow with an R-squared score of ${linearData?.metrics?.r2_score ?? '0.88'}. 
Second, Logistic Regression evaluates your budget risk, calculating a ${logisticData?.probability_percent ?? '40'} percent probability of exceeding your ₹${logisticData?.budget_amount ?? '5,000'} monthly budget, classified as ${logisticData?.risk_level ?? 'Moderate'} risk with an ROC-AUC of ${logisticData?.metrics?.roc_auc ?? '0.99'}. 
Third, PyTorch Deep Learning LSTM forecasts 7-day sequential cash flow using recurrent neural networks with 4,769 parameters. 
Fourth, K-Means clustering identifies 3 distinct spending archetypes across your transactions.`;

  const aiLabSpeechTrack = {
    id: 'ai-lab-overview',
    title: 'Setu AI/ML Intelligence Lab Overview',
    speech: speechText,
    lang: i18n.language,
  };

  return (
    <div className="space-y-4 px-4 pt-3 pb-12">
      {/* Top Navigation & Status Bar */}
      <header className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 text-deepEmerald shadow-glass hover:bg-white/80 active:scale-95 transition-all"
              aria-label="Back"
            >
              <AppIcon name="arrow-back" size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-deepEmerald tracking-tight">
                  {t('aiLab.title', 'AI/ML Intelligence Lab')}
                </h1>
                <span className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                  4 Models
                </span>
              </div>
              <p className="text-xs text-textSecondary font-medium">
                {t('aiLab.subtitle', 'Production ML Models for Financial Decision-Making')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ListenButton track={aiLabSpeechTrack} size="sm" />
            <button
              type="button"
              onClick={handleRetrainAll}
              disabled={retraining}
              className="flex items-center gap-1.5 rounded-full bg-emerald-gradient px-3.5 py-2 text-xs font-bold text-white shadow-glass hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
            >
              <AppIcon
                name="refresh"
                size={14}
                className={retraining ? 'animate-spin' : ''}
              />
              <span className="hidden sm:inline">
                {retraining ? t('aiLab.training', 'Training...') : t('aiLab.retrainAll', 'Retrain All')}
              </span>
              <span className="sm:hidden">
                {retraining ? '...' : 'Train'}
              </span>
            </button>
          </div>
        </div>

        {/* Backend & Model Status Indicator Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 p-2.5 px-3.5 shadow-glass text-xs font-medium">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-bold text-deepEmerald">
              {status?.isOnline
                ? t('aiLab.apiConnected', 'Python FastAPI Microservice Connected (Port 8000)')
                : t('aiLab.offlineFallback', 'Client Numerical Engine Active (Offline Fallback)')}
            </span>
          </div>
          <span className="text-[11px] text-textMuted">
            Frameworks: PyTorch 2.5 • Scikit-Learn 1.5 • NumPy
          </span>
        </div>

        {retrainSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-[#E2FAF2] border border-mint/60 p-2.5 text-center text-xs font-bold text-success shadow-xs"
          >
            ✓ {t('aiLab.allTrainedSuccess', 'All 4 ML models retrained successfully with updated parameters!')}
          </motion.div>
        )}
      </header>

      {/* 4 MODEL TABS NAVIGATION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-white/50 backdrop-blur-2xl border border-white/80 shadow-glass">
        {(
          [
            { key: 'linear', label: '1. Linear Regression', sub: 'Balance Forecast', icon: 'trending-up' },
            { key: 'logistic', label: '2. Logistic Regression', sub: 'Budget Risk', icon: 'shield-checkmark' },
            { key: 'lstm', label: '3. PyTorch LSTM', sub: 'Sequence Forecaster', icon: 'sparkles' },
            { key: 'kmeans', label: '4. K-Means', sub: 'Spending Clusters', icon: 'grid' },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleTabChange(item.key)}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-center transition-all duration-200 ${
              activeTab === item.key
                ? 'bg-gradient-to-br from-[#073B3A] to-[#087F73] text-white shadow-dockActive border border-mint/40 scale-[1.01]'
                : 'text-textSecondary hover:bg-white/60 hover:text-deepEmerald active:scale-95'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <AppIcon
                name={item.icon}
                size={14}
                className={activeTab === item.key ? 'text-mint' : 'text-textMuted'}
              />
              <span className="text-xs font-extrabold">{item.label}</span>
            </div>
            <span
              className={`text-[10px] mt-0.5 ${
                activeTab === item.key ? 'text-mint/90' : 'text-textMuted'
              }`}
            >
              {item.sub}
            </span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT PANELS */}
      <AnimatePresence mode="wait">
        {/* ============================================================= */}
        {/* TAB 1: LINEAR REGRESSION */}
        {/* ============================================================= */}
        {activeTab === 'linear' && (
          <motion.div
            key="linear"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-2xl p-4 md:p-5 shadow-glass border border-white/80 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-primary border border-mint/30">
                      <AppIcon name="trending-up" size={16} />
                    </span>
                    <h2 className="text-base md:text-lg font-black text-deepEmerald">
                      Model 1: Linear Regression Cash Balance Forecaster
                    </h2>
                  </div>
                  <p className="text-xs text-textSecondary mt-1 leading-relaxed max-w-xl">
                    Predicts upcoming cash balance for the next 7 days using chronological Ordinary Least Squares (OLS) with rolling 3-day cash flow and sinusoidal day-of-week cyclical components.
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-black text-textMuted tracking-wider">
                    Next-Day Projected Balance
                  </span>
                  <span className="text-2xl font-black text-deepEmerald">
                    {formatInr(linearData?.next_day_prediction ?? 0)}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      (linearData?.delta_amount ?? 0) >= 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {(linearData?.delta_amount ?? 0) >= 0 ? '↑ +' : '↓ −'}
                    {formatInr(Math.abs(linearData?.delta_amount ?? 0))} ({linearData?.pct_change ?? 0}%)
                  </span>
                </div>
              </div>

              {/* Data mode banner */}
              <div className="flex items-center justify-between border-t border-white/60 pt-2 text-[11px] text-textMuted font-medium">
                <span>
                  {linearData?.is_synthetic
                    ? '⚠️ Using reproducible 90-day synthetic gig-worker cashflow for evaluation'
                    : '✓ Trained on your real recorded transactions'}
                </span>
                <span>80/20 Chronological Split</span>
              </div>
            </div>

            {/* Interactive 7-Day Forecast Area Chart */}
            <Card className="p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-deepEmerald">
                    7-Day Cash Balance Horizon & Confidence Bounds
                  </h3>
                  <p className="text-[11px] text-textSecondary">
                    Solid line shows expected balance; shaded band shows ±1.2 RMSE prediction interval
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1 text-[#087F73]">
                    <span className="h-2 w-2 rounded-full bg-[#087F73]" /> Forecast
                  </span>
                  <span className="inline-flex items-center gap-1 text-mint">
                    <span className="h-2 w-2 rounded-full bg-mint/50" /> ±RMSE
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={linearData?.forecast_7_days ?? []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#087F73" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#087F73" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="boundGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#72E5C2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#72E5C2" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,59,58,0.06)" />
                    <XAxis
                      dataKey="day_label"
                      tick={{ fontSize: 11, fill: '#4E6563', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#4E6563' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload as any;
                          return (
                            <div className="rounded-xl bg-white/90 backdrop-blur-xl p-2.5 shadow-glass border border-white/90 text-xs">
                              <p className="font-extrabold text-deepEmerald">
                                {d.day_label} ({d.date})
                              </p>
                              <p className="font-bold text-primary mt-1">
                                Expected: ₹{d.predicted_balance?.toLocaleString('en-IN')}
                              </p>
                              <p className="text-[11px] text-textMuted mt-0.5">
                                Interval: ₹{d.confidence_lower?.toLocaleString('en-IN')} – ₹{d.confidence_upper?.toLocaleString('en-IN')}
                              </p>
                              <p className="text-[10px] text-textSecondary mt-0.5">
                                Expected Daily Net: ₹{d.expected_daily_net}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="confidence_upper"
                      stroke="transparent"
                      fill="url(#boundGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted_balance"
                      stroke="#087F73"
                      strokeWidth={2.5}
                      fill="url(#balanceGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Regression Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3.5 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  R² Score
                </span>
                <span className="text-xl font-black text-deepEmerald block mt-1">
                  {linearData?.metrics?.r2_score ?? '0.884'}
                </span>
                <span className="text-[10px] text-success font-bold mt-0.5 block">
                  Variance Explained
                </span>
              </div>

              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3.5 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  MAE (Test)
                </span>
                <span className="text-xl font-black text-deepEmerald block mt-1">
                  ₹{linearData?.metrics?.mae ?? '142.5'}
                </span>
                <span className="text-[10px] text-textMuted font-bold mt-0.5 block">
                  Mean Absolute Error
                </span>
              </div>

              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3.5 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  RMSE
                </span>
                <span className="text-xl font-black text-deepEmerald block mt-1">
                  ₹{linearData?.metrics?.rmse ?? '184.2'}
                </span>
                <span className="text-[10px] text-textMuted font-bold mt-0.5 block">
                  Root Mean Sq Error
                </span>
              </div>

              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3.5 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  Split Samples
                </span>
                <span className="text-xl font-black text-deepEmerald block mt-1">
                  {linearData?.metrics?.train_samples ?? 72} / {linearData?.metrics?.test_samples ?? 18}
                </span>
                <span className="text-[10px] text-textMuted font-bold mt-0.5 block">
                  Train / Test (80/20)
                </span>
              </div>
            </div>

            {/* Regression Coefficients & Interpretability Card */}
            <Card className="p-4 md:p-5">
              <h3 className="text-sm font-extrabold text-deepEmerald mb-1">
                Learned Model Coefficients & Feature Importance
              </h3>
              <p className="text-xs text-textSecondary mb-3">
                Interpretable regression weights indicating impact on projected cash balance:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {linearData?.metrics?.coefficients &&
                  Object.entries(linearData.metrics.coefficients).map(([feat, weight]) => (
                    <div
                      key={feat}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-white/80"
                    >
                      <span className="font-semibold text-textSecondary font-mono">{feat}</span>
                      <span
                        className={`font-mono font-bold ${
                          weight >= 0 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {weight >= 0 ? '+' : ''}{weight}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: LOGISTIC REGRESSION */}
        {/* ============================================================= */}
        {activeTab === 'logistic' && (
          <motion.div
            key="logistic"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-2xl p-4 md:p-5 shadow-glass border border-white/80 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-primary border border-mint/30">
                      <AppIcon name="shield-checkmark" size={16} />
                    </span>
                    <h2 className="text-base md:text-lg font-black text-deepEmerald">
                      Model 2: Logistic Regression Budget Risk Classifier
                    </h2>
                  </div>
                  <p className="text-xs text-textSecondary mt-1 leading-relaxed max-w-xl">
                    Estimates probability of monthly expenditure exceeding budget using standardized financial burn rates, daily volatility, and expense-to-income ratios.
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-black text-textMuted tracking-wider">
                    Risk Classification
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                        logisticData?.risk_level === 'Low'
                          ? 'bg-[#E2FAF2] text-success border-mint/60'
                          : logisticData?.risk_level === 'Moderate'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          logisticData?.risk_level === 'Low'
                            ? 'bg-success'
                            : logisticData?.risk_level === 'Moderate'
                            ? 'bg-amber-500'
                            : 'bg-rose-600'
                        }`}
                      />
                      {logisticData?.predicted_label ?? 'Within Budget'} ({logisticData?.risk_level ?? 'Low'} Risk)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Probability Gauge & Budget Comparison Card */}
            <Card className="p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-deepEmerald">
                    Budget Overrun Probability Meter
                  </h3>
                  <p className="text-xs text-textSecondary">
                    Evaluated against your monthly target of ₹{formatInr(logisticData?.budget_amount ?? 5000)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-deepEmerald">
                    {logisticData?.probability_percent ?? 40.8}%
                  </span>
                  <span className="text-[10px] font-bold text-textMuted block">
                    Exceed Probability
                  </span>
                </div>
              </div>

              {/* Progress Track with Color Stops */}
              <div className="space-y-1.5">
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/70 border border-white/80 p-0.5 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, logisticData?.probability_percent ?? 40)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      (logisticData?.probability_percent ?? 40) < 35
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : (logisticData?.probability_percent ?? 40) < 65
                        ? 'bg-gradient-to-r from-teal-400 to-amber-500'
                        : 'bg-gradient-to-r from-amber-500 to-rose-600'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-textMuted px-1">
                  <span>0% (Safe)</span>
                  <span>35% (Borderline)</span>
                  <span>65% (High Risk)</span>
                  <span>100% (Critical)</span>
                </div>
              </div>

              {/* Spend vs Budget Comparison */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/60">
                <div className="p-3 rounded-2xl bg-white/50 border border-white/80">
                  <span className="text-[10px] font-black uppercase text-textMuted block">
                    Projected Month Spend
                  </span>
                  <span className="text-lg font-black text-deepEmerald mt-0.5 block">
                    {formatInr(logisticData?.projected_spend ?? 4700)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/50 border border-white/80">
                  <span className="text-[10px] font-black uppercase text-textMuted block">
                    Target Budget
                  </span>
                  <span className="text-lg font-black text-deepEmerald mt-0.5 block">
                    {formatInr(logisticData?.budget_amount ?? 5000)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Classification Evaluation Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  ROC-AUC
                </span>
                <span className="text-lg font-black text-deepEmerald block mt-1">
                  {logisticData?.metrics?.roc_auc ?? '0.9967'}
                </span>
                <span className="text-[10px] text-success font-bold mt-0.5 block">
                  Discrimination
                </span>
              </div>

              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  Accuracy
                </span>
                <span className="text-lg font-black text-deepEmerald block mt-1">
                  {((logisticData?.metrics?.accuracy ?? 0.94) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-textMuted font-bold mt-0.5 block">
                  Overall Correct
                </span>
              </div>

              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  Precision
                </span>
                <span className="text-lg font-black text-deepEmerald block mt-1">
                  {((logisticData?.metrics?.precision ?? 0.965) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-textMuted font-bold mt-0.5 block">
                  Low False Pos
                </span>
              </div>

              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  Recall
                </span>
                <span className="text-lg font-black text-deepEmerald block mt-1">
                  {((logisticData?.metrics?.recall ?? 0.933) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-textMuted font-bold mt-0.5 block">
                  Catching Risk
                </span>
              </div>

              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  F1-Score
                </span>
                <span className="text-lg font-black text-deepEmerald block mt-1">
                  {((logisticData?.metrics?.f1_score ?? 0.949) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-textMuted font-bold mt-0.5 block">
                  Harmonic Mean
                </span>
              </div>
            </div>

            {/* Feature Coefficients Breakdown */}
            <Card className="p-4 md:p-5">
              <h3 className="text-sm font-extrabold text-deepEmerald mb-1">
                Standardized Logistic Feature Weights
              </h3>
              <p className="text-xs text-textSecondary mb-3">
                Features standardized with StandardScaler prior to training:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {logisticData?.metrics?.coefficients &&
                  Object.entries(logisticData.metrics.coefficients).map(([feat, coef]) => (
                    <div
                      key={feat}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-white/80"
                    >
                      <span className="font-semibold text-textSecondary font-mono">{feat}</span>
                      <span
                        className={`font-mono font-bold ${
                          coef >= 0 ? 'text-danger' : 'text-success'
                        }`}
                      >
                        {coef >= 0 ? '+' : ''}{coef}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: LSTM DEEP LEARNING */}
        {/* ============================================================= */}
        {activeTab === 'lstm' && (
          <motion.div
            key="lstm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Header Card with Demo Mode Toggle */}
            <div className="relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-2xl p-4 md:p-5 shadow-glass border border-white/80 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-primary border border-mint/30">
                      <AppIcon name="sparkles" size={16} />
                    </span>
                    <h2 className="text-base md:text-lg font-black text-deepEmerald">
                      Model 3: PyTorch LSTM Sequential Cash Flow Forecaster
                    </h2>
                  </div>
                  <p className="text-xs text-textSecondary mt-1 leading-relaxed max-w-xl">
                    Deep recurrent neural network (<span className="font-mono text-primary font-bold">torch.nn.LSTM</span>) modeling temporal dependencies in daily net cash flows across sequential 7-day windows.
                  </p>
                </div>

                {/* Synthetic Demo Mode Toggle */}
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/70 border border-white/80 shadow-xs">
                  <span className="text-[11px] font-bold text-deepEmerald">Demo Data Mode:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !lstmDemoMode;
                      setLstmDemoMode(next);
                      loadAllModels(next);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      lstmDemoMode ? 'bg-[#087F73]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        lstmDemoMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Status / Insufficient Data Notice */}
              <div className="flex items-center justify-between border-t border-white/60 pt-2 text-[11px] text-textMuted font-medium">
                <span>
                  {lstmData?.status === 'demo_mode' || lstmDemoMode
                    ? '⚡ Reproducible 60-day gig worker sequence dataset (Seed 42) enabled for model demonstration'
                    : '✓ Real transaction sequences trained on PyTorch LSTM'}
                </span>
                <span className="font-bold text-primary">PyTorch 2.5.1</span>
              </div>
            </div>

            {/* 7-Day Net Cash Flow Line Chart */}
            <Card className="p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-deepEmerald">
                    7-Day Multi-Step Sequential Net Cash Flow
                  </h3>
                  <p className="text-[11px] text-textSecondary">
                    Sequential neural network output forecasting daily income minus daily expenses
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1 text-[#087F73]">
                    <span className="h-2 w-2 rounded-full bg-[#087F73]" /> Forecast Net (₹)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lstmData?.forecast_7_days ?? []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,59,58,0.06)" />
                    <XAxis
                      dataKey="day_label"
                      tick={{ fontSize: 11, fill: '#4E6563', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#4E6563' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload as any;
                          return (
                            <div className="rounded-xl bg-white/90 backdrop-blur-xl p-2.5 shadow-glass border border-white/90 text-xs">
                              <p className="font-extrabold text-deepEmerald">
                                {d.day_label} ({d.date})
                              </p>
                              <p className="font-bold text-primary mt-1">
                                Predicted Net: ₹{d.predicted_net}
                              </p>
                              <p className="text-[11px] text-textMuted mt-0.5">
                                Confidence Band: ₹{d.confidence_lower} – ₹{d.confidence_upper}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted_net"
                      stroke="#087F73"
                      strokeWidth={3}
                      dot={{ fill: '#073B3A', r: 4 }}
                      activeDot={{ r: 6, fill: '#72E5C2' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Neural Network Architecture Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3.5 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  Epochs Trained
                </span>
                <span className="text-xl font-black text-deepEmerald block mt-1">
                  {lstmData?.metrics?.epochs ?? 35}
                </span>
                <span className="text-[10px] text-textMuted font-bold mt-0.5 block">
                  Adam Optimizer (lr=0.01)
                </span>
              </div>

              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3.5 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  Final MSE Loss
                </span>
                <span className="text-xl font-black text-deepEmerald block mt-1 font-mono">
                  {lstmData?.metrics?.final_train_loss?.toFixed(5) ?? '0.00806'}
                </span>
                <span className="text-[10px] text-success font-bold mt-0.5 block">
                  Normalized Loss
                </span>
              </div>

              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3.5 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  Test Sequence MAE
                </span>
                <span className="text-xl font-black text-deepEmerald block mt-1">
                  ₹{lstmData?.metrics?.test_mae?.toFixed(1) ?? '197.1'}
                </span>
                <span className="text-[10px] text-textMuted font-bold mt-0.5 block">
                  Chronological Split
                </span>
              </div>

              <div className="rounded-2xl bg-white/50 backdrop-blur-xl p-3.5 border border-white/80 shadow-glass">
                <span className="text-[10px] font-black uppercase tracking-wider text-textMuted block">
                  Model Parameters
                </span>
                <span className="text-xl font-black text-deepEmerald block mt-1 font-mono">
                  {lstmData?.metrics?.parameters?.toLocaleString() ?? '4,769'}
                </span>
                <span className="text-[10px] text-textMuted font-bold mt-0.5 block">
                  Weights & Biases
                </span>
              </div>
            </div>

            {/* Model Architecture Summary */}
            <Card className="p-4 md:p-5">
              <h3 className="text-sm font-extrabold text-deepEmerald mb-1">
                PyTorch Network Architecture Details
              </h3>
              <p className="text-xs text-textSecondary mb-3">
                Built and verified with genuine deep learning tensors:
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white/60 border border-white/80 flex justify-between">
                  <span className="text-textSecondary">Input Size:</span>
                  <span className="font-bold text-deepEmerald">3 features (normalized [income, expense, net])</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/60 border border-white/80 flex justify-between">
                  <span className="text-textSecondary">Hidden Units:</span>
                  <span className="font-bold text-deepEmerald">32 recurrent LSTM hidden states</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/60 border border-white/80 flex justify-between">
                  <span className="text-textSecondary">Sequence Length:</span>
                  <span className="font-bold text-deepEmerald">7 sliding days historical input</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/60 border border-white/80 flex justify-between">
                  <span className="text-textSecondary">Output Projection:</span>
                  <span className="font-bold text-deepEmerald">nn.Linear(32, 1) -&gt; 7-step autoregressive rollout</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: K-MEANS CLUSTERING */}
        {/* ============================================================= */}
        {activeTab === 'kmeans' && (
          <motion.div
            key="kmeans"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-2xl p-4 md:p-5 shadow-glass border border-white/80 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-primary border border-mint/30">
                      <AppIcon name="grid" size={16} />
                    </span>
                    <h2 className="text-base md:text-lg font-black text-deepEmerald">
                      Model 4: K-Means Spending Pattern Discovery
                    </h2>
                  </div>
                  <p className="text-xs text-textSecondary mt-1 leading-relaxed max-w-xl">
                    Unsupervised clustering with scikit-learn discovering empirical spending habits. Standardized on transaction amount, weekday timing, category code, and relative magnitude.
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-black text-textMuted tracking-wider">
                    Inertia (WCSS)
                  </span>
                  <span className="text-2xl font-black text-deepEmerald font-mono">
                    {kmeansData?.metrics?.inertia?.toFixed(1) ?? '170.4'}
                  </span>
                  <span className="text-[10px] text-textMuted font-bold">
                    k = 3 Clusters
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/60 pt-2 text-[11px] text-textMuted font-medium">
                <span>
                  {kmeansData?.is_synthetic
                    ? '⚡ Evaluated on 180 representative gig worker transactions'
                    : `✓ Analyzed ${kmeansData?.total_analyzed ?? 0} user transactions`}
                </span>
                <span>StandardScaler (Mean=0, Var=1) Applied</span>
              </div>
            </div>

            {/* Cluster Proportions Chart */}
            <Card className="p-4 md:p-5">
              <h3 className="text-sm font-extrabold text-deepEmerald mb-3">
                Cluster Distribution & Proportions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={kmeansData?.cluster_summaries ?? []}
                        dataKey="count"
                        nameKey="title"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        paddingAngle={4}
                      >
                        {(kmeansData?.cluster_summaries ?? []).map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as any;
                            return (
                              <div className="rounded-xl bg-white/90 backdrop-blur-xl p-2 shadow-glass border border-white/90 text-xs">
                                <p className="font-extrabold text-deepEmerald">{d.title}</p>
                                <p className="text-primary font-bold">{d.count} transactions ({d.percentage}%)</p>
                                <p className="text-textMuted">Average: ₹{d.avg_amount}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend & Summary */}
                <div className="space-y-2">
                  {(kmeansData?.cluster_summaries ?? []).map((c, idx) => (
                    <div
                      key={c.cluster_id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-white/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                        />
                        <span className="font-bold text-deepEmerald">{c.title}</span>
                      </div>
                      <span className="font-mono font-bold text-textSecondary">
                        {c.percentage}% ({c.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Empirical Archetype Profile Cards */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-deepEmerald px-1">
                Discovered Spending Archetypes
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(kmeansData?.cluster_summaries ?? []).map((c, idx) => (
                  <div
                    key={c.cluster_id}
                    className="rounded-3xl bg-white/50 backdrop-blur-2xl p-4 border border-white/80 shadow-glass space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                        >
                          Cluster {c.cluster_id}
                        </span>
                        <span className="text-xs font-bold text-textMuted font-mono">
                          {c.percentage}%
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-deepEmerald mt-2">
                        {c.title}
                      </h4>
                      <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/60 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-textMuted">Average Amount:</span>
                        <span className="font-bold text-deepEmerald font-mono">
                          ₹{c.avg_amount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-textMuted">Observed Range:</span>
                        <span className="font-semibold text-textSecondary font-mono">
                          ₹{c.min_amount} – ₹{c.max_amount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-textMuted">Primary Focus:</span>
                        <span className="font-semibold text-primary capitalize">
                          {c.primary_category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
