/**
 * Multilingual Number and Transaction Parser
 * Supports Devanagari (०–९), Gujarati (૦–૯), Bengali (০–৯), Tamil (௦–௯),
 * Kannada (೦–೯), Telugu (౦–౯), Malayalam (൦–൯), Gurmukhi (੦–੯), and standard (0–9) digits,
 * as well as spoken number words and phrases in Hindi, Marathi, Gujarati, and English.
 */

import type { ExtractedEntity } from '../ai/modelRegistry';

/**
 * Normalizes all Indic script digits to standard Arabic numerals (0-9).
 */
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
    0x0a66, // Gurmukhi ੦-੯ (Punjabi)
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

function makeWordPattern(expr: string): RegExp {
  return new RegExp(`(?<=[^\\p{L}\\p{N}]|^)(?:${expr})(?=[^\\p{L}\\p{N}]|$)`, 'gui');
}

/**
 * Dictionary of spoken number words and phrase mappings for Hindi, Marathi, Gujarati, and English.
 */
const SPOKEN_NUMBER_PATTERNS: Array<{ pattern: RegExp; value: number }> = [
  // Compound fractions & colloquial amounts
  { pattern: makeWordPattern('डेढ़\\s*हजार|दीड\\s*हजार|dedh\\s*hazar'), value: 1500 },
  { pattern: makeWordPattern('ढाई\\s*हजार|अडीच\\s*हजार|dhai\\s*hazar'), value: 2500 },
  { pattern: makeWordPattern('साढ़े\\s*तीन\\s*हजार|साडेतीन\\s*हजार'), value: 3500 },
  { pattern: makeWordPattern('साढ़े\\s*चार\\s*हजार|साडेचार\\s*हजार'), value: 4500 },
  { pattern: makeWordPattern('साढ़े\\s*पांच\\s*हजार|साडेपाच\\s*हजार'), value: 5500 },
  { pattern: makeWordPattern('डेढ़\\s*सौ|दीडशे|dedh\\s*sau'), value: 150 },
  { pattern: makeWordPattern('ढाई\\s*सौ|अडीचशे|dhai\\s*sau'), value: 250 },
  { pattern: makeWordPattern('साढ़े\\s*तीन\\s*सौ|साडेतीनशे'), value: 350 },
  { pattern: makeWordPattern('साढ़े\\s*चार\\s*सौ|साडेचारशे'), value: 450 },
  { pattern: makeWordPattern('साढ़े\\s*पांच\\s*सौ|साडेपाचशे'), value: 550 },
  { pattern: makeWordPattern('साढ़े\\s*छह\\s*सौ|साडेसहाशे'), value: 650 },
  { pattern: makeWordPattern('साढ़े\\s*सात\\s*सौ|साडेसातशे'), value: 750 },
  { pattern: makeWordPattern('साढ़े\\s*आठ\\s*सौ|साडेआठशे'), value: 850 },
  { pattern: makeWordPattern('साढ़े\\s*नौ\\s*सौ|साडेनऊशे'), value: 950 },

  // Thousands
  { pattern: makeWordPattern('दस\\s*हजार|दहा\\s*हजार|દસ\\s*હજાર|ten\\s*thousand'), value: 10000 },
  { pattern: makeWordPattern('नौ\\s*हजार|नऊ\\s*हजार|નવ\\s*હજાર|nine\\s*thousand'), value: 9000 },
  { pattern: makeWordPattern('आठ\\s*हजार|આઠ\\s*હજાર|eight\\s*thousand'), value: 8000 },
  { pattern: makeWordPattern('सात\\s*हजार|સાત\\s*હજાર|seven\\s*thousand'), value: 7000 },
  { pattern: makeWordPattern('छह\\s*हजार|सहा\\s*हजार|છ\\s*હજાર|six\\s*thousand'), value: 6000 },
  { pattern: makeWordPattern('पांच\\s*हजार|पाँच\\s*हजार|पाच\\s*हजार|પાંચ\\s*હજાર|five\\s*thousand'), value: 5000 },
  { pattern: makeWordPattern('चार\\s*हजार|ચાર\\s*હજાર|four\\s*thousand'), value: 4000 },
  { pattern: makeWordPattern('तीन\\s*हजार|ત્રણ\\s*હજાર|three\\s*thousand'), value: 3000 },
  { pattern: makeWordPattern('दो\\s*हजार|दोन\\s*हजार|બે\\s*હજાર|two\\s*thousand'), value: 2000 },
  { pattern: makeWordPattern('एक\\s*हजार|हजार|हज़ार|હજાર|one\\s*thousand|a\\s*thousand'), value: 1000 },

  // Hundreds
  { pattern: makeWordPattern('नौ\\s*सौ|नऊशे|નવસો|nine\\s*hundred|9\\s*hundred'), value: 900 },
  { pattern: makeWordPattern('आठ\\s*सौ|आठशे|આઠસો|eight\\s*hundred|8\\s*hundred'), value: 800 },
  { pattern: makeWordPattern('सात\\s*सौ|सातशे|સાતસો|seven\\s*hundred|7\\s*hundred'), value: 700 },
  { pattern: makeWordPattern('छह\\s*सौ|सहाशे|છસો|six\\s*hundred|6\\s*hundred'), value: 600 },
  { pattern: makeWordPattern('पांच\\s*सौ|पाँच\\s*सौ|पाचशे|પાંચસો|five\\s*hundred|5\\s*hundred'), value: 500 },
  { pattern: makeWordPattern('चार\\s*सौ|चारशे|ચારસો|four\\s*hundred|4\\s*hundred'), value: 400 },
  { pattern: makeWordPattern('तीन\\s*सौ|तीनशे|ત્રણસો|three\\s*hundred|3\\s*hundred'), value: 300 },
  { pattern: makeWordPattern('दो\\s*सौ|दोनशे|બસો|બેસો|two\\s*hundred|2\\s*hundred'), value: 200 },
  { pattern: makeWordPattern('एक\\s*सौ|एकशे|शंभर|સો|one\\s*hundred|1\\s*hundred'), value: 100 },

  // Tens & common smaller values
  { pattern: makeWordPattern('नब्बे|नव्वद|નેવું|ninety'), value: 90 },
  { pattern: makeWordPattern('अस्सी|ऐंशी|એંસી|eighty'), value: 80 },
  { pattern: makeWordPattern('सत्तर|સિત્તેર|seventy'), value: 70 },
  { pattern: makeWordPattern('साठ|સાઈઠ|sixty'), value: 60 },
  { pattern: makeWordPattern('पचास|पन्नास|પચાસ|fifty'), value: 50 },
  { pattern: makeWordPattern('चालीस|चाळीस|ચાલીસ|forty'), value: 40 },
  { pattern: makeWordPattern('तीस|ત્રીસ|thirty'), value: 30 },
  { pattern: makeWordPattern('बीस|वीस|વીસ|twenty'), value: 20 },
  { pattern: makeWordPattern('दस|दहा|દસ|ten'), value: 10 },
];

/**
 * Replaces spoken number words and phrases with their numeric ASCII representation.
 */
export function convertSpokenNumberWords(text: string): string {
  if (!text) return '';
  let updated = text;

  for (const item of SPOKEN_NUMBER_PATTERNS) {
    updated = updated.replace(item.pattern, ` ${item.value} `);
  }

  return updated.replace(/\s+/g, ' ').trim();
}

/**
 * Complete pre-processing of transcript:
 * 1. Normalizes Indic script digits to ASCII
 * 2. Converts spoken number words (Hindi, Marathi, Gujarati, English) to digits
 */
export function preprocessMultilingualTranscript(text: string): string {
  const digitsNormalized = normalizeIndicDigits(text);
  const wordsConverted = convertSpokenNumberWords(digitsNormalized);
  return wordsConverted;
}

/**
 * Comprehensive Multilingual Transaction Extraction Result
 */
export interface ParsedTransactionInfo {
  income: number;
  expense: number;
  expenseCategory: string;
  date: 'today' | 'yesterday';
  rawCleanedText: string;
  entities: ExtractedEntity[];
}

/**
 * Multilingual Income Keywords (Devanagari, Gujarati, Bengali, Tamil, Latin)
 */
const INCOME_KEYWORDS = [
  // Devanagari / Hindi / Marathi
  'कमाए',
  'कमाया',
  'कमाई',
  'मिला',
  'मिले',
  'मिळाले',
  'मिळवले',
  'कमावले',
  'आए',
  'आया',
  'आले',
  'आमदनी',
  // Gujarati
  'કમાયા',
  'મળ્યા',
  'આવક',
  'આવ્યા',
  // Bengali
  'আয়',
  'পেলাম',
  'উপার্জিত',
  // Tamil
  'வருமானம்',
  'சம்பாதித்தேன்',
  'கிடைத்தது',
  // Latin / Hinglish / English
  'kamaye',
  'kamaya',
  'kamayi',
  'mila',
  'mile',
  'milale',
  'kamavle',
  'earned',
  'earning',
  'income',
  'received',
  'got',
  'revenue',
  'payout',
];

/**
 * Multilingual Expense Keywords (Devanagari, Gujarati, Bengali, Tamil, Latin)
 */
const EXPENSE_KEYWORDS = [
  // Devanagari / Hindi / Marathi
  'खर्च',
  'खर्चा',
  'खर्च हुए',
  'खर्च हुआ',
  'खर्च झाले',
  'खर्च झाला',
  'झाले',
  'झाला',
  'दिले',
  'दिला',
  'गेले',
  'गया',
  'गए',
  'दिपे',
  // Gujarati
  'ખર્ચ',
  'ખર્ચ થયો',
  'આપ્યા',
  'ગયા',
  // Bengali
  'খরচ',
  'ব্যয়',
  'দিলাম',
  // Tamil
  'செலவு',
  'கொடுத்தேன்',
  // Latin / Hinglish / English
  'kharch',
  'kharcha',
  'kharch hue',
  'kharch zale',
  'zale',
  'zala',
  'gaye',
  'gaya',
  'diye',
  'diya',
  'de diye',
  'spent',
  'expense',
  'paid',
  'cost',
  'bought',
  'debit',
];

/**
 * Category detection keyword mappings
 */
const CATEGORY_MAP: Record<string, string[]> = {
  'Travel / Fuel': [
    'petrol',
    'diesel',
    'fuel',
    'cng',
    'gas',
    'travel',
    'auto',
    'rickshaw',
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
    'पेट्रोल',
    'डिझेल',
    'डिज़ल',
    'इंधन',
    'प्रवास',
    'रिक्षा',
    'ऑटो',
    'गाडी',
    'बस',
    'टोल',
    'પેટ્રોલ',
    'ડીઝલ',
    'મુસાફરી',
    'રિક્ષા',
    'ભાડું',
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
    'खाना',
    'जेवण',
    'नाश्ता',
    'नाष्टा',
    'चाय',
    'चहा',
    'भाजी',
    'किराणा',
    'किराना',
    'दूध',
    'हॉटेल',
    'ખાવાનું',
    'જમવાનું',
    'ચા',
    'નાસ્તો',
    'શાકભાજી',
  ],
  Rent: [
    'rent',
    'kiraya',
    'bhade',
    'room',
    'kholi',
    'flat',
    'deposit',
    'electricity',
    'bijli',
    'bill',
    'light bill',
    'किराया',
    'भाडे',
    'खोली',
    'घर',
    'वीज बिल',
    'लाईट बिल',
    'બિલ',
    'ભાડું',
  ],
  Tools: [
    'tools',
    'tool',
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
    'औजार',
    'हत्यार',
    'अवजार',
    'वायर',
    'ड्रिल',
    'हातोडा',
    'ओજાર',
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
    'दवा',
    'औषध',
    'डॉक्टर',
    'हॉस्पिटल',
    'दवाखाना',
    'गोळ्या',
    'દવા',
    'હોસ્પિટલ',
  ],
};

/**
 * Extracts income, expense, category, date, and entities from multilingual input.
 */
export function extractMultilingualTransaction(rawTranscript: string): ParsedTransactionInfo {
  // 1. Preprocess script digits and spoken number phrases
  const cleaned = preprocessMultilingualTranscript(rawTranscript || '');
  const lower = cleaned.toLowerCase();
  const entities: ExtractedEntity[] = [];

  let income = 0;
  let expense = 0;
  let expenseCategory = 'Food';
  let date: 'today' | 'yesterday' = 'today';

  // 2. Identify all numbers present in transcript
  const allNumbers: number[] = [];
  const numRegex = /\b\d+(?:\.\d+)?\b/g;
  let numMatch: RegExpExecArray | null;
  while ((numMatch = numRegex.exec(cleaned)) !== null) {
    const val = parseFloat(numMatch[0]);
    if (!isNaN(val) && val > 0) {
      allNumbers.push(val);
    }
  }

  // 3. Check for specific income and expense keyword matches
  const hasIncomeMarker = INCOME_KEYWORDS.some((kw) => lower.includes(kw));
  const hasExpenseMarker = EXPENSE_KEYWORDS.some((kw) => lower.includes(kw));

  // Check category keywords in transcript
  let detectedCategory: string | null = null;
  for (const [catName, kws] of Object.entries(CATEGORY_MAP)) {
    if (kws.some((kw) => lower.includes(kw))) {
      detectedCategory = catName;
      entities.push({ text: catName.toLowerCase(), type: 'EXPENSE_CATEGORY', confidence: 0.95 });
      break;
    }
  }

  if (detectedCategory) {
    expenseCategory = detectedCategory;
  }

  // 4. Intent parsing based on numbers and keywords
  if (allNumbers.length === 1) {
    const singleVal = allNumbers[0];
    if (hasExpenseMarker) {
      // e.g. "700 खर्च हुए", "700 spent", "खर्च 700"
      expense = singleVal;
      income = 0;
      entities.push({ text: `₹${expense}`, type: 'AMOUNT', confidence: 0.98 });
    } else if (hasIncomeMarker) {
      // e.g. "800 कमाए", "earned 800"
      income = singleVal;
      expense = 0;
      entities.push({ text: `₹${income}`, type: 'AMOUNT', confidence: 0.98 });
    } else if (detectedCategory) {
      // e.g. "petrol 200", "lunch 120"
      expense = singleVal;
      income = 0;
      entities.push({ text: `₹${expense}`, type: 'AMOUNT', confidence: 0.94 });
    } else {
      // Unspecified single number - check context or default to expense if expense words near
      if (lower.includes('rupaye') || lower.includes('रुपये') || lower.includes('rupees')) {
        expense = singleVal;
        income = 0;
      } else {
        income = singleVal;
        expense = 0;
      }
      entities.push({ text: `₹${singleVal}`, type: 'AMOUNT', confidence: 0.90 });
    }
  } else if (allNumbers.length >= 2) {
    // Both numbers present: e.g. "800 kamaye 200 kharch hue" or "earned 1000 spent 300"
    // Search around keywords for positional proximity
    let assignedInc = false;
    let assignedExp = false;

    // Check if first number is near income or expense
    for (const val of allNumbers) {
      const valStr = String(val);
      const valPos = cleaned.indexOf(valStr);
      if (valPos === -1) continue;

      // Extract window around the number (-25 to +25 chars)
      const windowStart = Math.max(0, valPos - 25);
      const windowEnd = Math.min(cleaned.length, valPos + valStr.length + 25);
      const windowText = lower.slice(windowStart, windowEnd);

      const isIncWindow = INCOME_KEYWORDS.some((kw) => windowText.includes(kw));
      const isExpWindow = EXPENSE_KEYWORDS.some((kw) => windowText.includes(kw));

      if (isIncWindow && !assignedInc) {
        income = val;
        assignedInc = true;
        entities.push({ text: `₹${val} (income)`, type: 'AMOUNT', confidence: 0.96 });
      } else if (isExpWindow && !assignedExp) {
        expense = val;
        assignedExp = true;
        entities.push({ text: `₹${val} (expense)`, type: 'AMOUNT', confidence: 0.96 });
      }
    }

    // Fallback if positional matching didn't catch both
    if (!assignedInc && !assignedExp) {
      // Conventionally in Indian gig worker phrasing: "earned X, spent Y"
      income = allNumbers[0];
      expense = allNumbers[1];
      entities.push({ text: `₹${income}`, type: 'AMOUNT', confidence: 0.88 });
      entities.push({ text: `₹${expense}`, type: 'AMOUNT', confidence: 0.88 });
    } else if (assignedInc && !assignedExp) {
      const remaining = allNumbers.find((n) => n !== income);
      if (remaining) expense = remaining;
    } else if (!assignedInc && assignedExp) {
      const remaining = allNumbers.find((n) => n !== expense);
      if (remaining) income = remaining;
    }
  }

  // 5. Date Detection
  if (
    lower.includes('yesterday') ||
    lower.includes('kal') ||
    lower.includes('काल') ||
    lower.includes('गए कल') ||
    lower.includes('ગઈકાલે')
  ) {
    date = 'yesterday';
    entities.push({ text: 'yesterday', type: 'DATE', confidence: 0.95 });
  } else {
    date = 'today';
    entities.push({ text: 'today', type: 'DATE', confidence: 0.95 });
  }

  return {
    income,
    expense,
    expenseCategory,
    date,
    rawCleanedText: cleaned,
    entities,
  };
}
