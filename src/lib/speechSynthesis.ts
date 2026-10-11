import { useState, useCallback, useEffect } from 'react';

/**
 * Text-to-Speech helper for Indian languages (Hindi, Marathi, English)
 * utilizing standard browser Web Speech Synthesis API.
 */
export function readTextAloud(
  text: string,
  lang: string = 'hi-IN',
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  // Cancel any previous speech
  window.speechSynthesis.cancel();

  const cleanText = text.replace(/[#*`_~]/g, '').trim();
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;
  utterance.rate = 0.95; // Slightly slower for better comprehension among workers
  utterance.pitch = 1.0;

  // Try to find matching voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(
    (v) => v.lang.startsWith(lang.slice(0, 2)) || v.lang.includes(lang)
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = () => {
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * React hook for managing "Suno" (Read Aloud) audio states across UI components.
 */
export function useReadAloud() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const toggleSpeak = useCallback((id: string, text: string, lang: string = 'hi-IN') => {
    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      const started = readTextAloud(text, lang, () => {
        setSpeakingId(null);
      });
      if (!started) {
        setSpeakingId(null);
      }
    }
  }, [speakingId]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  return {
    speakingId,
    isSpeaking: !!speakingId,
    toggleSpeak,
    stopSpeaking: () => {
      stopSpeaking();
      setSpeakingId(null);
    },
  };
}
