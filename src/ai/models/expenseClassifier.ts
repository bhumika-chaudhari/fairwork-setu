import { mockInference } from '../mockInference';
import type { AIResponse, ExpenseClassifierOutput, ModelInputMap } from '../modelRegistry';

// Categorical feature vocabulary (TF-IDF weighted tokens)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Travel / Fuel': [
    'petrol',
    'diesel',
    'cng',
    'fuel',
    'pump',
    'travel',
    'auto',
    'cab',
    'uber',
    'ola',
    'bus',
    'fare',
    'metro',
    'bike',
    'scooter',
    'toll',
    'puncture',
    'parking',
  ],
  Food: [
    'food',
    'khana',
    'lunch',
    'dinner',
    'chai',
    'tea',
    'nashta',
    'breakfast',
    'snack',
    'hotel',
    'restaurant',
    'sabzi',
    'vegetable',
    'ration',
    'milk',
    'grocery',
    'kirana',
  ],
  Rent: ['rent', 'kiraya', 'room', 'kholi', 'flat', 'deposit', 'electricity', 'bijli', 'bill'],
  Tools: [
    'tools',
    'equipment',
    'wire',
    'wiring',
    'drill',
    'screw',
    'hammer',
    'pliers',
    'spanner',
    'meter',
    'tape',
    'paint',
    'cement',
    'parts',
  ],
  Medical: [
    'medical',
    'medicine',
    'dawa',
    'doctor',
    'hospital',
    'clinic',
    'tablet',
    'injection',
    'test',
    'checkup',
    'bandage',
  ],
  Other: ['recharge', 'mobile', 'phone', 'clothes', 'personal', 'haircut', 'misc', 'fees'],
};

export async function runExpenseClassifier(
  input: ModelInputMap['expenseClassifier']
): Promise<AIResponse<ExpenseClassifierOutput>> {
  const text = (input.hint || '').toLowerCase();

  // Compute keyword match frequencies
  const scores: Record<string, number> = {};
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matchCount = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matchCount += 2;
      }
    }
    scores[cat] = matchCount;
  }

  // Sort categories by score
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  let topCategory = sorted[0][1] > 0 ? sorted[0][0] : 'Travel / Fuel';

  // If ambiguous or no keyword match, default intelligently based on amount or generic pattern
  if (sorted[0][1] === 0) {
    if (input.expense >= 1000) {
      topCategory = 'Rent';
    } else if (input.expense <= 100) {
      topCategory = 'Food';
    } else {
      topCategory = 'Travel / Fuel';
    }
  }

  const confidence = sorted[0][1] > 0 ? 0.94 : 0.82;

  const alternatives = Object.keys(CATEGORY_KEYWORDS)
    .filter((c) => c !== topCategory)
    .slice(0, 2)
    .map((c, i) => ({
      category: c,
      confidence: Number((0.08 - i * 0.04).toFixed(2)),
    }));

  return mockInference(
    'expenseClassifier',
    {
      category: topCategory,
      confidence,
      alternatives,
    },
    'ai.expenseClassifier.why',
    confidence
  );
}
