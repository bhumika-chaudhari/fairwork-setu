/**
 * Verification Test Suite for FairWork Setu's Unified Voice Assistant
 * Validates all 12 scenarios:
 * 1. Single expense extraction & confirmation card
 * 2. Single income extraction (without creating expense)
 * 3. Multiple expenses in one utterance (distinct items & total sum)
 * 4. Amount correction follow-up ("Change that to ₹180")
 * 5. Type flip follow-up ("I meant income, not expense")
 * 6. Real financial summary calculation (weekly / today sums)
 * 7. Job search intent & matching cards
 * 8. Health symptom guidance & scheme advice
 * 9. Critical health emergency escalation (112 / 108)
 * 10. Skills course recommendations (Model 7)
 * 11. Voice-guided navigation
 * 12. Multilingual detection & localized responses (Hindi / Marathi / English)
 */

import {
  detectSpokenLanguage,
  extractMultipleExpenses,
  normalizeCategory,
  processUserUtterance,
  type AssistantContextState,
} from '../services/voiceAssistantService';
import type { Transaction } from '../types/transaction';

async function runTests() {
  console.log('--- STARTING VOICE ASSISTANT 12-POINT VERIFICATION ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✓ [PASS] ${testName}`);
    } else {
      console.error(`✗ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    }
  }

  const nowStr = new Date().toISOString();
  const nowMs = Date.now();
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      amount: 1200,
      category: 'work_earnings',
      description: 'Zomato delivery payout',
      timestamp: nowStr,
      createdAt: nowMs,
      updatedAt: nowMs,
      source: 'manual',
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 150,
      category: 'food',
      description: 'Lunch',
      timestamp: nowStr,
      createdAt: nowMs,
      updatedAt: nowMs,
      source: 'manual',
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 300,
      category: 'travel_fuel',
      description: 'Petrol',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      createdAt: nowMs,
      updatedAt: nowMs,
      source: 'voice',
    },
  ];

  const baseState: AssistantContextState = {
    pendingConfirmation: null,
    lastIntent: null,
    userProfile: {
      name: 'Ramesh Kumar',
      workType: 'delivery',
      cityKey: 'cities.pune',
      savingsGoal: 5000,
    },
    transactions: mockTransactions,
    summary: {
      todayIncome: 1200,
      todayExpense: 150,
      todayNet: 1050,
      weeklyIncome: 1200,
      totalIncome: 1200,
      totalExpense: 450,
      netForPeriod: 750,
    },
  };

  // 1. Single Expense
  const r1 = await processUserUtterance('I spent ₹150 on food today', baseState);
  assert(
    r1.intent === 'add_expense' &&
      r1.pendingConfirmation?.items[0]?.amount === 150 &&
      r1.pendingConfirmation?.items[0]?.category === 'food',
    'Scenario 1: Single Expense ("I spent ₹150 on food today")',
    JSON.stringify(r1)
  );

  // 2. Single Income
  const r2 = await processUserUtterance('I earned ₹800 today', baseState);
  assert(
    r2.intent === 'add_income' &&
      r2.pendingConfirmation?.items[0]?.amount === 800 &&
      r2.pendingConfirmation?.items[0]?.type === 'income' &&
      r2.pendingConfirmation?.items[0]?.category === 'work_earnings',
    'Scenario 2: Single Income ("I earned ₹800 today")',
    JSON.stringify(r2)
  );

  // 3. Multiple Expenses in One Utterance
  const r3 = await processUserUtterance(
    'Add expenses: ₹50 for tea, ₹100 for petrol, and ₹200 for groceries',
    baseState
  );
  assert(
    r3.intent === 'add_multiple_expenses' &&
      r3.pendingConfirmation?.items.length === 3 &&
      r3.pendingConfirmation?.totalAmount === 350,
    'Scenario 3: Multiple Expenses in One Utterance (3 items totaling ₹350)',
    JSON.stringify(r3.pendingConfirmation)
  );

  // 4. Follow-up Amount Correction
  if (r1.pendingConfirmation) {
    const correctionState: AssistantContextState = {
      ...baseState,
      pendingConfirmation: r1.pendingConfirmation,
    };
    const r4 = await processUserUtterance('Change that to ₹180', correctionState);
    assert(
      r4.intent === 'correct_pending_amount' &&
        r4.pendingConfirmation?.items[0]?.amount === 180 &&
        r4.pendingConfirmation?.totalAmount === 180,
      'Scenario 4: Follow-up Amount Correction ("Change that to ₹180")',
      JSON.stringify(r4)
    );
  }

  // 5. Follow-up Type Flip
  if (r1.pendingConfirmation) {
    const flipState: AssistantContextState = {
      ...baseState,
      pendingConfirmation: r1.pendingConfirmation,
    };
    const r5 = await processUserUtterance('I meant income, not expense', flipState);
    assert(
      r5.intent === 'correct_pending_type' &&
        r5.pendingConfirmation?.items[0]?.type === 'income',
      'Scenario 5: Follow-up Type Flip ("I meant income, not expense")',
      JSON.stringify(r5)
    );
  }

  // 6. Financial Summary Calculation
  const r6 = await processUserUtterance('How much did I spend this week?', baseState);
  assert(
    r6.intent === 'financial_summary' &&
      r6.text.includes('450') &&
      r6.text.includes('This week'),
    'Scenario 6: Financial Summary Calculation ("How much did I spend this week?")',
    r6.text
  );

  // 7. Work / Kaam Search
  const r7 = await processUserUtterance('Find electrician jobs near me', baseState);
  assert(
    r7.intent === 'search_jobs' &&
      Array.isArray(r7.jobResults) &&
      r7.jobResults.length > 0,
    'Scenario 7: Work / Kaam Job Search ("Find electrician jobs near me")',
    JSON.stringify(r7.jobResults)
  );

  // 8. Health Symptom Guidance
  const r8 = await processUserUtterance(
    'I have a fever and weakness since yesterday',
    baseState
  );
  assert(
    r8.intent === 'health_guidance' &&
      r8.text.toLowerCase().includes('rest') &&
      r8.navigationAction?.route === '/sehat',
    'Scenario 8: Health Symptom Guidance ("Fever and weakness")',
    r8.text
  );

  // 9. Critical Health Emergency Escalation
  const r9 = await processUserUtterance(
    'I have chest pain and severe breathlessness',
    baseState
  );
  assert(
    r9.intent === 'health_emergency' &&
      r9.emergencyAlert?.isEmergency === true &&
      r9.emergencyAlert?.primaryNumber === '112' &&
      r9.emergencyAlert?.secondaryNumber === '108',
    'Scenario 9: Critical Health Emergency Escalation (112 / 108 triggered)',
    JSON.stringify(r9.emergencyAlert)
  );

  // 10. Skills Course Recommendations
  const r10 = await processUserUtterance('Courses for electrician', baseState);
  assert(
    r10.intent === 'recommend_skills' &&
      Array.isArray(r10.courseResults) &&
      r10.courseResults.length > 0,
    'Scenario 10: Skills Course Recommendations ("Courses for electrician")',
    JSON.stringify(r10.courseResults)
  );

  // 11. Navigation Intent
  const r11 = await processUserUtterance('Open money page', baseState);
  assert(
    r11.intent === 'navigate_page' &&
      r11.navigationAction?.route === '/dhan',
    'Scenario 11: Navigation Intent ("Open money page" -> /dhan)',
    JSON.stringify(r11.navigationAction)
  );

  // 12. Multilingual Support: Hindi and Marathi
  const r12Hindi = await processUserUtterance('Aaj 200 ka petrol bharwaya', baseState);
  assert(
    r12Hindi.lang === 'hi' &&
      r12Hindi.pendingConfirmation?.items[0]?.amount === 200 &&
      r12Hindi.pendingConfirmation?.items[0]?.category === 'travel_fuel',
    'Scenario 12a: Hindi Phrasing ("Aaj 200 ka petrol bharwaya")',
    JSON.stringify(r12Hindi)
  );

  const r12Marathi = await processUserUtterance('Mala 500 rupaye milale', baseState);
  assert(
    r12Marathi.lang === 'mr' &&
      r12Marathi.pendingConfirmation?.items[0]?.amount === 500 &&
      r12Marathi.pendingConfirmation?.items[0]?.type === 'income',
    'Scenario 12b: Marathi Phrasing ("Mala 500 rupaye milale")',
    JSON.stringify(r12Marathi)
  );

  console.log(`\n--- TEST SUMMARY: ${passed} / ${total} TESTS PASSED ---`);
  if (passed === total) {
    console.log('ALL 12 SCENARIOS VERIFIED SUCCESSFULLY!');
  } else {
    throw new Error(`Only ${passed}/${total} tests passed.`);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
});
