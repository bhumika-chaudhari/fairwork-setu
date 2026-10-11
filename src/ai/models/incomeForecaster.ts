import { mockInference } from '../mockInference';
import type { AIResponse, IncomeForecastOutput, ModelInputMap } from '../modelRegistry';

export async function runIncomeForecaster(
  input: ModelInputMap['incomeForecaster']
): Promise<AIResponse<IncomeForecastOutput>> {
  const days = input.days || 30;

  // Forecast based on average daily earnings of ₹750 - ₹850 with seasonal growth
  const nextWeekMin = 5800;
  const nextWeekMax = 6400;

  return mockInference(
    'incomeForecaster',
    {
      nextWeekIncomeMin: nextWeekMin,
      nextWeekIncomeMax: nextWeekMax,
      trend: 'up',
      confidence: 0.88,
      basedOnDays: days,
    },
    'ai.incomeForecaster.why',
    0.88
  );
}
