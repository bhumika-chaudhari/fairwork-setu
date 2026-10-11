import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../lib/icons';
import { useTransactions } from '../hooks/TransactionContext';
import type { Transaction, TransactionType, TransactionCategory } from '../types/transaction';
import { CATEGORY_ICONS, CATEGORY_TRANSLATION_KEYS } from '../services/transactionService';

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

export default function TransactionModal({
  isOpen,
  onClose,
  initialType = 'income',
  editingTx = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
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
        const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setDateStr(isoLocal);
      } catch {
        setDateStr(new Date().toISOString().slice(0, 16));
      }
    } else {
      setType(initialType);
      setAmount('');
      setCategory(initialType === 'income' ? 'work_earnings' : 'food');
      setDescription('');
      setWorkRef('');
      const now = new Date();
      const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDateStr(isoLocal);
    }
    setValidationError(null);
    setIsSubmitting(false);
  }, [isOpen, editingTx, initialType]);

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

    const parsedAmount = parseFloat(amount.trim());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError(t('transactions.errorInvalidAmount'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse ISO timestamp
      let finalTimestamp = new Date().toISOString();
      if (dateStr) {
        finalTimestamp = new Date(dateStr).toISOString();
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-deepEmerald/30 p-4 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[32px] bg-white/80 p-6 shadow-glassModal border border-white/90 backdrop-blur-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent" />
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-glass ${
                type === 'income'
                  ? 'bg-successSoft/90 text-success border border-[#72E5C2]/60'
                  : 'bg-danger/15 text-danger border border-danger/30'
              }`}
            >
              <AppIcon name={type === 'income' ? 'arrow-up' : 'arrow-down'} size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-deepEmerald">
                {editingTx
                  ? t('transactions.editTitle')
                  : type === 'income'
                  ? t('transactions.addIncome')
                  : t('transactions.addExpense')}
              </h2>
              <p className="text-xs text-textSecondary font-medium">
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 hover:bg-white text-textMuted hover:text-deepEmerald border border-white/80 transition-all active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-danger/15 border border-danger/30 p-3 text-xs font-bold text-danger backdrop-blur-md">
            <AppIcon name="alert-circle" size={16} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                    ? 'bg-gradient-to-r from-[#073B3A] to-[#087F73] text-white shadow-dockActive border border-mint/40 font-black'
                    : 'text-textSecondary hover:text-deepEmerald active:scale-95'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_6px_#72E5C2]" />
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
                    className="rounded-full bg-white/70 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-deepEmerald border border-mint/50 shadow-xs hover:bg-white active:scale-95 transition-all"
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
                className="w-full rounded-2xl border border-white/85 bg-white/65 hover:bg-white/80 focus:bg-white/92 backdrop-blur-xl pl-9 pr-4 py-3 text-base font-black text-deepEmerald shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.02)] placeholder:text-textMuted focus:border-primary/50 focus:ring-4 focus:ring-mint/30 focus:outline-none transition-all"
              />
            </div>
            {/* Quick Amount Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(type === 'income' ? [200, 500, 750, 1000] : [20, 50, 100, 200]).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className="rounded-xl bg-white/65 hover:bg-white/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-deepEmerald border border-white/80 shadow-xs active:scale-95 transition-all"
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
                        ? 'bg-gradient-to-r from-[#073B3A] to-[#087F73] text-white shadow-dockActive border border-mint/40'
                        : 'bg-white/65 hover:bg-white/90 text-textPrimary border border-white/80 backdrop-blur-md shadow-xs'
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

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full px-5 py-2.5 text-xs font-bold text-textSecondary hover:bg-white/60 transition-all active:scale-95"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="emerald-gradient-btn flex items-center gap-1.5 rounded-full px-7 py-2.5 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
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
      </div>
    </div>
  );
}
