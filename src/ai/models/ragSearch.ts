import { mockInference } from '../mockInference';
import type { AIResponse, ModelInputMap, RagSearchOutput, RagSource } from '../modelRegistry';

interface KnowledgeChunk {
  id: string;
  title: string;
  keywords: string[];
  content: string;
  sourceUrl: string;
}

const VERIFIED_KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: 'pmjay',
    title: 'Ayushman Bharat PM-JAY (National Health Authority)',
    keywords: ['ayushman', 'pmjay', 'free', 'hospital', 'checkup', 'surgery', '5 lakh', 'card', 'treatment'],
    content:
      'Ayushman Bharat (PM-JAY) provides cashless health coverage of up to ₹5,00,000 per family per year for secondary and tertiary hospitalization across empaneled public and private hospitals nationwide. Eligible informal and low-income workers can check eligibility and register using Aadhaar and ration card at any Jan Arogya Kendra or empaneled hospital.',
    sourceUrl: 'https://pmjay.gov.in',
  },
  {
    id: 'janaushadhi',
    title: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    keywords: ['medicine', 'generic', 'dawa', 'cheap', 'pharmacy', 'affordable', 'store', 'chemist'],
    content:
      'Jan Arogya and PM Bhartiya Janaushadhi Kendras offer quality generic medicines, surgical items, and everyday health supplies at 50% to 90% cheaper prices than branded commercial alternatives. Find your nearest verified Kendra by locating official kiosks in your district.',
    sourceUrl: 'https://janaushadhi.gov.in',
  },
  {
    id: 'eshram_pension',
    title: 'PM Shram Yogi Maandhan & e-Shram Social Security',
    keywords: ['pension', 'eshram', 'shram', 'gig', 'worker', 'old age', 'monthly', 'retirement', 'maandhan'],
    content:
      'PM Shram Yogi Maandhan (PM-SYM) offers an assured monthly pension of ₹3,000 upon reaching age 60 for unorganized and gig workers earning up to ₹15,000 per month. Enrolment is facilitated via the national e-Shram portal with minimal monthly co-contribution.',
    sourceUrl: 'https://eshram.gov.in',
  },
  {
    id: 'emergency',
    title: 'National Emergency Response Services (108 / 112)',
    keywords: ['emergency', 'ambulance', '108', 'police', '112', 'accident', 'immediate', 'urgent'],
    content:
      'Dial 108 for immediate 24x7 emergency medical and ambulance dispatch across India. Dial 112 for all-in-one emergency helpline services (police, fire, and health). Dial 1098 for the 24x7 child protection helpline.',
    sourceUrl: 'https://112.gov.in',
  },
];

export async function runRagSearch(
  input: ModelInputMap['ragSearch']
): Promise<AIResponse<RagSearchOutput>> {
  const query = (input.query || '').toLowerCase();

  // Keyword-based semantic retrieval scoring
  const scoredChunks = VERIFIED_KNOWLEDGE_BASE.map((chunk) => {
    let score = 0;
    for (const kw of chunk.keywords) {
      if (query.includes(kw)) {
        score += 3;
      }
    }
    return { chunk, score };
  }).sort((a, b) => b.score - a.score);

  const bestMatch = scoredChunks[0]?.score > 0 ? scoredChunks[0].chunk : VERIFIED_KNOWLEDGE_BASE[0];

  const sources: RagSource[] = scoredChunks
    .slice(0, 2)
    .filter((s) => s.score > 0 || s === scoredChunks[0])
    .map((s, idx) => ({
      title: s.chunk.title,
      url: s.chunk.sourceUrl,
      relevance: Number((0.92 - idx * 0.05).toFixed(2)),
    }));

  return mockInference(
    'ragSearch',
    {
      answer: bestMatch.content,
      sources,
    },
    'ai.ragSearch.why',
    0.92
  );
}
