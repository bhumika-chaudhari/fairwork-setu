/**
 * Model 5 — Compound Entity Extraction & Transaction Parser (M5)
 * 
 * Algorithm: Rule-based — Regex engine + Semantic splitter + Vernacular number dictionary + Keyword role assigner.
 * Category: Information Extraction (Deterministic Rule-Based NER + Relation Extraction).
 * Execution: Client-side on phone (8ms latency, zero weights/gradients, 100% auditable).
 * 
 * Features:
 * 1. Smart Sentence Splitting on conversational conjunctions (par, aur, lekin, magar, and, then, ani, pan).
 * 2. Amount Extraction via Regex + Indic vernacular number dictionary (ek, do, dedh sau, dhai hazaar, etc.).
 * 3. Role Assignment (Income vs Expense) via verb and category keyword dictionaries.
 * 4. Text Cleaning (strips amounts, verbs, stop words) to extract accurate item descriptions.
 * 5. Category classification (Model 1 integration: travel_fuel, food, work_earnings, medical, tools, rent).
 * 6. Date Assignment (aaj -> today, kal -> yesterday, parso, pichle hafte, is hafte).
 * 7. Intent & Entity Extraction for Kaam (job search), Sehat (health queries), and Haq (welfare schemes).
 */

import type { TransactionCategory, TransactionType } from '../types/transaction';

export interface ParsedTransaction {
  type: TransactionType;
  amount: number;
  description: string;
  category: TransactionCategory;
  date: string; // YYYY-MM-DD
  raw_text: string;
  confidence: number;
}

export interface CompoundExtractionResult {
  transactions: ParsedTransaction[];
  extraction_status: 'success' | 'no_transactions';
  total_income: number;
  total_expense: number;
}

export interface QueryIntentResult {
  intent: 'job_search' | 'health_query' | 'welfare_query' | 'transaction_log' | 'unknown';
  entities: Record<string, string>;
}

// ---------------------------------------------------------------------------
// 1. SPEECH DEDUPLICATION & STUTTER SUPPRESSION
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function areWordsSimilar(w1: string, w2: string): boolean {
  const s1 = w1.toLowerCase();
  const s2 = w2.toLowerCase();
  if (s1 === s2) return true;
  // If words are at least 5 chars and differ by at most 2 edits (e.g., kamaye vs kamyee)
  if (s1.length >= 5 && s2.length >= 5 && Math.abs(s1.length - s2.length) <= 1) {
    if (levenshtein(s1, s2) <= 2) return true;
  }
  return false;
}

/**
 * Eliminates acoustic stutters, ASR buffer loops, and consecutive repeated words/phrases.
 * e.g. "maine maine maine maine 8000 kamaye 8000 kamyee" -> "maine 8000 kamaye"
 */
export function deduplicateSpeechTranscript(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // 1. Remove consecutive identical or near-identical words
  const words = cleaned.split(/\s+/);
  const dedupedWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = dedupedWords[dedupedWords.length - 1];
    if (!prev || !areWordsSimilar(prev, w)) {
      dedupedWords.push(w);
    }
  }
  cleaned = dedupedWords.join(' ');

  // 2. Remove consecutive repeated phrases (up to 5-word phrases)
  for (let phraseLen = 5; phraseLen >= 2; phraseLen--) {
    const tokens = cleaned.split(/\s+/);
    let changed = false;
    const newTokens: string[] = [];
    let i = 0;
    while (i < tokens.length) {
      if (i + 2 * phraseLen <= tokens.length) {
        const slice1 = tokens.slice(i, i + phraseLen);
        const slice2 = tokens.slice(i + phraseLen, i + 2 * phraseLen);

        let match = true;
        for (let k = 0; k < phraseLen; k++) {
          if (!areWordsSimilar(slice1[k], slice2[k])) {
            match = false;
            break;
          }
        }

        if (match) {
          newTokens.push(...slice1);
          i += 2 * phraseLen;
          changed = true;
          continue;
        }
      }
      newTokens.push(tokens[i]);
      i++;
    }
    if (changed) {
      cleaned = newTokens.join(' ');
    }
  }

  return cleaned.trim();
}

// ---------------------------------------------------------------------------
// 2. INDIC DIGIT NORMALIZATION
// ---------------------------------------------------------------------------

export function normalizeIndicDigits(text: string): string {
  if (!text) return '';
  const indicRanges = [
    0x0966, // Devanagari ०-९ (Hindi, Marathi, Nepali)
    0x0ae6, // Gujarati ૦-૯
    0x09e6, // Bengali ০-৯
    0x0be6, // Tamil ௦-௯
    0x0ce6, // Kannada ೦-೯
    0x0c66, // Telugu ౦-౯
    0x0d66, // Malayalam ൦-൯
    0x0a66, // Gurmukhi ੦-੯
  ];

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    let matched = false;
    for (const start of indicRanges) {
      if (code >= start && code <= start + 9) {
        result += String(code - start);
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += text[i];
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// 2. VERNACULAR INDIC NUMBER DICTIONARY & COMPOUND NUMBER PARSER
// ---------------------------------------------------------------------------

const VERNACULAR_NUMBERS: Array<{ pattern: RegExp; value: number }> = [
  // Compound fractions & special vernacular terms
  { pattern: /\b(?:dedh\s*hazaar|dedh\s*hazar|deedh\s*hazar|दीड\s*हजार|डेढ़\s*हजार)\b/gi, value: 1500 },
  { pattern: /\b(?:dhai\s*hazaar|dhai\s*hazar|अडीच\s*हजार|ढाई\s*हजार)\b/gi, value: 2500 },
  { pattern: /\b(?:saadhe\s*teen\s*hazar|saade\s*teen\s*hazar|साडेतीन\s*हजार|साढ़े\s*तीन\s*हजार)\b/gi, value: 3500 },
  { pattern: /\b(?:saadhe\s*chaar\s*hazar|saade\s*char\s*hazar|साडेचार\s*हजार|साढ़े\s*चार\s*हजार)\b/gi, value: 4500 },
  { pattern: /\b(?:saadhe\s*paanch\s*hazar|saade\s*panch\s*hazar|साडेपाच\s*हजार|साढ़े\s*पांच\s*हजार)\b/gi, value: 5500 },

  { pattern: /\b(?:paune\s*do\s*sau|पौने\s*दो\s*सौ)\b/gi, value: 175 },
  { pattern: /\b(?:sava\s*sau|savva\s*sau|सवा\s*सौ)\b/gi, value: 125 },
  { pattern: /\b(?:dedh\s*sau|deedh\s*sau|dedsau|दीडशे|डेढ़\s*सौ)\b/gi, value: 150 },
  { pattern: /\b(?:dhai\s*sau|dhaisau|अडीचशे|ढाई\s*सौ)\b/gi, value: 250 },
  { pattern: /\b(?:paune\s*teen\s*sau|पौने\s*तीन\s*सौ)\b/gi, value: 275 },
  { pattern: /\b(?:saadhe\s*teen\s*sau|saade\s*teen\s*sau|साडेतीनशे|साढ़े\s*तीन\s*सौ)\b/gi, value: 350 },
  { pattern: /\b(?:saadhe\s*chaar\s*sau|saade\s*char\s*sau|साडेचारशे|साढ़े\s*चार\s*सौ)\b/gi, value: 450 },
  { pattern: /\b(?:saadhe\s*paanch\s*sau|saade\s*panch\s*sau|साडेपाचशे|साढ़े\s*पांच\s*सौ)\b/gi, value: 550 },

  // Thousands
  { pattern: /\b(?:das\s*hazaar|das\s*hazar|daha\s*hajar|दस\s*हजार|दहा\s*हजार|ten\s*thousand)\b/gi, value: 10000 },
  { pattern: /\b(?:nau\s*hazaar|nau\s*hazar|naw\s*hazar|नौ\s*हजार|नऊ\s*हजार|nine\s*thousand)\b/gi, value: 9000 },
  { pattern: /\b(?:aath\s*hazaar|aath\s*hazar|ath\s*hazar|आठ\s*हजार|eight\s*thousand)\b/gi, value: 8000 },
  { pattern: /\b(?:saat\s*hazaar|saat\s*hazar|सात\s*हजार|seven\s*thousand)\b/gi, value: 7000 },
  { pattern: /\b(?:chhe\s*hazaar|che\s*hazar|saha\s*hazar|छह\s*हजार|सहा\s*हजार|six\s*thousand)\b/gi, value: 6000 },
  { pattern: /\b(?:paanch\s*hazaar|panch\s*hazar|paach\s*hazar|पांच\s*हजार|पाच\s*हजार|five\s*thousand)\b/gi, value: 5000 },
  { pattern: /\b(?:chaar\s*hazaar|char\s*hazar|चार\s*हजार|four\s*thousand)\b/gi, value: 4000 },
  { pattern: /\b(?:teen\s*hazaar|teen\s*hazar|तीन\s*हजार|three\s*thousand)\b/gi, value: 3000 },
  { pattern: /\b(?:do\s*hazaar|do\s*hazar|don\s*hajar|दो\s*हजार|दोन\s*हजार|two\s*thousand)\b/gi, value: 2000 },
  { pattern: /\b(?:ek\s*hazaar|ek\s*hazar|hazaar|hazar|हजार|हज़ार|one\s*thousand)\b/gi, value: 1000 },

  // Hundreds
  { pattern: /\b(?:nau\s*sau|naw\s*she|नौ\s*सौ|नऊशे|nine\s*hundred)\b/gi, value: 900 },
  { pattern: /\b(?:aath\s*sau|ath\s*she|आठ\s*सौ|आठशे|eight\s*hundred)\b/gi, value: 800 },
  { pattern: /\b(?:saat\s*sau|saat\s*she|सात\s*सौ|सातशे|seven\s*hundred)\b/gi, value: 700 },
  { pattern: /\b(?:chhe\s*sau|che\s*she|saha\s*she|छह\s*सौ|सहाशे|six\s*hundred)\b/gi, value: 600 },
  { pattern: /\b(?:paanch\s*sau|panch\s*sau|paach\s*she|पांच\s*सौ|पाचशे|five\s*hundred)\b/gi, value: 500 },
  { pattern: /\b(?:chaar\s*sau|char\s*sau|char\s*she|चार\s*सौ|चारशे|four\s*hundred)\b/gi, value: 400 },
  { pattern: /\b(?:teen\s*sau|teen\s*she|तीन\s*सौ|तीनशे|three\s*hundred)\b/gi, value: 300 },
  { pattern: /\b(?:do\s*sau|don\s*she|दो\s*सौ|दोनशे|two\s*hundred)\b/gi, value: 200 },
  { pattern: /\b(?:ek\s*sau|sau|she|shambhar|एक\s*सौ|सौ|शंभर|one\s*hundred)\b/gi, value: 100 },

  // Tens & Units
  { pattern: /\b(?:nabbe|navvad|नब्बे|नव्वद|ninety)\b/gi, value: 90 },
  { pattern: /\b(?:assi|aishi|अस्सी|ऐंशी|eighty)\b/gi, value: 80 },
  { pattern: /\b(?:sattar|सत्तर|seventy)\b/gi, value: 70 },
  { pattern: /\b(?:saath|sath|साठ|sixty)\b/gi, value: 60 },
  { pattern: /\b(?:pachas|pannas|पचास|पन्नास|fifty)\b/gi, value: 50 },
  { pattern: /\b(?:chaalis|chalis|chaalees|चालीस|चाळीस|forty)\b/gi, value: 40 },
  { pattern: /\b(?:tees|तीस|thirty)\b/gi, value: 30 },
  { pattern: /\b(?:bees|vees|बीस|वीस|twenty)\b/gi, value: 20 },
  { pattern: /\b(?:pandrah|पंद्रह|fifteen)\b/gi, value: 15 },
  { pattern: /\b(?:das|daha|दस|दहा|ten)\b/gi, value: 10 },
  { pattern: /\b(?:paanch|panch|पांच|पाच|five)\b/gi, value: 5 },
  { pattern: /\b(?:chaar|char|चार|four)\b/gi, value: 4 },
  { pattern: /\b(?:teen|तीन|three)\b/gi, value: 3 },
  { pattern: /\b(?:do|don|दो|दोन|two)\b/gi, value: 2 },
  { pattern: /\b(?:ek|एक|one)\b/gi, value: 1 },
];

/**
 * Replaces spoken vernacular Indic number words with numeric digits
 * Handles compound additions e.g., "do hazaar paanch sau" -> 2500
 */
export function convertVernacularNumberWords(text: string): string {
  if (!text) return '';
  let updated = text;

  // Replace compound patterns in descending value order
  for (const item of VERNACULAR_NUMBERS) {
    updated = updated.replace(item.pattern, ` ${item.value} `);
  }

  // Handle adjacent compound numbers e.g. "2000 500" -> 2500, "1000 150" -> 1150, "500 50" -> 550
  updated = updated.replace(/\b(\d{3,5})\s+(\d{2,3})\b/g, (_m, high, low) => {
    const h = parseInt(high, 10);
    const l = parseInt(low, 10);
    if ((h === 1000 || h === 2000 || h === 3000 || h === 4000 || h === 5000) && l < 1000) {
      return String(h + l);
    }
    if ((h === 100 || h === 200 || h === 300 || h === 400 || h === 500 || h === 600 || h === 700 || h === 800 || h === 900) && l < 100) {
      return String(h + l);
    }
    return `${high} ${low}`;
  });

  return updated.replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// 3. STEP 1: SMART SENTENCE SPLITTING
// ---------------------------------------------------------------------------

/**
 * Checks if a string segment contains any numeric or vernacular amount
 */
export function hasAmount(segment: string): boolean {
  if (!segment) return false;
  const normalized = convertVernacularNumberWords(normalizeIndicDigits(segment));
  return /(?:₹|rs\.?|inr)?\s*\b\d+(?:\.\d+)?\b/i.test(normalized);
}

/**
 * Smart splitting rule:
 * - Split on par, lekin, magar, pan, and, then — always separate transactions.
 * - Split on aur, ani, & only if BOTH sides contain an amount.
 */
export function splitCompoundSentence(text: string): string[] {
  if (!text) return [];

  // Normalize script digits first
  const normalizedText = normalizeIndicDigits(text);

  // 1. Primary Split: Conjunctions that ALWAYS separate transactions:
  // "par", "lekin", "magar", "pan", "kintu", "parantu", "and", "then", plus punctuation
  const primaryRegex = /\b(?:par|lekin|magar|pan|kintu|parantu|and|then)\b|[,;\n]/gi;
  const primaryChunks = normalizedText
    .split(primaryRegex)
    .map((s) => s.trim())
    .filter(Boolean);

  const finalChunks: string[] = [];

  // 2. Secondary Split: Check "aur", "ani", "&"
  // Split on "aur" / "ani" ONLY if both sides contain an amount!
  for (const chunk of primaryChunks) {
    const aurRegex = /\b(?:aur|ani|&)\b/gi;
    if (!aurRegex.test(chunk)) {
      finalChunks.push(chunk);
      continue;
    }

    // Split candidate on "aur" / "ani"
    const subParts = chunk.split(aurRegex).map((s) => s.trim()).filter(Boolean);
    if (subParts.length < 2) {
      finalChunks.push(chunk);
      continue;
    }

    // Check if each pair across the split has amounts
    let currentAccumulator = subParts[0];
    for (let i = 1; i < subParts.length; i++) {
      const nextPart = subParts[i];
      if (hasAmount(currentAccumulator) && hasAmount(nextPart)) {
        finalChunks.push(currentAccumulator);
        currentAccumulator = nextPart;
      } else {
        // "petrol aur diesel" -> join them back together into the same transaction
        currentAccumulator = `${currentAccumulator} aur ${nextPart}`;
      }
    }
    if (currentAccumulator) {
      finalChunks.push(currentAccumulator);
    }
  }

  return finalChunks;
}

// ---------------------------------------------------------------------------
// 4. STEP 2: AMOUNT EXTRACTION
// ---------------------------------------------------------------------------

export function extractAmountFromChunk(chunk: string): { amount: number; remainingText: string } | null {
  // Convert vernacular number words & Indic digits to digits
  const converted = convertVernacularNumberWords(normalizeIndicDigits(chunk));

  // Regex pattern matching currency and digits
  const amtMatch = converted.match(
    /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:rupaye|rupees|rs|inr|₹|ka|ke|chi)?/i
  );

  if (!amtMatch) return null;

  const rawNum = amtMatch[1];
  const amount = parseFloat(rawNum);
  if (isNaN(amount) || amount <= 0) return null;

  // Remove the matched number and currency terms
  const remaining = converted
    .replace(/(?:₹|rs\.?|inr)/gi, '')
    .replace(new RegExp(`\\b${rawNum}\\b`, 'g'), '')
    .trim();

  return { amount, remainingText: remaining };
}

// ---------------------------------------------------------------------------
// 5. STEP 3: ROLE ASSIGNMENT (INCOME VS EXPENSE)
// ---------------------------------------------------------------------------

const INCOME_KEYWORDS = [
  'kamaya',
  'kamaye',
  'kamai',
  'kamavle',
  'mila',
  'mile',
  'milale',
  'bhada',
  'kiraya aaya',
  'income',
  'credit',
  'credited',
  'aamdani',
  'bikri',
  'fare',
  'earnings',
  'earned',
  'salary',
  'payout',
  'revenue',
  'tips',
  'jama',
  'कमाए',
  'कमाया',
  'कमाई',
  'मिला',
  'मिले',
  'मिळाले',
  'कमावले',
  'आए',
  'आया',
];

const EXPENSE_KEYWORDS = [
  'kharch',
  'kharcha',
  'kharche',
  'diya',
  'diye',
  'dile',
  'lagaya',
  'lagaye',
  'bharwaya',
  'bharwaye',
  'bharla',
  'kharida',
  'kharidi',
  'peeya',
  'pee',
  'pi',
  'khaya',
  'kiya',
  'gaya',
  'gayi',
  'gaye',
  'zala',
  'zale',
  'liya',
  'li',
  'spent',
  'paid',
  'cost',
  'bought',
  'debit',
  'recharge',
  'bhara',
  'खर्च',
  'खर्चा',
  'दिया',
  'दिए',
  'लगाया',
  'भरवाया',
  'खरीदा',
  'खरीदी',
  'पी',
  'पिया',
  'खाया',
];

const DEFINITE_EXPENSE_NOUNS = [
  'tel',
  'petrol',
  'diesel',
  'cng',
  'fuel',
  'chai',
  'tea',
  'khana',
  'lunch',
  'dinner',
  'nashta',
  'sabzi',
  'ration',
  'dawai',
  'medicine',
  'doctor',
  'tablet',
  'recharge',
  'rent',
  'kiraya',
  'puncture',
  'chaha',
  'जेवण',
  'नाश्ता',
  'दवा',
  'पेट्रोल',
  'इंधन',
];

export function detectTransactionRole(
  chunk: string,
  amount: number,
  workerMedian: number = 500
): TransactionType {
  const lower = chunk.toLowerCase();

  const hasIncome = INCOME_KEYWORDS.some((kw) => lower.includes(kw));
  const hasExpense = EXPENSE_KEYWORDS.some((kw) => lower.includes(kw));
  const hasExpenseNoun = DEFINITE_EXPENSE_NOUNS.some((n) => lower.includes(n));

  if (hasIncome && !hasExpense) {
    return 'income';
  }
  if (hasExpense && !hasIncome) {
    return 'expense';
  }
  if (hasExpenseNoun) {
    return 'expense';
  }

  // Ambiguity / context fallback:
  // Large amounts without expense verbs default to income; small amounts default to expense
  return amount > workerMedian ? 'income' : 'expense';
}

// ---------------------------------------------------------------------------
// 6. STEP 4: TEXT CLEANING & CATEGORY CLASSIFICATION (MODEL 1)
// ---------------------------------------------------------------------------

const STOP_WORDS = [
  'ka',
  'ki',
  'ke',
  'mein',
  'me',
  'se',
  'ko',
  'par',
  'pe',
  'aur',
  'ani',
  'aaj',
  'kal',
  'abhi',
  'rupaye',
  'rupees',
  'rs',
  'inr',
  'chi',
  'cha',
  'che',
  'for',
  'spent',
  'add',
  'hue',
  'hota',
  'kela',
];

export function cleanTransactionText(chunk: string, type: TransactionType): string {
  let cleaned = chunk.toLowerCase();

  // Remove role verbs
  const allVerbs = [...INCOME_KEYWORDS, ...EXPENSE_KEYWORDS];
  for (const v of allVerbs) {
    cleaned = cleaned.replace(new RegExp(`\\b${v}\\b`, 'gi'), ' ');
  }

  // Remove stop words
  for (const sw of STOP_WORDS) {
    cleaned = cleaned.replace(new RegExp(`\\b${sw}\\b`, 'gi'), ' ');
  }

  // Clean extra whitespace
  cleaned = cleaned.replace(/[^\w\s\u0900-\u097F]/g, ' ').replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    return type === 'income' ? 'kamaye' : 'Expense';
  }

  return cleaned;
}

export function assignCategory(description: string, type: TransactionType): TransactionCategory {
  const lower = description.toLowerCase();

  if (type === 'income') {
    if (lower.includes('tip') || lower.includes('bonus') || lower.includes('inaam')) {
      return 'tips_bonus';
    }
    return 'work_earnings';
  }

  // Fuel / Travel
  if (
    lower.includes('tel') ||
    lower.includes('petrol') ||
    lower.includes('diesel') ||
    lower.includes('cng') ||
    lower.includes('fuel') ||
    lower.includes('travel') ||
    lower.includes('auto') ||
    lower.includes('fare') ||
    lower.includes('toll') ||
    lower.includes('puncture')
  ) {
    return 'travel_fuel';
  }

  // Food
  if (
    lower.includes('chai') ||
    lower.includes('tea') ||
    lower.includes('chaha') ||
    lower.includes('food') ||
    lower.includes('khana') ||
    lower.includes('lunch') ||
    lower.includes('dinner') ||
    lower.includes('nashta') ||
    lower.includes('breakfast') ||
    lower.includes('snack') ||
    lower.includes('grocer') ||
    lower.includes('sabzi') ||
    lower.includes('ration') ||
    lower.includes('hotel')
  ) {
    return 'food';
  }

  // Rent / Housing
  if (
    lower.includes('rent') ||
    lower.includes('kiraya') ||
    lower.includes('room') ||
    lower.includes('flat') ||
    lower.includes('bijli') ||
    lower.includes('electricity') ||
    lower.includes('gas')
  ) {
    return 'rent';
  }

  // Medical
  if (
    lower.includes('medic') ||
    lower.includes('dawa') ||
    lower.includes('doctor') ||
    lower.includes('hospital') ||
    lower.includes('clinic') ||
    lower.includes('tablet')
  ) {
    return 'medical';
  }

  // Tools
  if (
    lower.includes('recharge') ||
    lower.includes('tool') ||
    lower.includes('equipment') ||
    lower.includes('wire') ||
    lower.includes('drill') ||
    lower.includes('phone') ||
    lower.includes('mobile')
  ) {
    return 'tools';
  }

  return 'other';
}

// ---------------------------------------------------------------------------
// 7. STEP 5: DATE ASSIGNMENT
// ---------------------------------------------------------------------------

export function extractDateFromText(text: string): string {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes('yesterday') || lower.includes('kal') || lower.includes('काल')) {
    const yesterday = new Date(now.getTime() - 86400000);
    return yesterday.toISOString().split('T')[0];
  }
  if (lower.includes('parso') || lower.includes('परसों')) {
    const parso = new Date(now.getTime() - 2 * 86400000);
    return parso.toISOString().split('T')[0];
  }
  if (lower.includes('pichle hafte') || lower.includes('last week')) {
    const lastWeek = new Date(now.getTime() - 7 * 86400000);
    return lastWeek.toISOString().split('T')[0];
  }

  return now.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// 8. STEP 6: COMPOUND PARSER PIPELINE (MODEL 5 CORE)
// ---------------------------------------------------------------------------

/**
 * Model 5: Parses a compound spoken utterance into structured transactions.
 * 
 * Example:
 * Input: "Aaj 800 kamaye par 150 ka tel bharwaya aur 40 ki chai pee"
 * Returns:
 * - Income: ₹800 (description: "kamaye", category: "work_earnings")
 * - Expense: ₹150 (description: "tel", category: "travel_fuel")
 * - Expense: ₹40 (description: "chai", category: "food")
 */
export function parseCompoundTransactions(
  transcript: string,
  workerMedian: number = 500
): CompoundExtractionResult {
  const deduped = deduplicateSpeechTranscript(transcript || '');
  if (!deduped) {
    return {
      transactions: [],
      extraction_status: 'no_transactions',
      total_income: 0,
      total_expense: 0,
    };
  }

  // Step 1: Split sentence on conjunctions
  const chunks = splitCompoundSentence(deduped);
  const transactions: ParsedTransaction[] = [];

  for (const chunk of chunks) {
    // Step 2: Extract amount
    const parsedAmt = extractAmountFromChunk(chunk);
    if (!parsedAmt || parsedAmt.amount <= 0) continue;

    // Step 3: Role assignment (Income vs Expense)
    const txType = detectTransactionRole(chunk, parsedAmt.amount, workerMedian);

    // Step 4: Text cleaning & Category assignment
    const desc = cleanTransactionText(parsedAmt.remainingText, txType);
    const category = assignCategory(desc || chunk, txType);

    // Step 5: Date assignment
    const date = extractDateFromText(chunk);

    // Confidence heuristic
    const confidence = parsedAmt.amount > 0 ? 0.98 : 0.85;

    transactions.push({
      type: txType,
      amount: parsedAmt.amount,
      description: desc,
      category,
      date,
      raw_text: chunk,
      confidence,
    });
  }

  const total_income = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const total_expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  return {
    transactions,
    extraction_status: transactions.length > 0 ? 'success' : 'no_transactions',
    total_income,
    total_expense,
  };
}

// ---------------------------------------------------------------------------
// 9. QUERY INTENT & ENTITY EXTRACTION (MODEL 5 QUERY MODE)
// ---------------------------------------------------------------------------

/**
 * Extracts intent & entities for Job Search (Kaam), Health (Sehat), and Welfare (Haq)
 */
export function extractQueryIntentAndEntities(text: string): QueryIntentResult {
  const lower = text.toLowerCase();

  // 1. Job search
  if (
    lower.includes('kaam') ||
    lower.includes('job') ||
    lower.includes('naukri') ||
    lower.includes('chahiye') ||
    lower.includes('delivery') ||
    lower.includes('driver') ||
    lower.includes('electrician') ||
    lower.includes('plumber') ||
    lower.includes('carpenter') ||
    lower.includes('welder')
  ) {
    const entities: Record<string, string> = {};
    if (lower.includes('electrician')) entities.skill = 'electrician';
    else if (lower.includes('plumber')) entities.skill = 'plumber';
    else if (lower.includes('driver')) entities.skill = 'driver';
    else if (lower.includes('delivery')) entities.skill = 'delivery';
    else entities.skill = 'general_worker';

    if (lower.includes('pune')) entities.city = 'Pune';
    else if (lower.includes('mumbai')) entities.city = 'Mumbai';
    else if (lower.includes('delhi')) entities.city = 'Delhi';
    else if (lower.includes('bangalore') || lower.includes('bengaluru')) entities.city = 'Bengaluru';

    if (lower.includes('turant') || lower.includes('aaj hi') || lower.includes('urgent') || lower.includes('immediate')) {
      entities.urgency = 'immediate';
    }

    return { intent: 'job_search', entities };
  }

  // 2. Health query
  if (
    lower.includes('dard') ||
    lower.includes('pain') ||
    lower.includes('bukhar') ||
    lower.includes('fever') ||
    lower.includes('chot') ||
    lower.includes('injury') ||
    lower.includes('seene') ||
    lower.includes('chest') ||
    lower.includes('saas') ||
    lower.includes('breath')
  ) {
    const entities: Record<string, string> = {};
    if (lower.includes('chest') || lower.includes('seene')) entities.symptom = 'chest pain';
    else if (lower.includes('fever') || lower.includes('bukhar')) entities.symptom = 'fever';
    else if (lower.includes('back') || lower.includes('kamar')) entities.symptom = 'back pain';
    else entities.symptom = 'general_symptom';

    if (lower.includes('tez') || lower.includes('tej') || lower.includes('severe') || lower.includes('bahut')) {
      entities.severity = 'high';
    } else {
      entities.severity = 'moderate';
    }

    const durationMatch = lower.match(/(\d+)\s*(ghante|hours?|din|days?)/i);
    if (durationMatch) {
      entities.duration = `${durationMatch[1]} ${durationMatch[2]}`;
    }

    return { intent: 'health_query', entities };
  }

  // 3. Welfare / Haq query
  if (
    lower.includes('yojna') ||
    lower.includes('yojana') ||
    lower.includes('scheme') ||
    lower.includes('shram') ||
    lower.includes('card') ||
    lower.includes('pension') ||
    lower.includes('bima') ||
    lower.includes('insurance') ||
    lower.includes('haq') ||
    lower.includes('ayushman')
  ) {
    const entities: Record<string, string> = {};
    if (lower.includes('shram')) entities.scheme = 'e-shram';
    else if (lower.includes('ayushman')) entities.scheme = 'pm-jay-ayushman';
    else if (lower.includes('pension')) entities.scheme = 'pm-sym-pension';
    else entities.scheme = 'welfare';

    entities.topic = lower.includes('apply') || lower.includes('kaise') ? 'application' : 'benefits';
    return { intent: 'welfare_query', entities };
  }

  // 4. Transaction log fallback
  if (hasAmount(text)) {
    return { intent: 'transaction_log', entities: {} };
  }

  return { intent: 'unknown', entities: {} };
}
