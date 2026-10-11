import { mockInference } from '../mockInference';
import type { AIResponse, ModelInputMap, TranslationOutput } from '../modelRegistry';

export async function runTranslationAssistant(
  input: ModelInputMap['translationAssistant'],
): Promise<AIResponse<TranslationOutput>> {
  return mockInference(
    'translationAssistant',
    {
      sourceLanguage: input.sourceLanguage || 'hi',
      targetLanguage: input.targetLanguage || 'en',
      translatedText: 'Today I earned ₹800 and spent ₹150 on petrol.',
      confidence: 0.96,
    },
    'ai.translation.why',
    0.96,
  );
}
