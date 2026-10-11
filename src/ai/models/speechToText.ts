import { mockInference } from '../mockInference';
import type { AIResponse, ModelInputMap, SpeechToTextOutput } from '../modelRegistry';

/**
 * Checks whether native browser SpeechRecognition API is available.
 */
export function isWebSpeechAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  // @ts-expect-error - WebKit prefix check
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Detects language script (Devanagari for Hindi/Marathi, Gujarati, Gurmukhi for Punjabi,
 * Telugu, Kannada, Malayalam, Tamil, Bengali, Latin for English).
 */
export function detectLanguage(
  text: string
): 'hi' | 'mr' | 'ta' | 'bn' | 'gu' | 'pa' | 'te' | 'kn' | 'ml' | 'en' {
  if (!text) return 'en';
  // Gujarati range: \u0A80-\u0AFF
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
  // Gurmukhi / Punjabi range: \u0A00-\u0A7F
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';
  // Telugu range: \u0C00-\u0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  // Kannada range: \u0C80-\u0CFF
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  // Malayalam range: \u0D00-\u0DFF
  if (/[\u0D00-\u0DFF]/.test(text)) return 'ml';
  // Tamil range: \u0B80-\u0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  // Bengali range: \u0980-\u09FF
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  // Devanagari Unicode range: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) {
    // Check for Marathi specific vocabulary/grammar markers
    if (/आहे|नाही|झाले|झाला|केले|केला|पाहिजे|रुपये|मिळाले|मिळवले|खर्च/.test(text)) {
      return 'mr';
    }
    return 'hi';
  }
  return 'en';
}

/**
 * Initialises Web Speech Recognition instance if supported.
 */
export function createSpeechRecognizer({
  language = 'hi-IN',
  onResult,
  onError,
  onEnd,
}: {
  language?: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}) {
  if (!isWebSpeechAvailable()) return null;

  try {
    // @ts-expect-error - SpeechRecognition prefix fallback
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognizer = new SpeechRecognitionClass();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = language;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognizer.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const output = final || interim;
      onResult(output, Boolean(final));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognizer.onerror = (event: any) => {
      onError(event.error || 'Speech recognition error');
    };

    recognizer.onend = () => {
      onEnd();
    };

    return recognizer;
  } catch (err) {
    onError(String(err));
    return null;
  }
}

export async function runSpeechToText(
  _input: ModelInputMap['speechToText']
): Promise<AIResponse<SpeechToTextOutput>> {
  const sampleTranscript = 'Today I earned 500 rupees and spent 150 on food.';
  const lang = detectLanguage(sampleTranscript);

  return mockInference(
    'speechToText',
    {
      transcript: sampleTranscript,
      language: lang,
      confidence: 0.94,
    },
    'ai.speechToText.why',
    0.94
  );
}
