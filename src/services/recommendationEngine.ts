import type { JobListing } from '../types/marketplace';

export interface WorkerProfileInput {
  name?: string | null;
  skillKeys?: string[];
  customSkills?: string[];
  skills?: string[]; // direct array support for tests/convenience
  experienceYears?: number | null;
  workType?: string | null;
  role?: string | null; // alias for workType
  cityKey?: string | null;
  location?: string | null;
  preferredCategory?: string | null;
  preferredWorkType?: string | null;
}

export interface RecommendationMatch {
  jobId: string;
  job: JobListing;
  matchScore: number; // 0 to 100
  matchingSkills: string[];
  missingSkills: string[];
  requiredExperienceYears: number;
  workerExperienceYears: number;
  explanation: string;
  model: string;
  isAlternative?: boolean;
}

export interface RecommendationResult {
  matches: RecommendationMatch[];
  isNewUserOrEmptyProfile: boolean;
  totalOpportunities: number;
  hasExactSkillMatches: boolean;
  topScore: number;
  explanationNotice?: string;
}

// Canonical skill synonyms and mapping for trades
const SKILL_SYNONYM_MAP: Record<string, string[]> = {
  driving: ['two-wheeler riding', 'driving', 'route navigation', 'gps navigation', 'commercial driving', 'license'],
  delivery: ['two-wheeler riding', 'delivery', 'route navigation', 'gps navigation', 'customer communication', 'parcel'],
  electrician: ['mcb repair', 'inverter wiring', 'safety grounding', 'pump panel check', 'wiring', 'electrical repair', 'switches'],
  plumbing: ['pipe jointing', 'leakage detection', 'sanitary installation', 'motor pump wiring check', 'plumbing', 'leak repair', 'pipe fitting'],
  warehouse: ['barcode scanning', 'inventory packing', 'dispatch verification', 'inventory sorter', 'loading'],
  tailoring: ['garment cutting', 'interlocking machine', 'embroidery attachment', 'fitting alterations', 'tailor', 'stitching'],
  tailor: ['garment cutting', 'interlocking machine', 'embroidery attachment', 'fitting alterations', 'tailor', 'stitching'],
  cleaning: ['vacuum operation', 'glass cleaning', 'floor scrubbing', 'safe chemical handling', 'sweeping', 'mopping', 'housekeeping'],
  sweepingmopping: ['vacuum operation', 'glass cleaning', 'floor scrubbing', 'safe chemical handling', 'sweeping', 'mopping'],
  cooking: ['north indian cuisine', 'maharashtrian cuisine', 'kitchen hygiene', 'time management', 'chapati', 'cooking', 'meal maker'],
  technician: ['screen replacement', 'smd soldering', 'charging port repair', 'hardware troubleshooting', 'electronics'],
  painting: ['wall putty smoothing', 'primer application', 'roller painting', 'surface tape masking', 'painting'],
  loading: ['barcode scanning', 'inventory packing', 'dispatch verification', 'pallet loading', 'lifting'],
};

/**
 * Normalizes a skill string: strips namespace, lowercases, replaces underscores/hyphens.
 */
export function normalizeSkill(skill: string): string {
  if (!skill) return '';
  return skill
    .replace(/^skills\./, '')
    .replace(/[_\-]+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Parses required experience years from job requirements, description, and title.
 */
export function extractRequiredExperience(job: JobListing): number {
  const combined = [
    ...(job.requirements || []),
    job.title || '',
    job.description || '',
  ].join(' ');

  // Pattern: "Minimum 2 years", "2+ years", "at least 3 years", "1-2 years experience"
  const minMatch = combined.match(/(?:minimum|min|at\s*least)\s*(\d+)\+?\s*years?/i);
  if (minMatch && minMatch[1]) {
    return parseInt(minMatch[1], 10);
  }

  const plusMatch = combined.match(/\b(\d+)\+?\s*years?(?:\s*of)?\s*experience/i);
  if (plusMatch && plusMatch[1]) {
    return parseInt(plusMatch[1], 10);
  }

  const rangeMatch = combined.match(/\b(\d+)\s*-\s*(\d+)\s*years?\s*experience/i);
  if (rangeMatch && rangeMatch[1]) {
    return parseInt(rangeMatch[1], 10);
  }

  // Keywords in title
  const lowTitle = (job.title || '').toLowerCase();
  if (lowTitle.includes('senior') || lowTitle.includes('lead') || lowTitle.includes('master')) {
    return 4;
  }
  if (lowTitle.includes('junior') || lowTitle.includes('entry') || lowTitle.includes('trainee') || lowTitle.includes('fresher') || lowTitle.includes('associate')) {
    return 0;
  }

  return 0;
}

/**
 * Checks if a worker skill matches a job skill or requirement.
 */
function isSkillMatch(workerSkill: string, jobSkill: string): boolean {
  const wsNorm = normalizeSkill(workerSkill);
  const jsNorm = normalizeSkill(jobSkill);

  if (!wsNorm || !jsNorm) return false;

  // Exact match
  if (wsNorm === jsNorm) return true;

  // Substring match for substantial tokens (len >= 3)
  if (wsNorm.length >= 3 && jsNorm.includes(wsNorm)) return true;
  if (jsNorm.length >= 3 && wsNorm.includes(jsNorm)) return true;

  // Check synonym mappings
  const synonyms = SKILL_SYNONYM_MAP[wsNorm] || [];
  for (const syn of synonyms) {
    if (jsNorm.includes(syn) || syn.includes(jsNorm)) return true;
  }

  const jobSynonyms = SKILL_SYNONYM_MAP[jsNorm] || [];
  for (const jsyn of jobSynonyms) {
    if (wsNorm.includes(jsyn) || jsyn.includes(wsNorm)) return true;
  }

  return false;
}

/**
 * Extracts and consolidates all skills from a worker profile input.
 */
export function getWorkerSkillList(profile: WorkerProfileInput): string[] {
  const result: string[] = [];

  if (Array.isArray(profile.skills)) {
    for (const s of profile.skills) {
      if (s && typeof s === 'string') result.push(s);
    }
  }

  if (Array.isArray(profile.skillKeys)) {
    for (const k of profile.skillKeys) {
      if (k && typeof k === 'string') result.push(k);
    }
  }

  if (Array.isArray(profile.customSkills)) {
    for (const cs of profile.customSkills) {
      if (cs && typeof cs === 'string') result.push(cs);
    }
  }

  return Array.from(new Set(result));
}

/**
 * Calculates deterministic match data between a worker profile and a single job listing.
 */
export function calculateJobMatch(
  profile: WorkerProfileInput,
  job: JobListing
): RecommendationMatch {
  const workerSkills = getWorkerSkillList(profile);
  const workerExp = Math.max(0, Number(profile.experienceYears) || 0);
  const workerRole = normalizeSkill(profile.workType || profile.role || '');
  const workerCity = normalizeSkill(profile.cityKey || profile.location || '');
  const requiredExp = extractRequiredExperience(job);

  const jobSkills = job.skills || [];
  const matchedJobSkills: string[] = [];
  const missingJobSkills: string[] = [];

  for (const js of jobSkills) {
    const matched = workerSkills.some((ws) => isSkillMatch(ws, js));
    if (matched) {
      matchedJobSkills.push(js);
    } else {
      missingJobSkills.push(js);
    }
  }

  const hasEmptyProfile = workerSkills.length === 0 && workerExp === 0 && !workerRole;

  // 1. Skill Score (Max 55 points)
  let skillScore = 0;
  if (jobSkills.length > 0) {
    const ratio = matchedJobSkills.length / jobSkills.length;
    skillScore = Math.round(ratio * 55);
  } else if (workerSkills.length > 0) {
    // If job has no listed skills, check title/description for worker skills
    const desc = `${job.title} ${job.description}`.toLowerCase();
    const found = workerSkills.filter((ws) => desc.includes(normalizeSkill(ws)));
    if (found.length > 0) {
      skillScore = Math.min(50, found.length * 20);
      matchedJobSkills.push(...found);
    }
  }

  // 2. Experience Alignment Score (Max 25 points)
  let expScore = 0;
  if (requiredExp === 0) {
    // Entry level job: ideal for beginners (0-1 yr), suitable for others
    if (workerExp <= 1) {
      expScore = 25;
    } else if (workerExp <= 3) {
      expScore = 22;
    } else {
      expScore = 20;
    }
  } else {
    // Requires experience
    if (workerExp >= requiredExp) {
      expScore = 25; // Meets or exceeds requirements
    } else {
      const deficit = requiredExp - workerExp;
      if (deficit === 1) {
        expScore = 14; // Close match
      } else if (deficit === 2) {
        expScore = 6;  // Significant gap
      } else {
        expScore = 0;  // Severe under-qualification penalty
      }
    }
  }

  // 3. Trade / Category Alignment (Max 15 points)
  let tradeScore = 0;
  const jobCategory = normalizeSkill(job.category || '');
  if (workerRole && jobCategory) {
    if (workerRole === jobCategory || workerRole.includes(jobCategory) || jobCategory.includes(workerRole)) {
      tradeScore = 15;
    } else {
      const related = SKILL_SYNONYM_MAP[workerRole] || [];
      if (related.some((r) => r.includes(jobCategory) || jobCategory.includes(r))) {
        tradeScore = 8;
      }
    }
  }

  // 4. Location Alignment (Max 5 points)
  let locationScore = 2; // Baseline
  if (workerCity) {
    const jobLoc = `${job.location || ''} ${job.serviceArea || ''}`.toLowerCase();
    if (jobLoc.includes(workerCity)) {
      locationScore = 5;
    }
  }

  // 5. Penalties & Final Score Calculation
  let penalty = 0;
  // If the job requires specialized skills and worker has 0 matched skills and worker is not in the trade:
  if (jobSkills.length >= 2 && matchedJobSkills.length === 0 && tradeScore === 0) {
    penalty = 22;
  }

  // If worker is beginner (0-1 yr) and job requires senior experience (3+ yrs):
  if (workerExp <= 1 && requiredExp >= 3) {
    penalty += 15;
  }

  let finalScore = skillScore + expScore + tradeScore + locationScore - penalty;

  // New user / empty profile baseline calibration
  if (hasEmptyProfile) {
    // Rank entry level / high-demand jobs top for empty profiles
    finalScore = requiredExp === 0 ? 58 : Math.max(30, 50 - requiredExp * 8);
  } else {
    finalScore = Math.max(12, Math.min(98, finalScore));
  }

  // Construct clear, user-facing explanation string
  let explanation = '';
  if (hasEmptyProfile) {
    explanation = requiredExp === 0
      ? 'Popular entry-level opening • Add your skills in Profile to get personalized recommendations.'
      : `High-demand opportunity (Requires ${requiredExp} yrs experience) • Add your skills to unlock exact match ranking.`;
  } else if (matchedJobSkills.length > 0) {
    const skillsListStr = matchedJobSkills.slice(0, 3).join(', ');
    const expText = requiredExp === 0
      ? `Fits your ${workerExp} yr${workerExp === 1 ? '' : 's'} experience`
      : workerExp >= requiredExp
        ? `Suitable for your ${workerExp} yr${workerExp === 1 ? '' : 's'} experience (requires ${requiredExp} yr${requiredExp === 1 ? '' : 's'})`
        : `Requires ${requiredExp} yrs experience (you have ${workerExp} yr${workerExp === 1 ? '' : 's'})`;

    explanation = `Matches ${matchedJobSkills.length} of your skill${matchedJobSkills.length === 1 ? '' : 's'} (${skillsListStr}) • ${expText}`;
  } else if (tradeScore > 0) {
    const expText = workerExp >= requiredExp
      ? `Matches your ${workerExp} yrs experience in ${profile.workType || 'your trade'}`
      : `Requires ${requiredExp} yrs experience`;
    explanation = `Trade fit: Aligns with your primary trade in ${job.category} • ${expText}`;
  } else {
    explanation = `New domain opportunity: Requires distinct trade skills • Requires ${requiredExp || 'entry-level'} experience.`;
  }

  return {
    jobId: job.id,
    job,
    matchScore: finalScore,
    matchingSkills: matchedJobSkills,
    missingSkills: missingJobSkills,
    requiredExperienceYears: requiredExp,
    workerExperienceYears: workerExp,
    explanation,
    model: 'Setu Deterministic Skill & Experience Matcher',
  };
}

/**
 * Ranks all jobs for a worker profile with deterministic sorting and zero-match fallback handling.
 */
export function rankJobsForProfile(
  profile: WorkerProfileInput,
  jobs: JobListing[]
): RecommendationResult {
  const workerSkills = getWorkerSkillList(profile);
  const workerExp = Math.max(0, Number(profile.experienceYears) || 0);
  const workerRole = normalizeSkill(profile.workType || profile.role || '');
  const isNewUserOrEmptyProfile = workerSkills.length === 0 && workerExp === 0 && !workerRole;

  if (!jobs || jobs.length === 0) {
    return {
      matches: [],
      isNewUserOrEmptyProfile,
      totalOpportunities: 0,
      hasExactSkillMatches: false,
      topScore: 0,
    };
  }

  // Calculate matches for all jobs deterministically
  const matches = jobs.map((job) => calculateJobMatch(profile, job));

  // Sort deterministically:
  // 1. Highest matchScore
  // 2. Highest matchingSkills.length
  // 3. Lowest requiredExperienceYears (if scores tie)
  // 4. Stable by job.id
  matches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    if (b.matchingSkills.length !== a.matchingSkills.length) {
      return b.matchingSkills.length - a.matchingSkills.length;
    }
    return a.jobId.localeCompare(b.jobId);
  });

  const topScore = matches[0]?.matchScore || 0;
  const hasExactSkillMatches = matches.some((m) => m.matchingSkills.length > 0);

  let explanationNotice: string | undefined = undefined;
  if (!isNewUserOrEmptyProfile && !hasExactSkillMatches) {
    explanationNotice =
      'No opportunities currently match your exact skills. Displaying recommended alternatives based on your experience and location.';
    for (const m of matches) {
      m.isAlternative = true;
    }
  }

  return {
    matches,
    isNewUserOrEmptyProfile,
    totalOpportunities: jobs.length,
    hasExactSkillMatches,
    topScore,
    explanationNotice,
  };
}
