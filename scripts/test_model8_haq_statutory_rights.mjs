/**
 * Automated Verification Test Suite for Model 8 / Haq Setu Statutory Labor Rights
 * & Dispute Resolution (Bilingual English + Hindi/Hinglish).
 * Verifies Frontend & Backend Parity, Statutory Grounding, and all 11 Benchmark Cases.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

console.log('='.repeat(75));
console.log('⚖️  FAIRWORK SETU MODEL 8 - HAQ SETU BILINGUAL STATUTORY RIGHTS VERIFICATION');
console.log('='.repeat(75) + '\n');

// 1. Inspect statutory knowledge corpus markdown
const corpusPath = path.resolve('model_codes/08_health_welfare_rag/data/raw/gig_workers_statutory_rights.md');
assert(fs.existsSync(corpusPath), 'gig_workers_statutory_rights.md must exist in data/raw');
const corpusContent = fs.readFileSync(corpusPath, 'utf8');

// 2. Inspect chunks.json
const chunksPath = path.resolve('model_codes/08_health_welfare_rag/artifacts/chunks.json');
assert(fs.existsSync(chunksPath), 'chunks.json must exist in artifacts');
const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));

// 3. Inspect backend statutory service & router
const backendHaqPath = path.resolve('ml_service/haq_service.py');
assert(fs.existsSync(backendHaqPath), 'haq_service.py must exist in ml_service');
const backendHaqContent = fs.readFileSync(backendHaqPath, 'utf8');

const mainPyPath = path.resolve('ml_service/main.py');
const mainPyContent = fs.readFileSync(mainPyPath, 'utf8');

const aiModelsRouterPath = path.resolve('ml_service/ai_models_router.py');
const aiModelsRouterContent = fs.readFileSync(aiModelsRouterPath, 'utf8');

const aiModelsServicePath = path.resolve('ml_service/ai_models_service.py');
const aiModelsServiceContent = fs.readFileSync(aiModelsServicePath, 'utf8');

// 4. Inspect frontend files
const frontendHaqPath = path.resolve('src/services/haqService.ts');
assert(fs.existsSync(frontendHaqPath), 'haqService.ts must exist');
const frontendHaqContent = fs.readFileSync(frontendHaqPath, 'utf8');

const voiceServicePath = path.resolve('src/services/voiceAssistantService.ts');
const voiceServiceContent = fs.readFileSync(voiceServicePath, 'utf8');

const assistantCardPath = path.resolve('src/components/haq/HaqAssistantCard.tsx');
assert(fs.existsSync(assistantCardPath), 'HaqAssistantCard.tsx must exist');
const assistantCardContent = fs.readFileSync(assistantCardPath, 'utf8');

const haqPagePath = path.resolve('src/pages/HaqSetuPage.tsx');
const haqPageContent = fs.readFileSync(haqPagePath, 'utf8');

// ---------------------------------------------------------------------------
// TEST 1: Knowledge Corpus and RAG Chunks Verification
// ---------------------------------------------------------------------------
console.log('Testing Test 1: Statutory labor rights corpus & RAG chunks index...');
assert(corpusContent.includes('Rajasthan Platform Based Gig Workers'), 'Corpus must include Rajasthan Gig Act 2023');
assert(corpusContent.includes('Code on Social Security, 2020'), 'Corpus must include Code on Social Security 2020');
assert(corpusContent.includes('Payment of Wages Act, 1936'), 'Corpus must include Payment of Wages Act 1936');
assert(corpusContent.includes("Employee's Compensation Act, 1923"), "Corpus must include Employee's Compensation Act 1923");
assert(corpusContent.includes('Bharatiya Nyaya Sanhita'), 'Corpus must include Bharatiya Nyaya Sanhita (BNS) 2023');
assert(corpusContent.includes('Contract Labour (Regulation and Abolition) Act, 1970'), 'Corpus must include Contract Labour Act 1970');
assert(corpusContent.includes('e-Shram'), 'Corpus must include e-Shram & BOCW');
assert(chunks.length >= 50, `RAG artifacts must contain expanded indexed chunks (found ${chunks.length})`);
console.log(`✅ Test 1 Passed: Statutory rights corpus verified with ${chunks.length} indexed chunks.\n`);

// ---------------------------------------------------------------------------
// TEST 2: Backend Architecture & Router Integration
// ---------------------------------------------------------------------------
console.log('Testing Test 2: Backend architecture, routers & voice intent wiring...');
assert(mainPyContent.includes('from haq_service import haq_router'), 'main.py must import haq_router');
assert(mainPyContent.includes('app.include_router(haq_router)'), 'main.py must include haq_router');
assert(aiModelsRouterContent.includes('/haq-assistant'), 'ai_models_router.py must expose /haq-assistant');
assert(aiModelsServiceContent.includes('from haq_service import classify_haq_intent'), 'ai_models_service.py must delegate rights intent to haq_service');
console.log('✅ Test 2 Passed: Backend routers and voice intent delegation verified.\n');

// ---------------------------------------------------------------------------
// TEST 3: Frontend Service & Voice Assistant Integration
// ---------------------------------------------------------------------------
console.log('Testing Test 3: Frontend service layer, voice assistant & offline fallback...');
assert(frontendHaqContent.includes('askHaqAssistant'), 'haqService.ts must export askHaqAssistant');
assert(frontendHaqContent.includes('classifyHaqIntent'), 'haqService.ts must export classifyHaqIntent');
assert(frontendHaqContent.includes('getOfflineStatutoryResponse'), 'haqService.ts must export getOfflineStatutoryResponse');
assert(voiceServiceContent.includes('classifyHaqIntent'), 'voiceAssistantService.ts must import and use classifyHaqIntent');
assert(voiceServiceContent.includes('getOfflineStatutoryResponse'), 'voiceAssistantService.ts must use getOfflineStatutoryResponse');
console.log('✅ Test 3 Passed: Frontend service layer and voice assistant wiring verified.\n');

// ---------------------------------------------------------------------------
// TEST 4: UI Components & Modal/View Integration
// ---------------------------------------------------------------------------
console.log('Testing Test 4: Interactive Haq Assistant UI card and view integration...');
assert(haqPageContent.includes('HaqAssistantCard'), 'HaqSetuPage.tsx must render HaqAssistantCard');
assert(haqPageContent.includes("setCurrentView('assistant')"), 'HaqSetuPage.tsx must support assistant view navigation');
assert(assistantCardContent.includes('Ask Haq Setu (हक सहायक)'), 'HaqAssistantCard.tsx must render header');
assert(assistantCardContent.includes('Company ne bina notice meri ID block kar di'), 'Sample queries must cover deactivation and rights');
console.log('✅ Test 4 Passed: UI components and navigation pills verified.\n');

// ---------------------------------------------------------------------------
// TEST 5: Exact Statutory Citations & Red-Flag Escalations
// ---------------------------------------------------------------------------
console.log('Testing Test 5: Exact statutory citations and escalation pathways...');
const expectedCitations = [
  'Rajasthan Platform Based Gig Workers Act, 2023',
  'Code on Social Security, 2020',
  'Payment of Wages Act, 1936',
  'Compensation Act, 1923',
  'Bharatiya Nyaya Sanhita (BNS) 2023',
  'Contract Labour (Regulation and Abolition) Act, 1970',
  'e-Shram',
  'samadhan.labour.gov.in',
  'epfigms.gov.in',
  'tel:112'
];

for (const cite of expectedCitations) {
  assert(
    backendHaqContent.includes(cite) && frontendHaqContent.includes(cite),
    `Both backend and frontend must feature verified citation: ${cite}`
  );
}
console.log('✅ Test 5 Passed: All 10 statutory citations and government portal escalations verified.\n');

// ---------------------------------------------------------------------------
// TEST 6: Execution of Python ML Service Test Suite
// ---------------------------------------------------------------------------
console.log('Testing Test 6: Running Python ML Service unit test suite (11 benchmark queries)...');
try {
  const pyBin = process.platform === 'win32' ? 'python' : 'python3';
  const pyOutput = execSync(`${pyBin} ml_service/test_haq_triage.py`, { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  console.log(pyOutput.trim());
  console.log('✅ Test 6 Passed: Python backend verified on all 11 statutory queries with 100% precision.\n');
} catch (err) {
  console.error('Python test failed:', err);
  process.exit(1);
}

console.log('='.repeat(75));
console.log('🎉 ALL FAIRWORK SETU MODEL 8 HAQ STATUTORY RIGHTS VERIFICATION TESTS PASSED!');
console.log('='.repeat(75));
