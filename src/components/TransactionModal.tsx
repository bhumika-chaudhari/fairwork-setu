import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../lib/icons';
import { useTransactions } from '../hooks/TransactionContext';
import type { Transaction, TransactionType, TransactionCategory } from '../types/transaction';
import { CATEGORY_ICONS, CATEGORY_TRANSLATION_KEYS } from '../services/transactionService';
import { normalizeIndicDigits } from '../lib/multilingualNumberParser';
import ModalPortal from './ModalPortal';

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
  const [validationError, setValidationError] = useState<string | null>(null);

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
    setType(preset.type);
    setAmount(preset.amount.toString());
    setCategory(preset.category);
    setDescription(preset.desc);
    if (preset.workRef) setWorkRef(preset.workRef);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const normalizedAmt = normalizeIndicDigits(amount.trim());
    const parsedAmount = parseFloat(normalizedAmt);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError(t('transactions.errorInvalidAmount'));
      return;
    }

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

      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
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
