/**
 * FairWork Setu - Android Native TTS & Web Speech Polyfill
 * Seamlessly integrates Android OS TextToSpeech (via AndroidTtsBridge)
 * into Capacitor WebView, where window.speechSynthesis is natively unavailable.
 */

export interface NativeAndroidTTS {
  isAvailable(): boolean;
  speak(text: string, lang: string, rate: number): void;
  stop(): void;
}

declare global {
  interface Window {
    AndroidTTS?: NativeAndroidTTS;
  }
}

export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.AndroidTTS !== 'undefined') return true;
  return 'speechSynthesis' in window && Boolean(window.speechSynthesis);
}

/**
 * Initializes polyfill if running inside Android Capacitor WebView
 * where window.speechSynthesis is not natively provided.
 */
export function initAndroidTtsPolyfill(): void {
  if (typeof window === 'undefined') return;

  // If window.speechSynthesis is already present (e.g. Chrome browser), do nothing
  if ('speechSynthesis' in window && window.speechSynthesis) {
    return;
  }

  // If AndroidTTS native bridge is present, mount standard Web Speech API polyfill
  if (window.AndroidTTS) {
    const androidTts = window.AndroidTTS;

    // Simulated voices
    const mockVoices: SpeechSynthesisVoice[] = [
      {
        default: true,
        lang: 'hi-IN',
        localService: true,
        name: 'Hindi (India) - Android TTS',
        voiceURI: 'android-hi-in',
      },
      {
        default: false,
        lang: 'mr-IN',
        localService: true,
        name: 'Marathi (India) - Android TTS',
        voiceURI: 'android-mr-in',
      },
      {
        default: false,
        lang: 'en-IN',
        localService: true,
        name: 'English (India) - Android TTS',
        voiceURI: 'android-en-in',
      },
    ];

    let currentUtterance: SpeechSynthesisUtterance | null = null;
    let isSpeaking = false;

    window.addEventListener('android-tts-start', () => {
      isSpeaking = true;
      if (currentUtterance && currentUtterance.onstart) {
        currentUtterance.onstart(new Event('start') as any);
      }
    });

    window.addEventListener('android-tts-done', () => {
      isSpeaking = false;
      const u = currentUtterance;
      currentUtterance = null;
      if (u && u.onend) {
        u.onend(new Event('end') as any);
      }
    });

    window.addEventListener('android-tts-error', (e: any) => {
      isSpeaking = false;
      const u = currentUtterance;
      currentUtterance = null;
      if (u && u.onerror) {
        u.onerror(new Event('error') as any);
      }
    });

    const mockSpeechSynthesis = {
      pending: false,
      get speaking() {
        return isSpeaking;
      },
      paused: false,
      onvoiceschanged: null,
      speak: (utterance: SpeechSynthesisUtterance) => {
        currentUtterance = utterance;
        const lang = utterance.lang || 'hi-IN';
        const rate = utterance.rate || 0.96;
        androidTts.speak(utterance.text, lang, rate);
      },
      cancel: () => {
        isSpeaking = false;
        currentUtterance = null;
        androidTts.stop();
      },
      pause: () => {
        isSpeaking = false;
        androidTts.stop();
      },
      resume: () => {},
      getVoices: () => mockVoices,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    };

    // Install mock onto window
    try {
      Object.defineProperty(window, 'speechSynthesis', {
        value: mockSpeechSynthesis,
        configurable: true,
        writable: true,
      });
    } catch {
      (window as any).speechSynthesis = mockSpeechSynthesis;
    }

    if (!('SpeechSynthesisUtterance' in window)) {
      class MockSpeechSynthesisUtterance {
        text: string;
        lang: string = 'hi-IN';
        rate: number = 1.0;
        pitch: number = 1.0;
        volume: number = 1.0;
        voice: SpeechSynthesisVoice | null = null;
        onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
        onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
        onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null = null;
        onpause: any = null;
        onresume: any = null;
        onmark: any = null;
        onboundary: any = null;

        constructor(text: string = '') {
          this.text = text;
        }
      }
      (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    }
  }
}
