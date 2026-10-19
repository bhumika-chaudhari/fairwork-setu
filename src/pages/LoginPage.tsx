import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import SetuLogo from '../components/SetuLogo';
import LanguageSelector from '../components/LanguageSelector';
import { AppIcon } from '../lib/icons';
import { useProfile } from '../hooks/ProfileContext';
import { playPop, playTap } from '../lib/feedback';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    isAuthenticated,
    onboardingComplete,
    isSupabaseConfigured,
    sendEmailLoginOtp,
    verifyEmailOtp,
  } = useProfile();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (onboardingComplete) {
        navigate('/home', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [isAuthenticated, onboardingComplete, navigate]);

  // Email OTP states
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Status & error states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUserNotFound, setIsUserNotFound] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUserNotFound(false);

    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setErrorMessage(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    setLoading(true);
    playTap();
    try {
      const res = await sendEmailLoginOtp(clean);
      if (res.error) {
        const msg = res.error.message || 'Failed to send verification code.';
        if (
          msg.toLowerCase().includes("account doesn't exist") ||
          msg.toLowerCase().includes('not found') ||
          msg.toLowerCase().includes('signups not allowed') ||
          msg.toLowerCase().includes('sign up first') ||
          msg.toLowerCase().includes('create an account')
        ) {
          setIsUserNotFound(true);
          setErrorMessage(
            t(
              'auth.accountDoesNotExist',
              "Account doesn't exist. Please sign up first."
            )
          );
        } else {
          setErrorMessage(msg);
        }
      } else {
        setOtpSent(true);
        setResendTimer(30);
        setSuccessMessage(res.message || `6-digit verification code sent to ${clean}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = otpCode.trim();
    if (cleanCode.length < 6) {
      setErrorMessage(t('auth.invalidOtp', 'Please enter the complete 6-digit OTP code.'));
      return;
    }

    setLoading(true);
    playTap();
    try {
      const clean = email.trim().toLowerCase();
      const res = await verifyEmailOtp(clean, cleanCode);
      if (res.error) {
        setErrorMessage(
          t(
            'auth.invalidOrExpiredOtp',
            'Verification code is incorrect or has expired. Please check or request a new code.'
          )
        );
      } else {
        playPop();
        // Navigation will be handled automatically by useEffect on isAuthenticated
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#FDF8F0] via-[#F8EFE2] to-[#FAF5EC] overflow-x-hidden flex flex-col justify-between selection:bg-amber-200">
      {/* Living Atmospheric Glow Orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[340px] md:h-[480px] w-[340px] md:w-[480px] rounded-full bg-[#E5953E]/30 blur-[80px] md:blur-[120px] transform-gpu" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-[340px] md:h-[480px] w-[340px] md:w-[480px] rounded-full bg-[#E5953E]/25 blur-[80px] md:blur-[130px] transform-gpu" />
      <div className="pointer-events-none absolute bottom-10 left-1/4 h-[300px] md:h-[380px] w-[300px] md:w-[380px] rounded-full bg-[#B34A26]/15 blur-[90px] md:blur-[140px] transform-gpu" />

      {/* Main container */}
      <div className="relative z-10 mx-auto flex w-full max-w-md md:max-w-lg flex-1 flex-col px-5 py-4 md:py-8 justify-between">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-4 border-b border-[#E9DFCE]/80">
          <button
            type="button"
            onClick={() => {
              playTap();
              navigate('/');
            }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-xl shadow-xs border border-[#E9DFCE] text-deepEmerald hover:bg-white hover:text-[#B34A26] transition-all active:scale-95"
            aria-label="Back to landing"
          >
            <AppIcon name="arrow-back" size={18} />
          </button>
          <SetuLogo size="sm" />
          <LanguageSelector variant="icon" />
        </header>

        {/* Content Box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="my-auto py-6"
        >
          {/* Headline */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-deepEmerald tracking-tight">
              {t('auth.welcomeBack', 'Welcome Back to Setu')}
            </h1>
            <p className="mt-1.5 text-xs md:text-sm text-textSecondary max-w-xs mx-auto leading-relaxed">
              {t(
                'auth.loginSubtitle',
                'Enter your registered email address to access your worker dashboard'
              )}
            </p>
          </div>

          {/* Missing Supabase Configuration Callout */}
          {!isSupabaseConfigured && (
            <div className="mb-5 rounded-2xl bg-amber-50/90 border border-amber-300/80 p-4 shadow-sm text-left">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <AppIcon name="shield-alert" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                    {t('auth.missingConfig', 'Authentication Service Unconfigured')}
                  </h4>
                  <p className="mt-1 text-xs text-amber-800/90 leading-relaxed">
                    {t(
                      'auth.missingConfigDesc',
                      'To enable live email authentication, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3.5 text-left flex items-start gap-2.5"
              >
                <AppIcon name="shield-alert" size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs text-red-800 leading-snug">
                  <div>{errorMessage}</div>
                  {isUserNotFound && (
                    <div className="mt-3">
                      <Link
                        to="/signup"
                        onClick={() => playTap()}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#B34A26] text-white text-xs font-bold shadow-sm hover:bg-[#8C3415] transition-all active:scale-95"
                      >
                        <span>{t('auth.signUp', 'Sign Up')}</span>
                        <span>→</span>
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Banner */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-left flex items-start gap-2.5"
              >
                <AppIcon name="checkmark-circle" size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs text-emerald-800 leading-snug">
                  {successMessage}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card Form */}
          <div className="rounded-[24px] bg-white/90 backdrop-blur-xl p-5 md:p-6 shadow-xl shadow-warmAmber/5 border border-white/80 ring-1 ring-[#D8CCB5]/60">
            {!otpSent ? (
              /* EMAIL INPUT STEP */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="text-left">
                  <label className="block text-xs font-bold text-deepEmerald mb-1.5">
                    {t('auth.emailAddress', 'Email Address')}
                  </label>
                  <div className="relative flex items-center rounded-2xl border border-[#D8CCB5] bg-white shadow-inner focus-within:border-deepEmerald focus-within:ring-2 focus-within:ring-deepEmerald/20 transition-all">
                    <span className="pl-3.5 text-textMuted">
                      <AppIcon name="mail" size={16} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                        setIsUserNotFound(false);
                      }}
                      placeholder={t('auth.emailPlaceholder', 'name@example.com')}
                      className="w-full bg-transparent px-3 py-3 text-sm font-semibold text-deepEmerald placeholder:text-textMuted/60 focus:outline-none"
                      required
                      autoFocus
                    />
                    {email && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('');
                          setErrorMessage(null);
                          setIsUserNotFound(false);
                        }}
                        className="mr-3 text-textMuted hover:text-red-600 text-xs font-bold"
                        title="Clear"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span className="block mt-1.5 text-[11px] text-textMuted">
                    {t('auth.emailOtpHint', 'We will send a 6-digit verification code to your email')}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !email.includes('@')}
                  className="emerald-gradient-btn w-full h-12 rounded-full text-sm font-extrabold text-white shadow-dockActive active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t('auth.sendingOtp', 'Sending OTP...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('auth.sendVerificationCode', 'Send Verification Code')}</span>
                      <AppIcon name="arrow-forward" size={16} />
                    </>
                  )}
                </button>

                {/* Quick-fill authorized demo account */}
                <div className="mt-4 pt-3 border-t border-[#EFE6D8] text-left">
                  <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider block mb-1.5">
                    {t('auth.demoAccounts', 'Authorized Demo Profile')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playTap();
                      setEmail('sadia.sakharkar@cumminscollege.in');
                      setErrorMessage(null);
                      setIsUserNotFound(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF5EC] border border-[#D8CCB5] text-xs font-semibold text-deepEmerald hover:bg-white hover:border-deepEmerald transition-all"
                  >
                    <span>👤</span>
                    <span>Sadia Sakharkar</span>
                    <span className="text-[10px] text-textMuted font-mono hidden sm:inline">
                      (sadia.sakharkar@cumminscollege.in)
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              /* VERIFY EMAIL OTP STEP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-deepEmerald">
                      {t('auth.emailVerificationCode', '6-Digit Verification Code')}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        playTap();
                        setOtpSent(false);
                        setOtpCode('');
                        setErrorMessage(null);
                      }}
                      className="text-[11px] font-bold text-[#B34A26] hover:underline"
                    >
                      {t('auth.changeEmail', 'Change Email')}
                    </button>
                  </div>

                  <p className="text-[11px] text-textMuted mb-2">
                    {t('auth.emailOtpSentTo', 'Verification code sent to')}{' '}
                    <strong className="text-deepEmerald">{email}</strong>
                  </p>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(val);
                      setErrorMessage(null);
                    }}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.5em] text-xl font-extrabold py-3 rounded-2xl border border-[#D8CCB5] bg-white shadow-inner focus:border-deepEmerald focus:ring-2 focus:ring-deepEmerald/20 transition-all text-deepEmerald placeholder:text-textMuted/40"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-textMuted">
                    {resendTimer > 0
                      ? t('auth.resendIn', `Resend in ${resendTimer}s`, { seconds: resendTimer })
                      : "Didn't receive the email?"}
                  </span>
                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={() => handleSendOtp()}
                    className="font-extrabold text-[#B34A26] hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    {t('auth.resendOtp', 'Resend Code')}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="emerald-gradient-btn w-full h-12 rounded-full text-sm font-extrabold text-white shadow-dockActive active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t('auth.verifying', 'Verifying...')}</span>
                    </>
                  ) : (
                    <>
                      <AppIcon name="shield-check" size={16} />
                      <span>{t('auth.verifyAndLogin', 'Verify & Log In')}</span>
                    </>
                  )}
                </button>

                <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2 text-left">
                  <span className="text-amber-700 shrink-0 mt-0.5">💡</span>
                  <span>
                    {t(
                      'auth.checkSpamFolder',
                      "Can't find the email? Please check your Spam or Junk folder. Codes expire in 1 hour."
                    )}
                  </span>
                </div>
              </form>
            )}
          </div>

          {/* Route to Sign Up */}
          <div className="mt-6 text-center">
            <span className="text-xs text-textSecondary">
              {t('auth.dontHaveAccount', 'New to Setu?')}{' '}
            </span>
            <Link
              to="/signup"
              onClick={() => playTap()}
              className="text-xs font-extrabold text-[#B34A26] hover:underline"
            >
              {t('auth.signUp', 'Sign Up')} →
            </Link>
          </div>
        </motion.div>

        {/* Bottom Language Selector */}
        <footer className="pt-2 pb-1 text-center">
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
            <span className="text-xs text-textMuted mr-1">🌐</span>
            <LanguageSelector variant="grid" />
          </div>
        </footer>
      </div>
    </div>
  );
}
