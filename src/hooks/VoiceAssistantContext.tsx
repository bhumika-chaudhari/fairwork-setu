import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from './ProfileContext';
import { useTransactions } from './TransactionContext';
import {
  processUserUtterance,
  detectSpokenLanguage,
  type AssistantMessage,
  type AssistantPendingConfirmation,
  type SupportedLanguage,
} from '../services/voiceAssistantService';
import { useTranslation } from 'react-i18next';
import { readTextAloud, stopSpeaking } from '../lib/speechSynthesis';
import { getActiveUser } from '../lib/supabaseClient';

export interface VoiceAssistantContextValue {
  isOpen: boolean;
  openAssistant: (initialQuery?: string) => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  messages: AssistantMessage[];
  clearMessages: () => void;
  currentScreen: string;
  isProcessing: boolean;
  pendingConfirmation: AssistantPendingConfirmation | null;
  sendMessage: (text: string) => Promise<void>;
  confirmPending: () => Promise<void>;
  cancelPending: () => void;
  initialQuery?: string;
  isSpeaking: boolean;
  autoSpeak: boolean;
  setAutoSpeak: (enabled: boolean) => void;
  speakMessage: (text: string, lang?: string) => void;
  stopAudio: () => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextValue | null>(null);

function screenFromPathname(path: string): string {
  if (path.startsWith('/kaam') || path.startsWith('/work')) return 'kaam';
  if (path.startsWith('/dhan') || path.startsWith('/money')) return 'dhan';
  if (path.startsWith('/sehat') || path.startsWith('/health')) return 'sehat';
  if (path.startsWith('/kaushal') || path.startsWith('/skills')) return 'kaushal';
  if (path.startsWith('/haq') || path.startsWith('/rights')) return 'haq';
  if (path.startsWith('/profile')) return 'profile';
  return 'home';
}

export function VoiceAssistantProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { transactions, summary, addTransaction } = useTransactions();
  const { i18n } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<AssistantPendingConfirmation | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeakState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('@setu/voice_assistant_autospeak');
      return v !== 'false';
    } catch {
      return true;
    }
  });

  const setAutoSpeak = useCallback((enabled: boolean) => {
    setAutoSpeakState(enabled);
    try {
      localStorage.setItem('@setu/voice_assistant_autospeak', String(enabled));
    } catch {
      // ignore
    }
  }, []);

  const stopAudio = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  const speakMessage = useCallback((text: string, lang?: string) => {
    const speechLang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    setIsSpeaking(true);
    const started = readTextAloud(text, speechLang, () => {
      setIsSpeaking(false);
    });
    if (!started) {
      setIsSpeaking(false);
    }
  }, []);

  const currentScreen = useMemo(() => screenFromPathname(location.pathname), [location.pathname]);
  const currentLang = (i18n.language || 'en').toLowerCase().slice(0, 2);

  // If user navigates to /voice directly, open modal
  useEffect(() => {
    if (location.pathname === '/voice') {
      setIsOpen(true);
    }
  }, [location.pathname]);

  // Initial welcome message per language and screen
  useEffect(() => {
    if (messages.length === 0) {
      let welcomeText =
        'Hello! I am your Setu Voice & Chat Assistant. Speak or type to manage work, money, health, skills, and rights.';
      if (currentLang === 'hi') {
        welcomeText =
          'नमस्ते! मैं आपका सेतू सहायक हूँ। आप बोलकर या लिखकर काम, कमाई, खर्चे, सेहत, कौशल और अपने अधिकारों की जानकारी ले सकते हैं।';
      } else if (currentLang === 'mr') {
        welcomeText =
          'नमस्कार! मी तुमचा सेतू सहाय्यक आहे. तुम्ही बोलून किंवा लिहून काम, पैसे, आरोग्य, कौशल्य आणि हक्कांची माहिती घेऊ शकता.';
      }

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
  }, [currentLang, messages.length]);

  const openAssistant = useCallback((query?: string) => {
    setIsOpen(true);
    if (query) {
      setInitialQuery(query);
    }
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    setInitialQuery(undefined);
    if (location.pathname === '/voice') {
      navigate(-1);
    }
  }, [location.pathname, navigate]);

  const toggleAssistant = useCallback(() => {
    if (isOpen) {
      closeAssistant();
    } else {
      openAssistant();
    }
  }, [isOpen, closeAssistant, openAssistant]);

  const clearMessages = useCallback(() => {
    let welcomeText =
      'Hello! I am your Setu Assistant. How can I help you today?';
    if (currentLang === 'hi') {
      welcomeText = 'नमस्ते! मैं आपका सेतू सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?';
    } else if (currentLang === 'mr') {
      welcomeText = 'नमस्कार! मी तुमचा सेतू सहाय्यक आहे. आज मी तुम्हाला कशी मदत करू?';
    }

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: welcomeText,
        timestamp: new Date().toISOString(),
        lang: currentLang as SupportedLanguage,
        intent: 'welcome',
      },
    ]);
    setPendingConfirmation(null);
  }, [currentLang]);

  // Execute confirmed transactions
  const executeConfirmedTransactions = useCallback(
    async (conf: AssistantPendingConfirmation) => {
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
        window.dispatchEvent(new Event('setu_transactions_changed'));
      } catch (err) {
        console.error('Failed to commit assistant transaction:', err);
      }
    },
    [addTransaction]
  );

  const confirmPending = useCallback(async () => {
    if (!pendingConfirmation) return;
    await executeConfirmedTransactions(pendingConfirmation);
    const conf = pendingConfirmation;
    setPendingConfirmation(null);

    setMessages((prev) => [
      ...prev,
      {
        id: `conf-${Date.now()}`,
        role: 'assistant',
        text: `Confirmed and saved ${conf.items.length} transaction(s) totaling ₹${conf.totalAmount}.`,
        timestamp: new Date().toISOString(),
        intent: 'confirm_execution',
      },
    ]);
  }, [pendingConfirmation, executeConfirmedTransactions]);

  const cancelPending = useCallback(() => {
    setPendingConfirmation(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `cancel-${Date.now()}`,
        role: 'assistant',
        text: 'Cancelled. No changes were made.',
        timestamp: new Date().toISOString(),
        intent: 'cancel_pending',
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: AssistantMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: text.trim(),
        timestamp: new Date().toISOString(),
        lang: detectSpokenLanguage(text),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);

      try {
        // Build rich contextual state
        const contextState = {
          pendingConfirmation,
          lastIntent: messages[messages.length - 1]?.intent || null,
          currentScreen,
          userProfile: {
            id: profile.id,
            name: profile.name,
            workType: profile.workType,
            cityKey: profile.cityKey,
            savingsGoal: profile.savingsGoal,
            skillKeys: profile.skillKeys,
            customSkills: profile.customSkills,
            preferredLanguage: profile.preferredLanguage,
            experienceYears: profile.experienceYears,
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

        const reply = await processUserUtterance(text, contextState);

        // Check if user confirmed transaction via natural language
        const targetConf = reply.pendingConfirmation || pendingConfirmation;
        if (reply.intent === 'confirm_execution' && targetConf) {
          await executeConfirmedTransactions(targetConf);
          setPendingConfirmation(null);
        } else if (reply.pendingConfirmation) {
          setPendingConfirmation(reply.pendingConfirmation);
        } else if (reply.intent === 'cancel_pending') {
          setPendingConfirmation(null);
        }

        // Handle navigation actions if user asked to go to another screen
        if (reply.navigationAction?.route) {
          const targetRoute = reply.navigationAction.route;
          if (location.pathname !== targetRoute) {
            // Keep assistant open while navigating
            navigate(targetRoute);
          }
        }

        // Handle language change action if triggered
        if (reply.intent === 'change_language' && (reply as any).targetLang) {
          const targetLang = (reply as any).targetLang;
          await i18n.changeLanguage(targetLang);
          await updateProfile({ preferredLanguage: targetLang });
        }

        setMessages((prev) => [...prev, reply]);

        // Text-to-Speech Playback if autoSpeak is enabled
        if (autoSpeak && reply.text) {
          const speechLang = reply.lang === 'mr' ? 'mr-IN' : reply.lang === 'hi' ? 'hi-IN' : 'en-IN';
          setIsSpeaking(true);
          readTextAloud(reply.text, speechLang, () => {
            setIsSpeaking(false);
          });
        }
      } catch (err) {
        console.error('Error in Voice Assistant sendMessage:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            text: 'I ran into an issue retrieving that. Please try again or rephrase your request.',
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      pendingConfirmation,
      messages,
      currentScreen,
      profile,
      transactions,
      summary,
      location.pathname,
      navigate,
      executeConfirmedTransactions,
      i18n,
      updateProfile,
      autoSpeak,
    ]
  );

  const value = useMemo<VoiceAssistantContextValue>(
    () => ({
      isOpen,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      messages,
      clearMessages,
      currentScreen,
      isProcessing,
      pendingConfirmation,
      sendMessage,
      confirmPending,
      cancelPending,
      initialQuery,
      isSpeaking,
      autoSpeak,
      setAutoSpeak,
      speakMessage,
      stopAudio,
    }),
    [
      isOpen,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      messages,
      clearMessages,
      currentScreen,
      isProcessing,
      pendingConfirmation,
      sendMessage,
      confirmPending,
      cancelPending,
      initialQuery,
      isSpeaking,
      autoSpeak,
      setAutoSpeak,
      speakMessage,
      stopAudio,
    ]
  );

  return (
    <VoiceAssistantContext.Provider value={value}>
      {children}
    </VoiceAssistantContext.Provider>
  );
}

export function useVoiceAssistant() {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
}
