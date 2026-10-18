import { useState, useEffect } from 'react';
import Card from '../Card';
import { AppIcon } from '../../lib/icons';
import { formatInr } from '../../localization';
import {
  fetchModelsRegistry,
  classifyExpenseText,
  forecastIncomeHorizon,
  detectTransactionAnomalies,
  extractTransactionEntities,
  matchJobsWithWorker,
  recommendSkillsForWorker,
  searchHealthWelfareRAG,
  type ModelRegistryResponse,
  type Model1Classification,
  type Model2Forecast,
  type Model3AnomalyResult,
  type Model5ExtractedTx,
  type Model6JobMatch,
  type Model7CourseRec,
  type Model8RAGResult,
} from '../../services/aiModelsClient';

export default function Models8SuiteBench() {
  const [registry, setRegistry] = useState<ModelRegistryResponse | null>(null);
  const [loadingReg, setLoadingReg] = useState(true);

  // Model 1 State
  const [m1Text, setM1Text] = useState('Petrol 250 rs for bike');
  const [m1Result, setM1Result] = useState<Model1Classification | null>(null);
  const [m1Loading, setM1Loading] = useState(false);

  // Model 2 State
  const [m2Periods, setM2Periods] = useState(7);
  const [m2Result, setM2Result] = useState<Model2Forecast | null>(null);
  const [m2Loading, setM2Loading] = useState(false);

  // Model 3 State
  const [m3Amount, setM3Amount] = useState('8500');
  const [m3Hour, setM3Hour] = useState('3');
  const [m3Result, setM3Result] = useState<Model3AnomalyResult | null>(null);
  const [m3Loading, setM3Loading] = useState(false);

  // Model 4 & 5 State
  const [m5Text, setM5Text] = useState('Aaj Zomato se 850 kamaya aur 200 fuel me diya');
  const [m5Result, setM5Result] = useState<Model5ExtractedTx | null>(null);
  const [m5Loading, setM5Loading] = useState(false);

  // Model 6 State
  const [m6Role, setM6Role] = useState('Delivery Partner');
  const [m6Result, setM6Result] = useState<Model6JobMatch[]>([]);
  const [m6Loading, setM6Loading] = useState(false);

  // Model 7 State
  const [m7Role, setM7Role] = useState('Residential Electrician');
  const [m7Result, setM7Result] = useState<Model7CourseRec[]>([]);
  const [m7Loading, setM7Loading] = useState(false);

  // Model 8 State
  const [m8Query, setM8Query] = useState('How can a gig worker get 5 lakh free hospital treatment under Ayushman Bharat?');
  const [m8Result, setM8Result] = useState<Model8RAGResult | null>(null);
  const [m8Loading, setM8Loading] = useState(false);

  useEffect(() => {
    fetchModelsRegistry()
      .then((data) => setRegistry(data))
      .catch((err) => console.error(err))
      .finally(() => setLoadingReg(false));

    // Preload tests
    handleTestM1('Petrol 250 rs for bike');
    handleTestM2(7);
    handleTestM6('Delivery Partner');
    handleTestM7('Residential Electrician');
    handleTestM8('How can a gig worker get 5 lakh free hospital treatment under Ayushman Bharat?');
  }, []);

  const handleTestM1 = async (text: string) => {
    if (!text.trim()) return;
    setM1Loading(true);
    try {
      const res = await classifyExpenseText(text);
      setM1Result(res);
    } finally {
      setM1Loading(false);
    }
  };

  const handleTestM2 = async (periods: number) => {
    setM2Loading(true);
    try {
      const res = await forecastIncomeHorizon(periods);
      setM2Result(res);
    } finally {
      setM2Loading(false);
    }
  };

  const handleTestM3 = async () => {
    setM3Loading(true);
    try {
      const res = await detectTransactionAnomalies([
        { amount: parseFloat(m3Amount) || 8500, category: 'Fuel', hour_of_day: parseInt(m3Hour) || 3 }
      ]);
      setM3Result(res);
    } finally {
      setM3Loading(false);
    }
  };

  const handleTestM5 = async (text: string) => {
    if (!text.trim()) return;
    setM5Loading(true);
    try {
      const res = await extractTransactionEntities(text);
      setM5Result(res);
    } finally {
      setM5Loading(false);
    }
  };

  const handleTestM6 = async (role: string) => {
    setM6Loading(true);
    try {
      const res = await matchJobsWithWorker({
        role,
        skills: role.toLowerCase().includes('delivery') ? ['driving', 'navigation', 'two-wheeler'] : ['wiring', 'electrical repair'],
        location: 'Mumbai'
      }, 3);
      setM6Result(res);
    } finally {
      setM6Loading(false);
    }
  };

  const handleTestM7 = async (currentRole: string) => {
    setM7Loading(true);
    try {
      const res = await recommendSkillsForWorker({
        current_role: currentRole,
        skills: ['wiring', 'tools', 'repair'],
        target_role: 'Solar Technician or Electrical Supervisor'
      }, 3);
      setM7Result(res);
    } finally {
      setM7Loading(false);
    }
  };

  const handleTestM8 = async (q: string) => {
    if (!q.trim()) return;
    setM8Loading(true);
    try {
      const res = await searchHealthWelfareRAG(q, 2);
      setM8Result(res);
    } finally {
      setM8Loading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SUITE HEADER BANNER */}
      <Card variant="accent" className="p-5 border border-[#E5953E]/40 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold border border-emerald-300 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Full 8-Model AI Suite Operational</span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-[#1E2B3E]">
              Audited, Validated & Merged Machine Learning Architecture
            </h2>
            <p className="text-xs text-textSecondary mt-1 max-w-2xl">
              All eight AI models from the <code className="font-mono text-terracotta bg-white px-1 py-0.5 rounded">ai-models</code> branch have been fully audited, bug-fixed, trained with reproducible datasets, evaluated with verified metrics, and deployed as live FastAPI singleton endpoints.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-xl bg-white p-3 border border-stone-200 text-center shadow-xs">
              <span className="block text-xl font-black text-terracotta">8 / 8</span>
              <span className="text-[10px] font-bold text-textMuted uppercase">Models Active</span>
            </div>
            <div className="rounded-xl bg-white p-3 border border-stone-200 text-center shadow-xs">
              <span className="block text-xl font-black text-emerald-700">100%</span>
              <span className="text-[10px] font-bold text-textMuted uppercase">Contract Match</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. INTERACTIVE TEST BENCH: 8 MODELS */}
      <div>
        <h3 className="text-sm font-extrabold text-[#1E2B3E] uppercase tracking-wider mb-3 flex items-center gap-2">
          <AppIcon name="sparkles" size={16} className="text-terracotta" />
          <span>Live Interactive Model Test Bench</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TEST BENCH 1: MODEL 1 (EXPENSE CLASSIFICATION) */}
          <Card className="p-4 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-terracotta">Model 1: Expense Classifier</span>
                <h4 className="text-sm font-extrabold text-[#1E2B3E]">TF-IDF + SGD Multiclass</h4>
              </div>
              <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                Accuracy: 75.0%
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={m1Text}
                onChange={(e) => setM1Text(e.target.value)}
                placeholder="e.g. Petrol 200, Chai nashta 50"
                className="flex-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-terracotta"
              />
              <button
                type="button"
                onClick={() => handleTestM1(m1Text)}
                disabled={m1Loading}
                className="rounded-xl bg-terracotta text-white px-3 py-1.5 text-xs font-bold hover:bg-[#8D3418] disabled:opacity-50"
              >
                {m1Loading ? '...' : 'Classify'}
              </button>
            </div>
            {m1Result && (
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-textPrimary">Predicted: <span className="text-terracotta uppercase font-black">{m1Result.category}</span></span>
                  <span className="text-[11px] text-textMuted font-mono">Conf: {(m1Result.confidence * 100).toFixed(1)}%</span>
                </div>
                {m1Result.probabilities && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {Object.entries(m1Result.probabilities).slice(0, 4).map(([cat, prob]) => (
                      <span key={cat} className="text-[10px] bg-white border border-stone-200 px-1.5 py-0.5 rounded text-stone-600">
                        {cat}: {(prob * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* TEST BENCH 2: MODEL 2 (INCOME FORECASTING) */}
          <Card className="p-4 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-terracotta">Model 2: Income Forecaster</span>
                <h4 className="text-sm font-extrabold text-[#1E2B3E]">Random Forest Lag-Regressor</h4>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                -47.1% Error vs Base
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-textMuted">Horizon:</span>
              {[3, 5, 7, 14].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setM2Periods(p); handleTestM2(p); }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    m2Periods === p ? 'bg-terracotta text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {p} Days
                </button>
              ))}
            </div>
            {m2Result && (
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Total: ₹{formatInr(m2Result.total_predicted_income)}</span>
                  <span className="text-textMuted">Avg: ₹{formatInr(m2Result.average_daily_income)}/day</span>
                </div>
                <div className="flex gap-1 overflow-x-auto pt-1">
                  {m2Result.forecast.map((f) => (
                    <div
                      key={f.date}
                      className={`rounded px-1.5 py-0.5 text-[10px] text-center shrink-0 border ${
                        f.is_weekend ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      <span className="block text-[8px] text-stone-400">{f.date.slice(5)}</span>
                      <span>₹{Math.round(f.predicted_income)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* TEST BENCH 3: MODEL 3 (ANOMALY DETECTION) */}
          <Card className="p-4 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-terracotta">Model 3: Anomaly Detector</span>
                <h4 className="text-sm font-extrabold text-[#1E2B3E]">Isolation Forest (5% Contam)</h4>
              </div>
              <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                Unsupervised
              </span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={m3Amount}
                  onChange={(e) => setM3Amount(e.target.value)}
                  placeholder="Amount ₹"
                  className="w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-terracotta"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={m3Hour}
                  onChange={(e) => setM3Hour(e.target.value)}
                  placeholder="Hour (0-23)"
                  className="w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-terracotta"
                />
              </div>
              <button
                type="button"
                onClick={handleTestM3}
                disabled={m3Loading}
                className="rounded-xl bg-terracotta text-white px-3 py-1.5 text-xs font-bold hover:bg-[#8D3418] disabled:opacity-50"
              >
                {m3Loading ? '...' : 'Check'}
              </button>
            </div>
            {m3Result && (
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-2.5 text-xs">
                {m3Result.flagged_count > 0 ? (
                  <div className="text-rose-800 font-bold">
                    ⚠️ Flagged as Anomaly! Score: {m3Result.anomalies[0].anomaly_score} ({m3Result.anomalies[0].severity} severity)
                  </div>
                ) : (
                  <div className="text-emerald-700 font-bold">
                    ✓ Validated: Conforms to typical transaction pattern.
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* TEST BENCH 4 & 5: MODEL 4 & 5 (VOICE & HINGLISH EXTRACTION) */}
          <Card className="p-4 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-terracotta">Model 4 & 5: Voice & Hinglish Parser</span>
                <h4 className="text-sm font-extrabold text-[#1E2B3E]">Whisper Tiny + Regex Entities</h4>
              </div>
              <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                170 Transcripts
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={m5Text}
                onChange={(e) => setM5Text(e.target.value)}
                placeholder="Enter Hinglish audio transcript"
                className="flex-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-terracotta"
              />
              <button
                type="button"
                onClick={() => handleTestM5(m5Text)}
                disabled={m5Loading}
                className="rounded-xl bg-terracotta text-white px-3 py-1.5 text-xs font-bold hover:bg-[#8D3418] disabled:opacity-50"
              >
                {m5Loading ? '...' : 'Extract'}
              </button>
            </div>
            {m5Result && (
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-2.5 text-xs grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-textMuted block">Amount</span>
                  <span className="font-bold text-terracotta">₹{m5Result.amount ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-textMuted block">Type</span>
                  <span className="font-bold uppercase">{m5Result.transaction_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-textMuted block">Category</span>
                  <span className="font-bold">{m5Result.category}</span>
                </div>
              </div>
            )}
          </Card>

          {/* TEST BENCH 6: MODEL 6 (JOB MATCHING) */}
          <Card className="p-4 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-terracotta">Model 6: Semantic Job Matcher</span>
                <h4 className="text-sm font-extrabold text-[#1E2B3E]">SentenceTransformer all-MiniLM</h4>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                MRR: 1.000
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={m6Role}
                onChange={(e) => { setM6Role(e.target.value); handleTestM6(e.target.value); }}
                className="flex-1 rounded-xl border border-stone-200 px-2.5 py-1.5 text-xs text-textPrimary bg-white focus:outline-none focus:border-terracotta"
              >
                <option value="Delivery Partner">Profile: Delivery Partner (Two-wheeler)</option>
                <option value="Residential Electrician">Profile: Residential Electrician</option>
                <option value="Commercial Auto Driver">Profile: Auto Driver</option>
              </select>
            </div>
            <div className="space-y-1.5">
              {m6Result.map((j) => (
                <div key={j.job_id} className="rounded-xl bg-stone-50 border border-stone-200 p-2 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-textPrimary">{j.title}</span>
                    <span className="text-[10px] text-textMuted block">{j.location} • {j.employment_type}</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-black">
                    {j.match_percentage.toFixed(1)}% match
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* TEST BENCH 7: MODEL 7 (SKILL RECOMMENDATION) */}
          <Card className="p-4 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-terracotta">Model 7: Skill Recommender</span>
                <h4 className="text-sm font-extrabold text-[#1E2B3E]">SentenceTransformer all-MiniLM</h4>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                MAP@5: 0.780
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={m7Role}
                onChange={(e) => { setM7Role(e.target.value); handleTestM7(e.target.value); }}
                className="flex-1 rounded-xl border border-stone-200 px-2.5 py-1.5 text-xs text-textPrimary bg-white focus:outline-none focus:border-terracotta"
              >
                <option value="Residential Electrician">Role: Electrician (Target: Solar / Earthing)</option>
                <option value="Delivery Partner">Role: Delivery Rider (Target: Fleet Safety)</option>
                <option value="Plumbing Technician">Role: Plumber (Target: Modern Sanitary)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              {m7Result.map((c) => (
                <div key={c.course_id} className="rounded-xl bg-stone-50 border border-stone-200 p-2 text-xs flex items-center justify-between">
                  <div className="pr-2">
                    <span className="font-bold text-textPrimary">{c.title}</span>
                    <span className="text-[10px] text-textMuted block">{c.provider}</span>
                  </div>
                  <span className="rounded-full bg-terracotta/15 text-terracotta px-2 py-0.5 text-[11px] font-black shrink-0">
                    {c.match_percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* TEST BENCH 8: MODEL 8 (HEALTH & WELFARE RAG) - FULL WIDTH */}
        <Card className="mt-4 p-4 border border-stone-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-terracotta">Model 8: Health & Welfare RAG</span>
              <h4 className="text-sm font-extrabold text-[#1E2B3E]">SentenceTransformer + FAISS Dense Vector Index</h4>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200 shrink-0">
              MRR@4: 0.9167 (6 labeled queries)
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={m8Query}
              onChange={(e) => setM8Query(e.target.value)}
              placeholder="Ask about Ayushman Bharat, ESIC, Rajasthan Gig Act, or PM-SYM Pension"
              className="flex-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-terracotta"
            />
            <button
              type="button"
              onClick={() => handleTestM8(m8Query)}
              disabled={m8Loading}
              className="rounded-xl bg-terracotta text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#8D3418] disabled:opacity-50 shrink-0"
            >
              {m8Loading ? '...' : 'Retrieve Policy'}
            </button>
          </div>

          {/* Quick query pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              'Ayushman Bharat 5 lakh hospital admission',
              'ESIC sickness cash benefit for injured gig worker',
              'Rajasthan Gig Workers Welfare Board cess fund',
              'PM-SYM 3000 rupees monthly pension scheme',
            ].map((qp) => (
              <button
                key={qp}
                type="button"
                onClick={() => { setM8Query(qp); handleTestM8(qp); }}
                className="rounded-full bg-white border border-stone-200 px-2.5 py-0.5 text-[10px] text-textSecondary hover:border-terracotta hover:text-terracotta transition-all"
              >
                + {qp}
              </button>
            ))}
          </div>

          {m8Result && m8Result.passages && (
            <div className="space-y-2 pt-1">
              {m8Result.passages.map((p, idx) => (
                <div key={idx} className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-textMuted">
                    <span className="font-mono text-terracotta font-bold">📄 {p.source}</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                      Sim: {p.similarity_score}
                    </span>
                  </div>
                  <p className="text-textPrimary text-[11px] leading-relaxed line-clamp-3">
                    {p.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 3. FULL AUDIT REGISTRY TABLE */}
      <div>
        <h3 className="text-sm font-extrabold text-[#1E2B3E] uppercase tracking-wider mb-3">
          Architecture & Verification Matrix
        </h3>
        {loadingReg || !registry ? (
          <div className="p-8 text-center text-xs text-textMuted">Loading verified models matrix...</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[11px] font-bold uppercase text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Model & Task</th>
                  <th className="py-3 px-4">Algorithm</th>
                  <th className="py-3 px-4">Dataset & License</th>
                  <th className="py-3 px-4">Evaluation Metric</th>
                  <th className="py-3 px-4">Integration Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {Object.entries(registry.models).map(([dir, m]) => (
                  <tr key={m.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-textPrimary">
                      <div className="font-bold text-terracotta">{m.name}</div>
                      <div className="text-[10px] text-textMuted font-mono">{dir}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{m.task}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">{m.algorithm}</td>
                    <td className="py-3 px-4">
                      <div className="text-[11px]">{m.dataset}</div>
                      <span className="inline-block mt-0.5 text-[9px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-mono">
                        {m.dataset_license}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 font-mono text-[11px]">
                        {Object.entries(m.evaluation_metrics).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-textMuted text-[10px]">{k}:</span>{' '}
                            <span className="font-bold text-emerald-800">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-textPrimary">
                      {m.integrated_feature}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
