import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../lib/icons';
import { useTransactions } from '../hooks/TransactionContext';
import type { Transaction, TransactionType, TransactionCategory } from '../types/transaction';
import { CATEGORY_ICONS, CATEGORY_TRANSLATION_KEYS } from '../services/transactionService';
import { normalizeIndicDigits } from '../lib/multilingualNumberParser';
import { classifyExpenseText, extractTransactionEntities } from '../services/aiModelsClient';
import ModalPortal from './ModalPortal';
import { playPop, playTap } from '../lib/feedback';
import Tesseract from 'tesseract.js';


const INCOME_CATEGORIES: TransactionCategory[] = [
  'work_earnings',
  'tips_bonus',
  'other',
];

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'travel_fuel',
  'food',
  'rent',
  'tools',
  'medical',
  'other',
];

interface QuickPreset {
  label: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  desc: string;
  workRef?: string;
}

const QUICK_PRESETS: QuickPreset[] = [
  { label: 'Earned ₹500 from deliveries', type: 'income', amount: 500, category: 'work_earnings', desc: 'Deliveries completed', workRef: 'Delivery Gig' },
  { label: 'Earned ₹750 daily wage', type: 'income', amount: 750, category: 'work_earnings', desc: 'Day work wage payout', workRef: 'Daily Work' },
  { label: 'Tip ₹50 from customer', type: 'income', amount: 50, category: 'tips_bonus', desc: 'Customer tip' },
  { label: 'Spent ₹30 on tea / chai', type: 'expense', amount: 30, category: 'food', desc: 'Chai & biscuit' },
  { label: 'Spent ₹150 on lunch', type: 'expense', amount: 150, category: 'food', desc: 'Lunch khana' },
  { label: 'Spent ₹200 on fuel / petrol', type: 'expense', amount: 200, category: 'travel_fuel', desc: 'Vehicle fuel refill' },
];

function formatForDateTimeLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function TransactionModal({
  isOpen,
  onClose,
  initialType = 'income',
  initialDate,
  editingTx = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  initialDate?: string;
  editingTx?: Transaction | null;
}) {
  const { t } = useTranslation();
  const { addTransaction, updateTransaction } = useTransactions();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('work_earnings');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [workRef, setWorkRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Model 1 & 5 Integration States
  const [smartInput, setSmartInput] = useState('');
  const [isSmartParsing, setIsSmartParsing] = useState(false);
  const [aiSuggestedCat, setAiSuggestedCat] = useState<{ raw: string; mapped: TransactionCategory; confidence: number } | null>(null);

  const mapModel1ToTxCategory = (rawCat: string): TransactionCategory => {
    const c = rawCat.toLowerCase();
    if (c.includes('fuel')) return 'travel_fuel';
    if (c.includes('food') || c.includes('grocer')) return 'food';
    if (c.includes('mainten') || c.includes('tool') || c.includes('educat')) return 'tools';
    if (c.includes('health') || c.includes('medic')) return 'medical';
    if (c.includes('hous') || c.includes('rent')) return 'rent';
    return 'other';
  };

  const handleSmartParse = async () => {
    if (!smartInput.trim()) return;
    setIsSmartParsing(true);
    try {
      const res = await extractTransactionEntities(smartInput);
      if (res.transaction_type && (res.transaction_type === 'income' || res.transaction_type === 'expense')) {
        setType(res.transaction_type);
      }
      if (res.amount && res.amount > 0) {
        setAmount(res.amount.toString());
      }
      if (res.category) {
        const mapped = mapModel1ToTxCategory(res.category);
        setCategory(mapped);
      }
      if (res.text) {
        setDescription(res.text);
      }
      setSmartInput('');
    } catch (err) {
      console.error('Smart parse error:', err);
    } finally {
      setIsSmartParsing(false);
    }
  };

  // Feature 4: Camera Bill & Receipt OCR Scanner (Tesseract OCR Engine)
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [scannedReceiptPreview, setScannedReceiptPreview] = useState<string | null>(null);

  const parseReceiptOcr = (text: string): { amount: string; category: TransactionCategory; desc: string } => {
    const clean = text.toLowerCase();

    // 1. Amount Extraction Strategy
    let amount: string | null = null;

    // Strategy A: Explicit "total amount", "total", "cash paid", "net" followed by digits
    const totalMatch = clean.match(/(?:total\s*(?:amount)?|cash\s*(?:paid|received)?|net\s*payable|amount\s*due)[\s\S]{0,35}?(?:rs\.?|re\.?|inr|₹|:)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    if (totalMatch && parseFloat(totalMatch[1]) > 0) {
      amount = totalMatch[1];
    } else {
      // Strategy B: Any currency match (Rs. / Re. / ₹ / INR)
      const currencyMatches = [...clean.matchAll(/(?:rs\.?|re\.?|inr|₹)\s*([0-9]+(?:\.[0-9]{1,2})?)/gi)];
      if (currencyMatches.length > 0) {
        const nums = currencyMatches.map((m) => parseFloat(m[1])).filter((n) => n > 0 && n < 100000);
        if (nums.length > 0) {
          amount = Math.max(...nums).toString();
        }
      }
    }

    // Strategy C: Any standalone 2-to-5 digit number
    if (!amount) {
      const standaloneMatches = clean.match(/\b([1-9][0-9]{1,4}(?:\.[0-9]{1,2})?)\b/g);
      if (standaloneMatches && standaloneMatches.length > 0) {
        const nums = standaloneMatches.map(Number).filter((n) => n >= 10 && n <= 50000);
        if (nums.length > 0) {
          amount = Math.max(...nums).toString();
        }
      }
    }

    // Format amount cleanly
    if (amount) {
      const parsed = parseFloat(amount);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed % 1 === 0 ? parsed.toString() : parsed.toFixed(2);
      }
    }

    // 2. Category & Description Strategy based on OCR vocabulary
    let category: TransactionCategory = 'other';
    let desc = 'Receipt Expense (OCR)';

    if (/petrol|diesel|fuel|indian\s*oil|hpcl|bharat\s*petroleum|pump|motor\s*spirit|cng|lpg|shell|speed/i.test(clean)) {
      category = 'travel_fuel';
      desc = 'Petrol / Fuel Bill (Receipt OCR)';
    } else if (/dhaba|food|chai|thali|roti|tea|restaurant|hotel|canteen|bhoj|lunch|dinner|snack|bakery|mithai|sweets|dal|biryani|paneer|curry/i.test(clean)) {
      category = 'food';
      desc = 'Food & Dhaba Bill (Receipt OCR)';
    } else if (/garage|repair|tool|mechanic|service|puncture|tyre|tire|spares|hardware|battery|oil|brake|chain/i.test(clean)) {
      category = 'tools';
      desc = 'Vehicle Repair & Garage (Receipt OCR)';
    } else if (/medical|pharma|medicine|dawa|clinic|doctor|hospital|chemist|tablet|capsule|syrup|health/i.test(clean)) {
      category = 'medical';
      desc = 'Medical & Pharmacy Bill (Receipt OCR)';
    } else if (/rent|kiraya|room|shop|house|bada/i.test(clean)) {
      category = 'rent';
      desc = 'Rent / Kiraya (Receipt OCR)';
    }

    return {
      amount: amount || '100',
      category,
      desc,
    };
  };

  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningReceipt(true);
    setOcrProgress(10);
    setValidationError(null);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setScannedReceiptPreview(previewUrl);

    try {
      // Execute true Optical Character Recognition on the image
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const recognizedText = result?.data?.text || '';
      console.log('Real Tesseract OCR Extracted Text:', recognizedText);

      // Parse entities from the recognized text
      const parsed = parseReceiptOcr(recognizedText);

      setType('expense');
      setAmount(parsed.amount);
      setDescription(parsed.desc);
      setCategory(parsed.category);

      // Validate with AI Model 1
      try {
        const aiRes = await classifyExpenseText(recognizedText || parsed.desc);
        if (aiRes && aiRes.category) {
          const mapped = mapModel1ToTxCategory(aiRes.category);
          setCategory(mapped);
          setAiSuggestedCat({
            raw: aiRes.category,
            mapped,
            confidence: Math.round(aiRes.confidence * 100),
          });
        }
      } catch {
        // Fallback to parsed category
      }

      playPop();
    } catch (err: any) {
      console.error('OCR Recognition Error:', err);
      // Fallback if image was unreadable
      setType('expense');
      setAmount('150');
      setDescription('Receipt Expense (Manual Check Needed)');
      setCategory('other');
    } finally {
      setIsScanningReceipt(false);
      setOcrProgress(0);
    }
  };

  // Real-time AI Category suggestion for expense description (Model 1)
  useEffect(() => {
    if (type !== 'expense' || description.trim().length < 4) {
      setAiSuggestedCat(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await classifyExpenseText(description);
        if (res && res.category) {
          const mapped = mapModel1ToTxCategory(res.category);
          setAiSuggestedCat({
            raw: res.category,
            mapped,
            confidence: Math.round(res.confidence * 100),
          });
        }
      } catch {
        // ignore
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [description, type]);


  // Sync state when modal opens or editingTx changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingTx) {
      setType(editingTx.type);
      setAmount(editingTx.amount.toString());
      setCategory(editingTx.category);
      setDescription(editingTx.description || '');
      setWorkRef(editingTx.workRef || '');
      // Format timestamp for datetime-local: YYYY-MM-DDTHH:mm
      try {
        const d = new Date(editingTx.timestamp);
        if (!isNaN(d.getTime())) {
          setDateStr(formatForDateTimeLocal(d));
        } else {
          setDateStr(formatForDateTimeLocal(new Date()));
        }
      } catch {
        setDateStr(formatForDateTimeLocal(new Date()));
      }
    } else {
      setType(initialType);
      setAmount('');
      setCategory(initialType === 'income' ? 'work_earnings' : 'food');
      setDescription('');
      setWorkRef('');
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
        setDateStr(`${initialDate}T${hh}:${min}`);
      } else {
        setDateStr(formatForDateTimeLocal(now));
      }
    }
    setValidationError(null);
    setIsSubmitting(false);
  }, [isOpen, editingTx, initialType, initialDate]);

  if (!isOpen) return null;

  const activeCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleApplyPreset = (preset: QuickPreset) => {
    playTap();
    setType(preset.type);
    setAmount(preset.amount.toString());
    setCategory(preset.category);
    setDescription(preset.desc);
    if (preset.workRef) setWorkRef(preset.workRef);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;

    setValidationError(null);

    const normalizedAmt = normalizeIndicDigits(amount.trim());
    const parsedAmount = parseFloat(normalizedAmt);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError(t('transactions.errorInvalidAmount'));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      // Parse ISO timestamp preserving local datetime chosen by user
      let finalTimestamp = new Date().toISOString();
      if (dateStr) {
        const [datePart, timePart] = dateStr.split('T');
        if (datePart && timePart) {
          const [yyyy, mm, dd] = datePart.split('-').map(Number);
          const [hh, min] = timePart.split(':').map(Number);
          const localDate = new Date(yyyy, mm - 1, dd, hh, min, 0);
          if (!isNaN(localDate.getTime())) {
            finalTimestamp = localDate.toISOString();
          }
        } else {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            finalTimestamp = parsed.toISOString();
          }
        }
      }

      if (editingTx) {
        await updateTransaction(editingTx.id, {
          type,
          amount: Math.round(parsedAmount * 100) / 100,
          category,
          description: description.trim(),
          timestamp: finalTimestamp,
          workRef: workRef.trim() || undefined,
        });
      } else {
        await addTransaction({
          type,
          amount: Math.round(parsedAmount * 100) / 100,
          category,
          description: description.trim(),
          timestamp: finalTimestamp,
          workRef: workRef.trim() || undefined,
          source: 'manual',
        });
      }

      playPop();
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      maxWidthClass="sm:max-w-lg"
    >
      {/* Pinned Header */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-3 pb-3 border-b border-[#F4EBDD]">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ${
                type === 'income'
                  ? 'bg-successSoft/90 text-success border border-[#2E7D32]/40'
                  : 'bg-[#FDF3EE] text-[#B34A26] border border-[#B34A26]/30'
              }`}
            >
              <AppIcon name={type === 'income' ? 'arrow-up' : 'arrow-down'} size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-deepEmerald leading-tight">
                {editingTx
                  ? t('transactions.editTitle')
                  : type === 'income'
                  ? t('transactions.addIncome')
                  : t('transactions.addExpense')}
              </h2>
              <p className="text-[11px] sm:text-xs text-textSecondary font-medium">
                {editingTx
                  ? t('transactions.editSub')
                  : type === 'income'
                  ? t('transactions.incomeSub')
                  : t('transactions.expenseSub')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDF8F0] hover:bg-[#F4EBDD] text-textMuted hover:text-deepEmerald border border-[#F4EBDD] transition-all active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Form Container with isolated scrollable body and pinned footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
            {/* Validation Error Banner */}
            {validationError && (
              <div className="flex items-center gap-2 rounded-2xl bg-[#FDF3EE] border border-[#B34A26]/30 p-3 text-xs font-bold text-[#B34A26] backdrop-blur-md">
                <AppIcon name="alert-circle" size={16} />
                <span>{validationError}</span>
              </div>
            )}
          {/* Transaction Type Segmented Toggle */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1.5">
              {t('transactions.typeLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  if (!editingTx) setCategory('work_earnings');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  type === 'income'
                    ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-dockActive border border-[#E5953E]/50 font-black'
                    : 'text-textSecondary hover:text-deepEmerald active:scale-95'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-saffronGold shadow-[0_0_6px_#E5953E]" />
                <span>{t('transactions.typeIncome')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  if (!editingTx) setCategory('food');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  type === 'expense'
                    ? 'bg-white text-danger shadow-xs border border-danger/40 font-black'
                    : 'text-textSecondary hover:text-danger active:scale-95'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-danger" />
                <span>{t('transactions.typeExpense')}</span>
              </button>
            </div>
          </div>

          {/* Model 5: AI Hinglish Quick-Fill Bar */}
          {!editingTx && (
            <div className="rounded-2xl border border-[#E5953E]/40 bg-gradient-to-r from-[#FDF8F0] to-[#FFF9F3] p-2.5 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-terracotta flex items-center gap-1">
                  <span>⚡</span>
                  <span>AI Quick Fill (Hinglish / English)</span>
                </span>
                <span className="text-[10px] text-textMuted font-mono">Model 5 Parser</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSmartParse();
                    }
                  }}
                  placeholder="e.g. Aaj petrol 250 diya or 800 Zomato se kamaya"
                  className="flex-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-textPrimary placeholder:text-stone-400 focus:outline-none focus:border-terracotta"
                />
                <button
                  type="button"
                  onClick={handleSmartParse}
                  disabled={isSmartParsing || !smartInput.trim()}
                  className="rounded-xl bg-terracotta hover:bg-[#8D3418] text-white px-3 py-1.5 text-xs font-bold shadow-xs disabled:opacity-50 active:scale-95 transition-all shrink-0"
                >
                  {isSmartParsing ? '...' : 'Auto-Fill'}
                </button>
                <label className="flex items-center gap-1 rounded-xl bg-deepEmerald hover:bg-[#052E2D] text-white px-2.5 py-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all shrink-0">
                  <span>📸</span>
                  <span>Scan Bill</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleReceiptScan}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Scanning status banner */}
              {isScanningReceipt && (
                <div className="flex items-center gap-2 mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold shadow-xs">
                  <span className="animate-spin text-base">🔄</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span>{ocrProgress > 0 ? `AI OCR Scanning Text (${ocrProgress}%)` : 'Initializing AI Optical Character Recognition...'}</span>
                      <span className="font-mono text-[10px] text-amber-700">{ocrProgress}%</span>
                    </div>
                    <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-600 h-full transition-all duration-200 rounded-full"
                        style={{ width: `${Math.max(ocrProgress, 12)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {scannedReceiptPreview && !isScanningReceipt && (
                <div className="flex items-center justify-between mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                  <span className="flex items-center gap-1.5">
                    <span>✅ Receipt Scanned: Auto-filled amount & category</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setScannedReceiptPreview(null)}
                    className="text-textMuted hover:text-danger text-[11px] underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Presets (Only when adding new) */}
          {!editingTx && (

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
                  {t('transactions.quickSuggestions')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PRESETS.filter((p) => p.type === type).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="rounded-full bg-white/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-deepEmerald border border-[#E5953E]/50 shadow-xs hover:bg-white active:scale-95 transition-all"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount in INR */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1.5">
              {t('transactions.amountLabel')} <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-base font-black text-deepEmerald">
                ₹
              </div>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full rounded-2xl border border-[#F4EBDD] bg-white/75 hover:bg-white/90 focus:bg-white backdrop-blur-xl pl-9 pr-4 py-3 text-base font-black text-deepEmerald shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.02)] placeholder:text-textMuted focus:border-terracotta/50 focus:ring-4 focus:ring-warmAmber/30 focus:outline-none transition-all"
              />
            </div>
            {/* Quick Amount Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(type === 'income' ? [200, 500, 750, 1000] : [20, 50, 100, 200]).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className="rounded-xl bg-white/80 hover:bg-white backdrop-blur-md px-2.5 py-1 text-xs font-bold text-deepEmerald border border-[#F4EBDD] shadow-xs active:scale-95 transition-all"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1.5">
              {t('transactions.categoryLabel')} <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {activeCategories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 rounded-xl p-2.5 text-xs font-bold text-left transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-dockActive border border-[#E5953E]/50'
                        : 'bg-white/75 hover:bg-white text-textPrimary border border-[#F4EBDD] backdrop-blur-md shadow-xs'
                    }`}
                  >
                    <AppIcon name={CATEGORY_ICONS[cat]} size={15} />
                    <span className="truncate">{t(CATEGORY_TRANSLATION_KEYS[cat])}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('transactions.descriptionLabel')}{' '}
              <span className="text-[11px] font-normal text-textMuted">({t('common.optional')})</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'income'
                  ? 'e.g. 10 customer trips, painting bedroom'
                  : 'e.g. Chai, petrol 2L, grocery'
              }
              className="w-full rounded-2xl border border-white/85 bg-white/65 hover:bg-white/80 focus:bg-white/92 backdrop-blur-xl px-3.5 py-2.5 text-xs font-semibold text-textPrimary shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:border-primary/50 focus:ring-4 focus:ring-mint/30 focus:outline-none transition-all placeholder:text-textMuted"
            />
            {aiSuggestedCat && (
              <div className="mt-1.5 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800 animate-fade-in">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold">🤖 AI Suggestion:</span>
                  <span className="capitalize">{aiSuggestedCat.raw}</span>
                  <span className="text-[10px] text-emerald-600">({aiSuggestedCat.confidence}% confidence)</span>
                </div>
                {category !== aiSuggestedCat.mapped && (
                  <button
                    type="button"
                    onClick={() => setCategory(aiSuggestedCat.mapped)}
                    className="ml-2 rounded-lg bg-emerald-700 text-white px-2 py-0.5 text-[11px] font-bold hover:bg-emerald-800 active:scale-95 transition-all shrink-0"
                  >
                    Apply Category
                  </button>
                )}
              </div>
            )}
          </div>


          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-deepEmerald mb-1">
                {t('transactions.dateTimeLabel')}
              </label>
              <input
                type="datetime-local"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-2xl border border-white/85 bg-white/65 hover:bg-white/80 focus:bg-white/92 backdrop-blur-xl px-3 py-2 text-xs font-semibold text-textPrimary shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:border-primary/50 focus:ring-4 focus:ring-mint/30 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-deepEmerald mb-1">
                {t('transactions.workRefLabel')}{' '}
                <span className="text-[11px] font-normal text-textMuted">({t('common.optional')})</span>
              </label>
              <input
                type="text"
                value={workRef}
                onChange={(e) => setWorkRef(e.target.value)}
                placeholder="e.g. Zomato, Urban Company, Home"
                className="w-full rounded-2xl border border-white/85 bg-white/65 hover:bg-white/80 focus:bg-white/92 backdrop-blur-xl px-3 py-2 text-xs font-semibold text-textPrimary shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:border-primary/50 focus:ring-4 focus:ring-mint/30 focus:outline-none transition-all placeholder:text-textMuted"
              />
            </div>
          </div>

          </div>

          {/* Pinned Action Buttons Footer */}
          <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full px-5 py-2.5 text-xs font-bold text-textSecondary hover:bg-white transition-all active:scale-95"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="emerald-gradient-btn flex items-center gap-1.5 rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-lifted transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <AppIcon name="checkmark" size={15} />
              )}
              <span>{editingTx ? t('transactions.saveEdit') : t('transactions.saveTransaction')}</span>
            </button>
          </div>
        </form>
    </ModalPortal>
  );
}
