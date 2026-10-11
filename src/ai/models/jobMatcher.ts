import { mockInference } from '../mockInference';
import type { AIResponse, JobMatchOutput, ModelInputMap } from '../modelRegistry';
import { mockJobs } from '../../data/mockData';

// Known skill embeddings dictionary (simulated SentenceTransformer 384-d semantic vectors)
const SKILL_VECTOR_MAP: Record<string, number[]> = {
  driving: [0.88, 0.12, 0.35, 0.74, 0.05, 0.62],
  delivery: [0.82, 0.18, 0.45, 0.68, 0.12, 0.58],
  cleaning: [0.15, 0.85, 0.22, 0.08, 0.79, 0.31],
  cooking: [0.22, 0.78, 0.18, 0.12, 0.84, 0.25],
  electrician: [0.35, 0.22, 0.91, 0.42, 0.15, 0.82],
  wiring: [0.32, 0.20, 0.94, 0.40, 0.12, 0.85],
  fanrepair: [0.28, 0.18, 0.89, 0.38, 0.14, 0.79],
  loading: [0.45, 0.32, 0.48, 0.88, 0.22, 0.41],
  plumbing: [0.25, 0.31, 0.78, 0.52, 0.34, 0.65],
  tailoring: [0.18, 0.42, 0.38, 0.22, 0.88, 0.28],
};

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function runJobMatcher(
  input: ModelInputMap['jobMatcher']
): Promise<AIResponse<JobMatchOutput>> {
  const targetJob = mockJobs.find((j) => j.id === input.jobId) || mockJobs[0];

  // Profile skills (or default worker skills: driving, delivery)
  const workerSkills = ['driving', 'delivery', 'cleaning'];

  // Normalize job skills
  const jobSkills = targetJob.skillKeys.map((k) =>
    k.replace('skills.', '').toLowerCase()
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  let totalSim = 0;
  let count = 0;

  for (const js of jobSkills) {
    const jobVec = SKILL_VECTOR_MAP[js] || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    let maxSimForSkill = 0;

    for (const ws of workerSkills) {
      const workerVec = SKILL_VECTOR_MAP[ws] || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
      const sim = cosineSimilarity(jobVec, workerVec);
      if (sim > maxSimForSkill) {
        maxSimForSkill = sim;
      }
    }

    totalSim += maxSimForSkill;
    count++;

    if (maxSimForSkill >= 0.75) {
      matchedSkills.push(js);
    } else {
      missingSkills.push(js);
    }
  }

  const rawScore = count > 0 ? totalSim / count : 0.85;
  const matchScore = Math.min(0.96, Math.max(0.65, Number(rawScore.toFixed(2))));

  const explanation =
    matchedSkills.length > 0
      ? `Your verified skills in ${matchedSkills.join(', ')} match ${Math.round(
          matchScore * 100
        )}% of job requirements.`
      : 'Good baseline fit based on your primary worker category and operating location.';

  return mockInference(
    'jobMatcher',
    {
      jobId: targetJob.id,
      matchScore,
      matchedSkills,
      missingSkills,
      explanation,
    },
    'ai.jobMatcher.why',
    matchScore
  );
}
