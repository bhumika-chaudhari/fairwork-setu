import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../lib/icons';
import { formatInr } from '../localization';
import ModalPortal from './ModalPortal';
import { useVoiceAssistant } from '../hooks/VoiceAssistantContext';
import {
  SetuContinuousSpeechRecognizer,
  type AssistantJobCard,
  type AssistantCourseCard,
  type AssistantEmergencyAlert,
} from '../services/voiceAssistantService';

interface UnifiedVoiceAssistantModalProps {
  visible?: boolean;
  onClose?: () => void;
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

const SCREEN_PROMPTS: Record<string, Array<{ label: string; text: string }>> = {
  kaam: [
    { label: 'Show matching jobs', text: 'Show matching jobs for my profile' },
    { label: 'My application status', text: 'Check my job application status' },
    { label: 'Delivery openings', text: 'Find delivery partner jobs near me' },
    { label: 'Electrician roles', text: 'Find residential electrician jobs' },
  ],
  dhan: [
    { label: 'Spent this week?', text: 'How much did I spend this week?' },
    { label: 'Forecast income', text: "Forecast tomorrow's income" },
    { label: 'Spent ₹150 on food', text: 'I spent ₹150 on food today' },
    { label: 'Earned ₹800 today', text: 'I earned ₹800 today' },
  ],
  sehat: [
    { label: 'What to do for fever?', text: 'What should I do for fever and body ache?' },
    { label: 'Nearest clinic / PHC', text: 'Where is the nearest government clinic or dispensary?' },
    { label: 'Ayushman Bharat cover', text: 'How does Ayushman Bharat cover gig workers?' },
    { label: 'Emergency ambulance', text: 'Call emergency ambulance 108' },
  ],
  kaushal: [
    { label: 'Recommend a course', text: 'Recommend a skill course for me' },
    { label: 'Electrician training', text: 'Show PMKVY electrician courses' },
    { label: 'Solar technician', text: 'Show solar panel technician training' },
    { label: 'Free certifications', text: 'What free government skill certificates can I earn?' },
  ],
  haq: [
    { label: 'What are my rights?', text: 'What are my legal rights as a gig worker?' },
    { label: 'Accident compensation', text: 'How do I claim accident compensation?' },
    { label: 'Deactivation rules', text: 'Can a platform deactivate my account without notice?' },
    { label: 'Draft grievance appeal', text: 'Help me draft an appeal against deactivation' },
  ],
  profile: [
    { label: 'Who am I?', text: 'Who am I and what is my registered profile?' },
    { label: 'Change language to Hindi', text: 'Change language to Hindi' },
    { label: 'Change language to Marathi', text: 'Change language to Marathi' },
    { label: 'Savings target progress', text: 'What is my current savings target?' },
  ],
  home: [
    { label: 'Show matching jobs', text: 'Show matching jobs' },
    { label: 'Spent ₹150 on food', text: 'I spent ₹150 on food today' },
    { label: 'Earned ₹800 today', text: 'I earned ₹800 today' },
    { label: 'Fever advice', text: 'What should I do for fever and weakness?' },
    { label: 'Recommend course', text: 'Recommend a course for me' },
  ],
};

const SCREEN_TITLES: Record<string, string> = {
  home: 'Home Dashboard',
  kaam: 'Work (Kaam)',
  dhan: 'Money (Dhan)',
  sehat: 'Health (Sehat)',
  kaushal: 'Skills (Kaushal)',
  haq: 'Rights (Haq Setu)',
  profile: 'Profile & Settings',
};

export default function UnifiedVoiceAssistantModal({
  visible: propVisible,
  onClose: propOnClose,
  initialQuery: propInitialQuery,
}: UnifiedVoiceAssistantModalProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  // Consume Centralized Voice Assistant Context
  const {
    isOpen: contextIsOpen,
    closeAssistant: contextClose,
    messages,
    sendMessage,
    isProcessing,
    currentScreen,
    pendingConfirmation,
    confirmPending,
    cancelPending,
    clearMessages,
    initialQuery: contextInitialQuery,
  } = useVoiceAssistant();

  // Combine prop and context states
  const isOpen = propVisible !== undefined ? propVisible : contextIsOpen;
  const handleClose = propOnClose || contextClose;
  const activeInitialQuery = propInitialQuery || contextInitialQuery;

  // Local UI & Recognition States
  const [mode, setMode] = useState<'voice' | 'chat'>('voice');
  const [inputText, setInputText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [silenceRemainingMs, setSilenceRemainingMs] = useState(5000);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  // References
  const recognizerRef = useRef<SetuContinuousSpeechRecognizer | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const currentLang = (i18n.language || 'en').toLowerCase().slice(0, 2);
  const speechLang = BCP47_LANGUAGE_MAP[currentLang] || 'hi-IN';

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimTranscript, isProcessing]);

  // Speech recognizer initialization & lifecycle
  useEffect(() => {
    if (!isOpen) {
      if (recognizerRef.current) {
        recognizerRef.current.cancel();
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    const userTimeoutSec = parseInt(
      localStorage.getItem('@setu/voice_silence_timeout') || '5',
      10
    );
    const configuredSilenceMs =
      (isNaN(userTimeoutSec) || userTimeoutSec < 2 ? 5 : userTimeoutSec) * 1000;

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
            sendMessage(finalText.trim());
          }
        },
        onError: (err) => {
          setIsListening(false);
          if (err === 'speech_not_supported') {
            setHasSpeechSupport(false);
            setErrorMessage(
              'Speech recognition is not supported in this browser. Please type below.'
            );
            setMode('chat');
          } else if (err === 'not-allowed') {
            setErrorMessage(
              'Microphone access was denied. Please allow microphone permissions or type below.'
            );
            setMode('chat');
          } else {
            setErrorMessage(`Microphone notice (${err}). You can speak again or type below.`);
          }
        },
        onStateChange: (state) => {
          setIsListening(state === 'listening');
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

    if (activeInitialQuery) {
      setMode('chat');
      sendMessage(activeInitialQuery);
    } else if (recognizer.isSupported()) {
      setMode('voice');
      recognizer.start();
    } else {
      setMode('chat');
    }

    return () => {
      recognizer.destroy();
      recognizerRef.current = null;
    };
  }, [isOpen, speechLang, activeInitialQuery, sendMessage]);

  const toggleListening = () => {
    if (!recognizerRef.current) return;
    if (isListening) {
      recognizerRef.current.stopAndFinalize();
    } else {
      setErrorMessage('');
      recognizerRef.current.start();
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handlePromptClick = (text: string) => {
    sendMessage(text);
  };

  if (!isOpen) return null;

  const screenPrompts = SCREEN_PROMPTS[currentScreen] || SCREEN_PROMPTS.home;
  const screenName = SCREEN_TITLES[currentScreen] || 'Setu App';

  return (
    <ModalPortal isOpen={isOpen} onClose={handleClose} maxWidthClass="sm:max-w-xl">
      <div className="flex flex-col h-[85vh] max-h-[720px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#F4EBDD]">
        {/* Header Bar */}
        <header className="shrink-0 px-5 py-3.5 bg-gradient-to-r from-white via-[#FDF8F0] to-white border-b border-[#F4EBDD] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-sm border border-[#F1B96B]/50">
              <AppIcon name="mic" size={17} className="text-white drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-[#1E2B3E] text-sm sm:text-base font-serif">
                  Setu Voice Assistant
                </h3>
                {/* Active Screen Context Pill */}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF7F8] text-[#3A757D] border border-[#3A757D]/30">
                  📍 {screenName}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Speaks Hindi, Marathi & English • Context-aware across Setu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Clear Chat Button */}
            <button
              type="button"
              onClick={clearMessages}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors text-xs font-semibold"
              title="Clear Conversation"
            >
              <AppIcon name="trash" size={16} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
              aria-label="Close Assistant"
            >
              <AppIcon name="close" size={20} />
            </button>
          </div>
        </header>

        {/* Conversation Message History */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-stone-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#B34A26] text-white rounded-br-xs font-medium'
                    : 'bg-white text-[#1E2B3E] border border-[#F4EBDD] rounded-bl-xs'
                }`}
              >
                {msg.text}

                {/* Render Job Cards if Present (Model 6) */}
                {msg.jobResults && msg.jobResults.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-stone-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Matched Openings (Model 6)
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.jobResults.map((job) => (
                        <div
                          key={job.id}
                          className="rounded-xl border border-[#F4EBDD] bg-[#FDF8F0]/70 p-2.5 space-y-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#1E2B3E] text-xs">
                                  {job.title}
                                </span>
                                {job.matchScore && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    {job.matchScore}% Match
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#7C2D16] block">
                                {job.employer} • {job.location}
                              </span>
                            </div>
                            <span className="text-[11px] font-black text-[#1E2B3E] shrink-0">
                              {job.pay}
                            </span>
                          </div>
                          {job.explanation && (
                            <p className="text-[10px] text-stone-600 bg-white/70 p-1.5 rounded-lg border border-[#F4EBDD]/60">
                              💡 {job.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render Course Recommendations if Present (Model 7) */}
                {msg.courseResults && msg.courseResults.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-stone-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Accredited Skill Courses (Model 7)
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.courseResults.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-[#F4EBDD] bg-[#FDF8F0]/70 p-2.5 space-y-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-[#1E2B3E] text-xs block">
                                {c.title}
                              </span>
                              <span className="text-[10px] text-[#7C2D16] block">
                                {c.provider}
                              </span>
                            </div>
                            {c.url && (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded-lg bg-[#B34A26] text-white text-[10px] font-bold hover:bg-[#7C2D16] shrink-0"
                              >
                                View Course
                              </a>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-500 block">
                            Skills: {c.skills}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render Emergency Alert if Present */}
                {msg.emergencyAlert && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-red-700">
                      <AppIcon name="alert-circle" size={16} />
                      <span>Immediate Emergency Actions</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${msg.emergencyAlert.primaryNumber}`}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs text-center shadow-xs"
                      >
                        Call 112 (National SOS)
                      </a>
                      <a
                        href={`tel:${msg.emergencyAlert.secondaryNumber}`}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs text-center shadow-xs"
                      >
                        Call 108 (Ambulance)
                      </a>
                    </div>
                  </div>
                )}

                {/* Render Navigation Action Button */}
                {msg.navigationAction && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        navigate(msg.navigationAction!.route);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#B34A26] text-white text-xs font-bold shadow-xs hover:bg-[#7C2D16] transition-all flex items-center gap-1.5"
                    >
                      <span>{msg.navigationAction.label}</span>
                      <AppIcon name="arrow-forward" size={13} />
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-stone-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}

          {/* Pending Transaction Confirmation Card */}
          {pendingConfirmation && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 space-y-3 shadow-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                  <AppIcon name="wallet" size={15} />
                  <span>Transaction Confirmation Required</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-800 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                  {formatInr(pendingConfirmation.totalAmount)}
                </span>
              </div>

              <p className="text-xs text-stone-700">
                {pendingConfirmation.summaryText}. Would you like to confirm and save this into your financial ledger?
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={confirmPending}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <AppIcon name="checkmark" size={14} />
                  <span>Confirm & Save</span>
                </button>
                <button
                  type="button"
                  onClick={cancelPending}
                  className="py-2 px-3 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Interim transcript while user is speaking */}
          {interimTranscript && (
            <div className="flex flex-col items-end">
              <div className="max-w-[85%] rounded-2xl p-3 bg-[#B34A26]/80 text-white text-xs sm:text-sm italic animate-pulse">
                {interimTranscript}...
              </div>
            </div>
          )}

          {/* Processing spinner indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 p-2 text-xs text-stone-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-[#B34A26] animate-ping" />
              <span>Setu Assistant analyzing request...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-rose-700 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Contextual Sample Suggestions for Current Screen */}
        <div className="shrink-0 px-4 py-2 bg-white border-t border-[#F4EBDD] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-stone-400 shrink-0 uppercase">
              Try:
            </span>
            {screenPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(p.text)}
                className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-[#FDF8F0] hover:text-[#B34A26] border border-stone-200 hover:border-[#F1B96B] text-[11px] font-semibold text-stone-700 whitespace-nowrap transition-all shadow-2xs"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Input & Voice Controls */}
        <footer className="shrink-0 p-4 bg-white border-t border-[#F4EBDD] space-y-3">
          {/* Mode Switcher & Listening Wave */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Mic Status Indicator / Toggle */}
              {hasSpeechSupport && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isListening
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <AppIcon name="mic" size={14} className={isListening ? 'text-rose-600' : ''} />
                  <span>{isListening ? `Listening (${Math.ceil(silenceRemainingMs / 1000)}s)` : 'Tap to Speak'}</span>
                </button>
              )}

              {/* Audio waveform visualizer when listening */}
              {isListening && (
                <div className="flex items-center gap-0.5 h-4">
                  <span className="w-1 bg-[#B34A26] h-2 rounded-full animate-pulse" />
                  <span className="w-1 bg-[#B34A26] h-4 rounded-full animate-bounce" />
                  <span className="w-1 bg-[#B34A26] h-3 rounded-full animate-pulse" />
                  <span className="w-1 bg-[#B34A26] h-4 rounded-full animate-bounce" />
                </div>
              )}
            </div>

            <span className="text-[10px] text-stone-400 font-medium">
              Lang: {currentLang.toUpperCase()} (Voice + Text)
            </span>
          </div>

          {/* Text input form for typed queries */}
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask about ${screenName} or speak Hindi/Marathi/English...`}
              className="flex-1 rounded-2xl border border-[#F4EBDD] bg-stone-50 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1E2B3E] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="p-2.5 rounded-2xl bg-[#B34A26] hover:bg-[#7C2D16] text-white disabled:opacity-40 transition-all shadow-xs active:scale-95"
              aria-label="Send Message"
            >
              <AppIcon name="arrow-forward" size={18} />
            </button>
          </form>
        </footer>
      </div>
    </ModalPortal>
  );
}
