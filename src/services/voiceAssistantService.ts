/**
 * FairWork Setu - Unified Multilingual Voice Assistant Service
 * Handles speech recognition with 5-second continuous silence detection,
 * multi-turn conversational context, multilingual intent recognition (Hindi, Marathi, English, Hinglish),
 * and live execution across Money, Work, Health, Skills, and Navigation.
 */

import type { Transaction, TransactionCategory } from '../types/transaction';
import type { JobListing } from '../types/marketplace';
import { fetchJobs } from './marketplaceService';
import {
  recommendSkillsForWorker,
  searchHealthWelfareRAG,
  classifyExpenseText,
  forecastIncomeHorizon,
} from './aiModelsClient';
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
  currentScreen?: string;
  userProfile?: {
    name?: string;
    workType?: string | null;
    cityKey?: string;
    savingsGoal?: number;
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
    if (/आहे|नाही|झाले|झाला|केले|केला|पाहिजे|रुपये|मिळाले|मिळवले|खर्च|काम|करायचे|मला|माझे|सांगा|कशी|कसा|द्या/.test(text)) {
      return 'mr';
    }
    return 'hi';
  }

  // 2. Transliterated / Romanized vocabulary markers
  // Marathi markers:
  if (/\b(mala|mazha|mazhe|ahe|ahet|nahi|jhale|zale|kela|kele|pahije|kamavle|kharch zala|paise|ani|kay karu|kasa|kashi|madat)\b/i.test(lower)) {
    return 'mr';
  }

  // Hindi / Hinglish markers:
  if (/\b(aaj|kal|kamaya|kharcha|kharch|rupaye|batao|chahiye|kaam|bukhar|dard|paise|kitna|hua|likho|jodo|dikhao|kholo|meri|mera)\b/i.test(lower)) {
    return 'hi';
  }

  return 'en';
}

/**
 * Standardize text category to valid TransactionCategory
 */
export function normalizeCategory(cat: string): TransactionCategory {
  const lower = cat.toLowerCase();
  if (lower.includes('fuel') || lower.includes('travel') || lower.includes('petrol') || lower.includes('diesel')) {
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
  if (lower.includes('tool') || lower.includes('equipment') || lower.includes('machin') || lower.includes('recharge')) {
    return 'tools';
  }
  if (lower.includes('medic') || lower.includes('doctor') || lower.includes('dawa') || lower.includes('hospital') || lower.includes('clinic')) {
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

/**
 * Extracts multiple expenses from phrasing like:
 * "Add expenses: ₹50 for tea, ₹100 for travel, and ₹200 for groceries"
 * "50 chai 100 petrol aur 200 sabzi"
 * "50 rupaye chaha, 100 travel ani 200 bhaji"
 */
export function extractMultipleExpenses(text: string): ExtractedMultiExpense | null {
  const cleaned = normalizeIndicDigits(text);
  const lower = cleaned.toLowerCase();

  // Must have some expense indicator or multiple amount pairs
  const hasExpenseContext =
    lower.includes('expense') ||
    lower.includes('spent') ||
    lower.includes('kharch') ||
    lower.includes('kharcha') ||
    lower.includes('likho') ||
    lower.includes('jodo') ||
    lower.includes('diya') ||
    lower.includes('bhara');

  // Split by common delimiters: comma, semicolon, "and", "aur", "ani", "plus", "&"
  const segments = cleaned
    .split(/[,;\n]|\band\b|\baur\b|\bani\b|\bplus\b|&/gi)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedItems: Array<{ amount: number; category: TransactionCategory; description: string }> = [];

  for (const seg of segments) {
    // Search for number in segment
    const numMatch = seg.match(/(?:₹|rs\.?|inr)?\s*([0-9]{1,6}(?:\.[0-9]{1,2})?)\s*(?:rupees?|rs\.?|inr|₹|ka|ke|rupaye|paise)?/i);
    if (!numMatch) continue;

    const amt = parseFloat(numMatch[1]);
    if (isNaN(amt) || amt <= 0) continue;

    // Remove the number and currency words to identify the item description
    const itemDesc = seg
      .replace(/(?:₹|rs\.?|inr)/gi, '')
      .replace(numMatch[1], '')
      .replace(/\b(for|pe|par|ka|ke|rupees|rupaye|paise|spent|add|expenses?|kharcha|kharch|hue|aur|ani)\b/gi, '')
      .trim();

    const desc = itemDesc || 'Expense';
    const cat = normalizeCategory(itemDesc);

    parsedItems.push({
      amount: amt,
      category: cat,
      description: desc.charAt(0).toUpperCase() + desc.slice(1),
    });
  }

  // If we found at least 2 distinct items, or 1 item with explicit multiple expense phrasing
  if (parsedItems.length >= 2 || (parsedItems.length === 1 && hasExpenseContext && lower.includes('expenses'))) {
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

  // 1. FOLLOW-UP CONFIRMATION OR CANCELLATION
  if (state.pendingConfirmation) {
    const pending = state.pendingConfirmation;

    // 1a. Check for Type Flip FIRST: "I meant income, not expense" / "Kamai hai kharcha nahi"
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
      if (lang === 'hi') resp = `प्रकार बदलकर आय (कमाई: ${formatInr(pending.totalAmount)}) कर दिया गया है। क्या मैं इसे जोड़ दूं?`;
      if (lang === 'mr') resp = `प्रकार बदलून उत्पन्न (${formatInr(pending.totalAmount)}) केला आहे. पुष्टी करायची का?`;

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

    // 1b. Check for Amount Correction: "Change that to ₹180", "180 kar do", "Make it 250"
    const correctionMatch = cleaned.match(/(?:change|make|badal|kar do|nako|put|instead|nahi|to)?\s*(?:₹|rs\.?)?\s*([0-9]{2,6})\s*(?:rupees?|rs\.?|kar do|karo)?/i);
    if (
      (lower.includes('change') || lower.includes('badal') || lower.includes('kar do') || lower.includes('meant') || lower.includes('to')) &&
      correctionMatch &&
      correctionMatch[1]
    ) {
      const newAmt = parseFloat(correctionMatch[1]);
      if (!isNaN(newAmt) && newAmt > 0) {
        // Update pending items
        const updatedItems = pending.items.map((item, idx) => (idx === 0 ? { ...item, amount: newAmt } : item));
        const newTotal = updatedItems.reduce((sum, it) => sum + it.amount, 0);

        let resp = `Updated amount to ${formatInr(newAmt)}. Please confirm to save.`;
        if (lang === 'hi') resp = `राशि बदलकर ${formatInr(newAmt)} कर दी गई है। कृपया सहेजने के लिए पुष्टि करें।`;
        if (lang === 'mr') resp = `रक्कम बदलून ${formatInr(newAmt)} केली आहे. जतन करण्यासाठी पुष्टी करा.`;

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
            summaryText: `${updatedItems[0].type === 'income' ? 'Income' : 'Expense'}: ${formatInr(newTotal)} (${updatedItems[0].category})`,
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

    // Check for Confirmation: "Yes", "Confirm", "Save", "Haan", "Ho", "Theek hai", "Add it"
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
      let resp = `Confirmed and recorded ${pending.items.length === 1 ? 'transaction' : `${pending.items.length} transactions`} (${formatInr(pending.totalAmount)}) successfully.`;
      if (lang === 'hi') resp = `सफलतापूर्वक दर्ज किया गया: ${formatInr(pending.totalAmount)}। आपके खाते में विवरण जुड़ चुका है।`;
      if (lang === 'mr') resp = `यशस्वीरित्या नोंदवले: ${formatInr(pending.totalAmount)}. तुमच्या खात्यात नोंद झाली आहे.`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'confirm_execution',
        executedSummary: `Recorded ${pending.items.length} transaction(s) totaling ${formatInr(pending.totalAmount)}`,
        pendingConfirmation: pending, // UI will execute the transaction handler
      };
    }
  }

  // 2. EMERGENCY HEALTH CHECK (Highest Priority)
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
    let alertAdvice = 'Call 112 (National Emergency) or 108 (Free Medical Ambulance) right now. Help is on the way.';

    if (lang === 'hi') {
      alertMsg = 'आपातकालीन स्वास्थ्य स्थिति! कृपया तुरंत काम बंद करें और तत्काल आपातकालीन सहायता लें।';
      alertAdvice = 'अभी 112 (राष्ट्रीय आपातकालीन सेवा) या 108 (निःशुल्क एम्बुलेंस) पर कॉल करें।';
    } else if (lang === 'mr') {
      alertMsg = 'तातडीची वैद्यकीय आणीबाणी! कृपया त्वरित काम थांबवा आणि तातडीने वैद्यकीय मदत मिळवा.';
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

  // 3. NAVIGATION INTENT
  const navTargets: Record<string, { route: string; label: string }> = {
    money: { route: '/dhan', label: 'Dhan (Money)' },
    dhan: { route: '/dhan', label: 'Dhan (Money)' },
    paisa: { route: '/dhan', label: 'Dhan (Money)' },
    paise: { route: '/dhan', label: 'Dhan (Money)' },
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
    profile: { route: '/profile', label: 'Profile' },
  };

  if (
    lower.startsWith('open ') ||
    lower.startsWith('go to ') ||
    lower.startsWith('take me to ') ||
    lower.includes('page kholo') ||
    lower.includes('dikhao') ||
    lower.includes('dakhav') ||
    lower.includes('uphad')
  ) {
    for (const [key, target] of Object.entries(navTargets)) {
      if (lower.includes(key)) {
        let resp = `Opening ${target.label} for you...`;
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

  // 4. FINANCIAL SUMMARY & BALANCE INQUIRY
  const isBalanceQuery =
    lower.includes('how much') ||
    lower.includes('balance') ||
    lower.includes('spent') ||
    lower.includes('earned') ||
    lower.includes('income') ||
    lower.includes('kitna') ||
    lower.includes('kiti') ||
    lower.includes('summary') ||
    lower.includes('hisab') ||
    lower.includes('hisaab') ||
    lower.includes('kamai');

  const isWeekly = lower.includes('week') || lower.includes('hafte') || lower.includes('athavada');
  const isToday = lower.includes('today') || lower.includes('aaj');
  const isYesterday = lower.includes('yesterday') || ((lower.includes('kal') || lower.includes('kaal')) && (lower.includes('gaya') || lower.includes('hua') || lower.includes('spent') || lower.includes('kamaya')));
  const isFutureForecast = lower.includes('tomorrow') || ((lower.includes('kal') || lower.includes('udya')) && (lower.includes('hoga') || lower.includes('hogi') || lower.includes('kamau') || lower.includes('kiti') || lower.includes('kitna'))) || lower.includes('forecast') || lower.includes('aage ki') || lower.includes('pudhil') || lower.includes('predict');

  // Future Income Forecast Intent (Model 2)
  if (isFutureForecast && (lower.includes('kamai') || lower.includes('earn') || lower.includes('income') || lower.includes('kitna') || lower.includes('hoga') || lower.includes('kiti'))) {
    try {
      const forecastRes = await forecastIncomeHorizon(7);
      const tomorrowPred = forecastRes.forecast?.[0]?.predicted_income || 650;
      const weekPred = forecastRes.total_predicted_income || 4500;

      let resp = `Based on your recent earning trends, Setu AI predicts tomorrow's income around ${formatInr(tomorrowPred)}, with a 7-day projected total of ${formatInr(weekPred)}.`;
      if (lang === 'hi') {
        resp = `सेतू AI आय पूर्वानुमान के अनुसार कल आपकी अनुमानित कमाई लगभग ${formatInr(tomorrowPred)} होगी, और अगले 7 दिनों में कुल लगभग ${formatInr(weekPred)} होने की संभावना है।`;
      } else if (lang === 'mr') {
        resp = `सेतू AI अंदाज: उद्या तुमची कमाई अंदाजे ${formatInr(tomorrowPred)} असू शकते आणि पुढील 7 दिवसांत एकूण सुमारे ${formatInr(weekPred)} कमाई अपेक्षित आहे.`;
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
      // Fall through to standard balance query if API is unavailable
    }
  }

  if (isBalanceQuery && (lower.includes('spend') || lower.includes('kharch') || lower.includes('kamaya') || lower.includes('balance') || lower.includes('bachat') || lower.includes('hisab'))) {
    const s = state.summary;
    const nowMs = Date.now();
    const sevenDaysAgoMs = nowMs - 7 * 86400000;
    const weeklyExpensesList = state.transactions.filter(
      (tx) => tx.type === 'expense' && new Date(tx.timestamp).getTime() >= sevenDaysAgoMs
    );
    const weeklyExpenseAmt = weeklyExpensesList.reduce((sum, tx) => sum + tx.amount, 0);
    const weeklyNetAmt = s.weeklyIncome - weeklyExpenseAmt;
    const totalBalanceAmt = s.totalIncome - s.totalExpense;

    let resp = '';

    if (isWeekly) {
      if (lower.includes('spend') || lower.includes('kharch')) {
        resp = `This week, your total recorded expenses are ${formatInr(weeklyExpenseAmt)}. Net earnings stand at ${formatInr(weeklyNetAmt)}.`;
        if (lang === 'hi') resp = `इस सप्ताह आपका कुल खर्च ${formatInr(weeklyExpenseAmt)} रहा है। आपकी शुद्ध बचत/कमाई ${formatInr(weeklyNetAmt)} है।`;
        if (lang === 'mr') resp = `या आठवड्यात तुमचा एकूण खर्च ${formatInr(weeklyExpenseAmt)} झाला आहे. तुमची निव्वळ कमाई ${formatInr(weeklyNetAmt)} आहे.`;
      } else {
        resp = `This week, you earned ${formatInr(s.weeklyIncome)} and spent ${formatInr(weeklyExpenseAmt)}, leaving ${formatInr(weeklyNetAmt)} in hand.`;
        if (lang === 'hi') resp = `इस सप्ताह आपने ${formatInr(s.weeklyIncome)} कमाए और ${formatInr(weeklyExpenseAmt)} खर्च किए। शुद्ध बचत ${formatInr(weeklyNetAmt)} है।`;
        if (lang === 'mr') resp = `या आठवड्यात तुम्ही ${formatInr(s.weeklyIncome)} कमावले आणि ${formatInr(weeklyExpenseAmt)} खर्च केले. हातात ${formatInr(weeklyNetAmt)} शिल्लक आहेत.`;
      }
    } else if (isToday) {
      if (lower.includes('spend') || lower.includes('kharch')) {
        resp = `Today's recorded expense is ${formatInr(s.todayExpense)}.`;
        if (lang === 'hi') resp = `आज का कुल खर्च ${formatInr(s.todayExpense)} है।`;
        if (lang === 'mr') resp = `आजचा एकूण खर्च ${formatInr(s.todayExpense)} आहे.`;
      } else {
        resp = `Today you earned ${formatInr(s.todayIncome)} and spent ${formatInr(s.todayExpense)}. Net for today: ${formatInr(s.todayNet)}.`;
        if (lang === 'hi') resp = `आज आपकी कमाई ${formatInr(s.todayIncome)} और खर्च ${formatInr(s.todayExpense)} है। आज का शुद्ध लाभ: ${formatInr(s.todayNet)}।`;
        if (lang === 'mr') resp = `आज तुमची कमाई ${formatInr(s.todayIncome)} आणि खर्च ${formatInr(s.todayExpense)} आहे. आजची निव्वळ शिल्लक: ${formatInr(s.todayNet)}.`;
      }
    } else {
      resp = `Your recorded total balance is ${formatInr(totalBalanceAmt)}. This week's earnings: ${formatInr(s.weeklyIncome)}, expenses: ${formatInr(weeklyExpenseAmt)}.`;
      if (lang === 'hi') resp = `आपका कुल दर्ज शेष (बैलेंस) ${formatInr(totalBalanceAmt)} है। इस सप्ताह की कमाई ${formatInr(s.weeklyIncome)} और खर्च ${formatInr(weeklyExpenseAmt)} है।`;
      if (lang === 'mr') resp = `तुमची एकूण नोंदवलेली शिल्लक ${formatInr(totalBalanceAmt)} आहे. या आठवड्याची कमाई ${formatInr(s.weeklyIncome)} आणि खर्च ${formatInr(weeklyExpenseAmt)} आहे.`;
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

  // 5. MULTIPLE EXPENSES CHECK ("₹50 for tea, ₹100 for travel, and ₹200 for groceries")
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

  // 6. SINGLE INCOME CHECK ("I earned ₹800 today", "Zomato se 850 kamaya", "500 rupaye milale")
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

  // Ensure it's not actually an expense phrase
  const isNotExpense = !lower.includes('spent') && !lower.includes('kharcha') && !lower.includes('kharch');

  if (isIncomePhrase && isNotExpense) {
    const numMatch = cleaned.match(/(?:₹|rs\.?|inr)?\s*([0-9]{2,6}(?:\.[0-9]{1,2})?)\s*(?:rupees?|rs\.?|inr|₹|ka|ke|rupaye|paise)?/i);
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
      if (lang === 'hi') resp = `मैंने ${formatInr(amount)} की आय (कमाई) का विवरण तैयार किया है। क्या मैं इसे जोड़ दूं?`;
      if (lang === 'mr') resp = `मी ${formatInr(amount)} उत्पन्नाची नोंद तयार केली आहे. पुष्टी करायची का?`;

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

  // 7. SINGLE EXPENSE CHECK ("I spent ₹150 on food today", "200 ka petrol", "50 chai")
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
    lower.includes('food') ||
    lower.includes('dawai');

  if (isExpensePhrase || cleaned.match(/[0-9]{2,6}/)) {
    const numMatch = cleaned.match(/(?:₹|rs\.?|inr)?\s*([0-9]{2,6}(?:\.[0-9]{1,2})?)\s*(?:rupees?|rs\.?|inr|₹|ka|ke|rupaye|paise)?/i);
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
      if (lang === 'hi') resp = `क्या आप ${cat.replace('_', ' ')} के लिए ${formatInr(amount)} का खर्च जोड़ना चाहते हैं?`;
      if (lang === 'mr') resp = `${cat.replace('_', ' ')} साठी ${formatInr(amount)} खर्च नोंदवायचा का?`;

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

  // 8. SKILL RECOMMENDATION INTENT ("Courses for electrician", "Learn solar panel", "Kaushal")
  if (
    lower.includes('course') ||
    lower.includes('skill') ||
    lower.includes('kaushal') ||
    lower.includes('learn') ||
    lower.includes('training') ||
    lower.includes('seekhna') ||
    lower.includes('shikayche') ||
    lower.includes('certificate')
  ) {
    try {
      const recs = await recommendSkillsForWorker({
        current_role: state.userProfile?.workType || 'Gig Worker',
        skills: [text],
        target_role: text,
      });

      const topCourses: AssistantCourseCard[] = recs.slice(0, 3).map((c) => ({
        id: c.course_id,
        title: c.title,
        provider: c.provider,
        skills: c.skills_taught,
        url: c.course_url,
      }));

      let resp = `Here are ${topCourses.length} accredited PMKVY / NSDC courses tailored for your skills:`;
      if (lang === 'hi') resp = `यहाँ आपके कौशल के लिए ${topCourses.length} मान्यता प्राप्त PMKVY / NSDC कोर्स हैं:`;
      if (lang === 'mr') resp = `येथे तुमच्या कौशल्यासाठी ${topCourses.length} मान्यताप्राप्त PMKVY / NSDC कोर्सेस आहेत:`;

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

  // 9. JOB SEARCH INTENT ("Find electrician jobs near me", "Plumber kaam", "Delivery gigs")
  if (
    lower.includes('job') ||
    lower.includes('jobs') ||
    lower.includes('kaam') ||
    lower.includes('gig') ||
    lower.includes('delivery') ||
    lower.includes('driver') ||
    lower.includes('electrician') ||
    lower.includes('plumber') ||
    lower.includes('carpenter') ||
    lower.includes('vacancy') ||
    lower.includes('rozi')
  ) {
    try {
      // Extract search keywords
      let queryTerm = '';
      if (lower.includes('electrician')) queryTerm = 'electrician';
      else if (lower.includes('plumber')) queryTerm = 'plumber';
      else if (lower.includes('delivery')) queryTerm = 'delivery';
      else if (lower.includes('driver')) queryTerm = 'driver';
      else if (lower.includes('tailor')) queryTerm = 'tailor';
      else if (lower.includes('cleaner') || lower.includes('maid')) queryTerm = 'cleaner';

      const allJobs = await fetchJobs({ search: queryTerm || undefined });
      const topJobs = allJobs.slice(0, 3).map((j) => ({
        id: j.id,
        title: j.title,
        employer: j.employer,
        location: j.location,
        pay: `${formatInr(j.compensation.amount)} / ${j.compensation.unit.replace('per_', '')}`,
        workType: j.workType,
      }));

      let resp = `I found ${topJobs.length} matching jobs for you:`;
      if (lang === 'hi') resp = `मुझे आपके लिए ${topJobs.length} उपयुक्त काम मिले:`;
      if (lang === 'mr') resp = `मला तुमच्यासाठी ${topJobs.length} योग्य नोकऱ्या मिळाल्या:`;

      return {
        id: msgId,
        role: 'assistant',
        text: resp,
        timestamp,
        lang,
        intent: 'search_jobs',
        jobResults: topJobs,
        navigationAction: {
          route: '/kaam',
          label: 'Open Kaam Marketplace',
        },
      };
    } catch {
      // fallback
    }
  }

  // 10. GENERAL HEALTH SYMPTOM & WELFARE GUIDANCE (Model 8 RAG)
  if (
    lower.includes('fever') ||
    lower.includes('bukhar') ||
    lower.includes('taap') ||
    lower.includes('cough') ||
    lower.includes('khansi') ||
    lower.includes('khokla') ||
    lower.includes('pain') ||
    lower.includes('dard') ||
    lower.includes('dukhna') ||
    lower.includes('headache') ||
    lower.includes('sar dard') ||
    lower.includes('ill') ||
    lower.includes('bimar') ||
    lower.includes('tabiyat') ||
    lower.includes('ayushman') ||
    lower.includes('abha')
  ) {
    try {
      const rag = await searchHealthWelfareRAG(text, 2);
      const policyPassage = rag.passages?.[0]?.text;

      let guidance =
        'Take adequate rest, stay hydrated, and monitor your symptoms. If fever or pain persists beyond 48 hours, please consult a registered medical officer at a nearby government dispensary.';
      if (policyPassage) {
        guidance += `\n\nHealth Scheme Note: ${policyPassage.slice(0, 200)}...`;
      }

      if (lang === 'hi') {
        guidance =
          'पर्याप्त आराम करें, पानी और तरल पदार्थ लें। यदि बुखार या दर्द 48 घंटे से अधिक रहे, तो कृपया नजदीकी सरकारी औषधालय या प्राथमिक स्वास्थ्य केंद्र (PHC) में डॉक्टर से संपर्क करें।';
        if (policyPassage) {
          guidance += `\n\nस्वास्थ्य योजना सहायता: आयुष्मान भारत / ABHA के तहत आप सरकारी अस्पतालों में कैशलेस उपचार प्राप्त कर सकते हैं।`;
        }
      } else if (lang === 'mr') {
        guidance =
          'पुरेशी विश्रांती घ्या, भरपूर पाणी प्या. जर ताप किंवा वेदना 48 तासांपेक्षा जास्त काळ राहिल्यास, कृपया जवळच्या सरकारी दवाखान्यात डॉक्टरांचा सल्ला घ्या.';
        if (policyPassage) {
          guidance += `\n\nयोजना सहाय्य: आयुष्मान भारत / ABHA द्वारे सरकारी रुग्णालयांमध्ये मोफत उपचारांची सुविधा उपलब्ध आहे.`;
        }
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
          label: 'View Nearby Healthcare Centers',
        },
      };
    } catch {
      // fallback
    }
  }

  // 11. PROFILE / ACCOUNT FAQ
  if (lower.includes('who am i') || lower.includes('mera naam') || lower.includes('profile') || lower.includes('naam kya')) {
    const name = state.userProfile?.name || 'Worker Friend';
    const role = state.userProfile?.workType || 'Independent Service Provider';

    let resp = `You are logged in as ${name}, working as ${role} in Setu.`;
    if (lang === 'hi') resp = `आप सेतू में ${name} के रूप में जुड़े हैं, आपका मुख्य कार्य ${role} है।`;
    if (lang === 'mr') resp = `तुम्ही सेतूमध्ये ${name} म्हणून लॉग इन आहात, तुमचे मुख्य काम ${role} आहे.`;

    return {
      id: msgId,
      role: 'assistant',
      text: resp,
      timestamp,
      lang,
      intent: 'profile_faq',
      navigationAction: {
        route: '/profile',
        label: 'View Full Profile',
      },
    };
  }

  // 12. DEFAULT CONVERSATIONAL FALLBACK
  let defaultMsg =
    'I am your Setu Livelihood Assistant. You can speak or type to record expenses, track income, find jobs, get health advice, or explore skill courses.';
  if (lang === 'hi') {
    defaultMsg =
      'मैं आपका सेतू सहायक हूँ। आप बोलकर या लिखकर कमाई दर्ज कर सकते हैं, खर्चे जोड़ सकते हैं, काम ढूंढ सकते हैं, या स्वास्थ्य और कौशल सहायता ले सकते हैं।';
  } else if (lang === 'mr') {
    defaultMsg =
      'मी तुमचा सेतू सहाय्यक आहे. तुम्ही बोलून किंवा लिहून कमाई नोंदवू शकता, खर्च जोडू शकता, नोकरी शोधू शकता, किंवा आरोग्य आणि कौशल्य मार्गदर्शन मिळवू शकता.';
  }

  return {
    id: msgId,
    role: 'assistant',
    text: defaultMsg,
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

  constructor(callbacks: SpeechCallbacks, options?: { silenceDurationMs?: number; language?: string }) {
    this.callbacks = callbacks;
    this.silenceDurationMs = options?.silenceDurationMs || 5000;
    this.language = options?.language || 'hi-IN';
    this.initRecognizer();
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    // @ts-expect-error - WebKit prefix check
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
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
      // @ts-expect-error - WebKit prefix check
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
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
          // Normal brief silence pause, continue listening
          return;
        }
        if (event.error === 'aborted') {
          return;
        }
        console.warn('Speech recognition error:', event.error);
        this.callbacks.onError(event.error || 'Microphone error');
      };

      this.recognizer.onend = () => {
        // If user is still actively speaking and timeout has not expired, restart seamlessly
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

  public start() {
    if (!this.isSupported()) {
      this.callbacks.onError('speech_not_supported');
      return;
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

    // Countdown interval every 100ms
    this.silenceInterval = setInterval(() => {
      this.remainingSilenceMs = Math.max(0, this.remainingSilenceMs - 100);
      this.callbacks.onSilenceTick(this.remainingSilenceMs, this.silenceDurationMs);
    }, 100);

    // 5-second silence expiration timer
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

