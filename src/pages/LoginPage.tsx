import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import SetuLogo from '../components/SetuLogo';
import LanguageSelector from '../components/LanguageSelector';
import { AppIcon } from '../lib/icons';
import { useProfile } from '../hooks/ProfileContext';
import { playPop, playTap } from '../lib/feedback';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const {
    isAuthenticated,
    onboardingComplete,
    isSupabaseConfigured,
    loginWithPhone,
    verifyPhoneOtp,
    loginWithEmail,
    sendMagicLink,
  } = useProfile();

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      if (onboardingComplete) {
        navigate('/home', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [isAuthenticated, onboardingComplete, navigate]);

  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');

  // Phone states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & error states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const clean = phoneNumber.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage(t('auth.invalidPhone', 'Please enter a valid 10-digit mobile number.'));
      return;
    }

    setLoading(true);
    playTap();
    try {
      const res = await loginWithPhone(clean);
      if (res.error) {
        setErrorMessage(res.error.message || 'Failed to send OTP. Please check your credentials.');
      } else {
        setOtpSent(true);
        setResendTimer(30);
        setSuccessMessage(res.message || `OTP sent to +91 ${clean.slice(-10)}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (otpCode.trim().length < 6) {
      setErrorMessage(t('auth.invalidOtp', 'Please enter the complete 6-digit OTP received via SMS.'));
      return;
    }

    setLoading(true);
    playTap();
    try {
      const clean = phoneNumber.replace(/\D/g, '');
      const res = await verifyPhoneOtp(clean, otpCode.trim());
      if (res.error) {
        setErrorMessage(res.error.message || 'Incorrect OTP. Please check the code and try again.');
      } else {
        playPop();
        // Navigation will be handled by useEffect upon isAuthenticated update
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMessage(t('auth.invalidPassword', 'Password must be at least 6 characters.'));
      return;
    }

    setLoading(true);
    playTap();
    try {
      const res = await loginWithEmail(email.trim(), password);
      if (res.error) {
        if (res.error.message?.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage(
            t(
              'auth.credentialsMismatch',
              'No account matches this email and password. If you are new, please Sign Up.'
            )
          );
        } else {
          setErrorMessage(res.error.message || 'Login failed. Please check your email and password.');
        }
      } else {
        playPop();
        // Navigation handled by auth effect
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t('auth.invalidEmail', 'Please enter a valid email address first.'));
      return;
    }

    setLoading(true);
    playTap();
    try {
      const res = await sendMagicLink(email.trim());
      if (res.error) {
        setErrorMessage(res.error.message || 'Failed to send magic link.');
      } else {
        setSuccessMessage(res.message || `Magic sign-in link dispatched to ${email.trim()}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send magic link.');
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
                'Enter your verified phone number or email to access your worker dashboard'
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
                      'To enable live SMS OTP and email authentication, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
                    )}
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-amber-700">
                    ℹ️ In accordance with data security standards, mock/fake logins are strictly disallowed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Auth Method Tabs */}
          <div className="flex rounded-2xl bg-[#EFE6D8]/70 p-1 mb-5 border border-[#E2D5C2]">
            <button
              type="button"
              onClick={() => {
                playTap();
                setAuthMethod('phone');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                authMethod === 'phone'
                  ? 'bg-white text-deepEmerald shadow-dockActive'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              <AppIcon name="phone" size={14} />
              <span>{t('auth.phoneOption', 'Phone OTP')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTap();
                setAuthMethod('email');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                authMethod === 'email'
                  ? 'bg-white text-deepEmerald shadow-dockActive'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              <AppIcon name="mail" size={14} />
              <span>{t('auth.emailOption', 'Email & Password')}</span>
            </button>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-left flex items-start gap-2.5"
              >
                <AppIcon name="shield-alert" size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs text-red-800 leading-snug">
                  {errorMessage}
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
            {authMethod === 'phone' ? (
              /* PHONE OTP FORM */
              !otpSent ? (
                <form onSubmit={handlePhoneSendOtp} className="space-y-4">
                  <div className="text-left">
                    <label className="block text-xs font-bold text-deepEmerald mb-1.5">
                      {t('auth.phoneNumber', 'Mobile Phone Number')}
                    </label>
                    <div className="relative flex items-center rounded-2xl border border-[#D8CCB5] bg-white shadow-inner focus-within:border-deepEmerald focus-within:ring-2 focus-within:ring-deepEmerald/20 transition-all">
                      <div className="flex items-center gap-1 pl-3.5 pr-2 py-3 border-r border-[#E9DFCE] text-xs font-bold text-warmCocoa select-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(val);
                        }}
                        placeholder={t('auth.phonePlaceholder', '10-digit mobile number')}
                        className="w-full bg-transparent px-3 py-3 text-sm font-semibold text-deepEmerald placeholder:text-textMuted/60 focus:outline-none"
                        required
                        autoFocus
                      />
                    </div>
                    <span className="block mt-1.5 text-[11px] text-textMuted">
                      {t('auth.otpWillBeSent', 'We will send a 6-digit one-time password via SMS')}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phoneNumber.length < 10}
                    className="emerald-gradient-btn w-full h-12 rounded-full text-sm font-extrabold text-white shadow-dockActive active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>{t('auth.sendingOtp', 'Sending OTP...')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('auth.sendOtp', 'Send Verification OTP')}</span>
                        <AppIcon name="arrow-forward" size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* VERIFY OTP STEP */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-left">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-deepEmerald">
                        {t('auth.enterOtp', 'Enter 6-digit OTP')}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          setErrorMessage(null);
                        }}
                        className="text-[11px] font-bold text-[#B34A26] hover:underline"
                      >
                        {t('common.edit', 'Change Number')} (+91 {phoneNumber})
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtpCode(val);
                        }}
                        placeholder="••••••"
                        className="w-full text-center tracking-[0.5em] text-xl font-extrabold py-3 rounded-2xl border border-[#D8CCB5] bg-white shadow-inner focus:border-deepEmerald focus:ring-2 focus:ring-deepEmerald/20 transition-all text-deepEmerald placeholder:text-textMuted/40"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-textMuted">
                      {resendTimer > 0
                        ? t('auth.resendIn', `Resend in ${resendTimer}s`, { seconds: resendTimer })
                        : "Didn't receive the SMS?"}
                    </span>
                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={handlePhoneSendOtp}
                      className="font-extrabold text-[#B34A26] hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      {t('auth.resendOtp', 'Resend OTP')}
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
                </form>
              )
            ) : (
              /* EMAIL & PASSWORD FORM */
              <form onSubmit={handleEmailLogin} className="space-y-4">
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
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.emailPlaceholder', 'name@example.com')}
                      className="w-full bg-transparent px-3 py-3 text-sm font-semibold text-deepEmerald placeholder:text-textMuted/60 focus:outline-none"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-bold text-deepEmerald mb-1.5">
                    {t('auth.password', 'Password')}
                  </label>
                  <div className="relative flex items-center rounded-2xl border border-[#D8CCB5] bg-white shadow-inner focus-within:border-deepEmerald focus-within:ring-2 focus-within:ring-deepEmerald/20 transition-all">
                    <span className="pl-3.5 text-textMuted">
                      <AppIcon name="shield" size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholder', 'Minimum 6 characters')}
                      className="w-full bg-transparent px-3 py-3 text-sm font-semibold text-deepEmerald placeholder:text-textMuted/60 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pr-3 text-textMuted hover:text-deepEmerald"
                      aria-label="Toggle password visibility"
                    >
                      <AppIcon name={showPassword ? 'eye-off' : 'eye'} size={16} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="emerald-gradient-btn w-full h-12 rounded-full text-sm font-extrabold text-white shadow-dockActive active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t('common.verifying', 'Signing In...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('auth.logIn', 'Log In')}</span>
                      <AppIcon name="arrow-forward" size={16} />
                    </>
                  )}
                </button>

                <div className="pt-1">
                  <button
                    type="button"
                    disabled={loading || !email}
                    onClick={handleMagicLink}
                    className="w-full py-2 text-xs font-bold text-textSecondary hover:text-[#B34A26] transition-colors"
                  >
                    ✉️ {t('auth.magicLink', 'Send Magic Sign-in Link')}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Route to Sign Up */}
          <div className="mt-6 text-center">
            <span className="text-xs text-textSecondary">
              {t("auth.dontHaveAccount", "New to Setu?")}{' '}
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
