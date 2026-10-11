import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

export interface SpeechTrack {
  id: string;
  title: string;
  subtitle?: string;
  speech: string;
  lang?: string;
}

export type SpeechPlaybackState = 'idle' | 'playing' | 'paused' | 'error';

interface SpeechContextValue {
  state: SpeechPlaybackState;
  currentTrack: SpeechTrack | null;
  activeId: string | null;
  errorMessage: string | null;
  play: (track: SpeechTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  toggle: (track: SpeechTrack) => void;
}

const SpeechContext = createContext<SpeechContextValue | null>(null);

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SpeechPlaybackState>('idle');
  const [currentTrack, setCurrentTrack] = useState<SpeechTrack | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sentencesRef = useRef<string[]>([]);
  const sentenceIndexRef = useRef<number>(0);
  const keepAliveTimerRef = useRef<any>(null);
  const currentLangRef = useRef<string>('en-IN');

  const stopKeepAlive = () => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  };

  const startKeepAlive = () => {
    stopKeepAlive();
    // Chrome bug workaround: speechSynthesis stops after ~15s without resume ping
    keepAliveTimerRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 10000);
  };

  const speakCurrentSentence = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setState('error');
      setErrorMessage('Speech Synthesis is not supported in this browser.');
      return;
    }

    const sentences = sentencesRef.current;
    const idx = sentenceIndexRef.current;

    if (idx >= sentences.length) {
      // Finished all sentences
      stopKeepAlive();
      setState('idle');
      setCurrentTrack(null);
      return;
    }

    const textToSpeak = sentences[idx].trim();
    if (!textToSpeak) {
      sentenceIndexRef.current += 1;
      speakCurrentSentence();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = currentLangRef.current;
    utterance.rate = 0.96; // Slightly slower, highly intelligible rate
    utterance.pitch = 1.0;

    // Pick best available voice for language
    const voices = window.speechSynthesis.getVoices();
    const target = currentLangRef.current.toLowerCase();
    const matched =
      voices.find((v) => v.lang.toLowerCase().startsWith(target.slice(0, 2))) ||
      voices.find((v) => v.lang.toLowerCase().includes('in')) ||
      voices[0];

    if (matched) {
      utterance.voice = matched;
    }

    utterance.onend = () => {
      sentenceIndexRef.current += 1;
      speakCurrentSentence();
    };

    utterance.onerror = (e) => {
      // Ignore user cancellation errors
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      setState('error');
      setErrorMessage(`Speech error: ${e.error || 'Audio playback interrupted.'}`);
      stopKeepAlive();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stopKeepAlive();
    setState('idle');
    setCurrentTrack(null);
    setErrorMessage(null);
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    setState('playing');
  }, []);

  const play = useCallback((track: SpeechTrack) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setState('error');
      setErrorMessage('Speech synthesis is not supported on this device/browser.');
      return;
    }

    // Cancel current playback
    window.speechSynthesis.cancel();
    stopKeepAlive();

    const normalizedLang =
      track.lang?.startsWith('hi')
        ? 'hi-IN'
        : track.lang?.startsWith('mr')
        ? 'mr-IN'
        : 'en-IN';

    currentLangRef.current = normalizedLang;
    setCurrentTrack(track);
    setState('playing');
    setErrorMessage(null);

    // Split text into natural sentence chunks so SpeechSynthesis never times out on mobile/desktop
    const cleanText = track.speech.replace(/[#*_~`]/g, '').trim();
    const rawSentences = cleanText.match(/[^.!?।]+[.!?।]+|[^.!?।]+/g) || [cleanText];
    sentencesRef.current = rawSentences.map((s) => s.trim()).filter(Boolean);
    sentenceIndexRef.current = 0;

    startKeepAlive();
    speakCurrentSentence();
  }, [speakCurrentSentence]);

  const toggle = useCallback((track: SpeechTrack) => {
    if (currentTrack?.id === track.id) {
      if (state === 'playing') {
        pause();
      } else if (state === 'paused') {
        resume();
      } else {
        play(track);
      }
    } else {
      play(track);
    }
  }, [currentTrack, state, play, pause, resume]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return (
    <SpeechContext.Provider
      value={{
        state,
        currentTrack,
        activeId: currentTrack?.id ?? null,
        errorMessage,
        play,
        pause,
        resume,
        stop,
        toggle,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return ctx;
}
