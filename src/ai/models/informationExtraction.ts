import { mockInference } from '../mockInference';
import type { AIResponse, InformationExtractionOutput, ModelInputMap } from '../modelRegistry';
import { extractMultilingualTransaction } from '../../lib/multilingualNumberParser';

export async function runInformationExtraction(
  input: ModelInputMap['informationExtraction']
): Promise<AIResponse<InformationExtractionOutput>> {
  const text = input.transcript || '';
  const parsed = extractMultilingualTransaction(text);

  return mockInference(
    'informationExtraction',
    {
      income: parsed.income,
      expense: parsed.expense,
      expenseCategory: parsed.expenseCategory,
      date: parsed.date,
      workType: 'gig_work',
      entities: parsed.entities,
    },
    'ai.informationExtraction.why',
    0.95
  );
}
