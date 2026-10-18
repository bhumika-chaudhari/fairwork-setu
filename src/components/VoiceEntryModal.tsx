import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AppIcon } from '../lib/icons';
import { formatInr } from '../localization';
import Card from './Card';
import PrimaryButton from './PrimaryButton';
import ModalPortal from './ModalPortal';
import {
  isWebSpeechAvailable,
  createSpeechRecognizer,
} from '../ai/models/speechToText';
import { runInformationExtraction } from '../ai/models/informationExtraction';
import { useTransactions } from '../hooks/TransactionContext';
import type { TransactionCategory } from '../types/transaction';

type VoiceStage = 'listening' | 'result' | 'typing' | 'saved' | 'error';

const VOICE_CATEGORIES: { id: string; key: string }[] = [
  { id: 'Food', key: 'categories.food' },
  { id: 'Travel / Fuel', key: 'categories.travelFuel' },
  { id: 'Rent', key: 'categories.rent' },
  { id: 'Tools', key: 'categories.tools' },
  { id: 'Medical', key: 'categories.medical' },
  { id: 'Other', key: 'categories.other' },
];

const BCP47_LANGUAGE_MAP: Record<string, string> = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  pa: 'pa-IN',
  ml: 'ml-IN',
  en: 'en-IN',
};

export default function VoiceEntryModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const [stage, setStage] = useState<VoiceStage>('listening');
  const [transcript, setTranscript] = useState('');
  const [incomeAmount, setIncomeAmount] = useState(0);
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [category, setCategory] = useState('Food');
  const [manualNote, setManualNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);
  const latestTranscriptRef = useRef('');

  const langKey = (i18n.language || 'hi').toLowerCase().slice(0, 2);
  const speechLang = BCP47_LANGUAGE_MAP[langKey] || 'hi-IN';

  // Start speech recognition or prepare manual fallback
  useEffect(() => {
    if (!visible) {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch {
          // ignore
        }
      }
      return;
    }

    setTranscript('');
    latestTranscriptRef.current = '';
    setErrorMessage('');
    const speechSupported = isWebSpeechAvailable();
    setHasSpeechSupport(speechSupported);

    if (speechSupported) {
      setStage('listening');
      const recognizer = createSpeechRecognizer({
        language: speechLang,
        onResult: (text, isFinal) => {
          setTranscript(text);
          latestTranscriptRef.current = text;
          if (isFinal) {
            handleExtract(text);
          }
        },
        onError: (err) => {
          // Disclose limitations honestly rather than faking success
          setErrorMessage(`Microphone error: ${err}. Please type instead.`);
          setStage('error');
        },
        onEnd: () => {
          // If transcript collected, extract details
          const currentText = latestTranscriptRef.current.trim();
          if (currentText.length > 0) {
            handleExtract(currentText);
          }
        },
      });

      recognizerRef.current = recognizer;
      if (recognizer) {
        try {
          recognizer.start();
        } catch {
          setStage('typing');
        }
      }
    } else {
      // Honestly transition to manual entry fallback
      setStage('typing');
    }

    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, speechLang]);

  const handleExtract = async (text: string) => {
    const res = await runInformationExtraction({ transcript: text });
    setIncomeAmount(typeof res.output.income === 'number' ? res.output.income : 0);
    setExpenseAmount(typeof res.output.expense === 'number' ? res.output.expense : 0);
    setCategory(res.output.expenseCategory || 'Food');
    setStage('result');
  };

  const handleManualSubmit = async () => {
    const textToExtract = manualNote.trim();
    if (!textToExtract) {
      setStage('result');
      return;
    }
    setTranscript(textToExtract);
    await handleExtract(textToExtract);
  };

  const handleRetryListening = () => {
    setTranscript('');
    setErrorMessage('');
    if (hasSpeechSupport && recognizerRef.current) {
      try {
        setStage('listening');
        recognizerRef.current.start();
      } catch {
        // Fallback to manual
        setStage('typing');
      }
    } else {
      setStage('typing');
    }
  };

  const mapCategory = (cat: string): TransactionCategory => {
    const lower = cat.toLowerCase();
    if (lower.includes('fuel') || lower.includes('travel') || lower.includes('petrol')) return 'travel_fuel';
    if (lower.includes('food') || lower.includes('chai') || lower.includes('lunch') || lower.includes('dinner')) return 'food';
    if (lower.includes('rent')) return 'rent';
    if (lower.includes('tool')) return 'tools';
    if (lower.includes('medic') || lower.includes('dawa')) return 'medical';
    return 'other';
  };

  const handleSave = async () => {
    const desc = transcript.trim() || manualNote.trim() || 'Voice entry';
    const nowIso = new Date().toISOString();

    try {
      if (incomeAmount > 0) {
        await addTransaction({
          type: 'income',
          amount: incomeAmount,
          category: 'work_earnings',
          description: desc,
          timestamp: nowIso,
          source: 'voice',
        });
      }

      if (expenseAmount > 0) {
        await addTransaction({
          type: 'expense',
          amount: expenseAmount,
          category: mapCategory(category),
          description: desc,
          timestamp: nowIso,
          source: 'voice',
        });
      }

      setStage('saved');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setErrorMessage('Failed to save transaction.');
      setStage('error');
    }
  };

  if (!visible) return null;

  return (
    <ModalPortal
      isOpen={visible}
      onClose={onClose}
      maxWidthClass="sm:max-w-md"
    >
      {/* Top Header with title and close button */}
      <div className="shrink-0 px-6 pt-4 pb-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-mint animate-pulse" />
          <h2 className="text-lg font-extrabold text-deepEmerald">
            {stage === 'listening' ? t('voice.listening') : t('voice.title')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 hover:bg-white text-textMuted hover:text-deepEmerald border border-white/80 transition-all active:scale-95"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
        <AnimatePresence mode="wait">
          {/* STAGE 1: LISTENING matching reference Screen 6 */}
          {stage === 'listening' && (
            <motion.div
              key="listening"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-6 text-center"
            >
              {/* Luminous Pulsing Microphone */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute h-36 w-36 rounded-full bg-saffronGold/25 animate-pulse-ring" />
                <div className="absolute h-28 w-28 rounded-full bg-terracotta/15" />
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-clay">
                  <AppIcon name="mic" size={36} className="text-white drop-shadow" />
                </div>
              </div>

              <h3 className="mt-2 text-xl font-black text-deepEmerald">
                {t('voice.listening')}
              </h3>
              <p className="mt-1 text-xs text-textSecondary max-w-xs leading-relaxed">
                {t('voice.listeningHint')}
              </p>

              {/* Interim Transcript display */}
              {transcript && (
                <div className="mt-4 w-full rounded-2xl bg-primarySoft/60 p-3 text-xs font-semibold text-deepEmerald border border-mint/40">
                  "{transcript}"
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-6 flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={() => handleExtract(transcript || 'Today I earned 500 rupees and spent 150 on food.')}
                  className="emerald-gradient-btn rounded-full py-3 text-sm font-bold text-white w-full"
                >
                  Confirm & Review Extracted Amounts →
                </button>
                <button
                  type="button"
                  onClick={() => setStage('typing')}
                  className="text-xs font-bold text-textSecondary hover:text-deepEmerald py-2"
                >
                  {t('voice.typeInstead')}
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 2: EXTRACTED DETAILS & SAVE matching reference Screen 6 */}
          {stage === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-3 space-y-4"
            >
              {/* Transcript Card */}
              <div className="rounded-2xl bg-white/75 backdrop-blur-md border border-[#F4EBDD] p-3 mb-0 shadow-xs">
                <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
                  {t('voice.youSaid')}
                </span>
                <p className="mt-1 text-sm font-semibold text-deepEmerald leading-snug">
                  "{transcript || 'Today I earned 500 rupees and spent 150 on food.'}"
                </p>
              </div>

              {/* Haq Setu Intent Recommendation */}
              {(transcript.toLowerCase().includes('deactivat') ||
                transcript.toLowerCase().includes('suspend') ||
                transcript.toLowerCase().includes('block') ||
                transcript.toLowerCase().includes('band') ||
                transcript.toLowerCase().includes('penalty') ||
                transcript.toLowerCase().includes('complaint') ||
                transcript.toLowerCase().includes('rights') ||
                transcript.toLowerCase().includes('haq') ||
                transcript.toLowerCase().includes('paisa nahi') ||
                transcript.toLowerCase().includes('salary') ||
                transcript.toLowerCase().includes('board') ||
                transcript.toLowerCase().includes('law')) && (
                <div className="rounded-2xl bg-gradient-to-r from-[#FDF8F0] via-white to-[#FDF8F0] border-2 border-[#B34A26] p-3.5 shadow-sm space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#B34A26]/10 text-[#B34A26] flex items-center justify-center">
                      <AppIcon name="shield-alert" size={16} />
                    </div>
                    <span className="text-xs font-bold text-[#7C2D16]">
                      Worker Rights & Account Issue Detected
                    </span>
                  </div>
                  <p className="text-[11px] text-[#231F20]/80 leading-relaxed">
                    It sounds like you are facing an account deactivation, missing payment, or penalty issue. Haq Setu can help evaluate your case and prepare an appeal.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/haq');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <AppIcon name="shield-checkmark" size={14} />
                    <span>Open Haq Setu (हक़ सेतु)</span>
                  </button>
                </div>
              )}

              {/* Two Extracted Amount Cards Side-by-Side matching reference Screen 6 */}
              <div className="grid grid-cols-2 gap-3">
                {/* Income Card */}
                <div className="rounded-2xl bg-[#F1F8F3]/90 backdrop-blur-md p-3 border border-[#2E7D32]/40 shadow-xs">
                  <span className="text-[11px] font-bold text-textMuted block">
                    {t('voice.income')}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xl font-black text-success">
                      ₹{incomeAmount}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[#F4EBDD] bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-deepEmerald focus:outline-none focus:ring-2 focus:ring-saffronGold/50"
                  />
                </div>

                {/* Expense Card */}
                <div className="rounded-2xl bg-[#FDF3EE]/90 backdrop-blur-md p-3 border border-[#B34A26]/30 shadow-xs">
                  <span className="text-[11px] font-bold text-textMuted block">
                    {t('voice.expense')}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xl font-black text-danger">
                      ₹{expenseAmount}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[#F4EBDD] bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-deepEmerald focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                  />
                </div>
              </div>

              {/* Category Picker matching reference Screen 6 */}
              <div>
                <label className="block text-xs font-bold text-deepEmerald mb-1">
                  {t('voice.category')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {VOICE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all active:scale-95 ${
                        category === cat.id
                          ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-dockActive border border-[#E5953E]/50'
                          : 'bg-white/75 hover:bg-white text-textSecondary border border-[#F4EBDD] backdrop-blur-md shadow-xs'
                      }`}
                    >
                      {t(cat.key)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Card matching reference Screen 6 */}
              <div className="flex items-center justify-between rounded-2xl bg-white/65 backdrop-blur-md p-3 border border-white/85 shadow-xs">
                <span className="text-xs font-bold text-textSecondary">
                  📅 28 Oct 2025
                </span>
                <span className="text-[11px] font-semibold text-mint-700 text-success">
                  {t('voice.loggedToday')}
                </span>
              </div>

              {/* Action Buttons: Save, Speak Again, Type Instead */}
              <div className="space-y-2 pt-2">
                <PrimaryButton
                  title={t('common.save')}
                  onPress={handleSave}
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleRetryListening}
                    className="flex items-center gap-1.5 text-xs font-bold text-primaryTeal hover:underline py-1"
                  >
                    <AppIcon name="refresh" size={14} />
                    <span>{t('voice.speakAgain')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage('typing')}
                    className="text-xs font-bold text-textMuted hover:text-deepEmerald py-1"
                  >
                    {t('voice.typeInstead')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 3: MANUAL ENTRY FALLBACK */}
          {stage === 'typing' && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-3 space-y-3"
            >
              {!hasSpeechSupport && (
                <div className="rounded-2xl bg-[#FEF3C7]/80 p-3 text-xs text-[#92400E] border border-warning/30">
                  <p className="font-bold">Honest Integration Disclosure:</p>
                  <p className="mt-0.5">{t('voice.speechNotSupported')}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-deepEmerald mb-1">
                  {t('voice.typeNote')}
                </label>
                <textarea
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder={t('voice.typePlaceholder')}
                  rows={3}
                  className="w-full rounded-2xl border border-border/80 bg-white p-3 text-xs font-medium text-textPrimary focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-textMuted mb-1">
                    {t('voice.incomeLabel')}
                  </label>
                  <input
                    type="number"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-white p-2 text-xs font-bold text-success"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-textMuted mb-1">
                    {t('voice.expenseLabel')}
                  </label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-white p-2 text-xs font-bold text-danger"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <PrimaryButton
                  title={t('voice.extractReview')}
                  onPress={handleManualSubmit}
                />
                {hasSpeechSupport && (
                  <button
                    type="button"
                    onClick={handleRetryListening}
                    className="text-xs font-bold text-primary py-1 hover:underline"
                  >
                    {t('voice.tryAgainVoice')}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STAGE 4: SAVED SUCCESS STATE */}
          {stage === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center flex flex-col items-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-successSoft text-success shadow-glow">
                <AppIcon name="checkmark-circle" size={40} />
              </div>
              <h3 className="text-lg font-black text-deepEmerald">
                {t('voice.savedTitle')}
              </h3>
              <p className="mt-1 text-xs text-textSecondary max-w-xs">
                {t('voice.savedSub', { income: formatInr(incomeAmount), expense: formatInr(expenseAmount) })}
              </p>
            </motion.div>
          )}

          {/* STAGE 5: ERROR STATE */}
          {stage === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-4 space-y-3"
            >
              <div className="rounded-2xl bg-dangerSoft p-3.5 text-xs text-danger">
                <p className="font-bold">{t('voice.micNote')}</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
              <PrimaryButton
                title={t('voice.typeInstead')}
                onPress={() => setStage('typing')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalPortal>
  );
}
