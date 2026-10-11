import { MODEL_REGISTRY, type AIResponse, type ModelMeta, type ModelName } from './modelRegistry';

export function clampConfidence(value: number): number {
  return Math.min(0.97, Math.max(0.7, value));
}

export function randomLatencyMs(min = 800, max = 1800): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export async function mockInference<T>(
  modelName: ModelName,
  output: T,
  explanation: string,
  confidence: number,
): Promise<AIResponse<T>> {
  const meta: ModelMeta = MODEL_REGISTRY[modelName];
  const latencyMs = randomLatencyMs();
  await new Promise((resolve) => setTimeout(resolve, latencyMs));
  return {
    model: meta.model,
    version: meta.version,
    status: 'success',
    confidence: clampConfidence(confidence),
    latencyMs,
    output,
    explanation,
  };
}
