import { useState, useCallback, useEffect } from 'react';
import { isSpeechSupported, initAndroidTtsPolyfill } from './androidTtsPolyfill';

/**
 * Text-to-Speech helper for Indian languages (Hindi, Marathi, English)
 * utilizing standard browser Web Speech Synthesis API.
 */
export function readTextAloud(
  text: string,
  lang: string = 'hi-IN',
  onEnd?: () => void
): boolean {
  initAndroidTtsPolyfill();
  if (!isSpeechSupported()) {
    return false;
  }

  // Cancel any previous speech
  if (typeof window !== 'undefined') {
    if (window.AndroidTTS) {
      try { window.AndroidTTS.stop(); } catch {}
    }
    if ('speechSynthesis' in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  const cleanText = text.replace(/[#*`_~]/g, '').trim();
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;

  // Read rate from configured preference or fallback
  let rate = 0.95;
  try {
    const stored = localStorage.getItem('@setu/speech_rate');
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
        rate = parsed;
      }
    }
  } catch {
    // fallback
  }
  utterance.rate = rate;
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

export function getSpeechRate(): number {
  try {
    const val = localStorage.getItem('@setu/speech_rate');
    return val ? parseFloat(val) : 0.95;
  } catch {
    return 0.95;
  }
}

export function setSpeechRate(rate: number): void {
  try {
    localStorage.setItem('@setu/speech_rate', String(rate));
  } catch {
    // ignore
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined') {
    if (window.AndroidTTS) {
      try { window.AndroidTTS.stop(); } catch {}
    }
    if ('speechSynthesis' in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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
