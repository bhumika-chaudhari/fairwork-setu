import { mockInference } from '../mockInference';
import type { AIResponse, ModelInputMap, SkillPassportOutput } from '../modelRegistry';

export async function runSkillPassportGenerator(
  input: ModelInputMap['skillPassportGenerator']
): Promise<AIResponse<SkillPassportOutput>> {
  const name = input.name || 'Setu Worker';
  const city = input.city || 'Pune';
  const years = input.years || 5;

  const summary = `Reliable professional in ${city} with ${years} years of proven experience, verified high completion rate, and well-known for punctuality, quality work, and client trust.`;

  return mockInference(
    'skillPassportGenerator',
    {
      summary,
      skills: ['Driving', 'Navigation', 'Time Management', 'Vehicle Care'],
      readinessScore: 88,
    },
    'ai.skillPassport.why',
    0.92
  );
}
