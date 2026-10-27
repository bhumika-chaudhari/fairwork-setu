import { mockInference } from '../mockInference';
import type { AIResponse, ExtractedEntity, InformationExtractionOutput, ModelInputMap } from '../modelRegistry';
import { extractMultilingualTransaction } from '../../lib/multilingualNumberParser';
import { parseCompoundTransactions } from '../../utils/entityParser';

export async function runInformationExtraction(
  input: ModelInputMap['informationExtraction']
): Promise<AIResponse<InformationExtractionOutput>> {
  const text = input.transcript || '';
  const compound = parseCompoundTransactions(text);

  if (compound.transactions.length > 0) {
    const entities: ExtractedEntity[] = [];
    compound.transactions.forEach((tx) => {
      entities.push({
        text: `₹${tx.amount} (${tx.type})`,
        type: 'AMOUNT',
        confidence: tx.confidence,
      });
      entities.push({
        text: tx.description,
        type: 'EXPENSE_CATEGORY',
        confidence: 0.95,
      });
    });

    const expItem = compound.transactions.find((t) => t.type === 'expense');
    const firstDate = compound.transactions[0]?.date || 'today';

    return mockInference(
      'informationExtraction',
      {
        income: compound.total_income,
        expense: compound.total_expense,
        expenseCategory: expItem ? expItem.category : 'food',
        date: firstDate,
        workType: 'gig_work',
        entities,
      },
      'ai.informationExtraction.why',
      0.98
    );
  }

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
