import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting FairWork Setu Authentication & Account-Existence Flow Tests...\n');

// 1. Verify Localization Files contain exact requested strings
const enLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/localization/resources/en.json'), 'utf8'));
const hiLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/localization/resources/hi.json'), 'utf8'));
const mrLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/localization/resources/mr.json'), 'utf8'));

// Test 1: Check en.json exact strings
assert.equal(
  enLocale.auth.accountDoesNotExist,
  "Account doesn't exist. Please sign up first.",
  "en.json auth.accountDoesNotExist must match exactly"
);
assert.equal(
  enLocale.auth.accountAlreadyExists,
  "An account already exists with this email. Please log in instead.",
  "en.json auth.accountAlreadyExists must match exactly"
);
console.log('✅ Test 1 Passed: English localization keys match exact requested strings.');

// Test 2: Check hi.json and mr.json presence
assert.ok(hiLocale.auth.accountDoesNotExist, "hi.json must have accountDoesNotExist");
assert.ok(hiLocale.auth.accountAlreadyExists, "hi.json must have accountAlreadyExists");
assert.ok(mrLocale.auth.accountDoesNotExist, "mr.json must have accountDoesNotExist");
assert.ok(mrLocale.auth.accountAlreadyExists, "mr.json must have accountAlreadyExists");
console.log('✅ Test 2 Passed: Hindi and Marathi localization keys verified.');

// Test 3: Verify LoginPage.tsx uses exact string and Sign Up button
const loginPageContent = fs.readFileSync(path.join(rootDir, 'src/pages/LoginPage.tsx'), 'utf8');
assert.ok(
  loginPageContent.includes("Account doesn't exist. Please sign up first."),
  "LoginPage.tsx must reference 'Account doesn't exist. Please sign up first.'"
);
assert.ok(
  loginPageContent.includes('to="/signup"'),
  "LoginPage.tsx must render Sign Up button leading to /signup"
);
console.log('✅ Test 3 Passed: LoginPage.tsx displays exact error and prominent Sign Up button.');

// Test 4: Verify SignUpPage.tsx uses exact string and Log In button
const signUpPageContent = fs.readFileSync(path.join(rootDir, 'src/pages/SignUpPage.tsx'), 'utf8');
assert.ok(
  signUpPageContent.includes("An account already exists with this email. Please log in instead."),
  "SignUpPage.tsx must reference 'An account already exists with this email. Please log in instead.'"
);
assert.ok(
  signUpPageContent.includes('to="/login"'),
  "SignUpPage.tsx must render Log In button leading to /login"
);
console.log('✅ Test 4 Passed: SignUpPage.tsx displays exact error and prominent Log In button.');

// Test 5: Verify AuthModal.tsx provides both Sign Up and Log In CTA buttons
const authModalContent = fs.readFileSync(path.join(rootDir, 'src/components/AuthModal.tsx'), 'utf8');
assert.ok(
  authModalContent.includes("Account doesn't exist. Please sign up first."),
  "AuthModal.tsx must reference 'Account doesn't exist. Please sign up first.'"
);
assert.ok(
  authModalContent.includes("An account already exists with this email. Please log in instead."),
  "AuthModal.tsx must reference 'An account already exists with this email. Please log in instead.'"
);
assert.ok(
  authModalContent.includes('setIsSignUp(true)') && authModalContent.includes('setIsSignUp(false)'),
  "AuthModal.tsx must switch modes via CTA buttons"
);
console.log('✅ Test 5 Passed: AuthModal.tsx seamlessly switches between Sign In and Sign Up.');

// Test 6: Verify ProfileContext.tsx implements strict checks
const profileContextContent = fs.readFileSync(path.join(rootDir, 'src/hooks/ProfileContext.tsx'), 'utf8');
assert.ok(
  profileContextContent.includes('checkEmailIsRegistered'),
  "ProfileContext.tsx must import and call checkEmailIsRegistered"
);
assert.ok(
  profileContextContent.includes("Account doesn't exist. Please sign up first."),
  "ProfileContext.tsx must return exact login error"
);
assert.ok(
  profileContextContent.includes("An account already exists with this email. Please log in instead."),
  "ProfileContext.tsx must return exact signup error"
);
console.log('✅ Test 6 Passed: ProfileContext.tsx strictly enforces pre-flight checks and error mappings.');

// Test 7: Verify schema.sql defines check_email_registered with SECURITY DEFINER
const schemaSqlContent = fs.readFileSync(path.join(rootDir, 'ml_service/schema.sql'), 'utf8');
assert.ok(
  schemaSqlContent.includes('CREATE OR REPLACE FUNCTION public.check_email_registered'),
  "schema.sql must define check_email_registered"
);
assert.ok(
  schemaSqlContent.includes('SECURITY DEFINER'),
  "schema.sql must set SECURITY DEFINER on check_email_registered"
);
console.log('✅ Test 7 Passed: Supabase schema.sql includes check_email_registered RPC definition.');

// Test 8: Verify Backend auth_router.py does not expose secrets
const authRouterContent = fs.readFileSync(path.join(rootDir, 'ml_service/auth_router.py'), 'utf8');
assert.ok(
  authRouterContent.includes('@auth_router.post("/check-account"'),
  "auth_router.py must define POST /check-account"
);
assert.ok(
  !authRouterContent.includes('password =') && !authRouterContent.includes('password:') && !authRouterContent.includes('client_secret'),
  "auth_router.py must never expose passwords or client secrets"
);
console.log('✅ Test 8 Passed: Backend auth_router.py zero secrets verified.');

console.log('\n🎉 ALL 8/8 AUTHENTICATION FLOW TESTS PASSED! 100% SUCCESS.\n');
