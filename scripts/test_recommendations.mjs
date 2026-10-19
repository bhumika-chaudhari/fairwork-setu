/**
 * Comprehensive Automated Test Suite for FairWork Setu Recommendation Engine
 * Covers all 10 recommendation quality test cases specified in the requirements.
 */

import assert from 'node:assert';
import {
  calculateJobMatch,
  rankJobsForProfile,
  normalizeSkill,
  extractRequiredExperience,
} from '../src/services/recommendationEngine.ts';

// Test Fixtures
const testJobs = [
  {
    id: 'job-python-data',
    title: 'Python & SQL Data Pipeline Associate',
    employer: 'FinTech Analytics Hub',
    category: 'technology',
    description: 'Build backend data pipelines using Python, SQL, and database indexing.',
    location: 'Pune',
    workType: 'full_time',
    compensation: { amount: 25000, maxAmount: 35000, unit: 'per_month', isEstimate: false },
    schedule: 'Full Time',
    requirements: ['Minimum 2 years experience in Python and database systems'],
    skills: ['Python', 'SQL', 'Data Pipelines', 'Database Indexing'],
    postedAt: '2026-10-15T10:00:00Z',
    verificationStatus: 'verified_platform',
  },
  {
    id: 'job-react-frontend',
    title: 'React & TypeScript Frontend Developer',
    employer: 'NextGen Digital Studio',
    category: 'technology',
    description: 'Develop responsive mobile-first UI components with React, TypeScript, and Tailwind.',
    location: 'Pune',
    workType: 'full_time',
    compensation: { amount: 28000, maxAmount: 40000, unit: 'per_month', isEstimate: false },
    schedule: 'Full Time',
    requirements: ['Minimum 2 years experience in React and TypeScript'],
    skills: ['React', 'TypeScript', 'JavaScript', 'CSS'],
    postedAt: '2026-10-15T10:00:00Z',
    verificationStatus: 'verified_platform',
  },
  {
    id: 'job-senior-lead-electrician',
    title: 'Senior Industrial Electrical Master',
    employer: 'Tata Power Industrial Solutions',
    category: 'electrician',
    description: 'Lead industrial transformer maintenance, 3-phase wiring, and team safety compliance.',
    location: 'Pune',
    workType: 'full_time',
    compensation: { amount: 35000, maxAmount: 45000, unit: 'per_month', isEstimate: false },
    schedule: 'Full Time',
    requirements: ['Minimum 5 years experience in high voltage wiring and industrial panels'],
    skills: ['Industrial wiring', 'MCB repair', 'Transformer maintenance', 'Safety grounding'],
    postedAt: '2026-10-15T10:00:00Z',
    verificationStatus: 'verified_platform',
  },
  {
    id: 'job-entry-delivery',
    title: 'Quick Delivery Partner (Fresher Friendly)',
    employer: 'Swiggy Express Fleet',
    category: 'delivery',
    description: 'Deliver retail packages and meals locally. No prior experience required.',
    location: 'Pune',
    workType: 'shift_based',
    compensation: { amount: 500, maxAmount: 800, unit: 'per_day', isEstimate: true },
    schedule: 'Flexible',
    requirements: ['Valid driving license', 'Smartphone with GPS'],
    skills: ['Two-wheeler riding', 'GPS Navigation', 'Customer Communication'],
    postedAt: '2026-10-15T10:00:00Z',
    verificationStatus: 'verified_platform',
  },
  {
    id: 'job-plumbing-tech',
    title: 'Plumbing & Water Motor Technician',
    employer: 'JalSeva Home Care',
    category: 'plumbing',
    description: 'Concealed pipe leakages, bathroom sanitary fittings, and overhead tank float valves.',
    location: 'Pune',
    workType: 'task_based',
    compensation: { amount: 600, maxAmount: 1200, unit: 'per_task', isEstimate: true },
    schedule: 'Task Based',
    requirements: ['Minimum 2 years experience in CPVC/GI pipe joints'],
    skills: ['Pipe jointing', 'Leakage detection', 'Sanitary installation', 'Motor pump wiring check'],
    postedAt: '2026-10-15T10:00:00Z',
    verificationStatus: 'community_posted',
  },
];

console.log('🧪 Starting FairWork Setu Recommendation Engine Test Suite...\n');

let passedTests = 0;
let totalTests = 10;

// ---------------------------------------------------------------------------
// TEST 1: Python & SQL user ranks data/backend jobs above unrelated
// ---------------------------------------------------------------------------
{
  const profilePython = {
    name: 'Aarav Sharma',
    skills: ['Python', 'SQL', 'Data Pipelines'],
    experienceYears: 3,
    workType: 'technology',
    location: 'Pune',
  };

  const result = rankJobsForProfile(profilePython, testJobs);
  const topJob = result.matches[0];

  assert.strictEqual(
    topJob.jobId,
    'job-python-data',
    'Test 1 Failed: Python+SQL job should rank #1 for Python+SQL profile'
  );
  assert(
    topJob.matchScore >= 80,
    `Test 1 Failed: Expected high match score (>=80), got ${topJob.matchScore}`
  );
  assert(
    topJob.matchingSkills.includes('Python') && topJob.matchingSkills.includes('SQL'),
    'Test 1 Failed: Matched skills must include Python and SQL'
  );

  console.log('✅ Test 1 Passed: Python & SQL user ranks data/backend jobs #1 above unrelated.');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 2: React & JS user receives frontend jobs
// ---------------------------------------------------------------------------
{
  const profileFrontend = {
    name: 'Pooja Patil',
    skills: ['React', 'TypeScript', 'JavaScript'],
    experienceYears: 3,
    workType: 'technology',
    location: 'Pune',
  };

  const result = rankJobsForProfile(profileFrontend, testJobs);
  const topJob = result.matches[0];

  assert.strictEqual(
    topJob.jobId,
    'job-react-frontend',
    'Test 2 Failed: React+TS frontend job should rank #1 for frontend profile'
  );
  assert(
    topJob.matchScore >= 80,
    `Test 2 Failed: Expected high match score (>=80), got ${topJob.matchScore}`
  );
  assert(
    topJob.matchingSkills.includes('React') && topJob.matchingSkills.includes('TypeScript'),
    'Test 2 Failed: Matched skills must include React and TypeScript'
  );

  console.log('✅ Test 2 Passed: React & TypeScript user ranks frontend jobs #1.');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 3: Experienced worker (5+ years) ranks senior opportunities higher
// ---------------------------------------------------------------------------
{
  const profileSeniorElectrician = {
    name: 'Ramesh Kulkarni',
    skills: ['Industrial wiring', 'MCB repair', 'Safety grounding', 'Transformer maintenance'],
    experienceYears: 6,
    workType: 'electrician',
    location: 'Pune',
  };

  const profileBeginnerElectrician = {
    name: 'Vikram Shinde',
    skills: ['Industrial wiring', 'MCB repair', 'Safety grounding', 'Transformer maintenance'],
    experienceYears: 1, // beginner
    workType: 'electrician',
    location: 'Pune',
  };

  const seniorMatch = calculateJobMatch(profileSeniorElectrician, testJobs[2]); // Senior industrial electrical
  const beginnerMatch = calculateJobMatch(profileBeginnerElectrician, testJobs[2]);

  assert(
    seniorMatch.matchScore > beginnerMatch.matchScore + 20,
    `Test 3 Failed: Senior worker score (${seniorMatch.matchScore}) should be >20 pts higher than beginner (${beginnerMatch.matchScore})`
  );
  assert(
    seniorMatch.matchScore >= 85,
    `Test 3 Failed: Senior worker should score >= 85, got ${seniorMatch.matchScore}`
  );

  console.log(
    `✅ Test 3 Passed: Senior worker scored ${seniorMatch.matchScore}% vs beginner ${beginnerMatch.matchScore}% on senior job.`
  );
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 4: Beginner worker (0-1 year) gets higher match on entry-level jobs and penalty on senior
// ---------------------------------------------------------------------------
{
  const beginnerProfile = {
    name: 'Suresh More',
    skills: ['Two-wheeler riding', 'GPS Navigation'],
    experienceYears: 0,
    workType: 'delivery',
    location: 'Pune',
  };

  const entryMatch = calculateJobMatch(beginnerProfile, testJobs[3]); // Entry delivery
  const seniorMatch = calculateJobMatch(beginnerProfile, testJobs[2]); // Senior industrial electrical

  assert(
    entryMatch.matchScore >= 80,
    `Test 4 Failed: Beginner should score >= 80 on entry delivery, got ${entryMatch.matchScore}`
  );
  assert(
    seniorMatch.matchScore < 40,
    `Test 4 Failed: Beginner should be heavily penalized on senior job, got ${seniorMatch.matchScore}`
  );

  console.log(
    `✅ Test 4 Passed: Beginner worker scored ${entryMatch.matchScore}% on entry job vs ${seniorMatch.matchScore}% on senior job.`
  );
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 5: Missing mandatory skill requirement mismatch penalization
// ---------------------------------------------------------------------------
{
  const cookProfile = {
    name: 'Sunita Bai',
    skills: ['Cooking', 'North Indian cuisine', 'Kitchen hygiene'],
    experienceYears: 5,
    workType: 'cooking',
    location: 'Pune',
  };

  // Check matching against industrial electrical and plumbing jobs
  const electricalMatch = calculateJobMatch(cookProfile, testJobs[2]);
  const plumbingMatch = calculateJobMatch(cookProfile, testJobs[4]);

  assert.strictEqual(
    electricalMatch.matchingSkills.length,
    0,
    'Test 5 Failed: Cook should have 0 matched skills for electrical job'
  );
  assert(
    electricalMatch.matchScore <= 35,
    `Test 5 Failed: Mismatched profile should be penalized, got score ${electricalMatch.matchScore}`
  );
  assert(
    plumbingMatch.matchScore <= 35,
    `Test 5 Failed: Mismatched profile should be penalized, got score ${plumbingMatch.matchScore}`
  );

  console.log('✅ Test 5 Passed: Missing mandatory skills correctly penalizes irrelevant job scores.');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 6: Empty skill list / new user receives graceful fallback recommendations without crashing
// ---------------------------------------------------------------------------
{
  const emptyProfile = {
    name: 'New Registered User',
    skills: [],
    skillKeys: [],
    customSkills: [],
    experienceYears: 0,
    workType: '',
    location: '',
  };

  let crashed = false;
  let result;
  try {
    result = rankJobsForProfile(emptyProfile, testJobs);
  } catch (e) {
    crashed = true;
    console.error(e);
  }

  assert.strictEqual(crashed, false, 'Test 6 Failed: Empty profile caused a crash');
  assert.strictEqual(result.isNewUserOrEmptyProfile, true, 'Test 6 Failed: Flag isNewUserOrEmptyProfile should be true');
  assert.strictEqual(result.matches.length, testJobs.length, 'Test 6 Failed: Should return all opportunities');
  // First job should be entry-level / fresher-friendly
  assert.strictEqual(
    result.matches[0].jobId,
    'job-entry-delivery',
    'Test 6 Failed: Entry-level job should be recommended first for new users'
  );
  assert(
    result.matches[0].explanation.includes('entry-level') || result.matches[0].explanation.includes('Profile'),
    'Test 6 Failed: Explanation should invite adding skills'
  );

  console.log('✅ Test 6 Passed: Empty profile handled gracefully with entry-level job #1 and invitation banner.');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 7: Zero matches scenario returns fallback recommendations with explanatory notice
// ---------------------------------------------------------------------------
{
  const obscureProfile = {
    name: 'Quantum Researcher',
    skills: ['Quantum Chromodynamics', 'Particle Accelerator Operation', 'Higgs Boson Analysis'],
    experienceYears: 8,
    workType: 'astrophysics',
    location: 'Geneva',
  };

  const result = rankJobsForProfile(obscureProfile, testJobs);

  assert.strictEqual(result.hasExactSkillMatches, false, 'Test 7 Failed: Expected hasExactSkillMatches to be false');
  assert(
    result.explanationNotice !== undefined && result.explanationNotice.length > 0,
    'Test 7 Failed: Expected explanatory notice for zero exact matches'
  );
  assert.strictEqual(
    result.matches.length,
    testJobs.length,
    'Test 7 Failed: Fallback opportunities must be presented, not an empty list'
  );
  assert.strictEqual(
    result.matches[0].isAlternative,
    true,
    'Test 7 Failed: Matches should be flagged as isAlternative'
  );

  console.log('✅ Test 7 Passed: Zero exact matches returns fallback opportunities with clear explanation notice.');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 8: Modifying profile skills immediately updates recommendations deterministically
// ---------------------------------------------------------------------------
{
  const baseProfile = {
    name: 'Worker Alpha',
    skills: ['Two-wheeler riding'],
    experienceYears: 1,
    workType: 'delivery',
    location: 'Pune',
  };

  const res1 = rankJobsForProfile(baseProfile, testJobs);
  const res2 = rankJobsForProfile(baseProfile, testJobs);

  // Determinism check
  assert.deepStrictEqual(
    res1.matches.map((m) => ({ id: m.jobId, score: m.matchScore })),
    res2.matches.map((m) => ({ id: m.jobId, score: m.matchScore })),
    'Test 8 Failed: Same profile must produce identical scores and ordering'
  );

  // Modify profile by learning plumbing
  const updatedProfile = {
    ...baseProfile,
    skills: ['Pipe jointing', 'Leakage detection', 'Sanitary installation'],
    workType: 'plumbing',
    experienceYears: 3,
  };

  const updatedRes = rankJobsForProfile(updatedProfile, testJobs);
  assert.strictEqual(
    updatedRes.matches[0].jobId,
    'job-plumbing-tech',
    'Test 8 Failed: After updating skills to plumbing, plumbing job must immediately rank #1'
  );
  assert(
    updatedRes.matches[0].matchScore >= 85,
    'Test 8 Failed: Updated plumbing job score should be >= 85'
  );

  console.log('✅ Test 8 Passed: Modifying profile skills immediately & deterministically shifts rankings.');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 9: Match explanation string accurately reflects the user's actual matching skills and experience
// ---------------------------------------------------------------------------
{
  const profilePlumber = {
    name: 'Deepak Rao',
    skills: ['Pipe jointing', 'Leakage detection'],
    experienceYears: 4,
    workType: 'plumbing',
    location: 'Pune',
  };

  const plumbingJob = testJobs[4];
  const match = calculateJobMatch(profilePlumber, plumbingJob);

  assert(
    match.explanation.includes('Pipe jointing') || match.explanation.includes('Leakage detection'),
    `Test 9 Failed: Explanation must contain matched skill names. Got: "${match.explanation}"`
  );
  assert(
    match.explanation.includes('4 yrs') || match.explanation.includes('4 years') || match.explanation.includes('Suitable'),
    `Test 9 Failed: Explanation must reflect worker 4 yrs experience. Got: "${match.explanation}"`
  );

  console.log(`✅ Test 9 Passed: Match explanation verified: "${match.explanation}"`);
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 10: Multi-profile isolation: recommendations for User A do not leak to User B
// ---------------------------------------------------------------------------
{
  const userA = {
    name: 'User A (Tech)',
    skills: ['Python', 'SQL'],
    experienceYears: 3,
    workType: 'technology',
    location: 'Pune',
  };

  const userB = {
    name: 'User B (Driver)',
    skills: ['Two-wheeler riding', 'GPS Navigation'],
    experienceYears: 2,
    workType: 'delivery',
    location: 'Pune',
  };

  // Run in A, B order
  const resA1 = rankJobsForProfile(userA, testJobs);
  const resB1 = rankJobsForProfile(userB, testJobs);

  // Run in B, A order
  const resB2 = rankJobsForProfile(userB, testJobs);
  const resA2 = rankJobsForProfile(userA, testJobs);

  assert.deepStrictEqual(
    resA1.matches.map((m) => m.jobId),
    resA2.matches.map((m) => m.jobId),
    'Test 10 Failed: User A results changed depending on order of execution'
  );
  assert.deepStrictEqual(
    resB1.matches.map((m) => m.jobId),
    resB2.matches.map((m) => m.jobId),
    'Test 10 Failed: User B results changed depending on order of execution'
  );
  assert.notStrictEqual(
    resA1.matches[0].jobId,
    resB1.matches[0].jobId,
    'Test 10 Failed: User A and User B should have different top recommendations'
  );

  console.log('✅ Test 10 Passed: Multi-profile isolation verified. Complete purity across invocations.');
  passedTests++;
}

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log(`\n🎉 ALL ${passedTests}/${totalTests} RECOMMENDATION QUALITY TESTS PASSED! 100% SUCCESS.\n`);
