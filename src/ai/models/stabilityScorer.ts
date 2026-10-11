import { mockInference } from '../mockInference';
import type { AIResponse, ModelInputMap, StabilityScoreOutput } from '../modelRegistry';

export async function runStabilityScorer(
  _input: ModelInputMap['stabilityScorer']
): Promise<AIResponse<StabilityScoreOutput>> {
  return mockInference(
    'stabilityScorer',
    {
      score: 348,
      level: 'Good Stability',
      factors: [
        { factor: 'Income regularity', score: 82 },
        { factor: 'Savings habit', score: 76 },
        { factor: 'Expense control', score: 68 },
        { factor: 'Work continuity', score: 85 },
      ],
      confidence: 0.89,
    },
    'ai.stabilityScorer.why',
    0.89
  );
}
