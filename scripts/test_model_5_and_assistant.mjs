import assert from 'assert';
import {
  parseCompoundTransactions,
  splitCompoundSentence,
  extractQueryIntentAndEntities,
  hasAmount,
  convertVernacularNumberWords,
  normalizeIndicDigits,
} from '../src/utils/entityParser.ts';

console.log('🧪 Starting Model 5 Compound Parser & Entity Extraction Test Suite...\n');

// ---------------------------------------------------------------------------
// TEST 1: The User's Exact Problem Utterance
// "Aaj 800 kamaye par 150 ka tel bharwaya aur 40 ki chai pee"
// ---------------------------------------------------------------------------
console.log('Testing Test 1: User problem sentence...');
const userUtterance = "Aaj 800 kamaye par 150 ka tel bharwaya aur 40 ki chai pee";

const chunks = splitCompoundSentence(userUtterance);
console.log('Chunks:', chunks);
assert.deepStrictEqual(chunks, [
  'Aaj 800 kamaye',
  '150 ka tel bharwaya',
  '40 ki chai pee'
]);

const res = parseCompoundTransactions(userUtterance);
console.log('Extracted transactions count:', res.transactions.length);
console.log('Total Income:', res.total_income);
console.log('Total Expense:', res.total_expense);

assert.strictEqual(res.transactions.length, 3, 'Must extract exactly 3 transactions');
assert.strictEqual(res.total_income, 800, 'Total income must be 800');
assert.strictEqual(res.total_expense, 190, 'Total expense must be 190 (150 + 40)');

// Item 1: Income ₹800
const tx1 = res.transactions[0];
assert.strictEqual(tx1.type, 'income');
assert.strictEqual(tx1.amount, 800);
assert.strictEqual(tx1.category, 'work_earnings');
assert.strictEqual(tx1.description, 'kamaye');

// Item 2: Expense ₹150
const tx2 = res.transactions[1];
assert.strictEqual(tx2.type, 'expense');
assert.strictEqual(tx2.amount, 150);
assert.strictEqual(tx2.category, 'travel_fuel');
assert.strictEqual(tx2.description, 'tel');

// Item 3: Expense ₹40
const tx3 = res.transactions[2];
assert.strictEqual(tx3.type, 'expense');
assert.strictEqual(tx3.amount, 40);
assert.strictEqual(tx3.category, 'food');
assert.strictEqual(tx3.description, 'chai');

console.log('✅ Test 1 Passed: Exactly 3 transactions extracted (Income ₹800, Expense ₹150, Expense ₹40).\n');

// ---------------------------------------------------------------------------
// TEST 2: Vernacular Number Words & Compound Additions
// ---------------------------------------------------------------------------
console.log('Testing Test 2: Vernacular Number Words & Compound Additions...');

const compoundNumText = "do hazaar paanch sau kamaye par ek hazaar dedh sau kharch hue";
const res2 = parseCompoundTransactions(compoundNumText);

assert.strictEqual(res2.transactions.length, 2);
assert.strictEqual(res2.transactions[0].amount, 2500, 'do hazaar paanch sau should be 2500');
assert.strictEqual(res2.transactions[0].type, 'income');
assert.strictEqual(res2.transactions[1].amount, 1150, 'ek hazaar dedh sau should be 1150');
assert.strictEqual(res2.transactions[1].type, 'expense');

console.log('✅ Test 2 Passed: Compound vernacular numbers (2500 income, 1150 expense) verified.\n');

// ---------------------------------------------------------------------------
// TEST 3: Smart Splitting Rule: Do not split "aur" without amounts on both sides
// ---------------------------------------------------------------------------
console.log('Testing Test 3: Conjunction "aur" without amount on both sides...');

const joinedText = "Maine 300 ka petrol aur diesel bharwaya";
const res3 = parseCompoundTransactions(joinedText);

assert.strictEqual(res3.transactions.length, 1, 'Must remain a single transaction');
assert.strictEqual(res3.transactions[0].amount, 300);
assert.strictEqual(res3.transactions[0].type, 'expense');
assert.strictEqual(res3.transactions[0].category, 'travel_fuel');

console.log('✅ Test 3 Passed: Smart splitting kept compound nouns in single transaction.\n');

// ---------------------------------------------------------------------------
// TEST 4: Date Extraction (aaj vs kal vs parso)
// ---------------------------------------------------------------------------
console.log('Testing Test 4: Relative Date Extraction...');

const kalText = "Kal 600 rupaye kamaye";
const res4 = parseCompoundTransactions(kalText);
const today = new Date();
const yesterday = new Date(today.getTime() - 86400000).toISOString().split('T')[0];

assert.strictEqual(res4.transactions[0].amount, 600);
assert.strictEqual(res4.transactions[0].type, 'income');
assert.strictEqual(res4.transactions[0].date, yesterday);

console.log('✅ Test 4 Passed: Yesterday ("kal") extracted as ' + yesterday + '.\n');

// ---------------------------------------------------------------------------
// TEST 5: Model 5 Query Mode: Intent & Entity Extraction (Kaam, Sehat, Haq)
// ---------------------------------------------------------------------------
console.log('Testing Test 5: Model 5 Query Intent & Entity Extraction...');

// Kaam / Job search
const q1 = extractQueryIntentAndEntities("Mujhe Pune me plumber ka urgent kaam chahiye");
assert.strictEqual(q1.intent, 'job_search');
assert.strictEqual(q1.entities.skill, 'plumber');
assert.strictEqual(q1.entities.city, 'Pune');
assert.strictEqual(q1.entities.urgency, 'immediate');

// Sehat / Health query
const q2 = extractQueryIntentAndEntities("2 ghante se seene me tej dard hai");
assert.strictEqual(q2.intent, 'health_query');
assert.strictEqual(q2.entities.symptom, 'chest pain');
assert.strictEqual(q2.entities.severity, 'high');
assert.strictEqual(q2.entities.duration, '2 ghante');

// Haq / Welfare query
const q3 = extractQueryIntentAndEntities("E-shram card ka fayda batao");
assert.strictEqual(q3.intent, 'welfare_query');
assert.strictEqual(q3.entities.scheme, 'e-shram');
assert.strictEqual(q3.entities.topic, 'benefits');

console.log('✅ Test 5 Passed: Model 5 extracts intent & entities for Kaam, Sehat, and Haq.\n');

// ---------------------------------------------------------------------------
// TEST 6: Simulated Assistant Response Generator Validation
// ---------------------------------------------------------------------------
console.log('Testing Test 6: Assistant confirmation string construction for user problem...');

function formatInr(val) {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

const compound = parseCompoundTransactions("Aaj 800 kamaye par 150 ka tel bharwaya aur 40 ki chai pee");
const pendingItems = compound.transactions.map((it, idx) => ({
  id: `multi-${idx}`,
  type: it.type,
  amount: it.amount,
  category: it.category,
  description: it.description,
}));

const expCount = pendingItems.filter(p => p.type === 'expense').length;
let hindiMsg = `मुझे ${formatInr(compound.total_income)} की आय और ${formatInr(compound.total_expense)} के ${expCount} खर्चे मिले:\n`;
pendingItems.forEach((it, i) => {
  const typeTag = it.type === 'income' ? 'आय' : 'खर्च';
  hindiMsg += `${i + 1}. ${typeTag}: ${it.description}: ${formatInr(it.amount)}\n`;
});
hindiMsg += 'क्या मैं इन्हें आपके खाते में जोड़ दूं?';

console.log('Generated Hindi message:\n' + hindiMsg);
assert(hindiMsg.includes('₹800 की आय'));
assert(hindiMsg.includes('₹190 के 2 खर्चे'));
assert(hindiMsg.includes('1. आय: kamaye: ₹800'));
assert(hindiMsg.includes('2. खर्च: tel: ₹150'));
assert(hindiMsg.includes('3. खर्च: chai: ₹40'));

console.log('✅ Test 6 Passed: Generated assistant dialog matches exact expected prompt format.\n');

// ---------------------------------------------------------------------------
// TEST 7: Repeated Voice Stutter / Loop Deduplication
// "maine maine maine maine 8000 kamaye 8000 kamyee"
// ---------------------------------------------------------------------------
console.log('Testing Test 7: Speech stutter / repetition loop deduplication...');
const stutterUtterance = "maine maine maine maine 8000 kamaye 8000 kamyee";
const dedupRes = parseCompoundTransactions(stutterUtterance);

console.log('Deduplicated count:', dedupRes.transactions.length);
console.log('Deduplicated income:', dedupRes.total_income);
assert.strictEqual(dedupRes.transactions.length, 1, 'Must collapse repeated speech into 1 transaction');
assert.strictEqual(dedupRes.total_income, 8000, 'Must extract single income amount of 8000');
assert.strictEqual(dedupRes.transactions[0].type, 'income');

console.log('✅ Test 7 Passed: "maine maine maine maine 8000 kamaye 8000 kamyee" successfully deduplicated to 1 income entry of ₹8,000.\n');

console.log('🎉 ALL MODEL 5 TESTS COMPLETED WITH 100% SUCCESS!');

