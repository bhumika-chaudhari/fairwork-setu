import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AppIcon } from '../lib/icons';
import { formatInr } from '../localization';
import ModalPortal from './ModalPortal';
import { useTransactions } from '../hooks/TransactionContext';
import { useProfile } from '../hooks/ProfileContext';
import {
  SetuContinuousSpeechRecognizer,
  processUserUtterance,
  detectSpokenLanguage,
  type AssistantMessage,
  type AssistantPendingConfirmation,
  type SupportedLanguage,
} from '../services/voiceAssistantService';

interface UnifiedVoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
}

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

const SAMPLE_PROMPTS = [
  { label: 'Spent ₹150 on food', text: 'I spent ₹150 on food today' },
  { label: 'Earned ₹800 today', text: 'I earned ₹800 today' },
  { label: '₹50 tea, ₹100 petrol, ₹200 grocery', text: 'Add expenses: ₹50 for tea, ₹100 for petrol, and ₹200 for groceries' },
  { label: 'Spent this week?', text: 'How much did I spend this week?' },
  { label: 'Electrician jobs near me', text: 'Find electrician jobs near me' },
  { label: 'Fever since yesterday', text: 'I have a fever and weakness since yesterday' },
];

export default function UnifiedVoiceAssistantModal({
  visible,
  onClose,
  initialQuery,
}: UnifiedVoiceAssistantModalProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { transactions, summary, addTransaction } = useTransactions();

  // Assistant State
  const [mode, setMode] = useState<'voice' | 'chat'>('voice');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [silenceRemainingMs, setSilenceRemainingMs] = useState(5000);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const [pendingConfirmation, setPendingConfirmation] = useState<AssistantPendingConfirmation | null>(null);

  // References
  const recognizerRef = useRef<SetuContinuousSpeechRecognizer | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const currentLang = (i18n.language || 'hi').toLowerCase().slice(0, 2);
  const speechLang = BCP47_LANGUAGE_MAP[currentLang] || 'hi-IN';

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimTranscript, isProcessing]);

  // Initial welcome message
  useEffect(() => {
    if (visible && messages.length === 0) {
      const welcomeText =
        currentLang === 'hi'
          ? 'नमस्ते! मैं आपका सेतू आवाज सहायक हूँ। आप बोलकर कमाई, खर्चे दर्ज कर सकते हैं, काम ढूंढ सकते हैं या योजनाएं जान सकते हैं।'
          : currentLang === 'mr'
          ? 'नमस्कार! मी तुमचा सेतू आवाज सहाय्यक आहे. तुम्ही बोलून किंवा लिहून खर्च, कमाई, काम शोधू शकता.'
          : 'Hello! I am your Setu AI Assistant. Speak or type to record expenses, track income, find jobs, or get health guidance.';

      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          text: welcomeText,
          timestamp: new Date().toISOString(),
          lang: currentLang as SupportedLanguage,
          intent: 'welcome',
        },
      ]);
    }
  }, [visible, currentLang, messages.length]);

  // Speech recognizer initialization & lifecycle
  useEffect(() => {
    if (!visible) {
      if (recognizerRef.current) {
        recognizerRef.current.cancel();
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    // Initialize continuous recognizer with configurable silence detection
    const userTimeoutSec = parseInt(
      localStorage.getItem('@setu/voice_silence_timeout') || '5',
      10
    );
    const configuredSilenceMs = (isNaN(userTimeoutSec) || userTimeoutSec < 2 ? 5 : userTimeoutSec) * 1000;

    const recognizer = new SetuContinuousSpeechRecognizer(
      {
        onInterim: (text) => {
          setInterimTranscript(text);
          setErrorMessage('');
        },
        onSilenceTick: (remainingMs) => {
          setSilenceRemainingMs(remainingMs);
        },
        onSilenceFinalized: (finalText) => {
          setIsListening(false);
          setInterimTranscript('');
          if (finalText.trim()) {
            handleProcessUtterance(finalText.trim());
          }
        },
        onError: (err) => {
          setIsListening(false);
          if (err === 'speech_not_supported') {
            setHasSpeechSupport(false);
            setErrorMessage('Speech recognition is not supported in this browser. Please use the text chat below.');
            setMode('chat');
          } else if (err === 'not-allowed') {
            setErrorMessage('Microphone access denied. Please check browser microphone permissions or type below.');
            setMode('chat');
          } else {
            setErrorMessage(`Microphone error (${err}). You can speak again or type below.`);
          }
        },
        onStateChange: (state) => {
          setIsListening(state === 'listening');
          setIsProcessing(state === 'processing');
        },
      },
      {
        silenceDurationMs: configuredSilenceMs,
        language: speechLang,
      }
    );

    recognizerRef.current = recognizer;
    setSilenceRemainingMs(configuredSilenceMs);
    setHasSpeechSupport(recognizer.isSupported());

    // If initial query passed, execute directly
    if (initialQuery) {
      setMode('chat');
      handleProcessUtterance(initialQuery);
    } else if (recognizer.isSupported()) {
      // Start listening automatically
      setMode('voice');
      recognizer.start();
    } else {
      setMode('chat');
    }

    return () => {
      recognizer.destroy();
      recognizerRef.current = null;
    };
  }, [visible, speechLang]);

  // Process user utterance through conversational assistant service
  const handleProcessUtterance = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: AssistantMessage = {
      id: userMsgId,
      role: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
      lang: detectSpokenLanguage(userText),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setInterimTranscript('');
    setIsProcessing(true);

    try {
      // Build context
      const contextState = {
        pendingConfirmation,
        lastIntent: messages[messages.length - 1]?.intent || null,
        userProfile: {
          name: profile.name,
          workType: profile.workType,
          cityKey: profile.cityKey,
          savingsGoal: profile.savingsGoal,
        },
        transactions,
        summary: {
          todayIncome: summary.todayIncome,
          todayExpense: summary.todayExpense,
          todayNet: summary.todayNet,
          weeklyIncome: summary.weeklyIncome,
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          netForPeriod: summary.netForPeriod,
        },
      };

      const reply = await processUserUtterance(userText, contextState);

      // Check if user confirmed execution via voice
      if (reply.intent === 'confirm_execution' && pendingConfirmation) {
        await executeConfirmedTransactions(pendingConfirmation);
        setPendingConfirmation(null);
      } else if (reply.pendingConfirmation) {
        setPendingConfirmation(reply.pendingConfirmation);
      } else if (reply.intent === 'cancel_pending') {
        setPendingConfirmation(null);
      }

      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      console.error('Error processing assistant utterance:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'I ran into an issue processing that. Please try again or type your command.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Commit confirmed transactions into TransactionContext
  const executeConfirmedTransactions = async (conf: AssistantPendingConfirmation) => {
    try {
      for (const item of conf.items) {
        await addTransaction({
          type: item.type,
          amount: item.amount,
          category: item.category,
          description: item.description,
          timestamp: item.dateStr || new Date().toISOString(),
          source: 'voice',
        });
      }
    } catch (err) {
      console.error('Failed to commit confirmed transaction:', err);
    }
  };

  // Manual Confirmation from UI Card
  const handleConfirmAction = async () => {
    if (!pendingConfirmation) return;
    await executeConfirmedTransactions(pendingConfirmation);

    const successMsg: AssistantMessage = {
      id: `success-${Date.now()}`,
      role: 'assistant',
      text: `✓ Confirmed and added ${pendingConfirmation.items.length === 1 ? 'transaction' : `${pendingConfirmation.items.length} transactions`} totaling ${formatInr(pendingConfirmation.totalAmount)} into your records.`,
      timestamp: new Date().toISOString(),
      executedSummary: `Added ${formatInr(pendingConfirmation.totalAmount)}`,
    };
    setMessages((prev) => [...prev, successMsg]);
    setPendingConfirmation(null);
  };

  const handleCancelAction = () => {
    setPendingConfirmation(null);
    const cancelMsg: AssistantMessage = {
      id: `cancel-${Date.now()}`,
      role: 'assistant',
      text: 'Transaction cancelled. No changes were made to your records.',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, cancelMsg]);
  };

  const handleToggleVoice = () => {
    if (isListening) {
      recognizerRef.current?.stopAndFinalize();
    } else {
      setMode('voice');
      setErrorMessage('');
      recognizerRef.current?.start();
    }
  };

  const handleStopAndSend = () => {
    if (recognizerRef.current && interimTranscript.trim()) {
      recognizerRef.current.stopAndFinalize();
    } else if (interimTranscript.trim()) {
      handleProcessUtterance(interimTranscript.trim());
    }
  };

  if (!visible) return null;

  return (
    <ModalPortal
      isOpen={visible}
      onClose={() => {
        recognizerRef.current?.cancel();
        onClose();
      }}
      maxWidthClass="sm:max-w-xl"
      panelClassName="bg-[#FFFDF9]/95 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(7,59,58,0.2),inset_0_1px_1.5px_rgba(255,255,255,0.95)] rounded-t-[28px] sm:rounded-[32px] overflow-hidden"
    >
      <div className="flex flex-col w-full h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
          {/* TOP PINNED HEADER */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[#F4EBDD] bg-white/70 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-clay">
                <AppIcon name="mic" size={18} className="drop-shadow" />
                {isListening && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffronGold opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-terracotta border border-white" />
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-deepEmerald leading-tight">
                  {t('voice.assistantTitle', 'Setu Multilingual Assistant')}
                </h3>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">
                  {isListening
                    ? `Listening (${(silenceRemainingMs / 1000).toFixed(1)}s silence window)`
                    : isProcessing
                    ? 'Processing with Setu AI...'
                    : 'Online • Hindi / Marathi / English'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mode Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (mode === 'voice') {
                    recognizerRef.current?.cancel();
                    setMode('chat');
                  } else {
                    setMode('voice');
                    recognizerRef.current?.start();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F4EBDD]/60 hover:bg-[#F4EBDD] text-deepEmerald transition-colors"
                title={mode === 'voice' ? 'Switch to text chat' : 'Switch to voice listening'}
              >
                <AppIcon name={mode === 'voice' ? 'chatbubble-ellipses' : 'mic'} size={13} />
                <span>{mode === 'voice' ? 'Type' : 'Voice'}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  recognizerRef.current?.cancel();
                  onClose();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 hover:bg-rose-50 text-textSecondary hover:text-rose-600 transition-colors border border-white/80 active:scale-95"
                aria-label="Close Assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-3 space-y-3">
            {/* VOICE RECORDING HERO SCREEN (When in voice mode) */}
            {mode === 'voice' && (
              <div className="flex flex-col items-center py-4 text-center">
                {/* Luminous Pulsing Microphone Visualizer */}
                <div
                  onClick={handleToggleVoice}
                  className="relative my-3 flex items-center justify-center cursor-pointer select-none group"
                >
                  {isListening && (
                    <>
                      <div className="absolute h-36 w-36 rounded-full bg-saffronGold/20 animate-pulse-ring" />
                      <div className="absolute h-28 w-28 rounded-full bg-terracotta/15 animate-ping" />
                    </>
                  )}
                  <div
                    className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-clay transition-transform duration-200 group-hover:scale-105 group-active:scale-95 ${
                      isListening
                        ? 'bg-gradient-to-br from-[#B34A26] to-[#7C2D16] ring-4 ring-saffronGold/50'
                        : 'bg-[#5A6B65]'
                    }`}
                  >
                    <AppIcon name="mic" size={32} className="text-white drop-shadow" />
                  </div>
                </div>

                {/* Status & 5-Second Silence Countdown Indicator */}
                <div className="w-full max-w-xs mt-2">
                  <h4 className="text-base font-black text-deepEmerald">
                    {isListening ? 'Listening to your voice...' : 'Microphone Paused'}
                  </h4>
                  <p className="text-xs text-textSecondary mt-0.5 leading-snug">
                    {isListening
                      ? 'Speak naturally with pauses. Will submit after 5 seconds of silence, or tap below to send instantly.'
                      : 'Tap the microphone to start speaking.'}
                  </p>

                  {/* Visual Silence Progress Bar */}
                  {isListening && (
                    <div className="mt-3 w-full bg-[#E8DCCB] h-2 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-saffronGold to-terracotta h-full transition-all duration-100 ease-linear"
                        style={{ width: `${(silenceRemainingMs / 5000) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Real-time Interim Transcript Preview */}
                {interimTranscript && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 w-full rounded-2xl bg-white/80 border border-[#E5953E]/40 p-3.5 shadow-sm text-left"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-terracotta">
                      Live Transcript (Continuous)
                    </span>
                    <p className="text-sm font-semibold text-deepEmerald mt-1 italic">
                      "{interimTranscript}"
                    </p>
                  </motion.div>
                )}

                {/* Error message if microphone issue */}
                {errorMessage && (
                  <div className="mt-3 w-full rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Voice Action Buttons */}
                <div className="mt-4 flex items-center justify-center gap-2.5 w-full max-w-sm">
                  {isListening && interimTranscript && (
                    <button
                      type="button"
                      onClick={handleStopAndSend}
                      className="flex-1 emerald-gradient-btn rounded-full py-2.5 px-4 text-xs font-extrabold text-white shadow-sm hover:scale-[1.02] active:scale-95"
                    >
                      Send Now (Don't Wait 5s) →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      recognizerRef.current?.cancel();
                      setIsListening(false);
                      setMode('chat');
                    }}
                    className="px-4 py-2.5 rounded-full text-xs font-bold text-textSecondary hover:text-deepEmerald bg-white/80 border border-[#F4EBDD]"
                  >
                    Type Instead
                  </button>
                </div>
              </div>
            )}

            {/* CONVERSATION MESSAGE THREAD */}
            <div className="space-y-3 pt-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white rounded-br-xs'
                        : 'bg-white/90 text-deepEmerald border border-[#F4EBDD] rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* ACTION CARD: PENDING TRANSACTION CONFIRMATION */}
                  {msg.pendingConfirmation && pendingConfirmation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 w-full max-w-md rounded-2xl bg-white border-2 border-[#E5953E] p-3.5 shadow-lifted"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDD]">
                        <span className="text-[11px] font-black uppercase tracking-wider text-terracotta">
                          Confirm Action Before Saving
                        </span>
                        <span className="text-xs font-extrabold text-deepEmerald">
                          Total: {formatInr(msg.pendingConfirmation.totalAmount)}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="mt-2 space-y-2">
                        {msg.pendingConfirmation.items.map((it, idx) => (
                          <div
                            key={it.id || idx}
                            className="flex items-center justify-between p-2 rounded-xl bg-[#FAF5EE] text-xs font-bold"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  it.type === 'income'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {it.type}
                              </span>
                              <span className="text-deepEmerald truncate max-w-[150px]">
                                {it.description}
                              </span>
                            </div>
                            <span className="text-sm font-black text-deepEmerald">
                              {formatInr(it.amount)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Note for worker */}
                      <p className="text-[10px] text-textMuted mt-2 italic">
                        Say "Yes / Haan / Confirm" or tap below. Say "Change that to ₹xxx" to adjust amount.
                      </p>

                      {/* Confirmation Buttons */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmAction}
                          className="flex-1 emerald-gradient-btn rounded-xl py-2 px-3 text-xs font-bold text-white shadow-sm hover:scale-[1.02] active:scale-95"
                        >
                          Confirm & Save ✓
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelAction}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-textSecondary hover:bg-rose-50 hover:text-rose-700 bg-[#F4EBDD]/50 border border-transparent"
                        >
                          Cancel ✕
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ACTION CARD: JOB RESULTS */}
                  {msg.jobResults && msg.jobResults.length > 0 && (
                    <div className="mt-2 w-full max-w-md space-y-2">
                      {msg.jobResults.map((job) => (
                        <div
                          key={job.id}
                          className="p-3 rounded-2xl bg-white/95 border border-[#F4EBDD] shadow-xs flex items-center justify-between hover:border-terracotta/40 transition-colors"
                        >
                          <div>
                            <h5 className="text-xs font-black text-deepEmerald">{job.title}</h5>
                            <p className="text-[11px] text-textSecondary">{job.employer} • {job.location}</p>
                            <span className="text-xs font-extrabold text-terracotta">{job.pay}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate('/kaam');
                            }}
                            className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#F4EBDD] hover:bg-terracotta hover:text-white text-deepEmerald transition-colors"
                          >
                            View Job →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ACTION CARD: SKILL COURSE RESULTS */}
                  {msg.courseResults && msg.courseResults.length > 0 && (
                    <div className="mt-2 w-full max-w-md space-y-2">
                      {msg.courseResults.map((course) => (
                        <div
                          key={course.id}
                          className="p-3 rounded-2xl bg-white/95 border border-[#F4EBDD] shadow-xs flex items-center justify-between hover:border-terracotta/40 transition-colors"
                        >
                          <div>
                            <span className="text-[9px] font-extrabold text-terracotta uppercase">{course.provider}</span>
                            <h5 className="text-xs font-black text-deepEmerald">{course.title}</h5>
                            <p className="text-[10px] text-textSecondary line-clamp-1">{course.skills}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate('/kaushal');
                            }}
                            className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#F4EBDD] hover:bg-terracotta hover:text-white text-deepEmerald transition-colors shrink-0 ml-2"
                          >
                            Explore →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ACTION CARD: HEALTH EMERGENCY ALERT */}
                  {msg.emergencyAlert && (
                    <div className="mt-2 w-full max-w-md p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-500 shadow-md">
                      <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-wider">
                        <AppIcon name="warning" size={16} className="text-rose-600" />
                        <span>Emergency Assistance</span>
                      </div>
                      <p className="text-xs text-rose-950 font-medium mt-1 leading-relaxed">
                        {msg.emergencyAlert.advice}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={`tel:${msg.emergencyAlert.primaryNumber}`}
                          className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs text-center shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <AppIcon name="call" size={13} />
                          <span>Call 112 (Police & Emergency)</span>
                        </a>
                        <a
                          href={`tel:${msg.emergencyAlert.secondaryNumber}`}
                          className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs text-center shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <AppIcon name="call" size={13} />
                          <span>Call 108 (Ambulance)</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* ACTION CARD: NAVIGATION SHORTCUT */}
                  {msg.navigationAction && (
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate(msg.navigationAction!.route);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-terracotta hover:underline"
                      >
                        <span>{msg.navigationAction.label}</span> →
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs font-bold text-textMuted py-2">
                  <div className="h-2 w-2 rounded-full bg-terracotta animate-ping" />
                  <span>Setu AI is analyzing...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          </div>

          {/* BOTTOM SUGGESTION PILLS (Quick Taps) */}
          <div className="shrink-0 px-4 py-2 bg-[#F9F4EC]/80 border-t border-[#F4EBDD] overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleProcessUtterance(prompt.text)}
                className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white border border-[#E8DCCB] text-textSecondary hover:border-terracotta hover:text-deepEmerald transition-colors active:scale-95 shrink-0"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* BOTTOM TYPED / MIC INPUT BAR */}
          <div className="shrink-0 p-3 sm:p-4 bg-white/90 border-t border-[#F4EBDD] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputText.trim()) {
                  handleProcessUtterance(inputText.trim());
                }
              }}
              placeholder="Speak or type (e.g. 'Spent 150 on food', 'Electrician jobs')..."
              className="flex-1 rounded-full border border-[#E8DCCB] bg-[#FFFDF9] px-4 py-2.5 text-xs sm:text-sm font-medium text-deepEmerald placeholder:text-textMuted focus:border-terracotta focus:outline-none shadow-xs"
            />

            {/* Quick Voice Mic Toggle Button inside bar */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-warm transition-transform active:scale-95 ${
                isListening
                  ? 'bg-rose-600 ring-2 ring-rose-300'
                  : 'bg-gradient-to-br from-[#B34A26] to-[#7C2D16]'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
              aria-label="Toggle Microphone"
            >
              <AppIcon name="mic" size={18} />
            </button>

            {/* Send Button for typed message */}
            <button
              type="button"
              disabled={!inputText.trim()}
              onClick={() => {
                if (inputText.trim()) {
                  handleProcessUtterance(inputText.trim());
                }
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#073B3A] text-white shadow-warm disabled:opacity-40 transition-transform active:scale-95"
              aria-label="Send Message"
            >
              <AppIcon name="paper-plane" size={16} />
            </button>
          </div>
        </div>
      </ModalPortal>
    );
  }
