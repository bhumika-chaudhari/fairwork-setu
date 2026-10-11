import { mockInference } from '../mockInference';
import type { AIResponse, InformationExtractionOutput, ModelInputMap, ExtractedEntity } from '../modelRegistry';

export async function runInformationExtraction(
  input: ModelInputMap['informationExtraction']
): Promise<AIResponse<InformationExtractionOutput>> {
  const text = (input.transcript || '').toLowerCase();

  let income = 500;
  let expense = 150;
  let expenseCategory = 'Food';
  let date = 'today';
  const entities: ExtractedEntity[] = [];

  // 1. Extract income with regex patterns (English + Hindi / Hinglish)
  // e.g. "earned 500", "500 earned", "500 kamaye", "kamaya 800", "income 700"
  const incomeRegex = /(?:earned|earning|income|kamaye|kamaya|mila|mile)\D*?(\d{2,6})|(\d{2,6})\s*(?:rupees|rs|inr|rupya|rupaye)?\s*(?:earned|kamaye|income)/i;
  const incMatch = text.match(incomeRegex);
  if (incMatch) {
    const val = incMatch[1] || incMatch[2];
    if (val) {
      income = parseInt(val, 10);
      entities.push({ text: `₹${income}`, type: 'AMOUNT', confidence: 0.96 });
    }
  }

  // 2. Extract expense with regex patterns
  // e.g. "spent 150", "150 spent", "150 kharch", "kharcha 200", "petrol me 150", "food 120"
  const expenseRegex = /(?:spent|kharch|kharcha|gaye|de diye|spent on)\D*?(\d{2,6})|(\d{2,6})\s*(?:rupees|rs|inr|rupya|rupaye)?\s*(?:spent|kharch|on food|food|petrol)/i;
  const expMatch = text.match(expenseRegex);
  if (expMatch) {
    const val = expMatch[1] || expMatch[2];
    if (val) {
      expense = parseInt(val, 10);
      entities.push({ text: `₹${expense}`, type: 'AMOUNT', confidence: 0.94 });
    }
  }

  // Fallback: if transcript has 2 distinct numbers and none matched above
  if (!incMatch && !expMatch) {
    const numbers = text.match(/\d{2,6}/g);
    if (numbers && numbers.length >= 2) {
      income = parseInt(numbers[0], 10);
      expense = parseInt(numbers[1], 10);
    } else if (numbers && numbers.length === 1) {
      if (text.includes('spent') || text.includes('kharch')) {
        expense = parseInt(numbers[0], 10);
        income = 0;
      } else {
        income = parseInt(numbers[0], 10);
        expense = 0;
      }
    }
  }

  // 3. Category detection
  if (text.includes('petrol') || text.includes('diesel') || text.includes('fuel') || text.includes('auto') || text.includes('travel')) {
    expenseCategory = 'Travel / Fuel';
    entities.push({ text: 'fuel / travel', type: 'EXPENSE_CATEGORY', confidence: 0.95 });
  } else if (text.includes('food') || text.includes('khana') || text.includes('chai') || text.includes('lunch') || text.includes('dinner')) {
    expenseCategory = 'Food';
    entities.push({ text: 'food', type: 'EXPENSE_CATEGORY', confidence: 0.94 });
  } else if (text.includes('rent') || text.includes('kiraya') || text.includes('room')) {
    expenseCategory = 'Rent';
    entities.push({ text: 'rent', type: 'EXPENSE_CATEGORY', confidence: 0.97 });
  } else if (text.includes('tool') || text.includes('wire') || text.includes('equipment')) {
    expenseCategory = 'Tools';
    entities.push({ text: 'tools', type: 'EXPENSE_CATEGORY', confidence: 0.92 });
  } else if (text.includes('medical') || text.includes('dawa') || text.includes('medicine') || text.includes('doctor')) {
    expenseCategory = 'Medical';
    entities.push({ text: 'medical', type: 'EXPENSE_CATEGORY', confidence: 0.96 });
  } else {
    expenseCategory = 'Food';
  }

  // 4. Date extraction
  if (text.includes('yesterday') || text.includes('kal')) {
    date = 'yesterday';
    entities.push({ text: 'yesterday', type: 'DATE', confidence: 0.92 });
  } else {
    date = 'today';
    entities.push({ text: 'today', type: 'DATE', confidence: 0.95 });
  }

  return mockInference(
    'informationExtraction',
    {
      income,
      expense,
      expenseCategory,
      date,
      workType: 'gig_work',
      entities,
    },
    'ai.informationExtraction.why',
    0.95
  );
}
