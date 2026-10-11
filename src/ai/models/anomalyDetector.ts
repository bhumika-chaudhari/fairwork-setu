import { mockInference } from '../mockInference';
import type { AIResponse, AnomalyAlertOutput, ModelInputMap } from '../modelRegistry';

export async function runAnomalyDetector(
  _input: ModelInputMap['anomalyDetector']
): Promise<AIResponse<AnomalyAlertOutput>> {
  return mockInference(
    'anomalyDetector',
    {
      type: 'unusual_fuel_expense',
      severity: 'medium',
      message: 'AI Alert: Your fuel expenses are 30% higher than usual. Check for unusual deductions.',
      confidence: 0.91,
      recommendedAction: 'Review past 7 days fuel transactions and check vehicle mileage or platform deductions.',
    },
    'ai.anomalyDetector.why',
    0.91
  );
}
