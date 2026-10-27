/**
 * FairWork Setu - Unified Multilingual Voice Assistant Service
 * Handles speech recognition with 5-second continuous silence detection,
 * multi-turn conversational context, multilingual intent recognition (Hindi, Marathi, English, Hinglish),
 * and live execution across Home, Work, Money, Health, Skills, Rights, and Profile/Settings.
 */

import type { Transaction, TransactionCategory } from '../types/transaction';
import type { JobListing } from '../types/marketplace';
import { fetchJobs, fetchMyApplications, fetchBookings } from './marketplaceService';
import {
  recommendSkillsForWorker,
  searchHealthWelfareRAG,
  classifyExpenseText,
  forecastIncomeHorizon,
  matchJobsWithWorker,
  detectTransactionAnomalies,
  parseAssistantIntent,
} from './aiModelsClient';
import { fetchHealthFacilities, getSavedHealthItems } from './healthService';
import { VERIFIED_LEGAL_SOURCES, getSavedCases } from './haqService';
import { getActiveUser } from '../lib/supabaseClient';
import { formatInr } from '../localization';
import { normalizeIndicDigits } from '../lib/multilingualNumberParser';

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export interface PendingTransactionItem {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: TransactionCategory;
  description: string;
  dateStr?: string;
}

export interface AssistantPendingConfirmation {
  kind: 'single_transaction' | 'multiple_transactions';
  items: PendingTransactionItem[];
  totalAmount: number;
  summaryText: string;
}

export interface AssistantJobCard {
  id: string;
  title: string;
  employer: string;
  location: string;
  pay: string;
  workType: string;
  matchScore?: number;
  matchingSkills?: string[];
  explanation?: string;
}

export interface AssistantCourseCard {
  id: string;
  title: string;
  provider: string;
  skills: string;
  url?: string;
}

export interface AssistantEmergencyAlert {
  isEmergency: boolean;
  severity: 'critical' | 'high' | 'moderate';
  primaryNumber: string;
  secondaryNumber: string;
  reason: string;
  advice: string;
}

export interface AssistantNavigationAction {
  route: string;
  label: string;
  description?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  lang?: SupportedLanguage;
  intent?: string;
  confidence?: number;
  targetLang?: 'en' | 'hi' | 'mr';
  // Dynamic action payloads
  pendingConfirmation?: AssistantPendingConfirmation;
  jobResults?: AssistantJobCard[];
  courseResults?: AssistantCourseCard[];
  emergencyAlert?: AssistantEmergencyAlert;
  navigationAction?: AssistantNavigationAction;
  executedSummary?: string;
}

export interface AssistantContextState {
  pendingConfirmation: AssistantPendingConfirmation | null;
  lastIntent: string | null;
  currentScreen?: string; // 'home' | 'kaam' | 'dhan' | 'sehat' | 'kaushal' | 'haq' | 'profile'
  userProfile?: {
    id?: string;
    name?: string;
    workType?: string | null;
    cityKey?: string;
    savingsGoal?: number;
    skillKeys?: string[];
    customSkills?: string[];
    preferredLanguage?: string;
    experienceYears?: number;
  };
  transactions: Transaction[];
  summary: {
    todayIncome: number;
    todayExpense: number;
    todayNet: number;
    weeklyIncome: number;
    totalIncome: number;
    totalExpense: number;
    netForPeriod: number;
  };
  bookings?: any[];
  applications?: any[];
  haqCases?: any[];
}

// ---------------------------------------------------------------------------
// LANGUAGE & INTENT UTILITIES
// ---------------------------------------------------------------------------

export function detectSpokenLanguage(text: string): SupportedLanguage {
  if (!text) return 'en';
  const lower = text.toLowerCase();

  // 1. Devanagari script markers
  if (/[\u0900-\u097F]/.test(text)) {
    // Specific Marathi vocabulary markers in Devanagari
    if (
      /आहे|नाही|झाले|झाला|केले|केला|पाहिजे|रुपये|मिळाले|मिळवले|खर्च|काम|करायचे|मला|माझे|सांगा|कशी|कसा|द्या|आरोग्य|हक्क|शिल्लक|नोंदवा|दवाखाना|अर्ज|सुचवा/.test(
        text
      )
    ) {
      return 'mr';
    }
    return 'hi';
  }

  // 2. Transliterated / Romanized vocabulary markers
  // Marathi markers:
  if (
    /\b(mala|mazha|mazhe|ahe|ahet|nahi|jhale|zale|kela|kele|pahije|kamavle|kharch zala|paise|ani|kay karu|kasa|kashi|madat|nokari|shikayche|shillak|dakhav|saanga|kuthe|davakhana|arj|haq)\b/i.test(
      lower
    )
  ) {
    return 'mr';
  }

  // Hindi / Hinglish markers:
  if (
    /\b(aaj|kal|kamaya|kharcha|kharch|rupaye|batao|chahiye|kaam|bukhar|dard|paise|kitna|hua|likho|jodo|dikhao|kholo|meri|mera|seekhna|kripya|hisaab|hisab|shikayat|aspataal|dawa|bachat)\b/i.test(
      lower
    )
  ) {
    return 'hi';
  }

  return 'en';
}

/**
 * Standardize text category to valid TransactionCategory
 */
export function normalizeCategory(cat: string): TransactionCategory {
  const lower = cat.toLowerCase();
  if (
    lower.includes('fuel') ||
    lower.includes('travel') ||
    lower.includes('petrol') ||
    lower.includes('diesel') ||
    lower.includes('cng')
  ) {
    return 'travel_fuel';
  }
  if (
    lower.includes('food') ||
    lower.includes('chai') ||
    lower.includes('tea') ||
    lower.includes('lunch') ||
    lower.includes('dinner') ||
    lower.includes('nashta') ||
    lower.includes('grocer') ||
    lower.includes('sabzi') ||
    lower.includes('ration') ||
    lower.includes('roti')
  ) {
    return 'food';
  }
  if (lower.includes('rent') || lower.includes('kiraya') || lower.includes('room')) {
    return 'rent';
  }
  if (
    lower.includes('tool') ||
    lower.includes('equipment') ||
    lower.includes('machin') ||
    lower.includes('recharge') ||
    lower.includes('phone')
  ) {
    return 'tools';
  }
  if (
    lower.includes('medic') ||
    lower.includes('doctor') ||
    lower.includes('dawa') ||
    lower.includes('hospital') ||
    lower.includes('clinic') ||
    lower.includes('tablet')
  ) {
    return 'medical';
  }
  return 'other';
}

// ---------------------------------------------------------------------------
// PARSERS FOR MULTI-EXPENSE & COMPLEX UTTERANCES
// ---------------------------------------------------------------------------

export interface ExtractedMultiExpense {
  items: Array<{
    amount: number;
    category: TransactionCategory;
    description: string;
  }>;
  total: number;
}

export function extractMultipleExpenses(text: string): ExtractedMultiExpense | null {
  const cleaned = normalizeIndicDigits(text);
  const lower = cleaned.toLowerCase();

  const hasExpenseContext =
    lower.includes('expense') ||
    lower.includes('spent') ||
    lower.includes('kharch') ||
    lower.includes('kharcha') ||
    lower.includes('likho') ||
    lower.includes('jodo') ||
    lower.includes('diya') ||
    lower.includes('bhara');

  const segments = cleaned
    .split(/[,;\n]|\band\b|\baur\b|\bani\b|\bplus\b|&/gi)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedItems: Array<{
    amount: number;
    category: TransactionCategory;
    description: string;
  }> = [];

  for (const seg of segments) {
    const numMatch = seg.match(
      /(?:₹|rs\.?|inr)?\s*([0-9]{1,6}(?:\.[0-9]{1,2})?)\s*(?:rupees?|rs\.?|inr|₹|ka|ke|rupaye|paise)?/i
    );
    if (!numMatch) continue;

    const amt = parseFloat(numMatch[1]);
    if (isNaN(amt) || amt <= 0) continue;

    const itemDesc = seg
      .replace(/(?:₹|rs\.?|inr)/gi, '')
      .replace(numMatch[1], '')
      .replace(
        /\b(for|pe|par|ka|ke|rupees|rupaye|paise|spent|add|expenses?|kharcha|kharch|hue|aur|ani)\b/gi,
        ''
      )
      .trim();

    const desc = itemDesc || 'Expense';
    const cat = normalizeCategory(itemDesc);

    parsedItems.push({
      amount: amt,
      category: cat,
      description: desc.charAt(0).toUpperCase() + desc.slice(1),
    });
  }

  if (
    parsedItems.length >= 2 ||
    (parsedItems.length === 1 && hasExpenseContext && lower.includes('expenses'))
  ) {
    const total = parsedItems.reduce((acc, curr) => acc + curr.amount, 0);
    return { items: parsedItems, total };
  }

  return null;
}

// ---------------------------------------------------------------------------
// INTENT PROCESSOR & DIALOGUE AGENT
// ---------------------------------------------------------------------------

export async function processUserUtterance(
  input: string,
  state: AssistantContextState
): Promise<AssistantMessage> {
  const text = input.trim();
  const lang = detectSpokenLanguage(text);
  const cleaned = normalizeIndicDigits(text);
  const lower = cleaned.toLowerCase();
  const timestamp = new Date().toISOString();
  const msgId = `msg-${Date.now()}`;
  const currentScreen = state.currentScreen || 'home';
  const userName = state.userProfile?.name || 'Worker Friend';
  const userTrade = state.userProfile?.workType || 'delivery';
  const userCity = (state.userProfile?.cityKey || 'pune').replace('cities.', '');

  // 0. UNCLEAR AUDIO OR EMPTY INPUT HANDLING
  if (!text) {
    let emptyMsg =
      "I couldn't hear that clearly. Please tap the microphone to speak again or type your question below.";
    if (lang === 'hi') {
      emptyMsg =
        'मैं आपकी आवाज़ स्पष्ट रूप से नहीं सुन पाया। कृपया माइक दबाकर फिर से बोलें या नीचे अपना प्रश्न लिखें।';
    } else if (lang === 'mr') {
      emptyMsg =
        'मला तुमचा आवाज स्पष्टपणे ऐकू आला नाही. कृपया माइक दाबून पुन्हा बोला किंवा खाली तुमचा प्रश्न टाइप करा.';
    }
    return {
      id: msgId,
      role: 'assistant',
      text: emptyMsg,
      timestamp,
      lang,
      intent: 'unclear_audio',
    };
  }

  // Resolve authentic user ID for authorized queries
  let userId = state.userProfile?.id;
  if (!userId) {
    try {
      const activeU = await getActiveUser();
      if (activeU?.id) userId = activeU.id;
    } catch {
      // ignore
    }
  }
  if (!userId) {
    userId =
      'usr-' + (state.userProfile?.name || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  // 1. FOLLOW-UP CONFIRMATION OR CANCELLATION OF PENDING ACTION
  if (state.pendingConfirmation) {
    const pending = state.pendingConfirmation;

    // 1a. Check for Type Flip FIRST: "I meant income, not expense"
    if (
      lower.includes('income') ||
      lower.includes('kamai') ||
      lower.includes('kamavle') ||
      lower.includes('earning') ||
      lower.includes('mila') ||
      lower.includes('milale')
    ) {
      const updatedItems = pending.items.map((it) => ({
        ...it,
        type: 'income' as const,
        category: 'work_earnings' as const,
        description: 'Earnings',
      }));

      let resp = `Changed type to Income (${formatInr(pending.totalAmount)}). Ready to confirm?`;
      if (lang === 'hi')
        resp = `प्रकार बदलकर आय (कमाई: ${formatInr(
          pending.totalAmount
        )}) कर दिया गया है। क्या मैं इसे जोड़ दूं?`;
      if (lang === 'mr')
        resp = `प्रकार बदलून उत्पन्न (${formatInr(
          pending.totalAmount
        )}) केला आहे. पुष्टी करायची का?`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'correct_pending_type',
        pendingConfirmation: {
          ...pending,
          items: updatedItems,
          summaryText: `Income: ${formatInr(pending.totalAmount)} (Earnings)`,
        },
      };
    }

    // 1b. Check for Amount Correction: "Change that to ₹180", "180 kar do"
    const correctionMatch = cleaned.match(
      /(?:change|make|badal|kar do|nako|put|instead|nahi|to)?\s*(?:₹|rs\.?)?\s*([0-9]{2,6})\s*(?:rupees?|rs\.?|kar do|karo)?/i
    );
    if (
      (lower.includes('change') ||
        lower.includes('badal') ||
        lower.includes('kar do') ||
        lower.includes('meant') ||
        lower.includes('to')) &&
      correctionMatch &&
      correctionMatch[1]
    ) {
      const newAmt = parseFloat(correctionMatch[1]);
      if (!isNaN(newAmt) && newAmt > 0) {
        const updatedItems = pending.items.map((item, idx) =>
          idx === 0 ? { ...item, amount: newAmt } : item
        );
        const newTotal = updatedItems.reduce((sum, it) => sum + it.amount, 0);

        let resp = `Updated amount to ${formatInr(newAmt)}. Please confirm to save.`;
        if (lang === 'hi')
          resp = `राशि बदलकर ${formatInr(
            newAmt
          )} कर दी गई है। कृपया सहेजने के लिए पुष्टि करें।`;
        if (lang === 'mr')
          resp = `रक्कम बदलून ${formatInr(newAmt)} केली आहे. जतन करण्यासाठी पुष्टी करा.`;

        return {
          id: msgId,
          role: 'assistant',
          text: resp,
          timestamp,
          lang,
          intent: 'correct_pending_amount',
          pendingConfirmation: {
            ...pending,
            items: updatedItems,
            totalAmount: newTotal,
            summaryText: `${
              updatedItems[0].type === 'income' ? 'Income' : 'Expense'
            }: ${formatInr(newTotal)} (${updatedItems[0].category})`,
          },
        };
      }
    }

    // 1c. Check for Explicit Cancel
    const isExplicitCancel =
      /\b(cancel|rehne do|mat karo|nako|discard|stop)\b/i.test(lower) ||
      (/\bno\b/i.test(lower) && !lower.includes('income') && !lower.includes('expense'));

    if (isExplicitCancel) {
      let resp = 'Transaction cancelled. No changes were made.';
      if (lang === 'hi') resp = 'लेनदेन रद्द कर दिया गया है। कोई बदलाव नहीं किया गया।';
      if (lang === 'mr') resp = 'व्यवहार रद्द केला आहे. कोणतेही बदल केले नाहीत.';

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'cancel_pending',
      };
    }

    // 1d. Check for Confirmation
    if (
      lower.includes('yes') ||
      lower.includes('confirm') ||
      lower.includes('save') ||
      lower.includes('haan') ||
      lower.includes('ha') ||
      lower.includes('ho') ||
      lower.includes('theek') ||
      lower.includes('add') ||
      lower.includes('kar do') ||
      lower.includes('chala')
    ) {
      let resp = `Confirmed and recorded ${
        pending.items.length === 1 ? 'transaction' : `${pending.items.length} transactions`
      } (${formatInr(pending.totalAmount)}) successfully.`;
      if (lang === 'hi')
        resp = `सफलतापूर्वक दर्ज किया गया: ${formatInr(
          pending.totalAmount
        )}। आपके खाते में विवरण जुड़ चुका है।`;
      if (lang === 'mr')
        resp = `यशस्वीरित्या नोंदवले: ${formatInr(
          pending.totalAmount
        )}. तुमच्या खात्यात नोंद झाली आहे.`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'confirm_execution',
        executedSummary: `Recorded ${pending.items.length} transaction(s) totaling ${formatInr(
          pending.totalAmount
        )}`,
        pendingConfirmation: pending,
      };
    }
  }

  // 2. CRITICAL HEALTH EMERGENCY CHECK (Highest Priority across all screens)
  const isEmergency =
    lower.includes('chest pain') ||
    lower.includes('seene mein dard') ||
    lower.includes('chaati madhe dard') ||
    lower.includes('heart attack') ||
    lower.includes('breathless') ||
    lower.includes('saans nahi') ||
    lower.includes('saas lene') ||
    lower.includes('heavy bleeding') ||
    lower.includes('bahut khoon') ||
    lower.includes('accident') ||
    lower.includes('unconscious') ||
    lower.includes('behosh') ||
    lower.includes('chakkar khakar gir');

  if (isEmergency) {
    let alertMsg =
      'CRITICAL HEALTH EMERGENCY DETECTED. Please stop physical work immediately and seek urgent emergency medical care.';
    let alertAdvice =
      'Call 112 (National Emergency) or 108 (Free Medical Ambulance) right now. Help is on the way.';

    if (lang === 'hi') {
      alertMsg =
        'आपातकालीन स्वास्थ्य स्थिति! कृपया तुरंत काम बंद करें और तत्काल आपातकालीन सहायता लें।';
      alertAdvice =
        'अभी 112 (राष्ट्रीय आपातकालीन सेवा) या 108 (निःशुल्क एम्बुलेंस) पर कॉल करें।';
    } else if (lang === 'mr') {
      alertMsg =
        'तातडीची वैद्यकीय आणीबाणी! कृपया त्वरित काम थांबवा आणि तातडीने वैद्यकीय मदत मिळवा.';
      alertAdvice = 'त्वरित 112 (राष्ट्रीय आपत्कालीन सेवा) किंवा 108 (रुग्णवाहिका) वर कॉल करा.';
    }

    return {
      id: msgId,
      role: 'assistant',
      text: `${alertMsg} ${alertAdvice}`,
      timestamp,
      lang,
      intent: 'health_emergency',
      emergencyAlert: {
        isEmergency: true,
        severity: 'critical',
        primaryNumber: '112',
        secondaryNumber: '108',
        reason: 'Acute symptoms requiring immediate medical evaluation',
        advice: alertAdvice,
      },
    };
  }

  // 3. NAVIGATION INTENTS (Cross-Module Navigation)
  const navTargets: Record<string, { route: string; label: string }> = {
    money: { route: '/dhan', label: 'Dhan (Money)' },
    dhan: { route: '/dhan', label: 'Dhan (Money)' },
    paisa: { route: '/dhan', label: 'Dhan (Money)' },
    paise: { route: '/dhan', label: 'Dhan (Money)' },
    wallet: { route: '/dhan', label: 'Dhan (Money)' },
    work: { route: '/kaam', label: 'Kaam (Work)' },
    kaam: { route: '/kaam', label: 'Kaam (Work)' },
    job: { route: '/kaam', label: 'Kaam (Work)' },
    jobs: { route: '/kaam', label: 'Kaam (Work)' },
    health: { route: '/sehat', label: 'Sehat (Health)' },
    sehat: { route: '/sehat', label: 'Sehat (Health)' },
    hospital: { route: '/sehat', label: 'Sehat (Health)' },
    doctor: { route: '/sehat', label: 'Sehat (Health)' },
    skill: { route: '/kaushal', label: 'Kaushal (Skills)' },
    skills: { route: '/kaushal', label: 'Kaushal (Skills)' },
    kaushal: { route: '/kaushal', label: 'Kaushal (Skills)' },
    course: { route: '/kaushal', label: 'Kaushal (Skills)' },
    rights: { route: '/haq', label: 'Haq Setu (Rights)' },
    haq: { route: '/haq', label: 'Haq Setu (Rights)' },
    home: { route: '/home', label: 'Home' },
    profile: { route: '/profile', label: 'Profile & Settings' },
    settings: { route: '/profile', label: 'Profile & Settings' },
  };

  const isNavCommand =
    lower.startsWith('open ') ||
    lower.startsWith('go to ') ||
    lower.startsWith('take me to ') ||
    lower.startsWith('switch to ') ||
    lower.includes('page kholo') ||
    lower.includes('dikhao') ||
    lower.includes('dakhav') ||
    lower.includes('uphad') ||
    lower.includes('par chalo') ||
    lower.includes('var ja');

  if (isNavCommand) {
    for (const [key, target] of Object.entries(navTargets)) {
      if (lower.includes(key)) {
        let resp = `Navigating to ${target.label}...`;
        if (lang === 'hi') resp = `आपके लिए ${target.label} खोला जा रहा है...`;
        if (lang === 'mr') resp = `तुमच्यासाठी ${target.label} उघडत आहे...`;

        return {
          id: msgId,
          role: 'assistant',
          text: resp,
          timestamp,
          lang,
          intent: 'navigate_page',
          navigationAction: {
            route: target.route,
            label: target.label,
          },
        };
      }
    }
  }

  // 4. LANGUAGE SWITCH COMMAND ("Change language to Hindi / Marathi / English")
  if (
    lower.includes('language') ||
    lower.includes('bhasha') ||
    lower.includes('boli')
  ) {
    let targetLang: 'en' | 'hi' | 'mr' | null = null;
    if (lower.includes('hindi') || lower.includes('हिंदी')) targetLang = 'hi';
    else if (lower.includes('marathi') || lower.includes('मराठी')) targetLang = 'mr';
    else if (lower.includes('english') || lower.includes('अंग्रेजी')) targetLang = 'en';

    if (targetLang) {
      let resp = `Switching language to ${targetLang === 'hi' ? 'Hindi (हिन्दी)' : targetLang === 'mr' ? 'Marathi (मराठी)' : 'English'}...`;
      if (targetLang === 'hi') resp = 'भाषा बदलकर हिन्दी कर दी गई है।';
      if (targetLang === 'mr') resp = 'भाषा बदलून मराठी केली आहे.';

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang: targetLang,
        intent: 'change_language',
        targetLang,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 5. SERVICE BOOKINGS & CUSTOMER APPOINTMENTS INQUIRIES
  // -------------------------------------------------------------------------
  const isBookingQuery =
    lower.includes('booking') ||
    lower.includes('appointment') ||
    lower.includes('service request') ||
    lower.includes('meri booking') ||
    lower.includes('majhe booking') ||
    lower.includes('majhi booking') ||
    lower.includes('grahak');

  if (isBookingQuery) {
    try {
      const bookings = await fetchBookings({});
      if (bookings.length === 0) {
        let resp =
          'You currently have 0 active customer service bookings on file. You can offer your trade or browse incoming customer requests in the Kaam Marketplace.';
        if (lang === 'hi') {
          resp =
            'आपके खाते में वर्तमान में 0 सक्रिय ग्राहक सेवा बुकिंग दर्ज हैं। आप काम (Kaam) पृष्ठ पर जाकर अपनी सेवाएँ सूचीबद्ध कर सकते हैं।';
        } else if (lang === 'mr') {
          resp =
            'तुमच्या खात्यात सध्या 0 ग्राहक सेवा बुकिंग नोंदवलेली आहेत. तुम्ही काम मार्केटमध्ये नवीन सेवा देऊ शकता.';
        }

        return {
          id: msgId,
          role: 'assistant',
          text: resp,
          timestamp,
          lang,
          intent: 'check_bookings',
          navigationAction: { route: '/kaam', label: 'Open Kaam Marketplace' },
        };
      }

      const topB = bookings[0];
      let resp = `You have ${bookings.length} active service booking(s). Most recent: ${topB.serviceName || topB.workerTrade || 'Service'} scheduled for ${topB.scheduledDate || 'upcoming shift'} (Status: ${topB.status}).`;
      if (lang === 'hi') {
        resp = `आपकी ${bookings.length} सेवा बुकिंग दर्ज हैं। नवीनतम: ${topB.serviceName || topB.workerTrade || 'सेवा'} (तारीख: ${topB.scheduledDate || 'आगामी'}, स्थिति: ${topB.status})।`;
      } else if (lang === 'mr') {
        resp = `तुमच्याकडे ${bookings.length} ग्राहक बुकिंग आहेत. अलीकडील: ${topB.serviceName || topB.workerTrade || 'सेवा'} (तारीख: ${topB.scheduledDate || 'पुढील'}, स्थिती: ${topB.status}).`;
      }

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'check_bookings',
        navigationAction: { route: '/kaam', label: 'View Bookings in Kaam' },
      };
    } catch {
      // continue
    }
  }

  // -------------------------------------------------------------------------
  // 6. WORK & JOB APPLICATION STATUS INQUIRIES
  // -------------------------------------------------------------------------
  const isAppStatusQuery =
    lower.includes('my application') ||
    lower.includes('application status') ||
    lower.includes('job status') ||
    lower.includes('applied') ||
    lower.includes('meri application') ||
    lower.includes('arz') ||
    lower.includes('arjachi sthiti') ||
    lower.includes('nokari cha status');

  if (isAppStatusQuery) {
    try {
      const myApps = await fetchMyApplications(userId);
      if (myApps.length === 0) {
        let resp =
          'You have not submitted any formal job applications yet. You can browse open delivery, warehouse, and electrician roles and apply in 1 tap.';
        if (lang === 'hi')
          resp =
            'आपने अभी तक कोई आवेदन जमा नहीं किया है। आप डिलीवरी, वेयरहाउस और इलेक्ट्रीशियन के काम देखकर 1-टैप में आवेदन कर सकते हैं।';
        if (lang === 'mr')
          resp =
            'तुम्ही अद्याप कोणताही अर्ज केलेला नाही. तुम्ही खुली कामे पाहून लगेच अर्ज करू शकता.';

        return {
          id: msgId,
          role: 'assistant',
          text: resp,
          timestamp,
          lang,
          intent: 'check_applications',
          navigationAction: { route: '/kaam', label: 'Browse Jobs in Kaam' },
        };
      }

      const activeApp = myApps[0];
      let resp = `You have ${myApps.length} active application(s). Most recent: ${activeApp.jobTitle} at ${activeApp.employer} (Status: ${activeApp.status}). Next action: ${activeApp.nextAction || 'Awaiting employer review'}.`;
      if (lang === 'hi')
        resp = `आपके ${myApps.length} सक्रिय आवेदन हैं। नवीनतम: ${activeApp.employer} में ${activeApp.jobTitle} (स्थिति: ${activeApp.status})। अगला कदम: ${activeApp.nextAction || 'नियोक्ता समीक्षा की प्रतीक्षा'}।`;
      if (lang === 'mr')
        resp = `तुमचे ${myApps.length} सक्रिय अर्ज आहेत. अलीकडील: ${activeApp.employer} येथे ${activeApp.jobTitle} (स्थिती: ${activeApp.status}). पुढील पायरी: ${activeApp.nextAction || 'नियोक्त्याच्या पुनरावलोकनाची वाट पाहत आहे'}.`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'check_applications',
        navigationAction: { route: '/kaam', label: 'View Applications in Kaam' },
      };
    } catch {
      // continue to matching
    }
  }

  // -------------------------------------------------------------------------
  // 7. MATCHING JOBS SEARCH INQUIRY (Model 6)
  // -------------------------------------------------------------------------
  const isJobSearchQuery =
    lower.includes('match') ||
    lower.includes('find job') ||
    lower.includes('matching job') ||
    lower.includes('search job') ||
    lower.includes('show job') ||
    lower.includes('delivery job') ||
    lower.includes('electrician job') ||
    lower.includes('driver job') ||
    lower.includes('warehouse job') ||
    lower.includes('kaam dikhao') ||
    lower.includes('kaam chahiye') ||
    lower.includes('nokari dhoondho') ||
    lower.includes('nokari shodha') ||
    lower.includes('openings') ||
    lower.includes('vacancy');

  if (isJobSearchQuery) {
    try {
      const userSkills = [
        ...(state.userProfile?.skillKeys || []).map((k) =>
          k.replace('skills.', '').replace('_', ' ')
        ),
        ...(state.userProfile?.customSkills || []),
      ];

      const workerPayload = {
        name: userName,
        role: userTrade,
        skills: userSkills.length > 0 ? userSkills : ['driving', 'delivery', 'navigation'],
        preferred_category: userTrade,
        location: userCity,
      };

      // Call Model 6 Semantic Matcher
      const matches = await matchJobsWithWorker(workerPayload, 3);
      const topCards: AssistantJobCard[] = matches.map((m) => ({
        id: m.job_id,
        title: m.title,
        employer: m.title.includes('Delivery')
          ? 'Swiggy Express Fleet'
          : m.title.includes('Driver')
          ? 'City Mobility Fleet'
          : 'Verified Platform Partner',
        location: m.location || userCity,
        pay: m.employment_type === 'shift_based' ? '₹450–₹750 / day' : '₹14,000–₹18,000 / month',
        workType: m.employment_type || 'full_time',
        matchScore: Math.round(m.match_percentage),
        matchingSkills: m.matching_skills || [],
        explanation: m.match_explanation,
      }));

      const topMatch = topCards[0];
      let resp = `Setu AI Model 6 found ${topCards.length} high-fit jobs matching your profile (${userTrade}, ${userCity}). Top match: ${topMatch?.title} (${topMatch?.matchScore}% match).`;
      if (lang === 'hi')
        resp = `सेतू AI मॉडल 6 ने आपकी प्रोफ़ाइल (${userTrade}, ${userCity}) के अनुसार ${topCards.length} उपयुक्त काम खोजे हैं। शीर्ष मिलान: ${topMatch?.title} (${topMatch?.matchScore}% मैच)।`;
      if (lang === 'mr')
        resp = `सेतू AI मॉडेल 6 ने तुमच्या प्रोफाइलनुसार (${userTrade}, ${userCity}) ${topCards.length} योग्य नोकऱ्या शोधल्या आहेत. सर्वोच्च जुळणी: ${topMatch?.title} (${topMatch?.matchScore}% मॅच).`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'match_jobs_model6',
        jobResults: topCards,
        navigationAction: {
          route: '/kaam',
          label: 'Open Kaam Marketplace',
        },
      };
    } catch (err) {
      console.warn('Model 6 assistant fallback:', err);
    }
  }

  // -------------------------------------------------------------------------
  // 8. MONEY (DHAN) MODULE INTENTS
  // -------------------------------------------------------------------------
  const isMoneyContext =
    lower.includes('money') ||
    lower.includes('dhan') ||
    lower.includes('balance') ||
    lower.includes('spent') ||
    lower.includes('earned') ||
    lower.includes('income') ||
    lower.includes('expense') ||
    lower.includes('kharch') ||
    lower.includes('kamai') ||
    lower.includes('hisaab') ||
    lower.includes('hisab') ||
    lower.includes('savings') ||
    lower.includes('shillak') ||
    lower.includes('bachat');

  // 8a. Anomaly / Suspicious Spending Detection (Model 3)
  if (
    isMoneyContext &&
    (lower.includes('anomaly') ||
      lower.includes('suspicious') ||
      lower.includes('fraud') ||
      lower.includes('gadbad') ||
      lower.includes('galti') ||
      lower.includes('unusual'))
  ) {
    try {
      const anomalyRes = await detectTransactionAnomalies(state.transactions);
      let resp = '';
      if (anomalyRes.flagged_count === 0) {
        resp = 'Setu AI Model 3 scanned your recent transactions. All transactions appear normal with no suspicious activity detected.';
        if (lang === 'hi')
          resp =
            'सेतू AI मॉडल 3 ने आपके सभी लेन-देन की जांच की है। सभी लेन-देन सामान्य हैं और कोई संदिग्ध गतिविधि नहीं पाई गई।';
        if (lang === 'mr')
          resp =
            'सेतू AI मॉडेल 3 ने तुमच्या व्यवहारांची तपासणी केली. सर्व व्यवहार सामान्य असून कोणतीही संशयास्पद नोंद आढळलेली नाही.';
      } else {
        resp = `Setu AI Model 3 flagged ${anomalyRes.flagged_count} unusual transaction(s) that deviate from your normal spending pattern.`;
        if (lang === 'hi')
          resp = `सेतू AI मॉडल 3 ने ${anomalyRes.flagged_count} असामान्य लेन-देन पहचाने हैं जो आपके सामान्य खर्च पैटर्न से अलग हैं।`;
        if (lang === 'mr')
          resp = `सेतू AI मॉडेल 3 ने ${anomalyRes.flagged_count} असामान्य व्यवहार ओळखले आहेत.`;
      }

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'anomaly_detection',
        navigationAction: { route: '/dhan', label: 'View Transactions in Dhan' },
      };
    } catch {
      // fallback
    }
  }

  // 8b. Future Income Forecast (Model 2)
  const isFutureForecast =
    lower.includes('tomorrow') ||
    ((lower.includes('kal') || lower.includes('udya')) &&
      (lower.includes('hoga') ||
        lower.includes('hogi') ||
        lower.includes('kamau') ||
        lower.includes('kiti') ||
        lower.includes('kitna'))) ||
    lower.includes('forecast') ||
    lower.includes('aage ki') ||
    lower.includes('pudhil') ||
    lower.includes('predict');

  if (
    isMoneyContext &&
    isFutureForecast &&
    (lower.includes('kamai') ||
      lower.includes('earn') ||
      lower.includes('income') ||
      lower.includes('kitna') ||
      lower.includes('hoga') ||
      lower.includes('kiti'))
  ) {
    try {
      const forecastRes = await forecastIncomeHorizon(7);
      const tomorrowPred = forecastRes.forecast?.[0]?.predicted_income || 650;
      const weekPred = forecastRes.total_predicted_income || 4500;

      let resp = `Based on your recent earning trends, Setu AI Model 2 predicts tomorrow's income around ${formatInr(
        tomorrowPred
      )}, with a 7-day projected total of ${formatInr(weekPred)}.`;
      if (lang === 'hi') {
        resp = `सेतू AI मॉडल 2 आय पूर्वानुमान के अनुसार कल आपकी अनुमानित कमाई लगभग ${formatInr(
          tomorrowPred
        )} होगी, और अगले 7 दिनों में कुल लगभग ${formatInr(weekPred)} होने की संभावना है।`;
      } else if (lang === 'mr') {
        resp = `सेतू AI मॉडेल 2 अंदाज: उद्या तुमची कमाई अंदाजे ${formatInr(
          tomorrowPred
        )} असू शकते आणि पुढील 7 दिवसांत एकूण सुमारे ${formatInr(weekPred)} अपेक्षित आहे.`;
      }

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'income_forecast',
        navigationAction: {
          route: '/dhan',
          label: 'View Detailed Income Forecast',
        },
      };
    } catch {
      // Fall through to balance inquiry
    }
  }

  // 8c. Multiple Expenses in One Utterance
  const multiExp = extractMultipleExpenses(text);
  if (multiExp && multiExp.items.length >= 2) {
    const pendingItems: PendingTransactionItem[] = multiExp.items.map((it, idx) => ({
      id: `multi-${Date.now()}-${idx}`,
      type: 'expense',
      amount: it.amount,
      category: it.category,
      description: it.description,
      dateStr: new Date().toISOString(),
    }));

    let resp = `I found ${pendingItems.length} expenses totaling ${formatInr(multiExp.total)}:\n`;
    pendingItems.forEach((it, i) => {
      resp += `${i + 1}. ${it.description}: ${formatInr(it.amount)}\n`;
    });
    resp += 'Would you like me to record these?';

    if (lang === 'hi') {
      resp = `मुझे कुल ${formatInr(multiExp.total)} के ${pendingItems.length} खर्चे मिले:\n`;
      pendingItems.forEach((it, i) => {
        resp += `${i + 1}. ${it.description}: ${formatInr(it.amount)}\n`;
      });
      resp += 'क्या मैं इन्हें आपके खाते में जोड़ दूं?';
    } else if (lang === 'mr') {
      resp = `मला एकूण ${formatInr(multiExp.total)} चे ${pendingItems.length} खर्च आढळले:\n`;
      pendingItems.forEach((it, i) => {
        resp += `${i + 1}. ${it.description}: ${formatInr(it.amount)}\n`;
      });
      resp += 'मी हे तुमच्या खात्यात नोंदवू का?';
    }

    return {
      id: msgId,
      role: 'assistant',
      text: resp,
      timestamp,
      lang,
      intent: 'add_multiple_expenses',
      pendingConfirmation: {
        kind: 'multiple_transactions',
        items: pendingItems,
        totalAmount: multiExp.total,
        summaryText: `${pendingItems.length} expenses totaling ${formatInr(multiExp.total)}`,
      },
    };
  }

  // 8d. Single Income Logging ("I earned ₹800 today", "Zomato se 850 kamaya")
  const isIncomePhrase =
    lower.includes('earned') ||
    lower.includes('received') ||
    lower.includes('salary') ||
    lower.includes('credited') ||
    lower.includes('kamaya') ||
    lower.includes('kamavle') ||
    lower.includes('milale') ||
    lower.includes('mila') ||
    lower.includes('aaya') ||
    lower.includes('payout');

  const isNotExpense =
    !lower.includes('spent') && !lower.includes('kharcha') && !lower.includes('kharch');

  if (isIncomePhrase && isNotExpense) {
    const numMatch = cleaned.match(
      /(?:₹|rs\.?|inr)?\s*([0-9]{2,6}(?:\.[0-9]{1,2})?)\s*(?:rupees?|rs\.?|inr|₹|ka|ke|rupaye|paise)?/i
    );
    const amount = numMatch ? parseFloat(numMatch[1]) : 0;

    if (amount > 0) {
      const item: PendingTransactionItem = {
        id: `tx-${Date.now()}`,
        type: 'income',
        amount,
        category: 'work_earnings',
        description: text.slice(0, 40) || 'Work Earnings',
        dateStr: new Date().toISOString(),
      };

      let resp = `I've prepared an Income entry of ${formatInr(amount)} for Earnings. Ready to confirm?`;
      if (lang === 'hi')
        resp = `मैंने ${formatInr(
          amount
        )} की आय (कमाई) का विवरण तैयार किया है। क्या मैं इसे जोड़ दूं?`;
      if (lang === 'mr')
        resp = `मी ${formatInr(amount)} उत्पन्नाची नोंद तयार केली आहे. पुष्टी करायची का?`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'add_income',
        pendingConfirmation: {
          kind: 'single_transaction',
          items: [item],
          totalAmount: amount,
          summaryText: `Income: ${formatInr(amount)} (Work Earnings)`,
        },
      };
    }
  }

  // 8e. Single Expense Logging ("I spent ₹150 on food today", "200 ka petrol")
  const isExpensePhrase =
    lower.includes('spent') ||
    lower.includes('paid') ||
    lower.includes('bought') ||
    lower.includes('expense') ||
    lower.includes('kharcha') ||
    lower.includes('kharch') ||
    lower.includes('diya') ||
    lower.includes('bhara') ||
    lower.includes('petrol') ||
    lower.includes('diesel') ||
    lower.includes('chai') ||
    lower.includes('dawai');

  if (isExpensePhrase && !isIncomePhrase) {
    const numMatch = cleaned.match(
      /(?:₹|rs\.?|inr)?\s*([0-9]{2,6}(?:\.[0-9]{1,2})?)\s*(?:rupees?|rs\.?|inr|₹|ka|ke|rupaye|paise)?/i
    );
    const amount = numMatch ? parseFloat(numMatch[1]) : 0;

    if (amount > 0) {
      const cat = normalizeCategory(text);
      const item: PendingTransactionItem = {
        id: `tx-${Date.now()}`,
        type: 'expense',
        amount,
        category: cat,
        description: text.slice(0, 40) || 'Expense',
        dateStr: new Date().toISOString(),
      };

      let resp = `Add an expense of ${formatInr(amount)} for ${cat.replace('_', ' ')}?`;
      if (lang === 'hi')
        resp = `क्या आप ${cat.replace('_', ' ')} के लिए ${formatInr(amount)} का खर्च जोड़ना चाहते हैं?`;
      if (lang === 'mr')
        resp = `${cat.replace('_', ' ')} साठी ${formatInr(amount)} खर्च नोंदवायचा का?`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'add_expense',
        pendingConfirmation: {
          kind: 'single_transaction',
          items: [item],
          totalAmount: amount,
          summaryText: `Expense: ${formatInr(amount)} (${cat.replace('_', ' ')})`,
        },
      };
    }
  }

  // 8f. Category Breakdown or Highest Expense Inquiries
  if (
    isMoneyContext &&
    (lower.includes('highest') ||
      lower.includes('biggest') ||
      lower.includes('sabse bada') ||
      lower.includes('sarvat motha') ||
      lower.includes('max expense'))
  ) {
    const expenses = state.transactions.filter((tx) => tx.type === 'expense');
    if (expenses.length === 0) {
      let resp = 'You have not recorded any expenses yet.';
      if (lang === 'hi') resp = 'आपने अभी तक कोई खर्च दर्ज नहीं किया है।';
      if (lang === 'mr') resp = 'तुम्ही अद्याप कोणताही खर्च नोंदवलेला नाही.';
      return { id: msgId, role: 'assistant', text: resp, timestamp, lang, intent: 'financial_summary' };
    }
    const maxExp = expenses.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), expenses[0]);
    let resp = `Your largest recorded expense is ${formatInr(maxExp.amount)} for ${maxExp.category.replace('_', ' ')} (${maxExp.description || 'Expense'}).`;
    if (lang === 'hi')
      resp = `आपका सबसे बड़ा दर्ज खर्च ${formatInr(maxExp.amount)} है (${maxExp.category.replace('_', ' ')}: ${maxExp.description || 'खर्च'})।`;
    if (lang === 'mr')
      resp = `तुमचा सर्वात मोठा नोंदवलेला खर्च ${formatInr(maxExp.amount)} आहे (${maxExp.category.replace('_', ' ')}: ${maxExp.description || 'खर्च'}).`;

    return {
      id: msgId,
      role: 'assistant',
      text: resp,
      timestamp,
      lang,
      intent: 'financial_summary',
      navigationAction: { route: '/dhan', label: 'View Money Ledger' },
    };
  }

  // 8g. Financial Balance & Spending Inquiries ("How much did I spend?", "Kitna hisab hua?")
  const isBalanceQuery =
    lower.includes('how much') ||
    lower.includes('balance') ||
    lower.includes('kitna') ||
    lower.includes('kiti') ||
    lower.includes('summary') ||
    lower.includes('hisab') ||
    lower.includes('hisaab') ||
    lower.includes('shillak') ||
    lower.includes('spend') ||
    lower.includes('earn');

  if (isMoneyContext && isBalanceQuery) {
    const s = state.summary;
    const nowMs = Date.now();
    const sevenDaysAgoMs = nowMs - 7 * 86400000;
    const weeklyExpensesList = state.transactions.filter(
      (tx) => tx.type === 'expense' && new Date(tx.timestamp).getTime() >= sevenDaysAgoMs
    );
    const weeklyExpenseAmt = weeklyExpensesList.reduce((sum, tx) => sum + tx.amount, 0);
    const weeklyNetAmt = s.weeklyIncome - weeklyExpenseAmt;
    const totalBalanceAmt = s.totalIncome - s.totalExpense;

    const isWeekly =
      lower.includes('week') || lower.includes('hafte') || lower.includes('athavada');
    const isToday = lower.includes('today') || lower.includes('aaj');

    let resp = '';
    if (state.transactions.length === 0 && s.totalIncome === 0 && s.totalExpense === 0) {
      resp =
        'You have not recorded any income or expenses yet. You can speak or type to log transactions, for example: "Earned ₹800 today" or "Spent ₹150 on petrol".';
      if (lang === 'hi')
        resp =
          'आपने अभी तक कोई कमाई या खर्च दर्ज नहीं किया है। आप बोलकर या लिखकर लेन-देन जोड़ सकते हैं, जैसे: "आज 800 रुपये कमाए" या "150 रुपये का पेट्रोल भरवाया"।';
      if (lang === 'mr')
        resp =
          'तुम्ही अद्याप कोणतेही उत्पन्न किंवा खर्च नोंदवलेले नाही. तुम्ही बोलून किंवा लिहून व्यवहार जोडू शकता, उदा. "आज 800 रुपये कमावले" किंवा "150 रुपये पेट्रोल खर्च".';
    } else if (isWeekly) {
      if (lower.includes('spend') || lower.includes('kharch')) {
        resp = `This week, your total recorded expenses are ${formatInr(
          weeklyExpenseAmt
        )}. Net earnings stand at ${formatInr(weeklyNetAmt)}.`;
        if (lang === 'hi')
          resp = `इस सप्ताह आपका कुल खर्च ${formatInr(
            weeklyExpenseAmt
          )} रहा है। आपकी शुद्ध बचत ${formatInr(weeklyNetAmt)} है।`;
        if (lang === 'mr')
          resp = `या आठवड्यात तुमचा एकूण खर्च ${formatInr(
            weeklyExpenseAmt
          )} झाला आहे. तुमची निव्वळ कमाई ${formatInr(weeklyNetAmt)} आहे.`;
      } else {
        resp = `This week, you earned ${formatInr(s.weeklyIncome)} and spent ${formatInr(
          weeklyExpenseAmt
        )}, leaving ${formatInr(weeklyNetAmt)} in hand.`;
        if (lang === 'hi')
          resp = `इस सप्ताह आपने ${formatInr(s.weeklyIncome)} कमाए और ${formatInr(
            weeklyExpenseAmt
          )} खर्च किए। शुद्ध बचत ${formatInr(weeklyNetAmt)} है।`;
        if (lang === 'mr')
          resp = `या आठवड्यात तुम्ही ${formatInr(s.weeklyIncome)} कमावले आणि ${formatInr(
            weeklyExpenseAmt
          )} खर्च केले. शिल्लक: ${formatInr(weeklyNetAmt)}.`;
      }
    } else if (isToday) {
      if (lower.includes('spend') || lower.includes('kharch')) {
        resp = `Today's recorded expense is ${formatInr(s.todayExpense)}.`;
        if (lang === 'hi') resp = `आज का कुल खर्च ${formatInr(s.todayExpense)} है।`;
        if (lang === 'mr') resp = `आजचा एकूण खर्च ${formatInr(s.todayExpense)} आहे.`;
      } else {
        resp = `Today you earned ${formatInr(s.todayIncome)} and spent ${formatInr(
          s.todayExpense
        )}. Net for today: ${formatInr(s.todayNet)}.`;
        if (lang === 'hi')
          resp = `आज आपकी कमाई ${formatInr(s.todayIncome)} और खर्च ${formatInr(
            s.todayExpense
          )} है। शुद्ध लाभ: ${formatInr(s.todayNet)}।`;
        if (lang === 'mr')
          resp = `आज तुमची कमाई ${formatInr(s.todayIncome)} आणि खर्च ${formatInr(
            s.todayExpense
          )} आहे. निव्वळ शिल्लक: ${formatInr(s.todayNet)}.`;
      }
    } else {
      resp = `Your recorded total balance is ${formatInr(
        totalBalanceAmt
      )}. Total Income: ${formatInr(s.totalIncome)}, Total Expenses: ${formatInr(s.totalExpense)}.`;
      if (lang === 'hi')
        resp = `आपका कुल दर्ज शेष ${formatInr(
          totalBalanceAmt
        )} है (कुल आय: ${formatInr(s.totalIncome)}, कुल खर्च: ${formatInr(s.totalExpense)})।`;
      if (lang === 'mr')
        resp = `तुमची एकूण नोंदवलेली शिल्लक ${formatInr(
          totalBalanceAmt
        )} आहे (एकूण उत्पन्न: ${formatInr(s.totalIncome)}, एकूण खर्च: ${formatInr(s.totalExpense)}).`;
    }

    return {
      id: msgId,
      role: 'assistant',
      text: resp,
      timestamp,
      lang,
      intent: 'financial_summary',
      navigationAction: {
        route: '/dhan',
        label: 'View Detailed Money Records',
      },
    };
  }

  // -------------------------------------------------------------------------
  // 9. HEALTH (SEHAT) MODULE INTENTS
  // -------------------------------------------------------------------------
  const isHealthContext =
    lower.includes('health') ||
    lower.includes('sehat') ||
    lower.includes('fever') ||
    lower.includes('bukhar') ||
    lower.includes('taap') ||
    lower.includes('cough') ||
    lower.includes('cold') ||
    lower.includes('pain') ||
    lower.includes('dard') ||
    lower.includes('clinic') ||
    lower.includes('hospital') ||
    lower.includes('doctor') ||
    lower.includes('ayushman') ||
    lower.includes('dawa') ||
    lower.includes('medicine');

  // 9a. Clinic / Hospital Search Near Me ("Nearest hospital / clinic / PHC")
  if (
    isHealthContext &&
    (lower.includes('nearest') ||
      lower.includes('near me') ||
      lower.includes('paas') ||
      lower.includes('kuthe') ||
      lower.includes('dispensary') ||
      lower.includes('phc') ||
      lower.includes('clinic') ||
      lower.includes('hospital'))
  ) {
    try {
      const facilities = await fetchHealthFacilities({ city: userCity });
      const topFacility = facilities[0];

      let resp = `Here is the nearest verified public health facility: ${topFacility.name} in ${topFacility.locality}, ${topFacility.city} (${topFacility.distance} away). Timings: ${topFacility.timings}. Phone: ${topFacility.phone}.`;
      if (lang === 'hi')
        resp = `आपके सबसे नजदीकी सत्यापित स्वास्थ्य केंद्र: ${topFacility.name}, ${topFacility.locality}, ${topFacility.city} (दूरी: ${topFacility.distance})। समय: ${topFacility.timings}। हेल्पलाइन: ${topFacility.phone}।`;
      if (lang === 'mr')
        resp = `तुमच्या सर्वात जवळचे आरोग्य केंद्र: ${topFacility.name}, ${topFacility.locality}, ${topFacility.city} (अंतर: ${topFacility.distance}). वेळ: ${topFacility.timings}. संपर्क: ${topFacility.phone}.`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'find_clinic',
        navigationAction: { route: '/sehat', label: 'View Health Facilities' },
      };
    } catch {
      // fallback
    }
  }

  // 9b. Saved Health Resources
  if (isHealthContext && (lower.includes('saved') || lower.includes('bookmark'))) {
    const saved = getSavedHealthItems();
    if (saved.length === 0) {
      let resp =
        'You have not bookmarked any clinics or health schemes yet. You can save nearby facilities in the Sehat Health Hub for offline access.';
      if (lang === 'hi')
        resp = 'आपने अभी तक कोई स्वास्थ्य केंद्र या योजना सहेजी नहीं है। आप सेहत पृष्ठ पर जाकर नजदीकी औषधालयों को सहेज सकते हैं।';
      if (lang === 'mr')
        resp = 'तुम्ही अद्याप कोणतेही दवाखाने जतन केलेले नाहीत. तुम्ही आरोग्य पानावर जाऊन ते जतन करू शकता.';
      return { id: msgId, role: 'assistant', text: resp, timestamp, lang, intent: 'health_guidance' };
    }
    let resp = `You have ${saved.length} saved health bookmark(s). Most recent: ${saved[0].title} (${saved[0].locality || userCity}).`;
    if (lang === 'hi') resp = `आपके ${saved.length} सहेजे गए स्वास्थ्य संसाधन हैं। नवीनतम: ${saved[0].title}।`;
    if (lang === 'mr') resp = `तुमचे ${saved.length} जतन केलेले आरोग्य केंद्र आहेत. अलीकडील: ${saved[0].title}.`;
    return {
      id: msgId,
      role: 'assistant',
      text: resp,
      timestamp,
      lang,
      intent: 'health_guidance',
      navigationAction: { route: '/sehat', label: 'View Saved Health Items' },
    };
  }

  // 9c. General Health Symptom Guidance & Scheme Info (Model 8 RAG)
  if (isHealthContext) {
    try {
      const rag = await searchHealthWelfareRAG(text, 2);
      const passageText = rag.passages?.[0]?.text;

      let guidance =
        'Take adequate rest, stay hydrated, and take generic paracetamol under pharmacist advice. If fever, pain, or cough persists beyond 48 hours, please consult a registered medical officer at your nearest government dispensary.';
      if (passageText) {
        guidance += `\n\nHealth Scheme Note: Under Ayushman Bharat (PM-JAY), gig workers are eligible for up to ₹5 Lakhs annual cashless secondary and tertiary hospitalization.`;
      }

      if (lang === 'hi') {
        guidance =
          'पर्याप्त आराम करें, पानी और तरल पदार्थ लें। यदि बुखार या दर्द 48 घंटे से अधिक रहे, तो कृपया नजदीकी सरकारी औषधालय या प्राथमिक स्वास्थ्य केंद्र (PHC) में डॉक्टर से संपर्क करें। आयुष्मान भारत / ABHA के तहत आप सरकारी अस्पतालों में निःशुल्क उपचार प्राप्त कर सकते हैं।';
      } else if (lang === 'mr') {
        guidance =
          'पुरेशी विश्रांती घ्या आणि भरपूर पाणी प्या. जर ताप किंवा खोकला 48 तासांपेक्षा जास्त काळ राहिल्यास, कृपया जवळच्या सरकारी दवाखान्यात डॉक्टरांचा सल्ला घ्या. आयुष्मान भारत योजनेअंतर्गत सरकारी रुग्णालयांमध्ये मोफत उपचारांची सुविधा उपलब्ध आहे.';
      }

      return {
        id: msgId,
        role: 'assistant',
        text: guidance,
        timestamp,
        lang,
        intent: 'health_guidance',
        navigationAction: {
          route: '/sehat',
          label: 'Open Sehat Health Hub',
        },
      };
    } catch {
      // fallback
    }
  }

  // -------------------------------------------------------------------------
  // 10. SKILLS (KAUSHAL) MODULE INTENTS (Model 7)
  // -------------------------------------------------------------------------
  const isSkillsContext =
    lower.includes('skill') ||
    lower.includes('course') ||
    lower.includes('kaushal') ||
    lower.includes('training') ||
    lower.includes('learn') ||
    lower.includes('seekhna') ||
    lower.includes('shikayche') ||
    lower.includes('certificate') ||
    lower.includes('pmkvy');

  if (isSkillsContext) {
    try {
      const recs = await recommendSkillsForWorker({
        current_role: userTrade,
        skills: state.userProfile?.skillKeys || [text],
        target_role: text.includes('solar') ? 'Solar Technician' : text,
      });

      const topCourses: AssistantCourseCard[] = recs.slice(0, 3).map((c) => ({
        id: c.course_id,
        title: c.title,
        provider: c.provider,
        skills: c.skills_taught,
        url: c.course_url,
      }));

      let resp = `Here are ${topCourses.length} accredited PMKVY / NSDC skill courses tailored for ${userTrade}:`;
      if (lang === 'hi')
        resp = `यहाँ ${userTrade} के लिए ${topCourses.length} मान्यता प्राप्त PMKVY / NSDC कोर्स हैं:`;
      if (lang === 'mr')
        resp = `येथे ${userTrade} साठी ${topCourses.length} मान्यताप्राप्त PMKVY / NSDC कोर्सेस आहेत:`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'recommend_skills',
        courseResults: topCourses,
        navigationAction: {
          route: '/kaushal',
          label: 'View All Skill Courses',
        },
      };
    } catch {
      // fallback
    }
  }

  // -------------------------------------------------------------------------
  // 11. RIGHTS (HAQ SETU) MODULE INTENTS
  // -------------------------------------------------------------------------
  const isRightsContext =
    lower.includes('rights') ||
    lower.includes('haq') ||
    lower.includes('law') ||
    lower.includes('kanoon') ||
    lower.includes('deactivat') ||
    lower.includes('suspension') ||
    lower.includes('blocked') ||
    lower.includes('compensation') ||
    lower.includes('appeal') ||
    lower.includes('grievance') ||
    lower.includes('shikayat') ||
    lower.includes('takrar');

  if (isRightsContext) {
    // 11a. Check for filed grievance appeals
    if (lower.includes('my appeal') || lower.includes('case status') || lower.includes('meri shikayat') || lower.includes('majhi takrar')) {
      const savedCases = getSavedCases();
      if (savedCases.length === 0) {
        let resp =
          'You have not filed any grievance appeals yet. If your platform ID was deactivated without notice, you can generate and track a formal appeal in Haq Setu.';
        if (lang === 'hi')
          resp =
            'आपने अभी तक कोई शिकायत अपील दर्ज नहीं की है। यदि आपकी आईडी बिना नोटिस बंद कर दी गई है, तो आप हक सेतू में अपील तैयार कर सकते हैं।';
        if (lang === 'mr')
          resp =
            'तुम्ही अद्याप कोणतीही तक्रार दाखल केलेली नाही. तुमचे खाते बंद झाले असल्यास, तुम्ही हक्क सेतूमध्ये दाद मागू शकता.';
        return {
          id: msgId,
          role: 'assistant',
          text: resp,
          timestamp,
          lang,
          intent: 'gig_rights_info',
          navigationAction: { route: '/haq', label: 'Open Haq Setu Appeal Generator' },
        };
      }
      const topCase = savedCases[0];
      let resp = `You have ${savedCases.length} filed grievance appeal(s). Most recent: Case ${topCase.caseNumber} against ${topCase.platform} (Status: ${topCase.status}).`;
      if (lang === 'hi')
        resp = `आपकी ${savedCases.length} शिकायत दर्ज हैं। नवीनतम: केस ${topCase.caseNumber} (${topCase.platform}, स्थिति: ${topCase.status})।`;
      if (lang === 'mr')
        resp = `तुमच्या ${savedCases.length} तक्रारी दाखल आहेत. अलीकडील: केस ${topCase.caseNumber} (${topCase.platform}, स्थिती: ${topCase.status}).`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'gig_rights_info',
        navigationAction: { route: '/haq', label: 'View Grievance Tracker' },
      };
    }

    // 11b. General Gig Worker Statutory Rights
    let resp =
      'Under the Code on Social Security (2020) Section 114 and State Platform Gig Workers Welfare Acts (such as Rajasthan Gig Act 2023 Sec 16), aggregators cannot arbitrarily block your ID without written notice, human review, and a statutory right to appeal before the Labour Appellate Authority.';
    if (lang === 'hi') {
      resp =
        'सामाजिक सुरक्षा संहिता (2020) की धारा 114 और राजस्थान गिग वर्कर्स अधिनियम (2023) की धारा 16 के तहत, बिना पूर्व लिखित नोटिस और सुनवाई के कोई भी एग्रीगेटर आपकी आईडी बंद नहीं कर सकता। आपके पास अपीलीय प्राधिकारी के समक्ष शिकायत दर्ज करने का वैधानिक अधिकार है।';
    } else if (lang === 'mr') {
      resp =
        'सामाजिक सुरक्षा संहिता (2020) कलम 114 आणि गिग कामगार कल्याण कायदा (2023) कलम 16 नुसार, नोटीस आणि मानवी सुनावणीशिवाय खाते बंद न होण्याचा तुमचा कायदेशीर हक्क आहे. कामगार प्राधिकरणाकडे दाद मागण्याची कायदेशीर सुविधा उपलब्ध आहे.';
    }

    return {
      id: msgId,
      role: 'assistant',
      text: resp,
      timestamp,
      lang,
      intent: 'gig_rights_info',
      navigationAction: {
        route: '/haq',
        label: 'Open Haq Setu Appeal Generator',
      },
    };
  }

  // -------------------------------------------------------------------------
  // 12. PROFILE & SETTINGS MODULE INTENTS
  // -------------------------------------------------------------------------
  const isProfileContext =
    lower.includes('who am i') ||
    lower.includes('mera naam') ||
    lower.includes('profile') ||
    lower.includes('settings') ||
    lower.includes('naam kya') ||
    lower.includes('savings target') ||
    lower.includes('target');

  if (isProfileContext) {
    const savingsTarget = state.userProfile?.savingsGoal || 5000;
    const skillsCount =
      (state.userProfile?.skillKeys?.length || 0) +
      (state.userProfile?.customSkills?.length || 0);

    let resp = `You are logged in as ${userName}, working as a verified ${userTrade} in ${userCity}. You have ${skillsCount} skills on file and a monthly savings target of ${formatInr(
      savingsTarget
    )}.`;
    if (lang === 'hi')
      resp = `आप सेतू में ${userName} के रूप में जुड़े हैं, आपका मुख्य कार्य ${userTrade} (${userCity}) है। आपके खाते में ${skillsCount} कौशल दर्ज हैं और बचत लक्ष्य ${formatInr(
        savingsTarget
      )} है।`;
    if (lang === 'mr')
      resp = `तुम्ही सेतूमध्ये ${userName} म्हणून लॉग इन आहात, तुमचे मुख्य काम ${userTrade} (${userCity}) आहे. तुमच्या खात्यात ${skillsCount} कौशल्ये नोंदवली आहेत आणि बचतीचे उद्दिष्ट ${formatInr(
        savingsTarget
      )} आहे.`;

    return {
      id: msgId,
      role: 'assistant',
      text: resp,
      timestamp,
      lang,
      intent: 'profile_faq',
      navigationAction: {
        route: '/profile',
        label: 'Open Profile & Settings',
      },
    };
  }

  // -------------------------------------------------------------------------
  // 13. PLATFORM EXPLANATION & PURPOSE ("What is Setu?")
  // -------------------------------------------------------------------------
  const isPlatformHelp =
    lower.includes('what is setu') ||
    lower.includes('what is fairwork') ||
    lower.includes('how does this app help') ||
    lower.includes('what can you do') ||
    lower.includes('setu kya hai') ||
    lower.includes('he app kay ahe') ||
    lower.includes('help me') ||
    lower.includes('madat');

  if (isPlatformHelp) {
    let resp =
      'FairWork Setu is your AI livelihood companion designed for gig and informal workers in India. I help you track income and expenses in your own language, forecast upcoming earnings with ML, find verified jobs matching your skills, access Ayushman Bharat health benefits, upgrade your skills with PMKVY certifications, and protect your legal rights against unfair platform deactivations.';
    if (lang === 'hi') {
      resp =
        'फेयरवर्क सेतू भारत के गिग और असंगठित कामगारों के लिए बनाया गया AI साथी है। यह आपकी भाषा में दैनिक कमाई और खर्चों का हिसाब रखने, कमाई का AI अनुमान लगाने, आपकी कुशलता के अनुसार सत्यापित काम खोजने, आयुष्मान भारत स्वास्थ्य लाभ लेने, PMKVY कौशल कोर्स सीखने और कानूनी अधिकारों की रक्षा करने में मदद करता है।';
    } else if (lang === 'mr') {
      resp =
        'फेअरवर्क सेतू हे भारतातील गिग आणि असंघटित कामगारांसाठी AI साथीदार आहे. हे तुमच्या भाषेत दैनंदिन कमाई आणि खर्चाचा हिशोब ठेवणे, AI द्वारे पुढील कमाईचा अंदाज घेणे, काम शोधणे, आयुष्यमान भारत आरोग्य योजनांचा लाभ घेणे, कौशल्य प्रशिक्षण घेणे आणि कायदेशीर अधिकारांचे रक्षण करण्यास मदत करते.';
    }

    return {
      id: msgId,
      role: 'assistant',
      text: resp,
      timestamp,
      lang,
      intent: 'general_help',
    };
  }

  // -------------------------------------------------------------------------
  // 14. INTELLIGENT DYNAMIC GENERATIVE FALLBACK
  // -------------------------------------------------------------------------
  // Attempt to consult the backend AI model router
  try {
    const backendRes = await parseAssistantIntent(text, {
      summary: state.summary,
      user_profile: state.userProfile,
      transactions: state.transactions,
      current_screen: currentScreen,
    });

    if (backendRes?.reply && backendRes.intent !== 'general_help') {
      return {
        id: msgId,
        role: 'assistant',
        text: backendRes.reply,
        timestamp,
        lang: backendRes.language || lang,
        intent: backendRes.intent,
        navigationAction: backendRes.route
          ? { route: backendRes.route, label: `Open ${backendRes.route.slice(1).toUpperCase()}` }
          : undefined,
      };
    }
  } catch {
    // Continue to personalized dynamic synthesis
  }

  // Synthesize an intelligent, data-grounded response answering the user directly
  let fallbackAnswer = `I am your Setu Voice Assistant. I can check your today's earnings (currently ${formatInr(
    state.summary.todayIncome
  )}), log expenses, find matching ${userTrade} jobs in ${userCity}, look up the nearest government dispensary, or help draft an appeal against unfair platform deactivations. What would you like to do?`;

  if (lang === 'hi') {
    fallbackAnswer = `मैं आपका सेतू सहायक हूँ। मैं आपकी आज की कमाई (वर्तमान: ${formatInr(
      state.summary.todayIncome
    )}), खर्चे दर्ज करने, ${userCity} में ${userTrade} के उपयुक्त काम खोजने, नजदीकी प्राथमिक स्वास्थ्य केंद्र का पता लगाने या खाता बंद होने पर अपील तैयार करने में मदद कर सकता हूँ। आप क्या जानना चाहते हैं?`;
  } else if (lang === 'mr') {
    fallbackAnswer = `मी तुमचा सेतू सहाय्यक आहे. मी तुमची आजची कमाई (सध्या: ${formatInr(
      state.summary.todayIncome
    )}), खर्च नोंदवणे, ${userCity} मध्ये ${userTrade} ची कामे शोधणे, जवळचा सरकारी दवाखाना शोधणे किंवा अपील मसुदा तयार करण्यात मदत करू शकतो. मी तुम्हाला कशी मदत करू?`;
  }

  return {
    id: msgId,
    role: 'assistant',
    text: fallbackAnswer,
    timestamp,
    lang,
    intent: 'general_help',
  };
}

// ---------------------------------------------------------------------------
// 5-SECOND CONTINUOUS SILENCE RECOGNIZER CLASS
// ---------------------------------------------------------------------------

export interface SpeechCallbacks {
  onInterim: (text: string) => void;
  onSilenceTick: (remainingMs: number, totalMs: number) => void;
  onSilenceFinalized: (finalText: string) => void;
  onError: (error: string) => void;
  onStateChange: (state: 'idle' | 'listening' | 'processing' | 'error') => void;
}

export class SetuContinuousSpeechRecognizer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognizer: any = null;
  private isListeningActive = false;
  private accumulatedFinal = '';
  private currentFullTranscript = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private silenceTimer: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private silenceInterval: any = null;
  private remainingSilenceMs = 5000;
  private readonly silenceDurationMs: number = 5000;
  private callbacks: SpeechCallbacks;
  private language: string;

  constructor(
    callbacks: SpeechCallbacks,
    options?: { silenceDurationMs?: number; language?: string }
  ) {
    this.callbacks = callbacks;
    this.silenceDurationMs = options?.silenceDurationMs || 5000;
    this.language = options?.language || 'hi-IN';
    this.initRecognizer();
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  /**
   * Request microphone permission explicitly via MediaDevices API
   */
  public static async requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { granted: false, error: 'speech_not_supported' };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true };
    } catch (err: any) {
      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        return { granted: false, error: 'not-allowed' };
      }
      return { granted: false, error: err?.message || 'permission_denied' };
    }
  }

  public setLanguage(lang: string) {
    this.language = lang;
    if (this.recognizer) {
      try {
        this.recognizer.lang = lang;
      } catch {
        // ignore
      }
    }
  }

  private initRecognizer() {
    if (!this.isSupported()) return;

    try {
      const win = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) return;
      this.recognizer = new SpeechRecognitionClass();
      this.recognizer.continuous = true;
      this.recognizer.interimResults = true;
      this.recognizer.lang = this.language;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognizer.onresult = (event: any) => {
        let interim = '';
        let newFinalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinalChunk += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (newFinalChunk) {
          this.accumulatedFinal += newFinalChunk;
        }

        this.currentFullTranscript = (this.accumulatedFinal + ' ' + interim).trim();
        this.callbacks.onInterim(this.currentFullTranscript);

        // Reset 5-Second Silence Detection Timer
        this.resetSilenceTimer();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognizer.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error === 'aborted') {
          return;
        }
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.callbacks.onError('not-allowed');
        } else if (event.error === 'audio-capture') {
          this.callbacks.onError('audio-capture');
        } else {
          this.callbacks.onError(event.error || 'Microphone error');
        }
      };

      this.recognizer.onend = () => {
        if (this.isListeningActive && this.remainingSilenceMs > 100) {
          try {
            this.recognizer.start();
          } catch {
            // ignore
          }
        }
      };
    } catch (err) {
      this.callbacks.onError(String(err));
    }
  }

  public async start() {
    if (!this.isSupported()) {
      this.callbacks.onError('speech_not_supported');
      return;
    }

    // Permission preflight
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const perm = await SetuContinuousSpeechRecognizer.requestMicrophonePermission();
        if (!perm.granted && perm.error === 'not-allowed') {
          this.callbacks.onError('not-allowed');
          return;
        }
      } catch {
        // continue
      }
    }

    this.accumulatedFinal = '';
    this.currentFullTranscript = '';
    this.isListeningActive = true;
    this.clearTimers();
    this.remainingSilenceMs = this.silenceDurationMs;
    this.callbacks.onStateChange('listening');
    this.callbacks.onSilenceTick(this.remainingSilenceMs, this.silenceDurationMs);

    try {
      this.recognizer.lang = this.language;
      this.recognizer.start();
    } catch {
      // If already started, ignore
    }
  }

  private resetSilenceTimer() {
    this.clearTimers();
    this.remainingSilenceMs = this.silenceDurationMs;
    this.callbacks.onSilenceTick(this.remainingSilenceMs, this.silenceDurationMs);

    this.silenceInterval = setInterval(() => {
      this.remainingSilenceMs = Math.max(0, this.remainingSilenceMs - 100);
      this.callbacks.onSilenceTick(this.remainingSilenceMs, this.silenceDurationMs);
    }, 100);

    this.silenceTimer = setTimeout(() => {
      this.stopAndFinalize();
    }, this.silenceDurationMs);
  }

  public stopAndFinalize() {
    this.clearTimers();
    this.isListeningActive = false;

    if (this.recognizer) {
      try {
        this.recognizer.stop();
      } catch {
        // ignore
      }
    }

    const finalText = this.currentFullTranscript.trim();
    this.callbacks.onStateChange('processing');
    this.callbacks.onSilenceFinalized(finalText);
  }

  public cancel() {
    this.clearTimers();
    this.isListeningActive = false;
    this.accumulatedFinal = '';
    this.currentFullTranscript = '';

    if (this.recognizer) {
      try {
        this.recognizer.stop();
      } catch {
        // ignore
      }
    }
    this.callbacks.onStateChange('idle');
  }

  private clearTimers() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.silenceInterval) {
      clearInterval(this.silenceInterval);
      this.silenceInterval = null;
    }
  }

  public destroy() {
    this.cancel();
    this.recognizer = null;
  }
}
