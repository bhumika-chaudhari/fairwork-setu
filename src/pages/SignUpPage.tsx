import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import SetuLogo from '../components/SetuLogo';
import LanguageSelector from '../components/LanguageSelector';
import SkillChip from '../components/SkillChip';
import { AppIcon } from '../lib/icons';
import {
  CITY_KEYS,
  SUGGESTED_SKILL_KEYS,
  workerTypeOptions,
  genderOptions,
  type WorkerType,
} from '../data/mockData';
import { useProfile, type Gender } from '../hooks/ProfileContext';
import {
  formatInr,
  changeAppLanguage,
  SUPPORTED_LANGUAGE_CODES,
  LANGUAGE_NATIVE_NAMES,
  type LanguageCode,
} from '../localization';
import { playPop, playTap } from '../lib/feedback';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    user,
    profile,
    isAuthenticated,
    onboardingComplete,
    isSupabaseConfigured,
    loginWithPhone,
    verifyPhoneOtp,
    sendEmailOtp,
    verifyEmailOtp,
    signupWithEmail,
    completeOnboarding,
  } = useProfile();

  // If already authenticated and onboarding complete, send to dashboard
  useEffect(() => {
    if (isAuthenticated && onboardingComplete) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, onboardingComplete, navigate]);

  const [step, setStep] = useState<1 | 2 | 3>(user ? 2 : 1);

  // Step 1: Contact verification
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const [emailAuthMode, setEmailAuthMode] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Personal Details
  const [fullName, setFullName] = useState(profile.name || '');
  const [gender, setGender] = useState<Gender | null>(profile.gender || null);
  const [avatarUrl, setAvatarUrl] = useState<string>(profile.avatarUrl || '');
  const [preferredLang, setPreferredLang] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'en'
  );
  const [isListeningName, setIsListeningName] = useState(false);

  // Step 3: Work, Location, Skills, Goals
  const [workType, setWorkType] = useState<WorkerType | null>(profile.workType || null);
  const [cityInput, setCityInput] = useState(
    profile.cityKey ? profile.cityKey.replace(/^cities\./i, '') : ''
  );
  const [experienceYears, setExperienceYears] = useState(profile.experienceYears || 2);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    profile.skillKeys && profile.skillKeys.length > 0 ? profile.skillKeys : []
  );
  const [savingsGoal, setSavingsGoal] = useState<number>(profile.savingsGoal || 5000);

  // Async UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Resend countdown timer for phone
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Resend countdown timer for email
  useEffect(() => {
    if (emailResendTimer <= 0) return;
    const interval = setInterval(() => {
      setEmailResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [emailResendTimer]);

  // Reactive prefill from profile
  useEffect(() => {
    if (profile.name && !fullName) setFullName(profile.name);
    if (profile.gender && !gender) setGender(profile.gender);
    if (profile.avatarUrl && !avatarUrl) setAvatarUrl(profile.avatarUrl);
    if (profile.workType && !workType) setWorkType(profile.workType);
    if (profile.cityKey && !cityInput) {
      setCityInput(profile.cityKey.replace(/^cities\./i, ''));
    }
    if (profile.skillKeys && profile.skillKeys.length > 0 && selectedSkills.length === 0) {
      setSelectedSkills(profile.skillKeys);
    }
    if (profile.savingsGoal && profile.savingsGoal !== 5000) setSavingsGoal(profile.savingsGoal);
    if (profile.experienceYears) setExperienceYears(profile.experienceYears);
  }, [profile]);

  // Handle immediate language switch in Step 2 or via selectors
  const handleLanguageSelect = async (code: LanguageCode) => {
    setPreferredLang(code);
    await changeAppLanguage(code);
  };

  // Step 1: Phone Send OTP
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
        setErrorMessage(res.error.message || 'Failed to send verification SMS.');
      } else {
        setOtpSent(true);
        setResendTimer(30);
        setSuccessMessage(res.message || `Verification code sent to +91 ${clean.slice(-10)}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Phone Verify OTP
  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (otpCode.trim().length < 6) {
      setErrorMessage(t('auth.invalidOtp', 'Please enter the complete 6-digit OTP code.'));
      return;
    }

    setLoading(true);
    playTap();
    try {
      const clean = phoneNumber.replace(/\D/g, '');
      const res = await verifyPhoneOtp(clean, otpCode.trim());
      if (res.error) {
        setErrorMessage(res.error.message || 'Incorrect OTP code. Please retry.');
      } else {
        playPop();
        setStep(2);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Email Send OTP
  const handleEmailSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const clean = email.trim();
    if (!clean || !clean.includes('@')) {
      setErrorMessage(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    setLoading(true);
    playTap();
    try {
      const res = await sendEmailOtp(clean);
      if (res.error) {
        setErrorMessage(res.error.message || 'Failed to send verification code.');
      } else {
        setEmailOtpSent(true);
        setEmailResendTimer(30);
        setSuccessMessage(res.message || `6-digit verification code sent to ${clean}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send email OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Email Verify OTP
  const handleEmailVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (emailOtpCode.trim().length < 6) {
      setErrorMessage(t('auth.invalidOtp', 'Please enter the complete 6-digit OTP code.'));
      return;
    }

    setLoading(true);
    playTap();
    try {
      const clean = email.trim();
      const res = await verifyEmailOtp(clean, emailOtpCode.trim());
      if (res.error) {
        setErrorMessage(res.error.message || 'Incorrect verification code. Please retry.');
      } else {
        playPop();
        setStep(2);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Email Sign Up (Password)
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMessage(t('auth.invalidPassword', 'Password must be at least 6 characters long.'));
      return;
    }

    setLoading(true);
    playTap();
    try {
      const res = await signupWithEmail(email.trim(), password);
      if (res.error) {
        setErrorMessage(res.error.message || 'Sign up failed. Please check your credentials.');
      } else {
        playPop();
        setStep(2);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Speech-to-text name input
  const handleVoiceNameInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your name.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang =
        preferredLang === 'mr' ? 'mr-IN' : preferredLang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningName(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setFullName(transcript.trim());
        }
        setIsListeningName(false);
      };
      recognition.onerror = () => setIsListeningName(false);
      recognition.onend = () => setIsListeningName(false);
      recognition.start();
    } catch {
      setIsListeningName(false);
    }
  };

  // Step 2: Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Photo size should be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setAvatarUrl(dataUrl);
          setErrorMessage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStep2Continue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage(t('auth.enterFullName', 'Please enter your full name (at least 2 letters).'));
      return;
    }
    setErrorMessage(null);
    playTap();
    setStep(3);
  };

  // Step 3: Toggle skill chips
  const toggleSkill = (skillKey: string) => {
    playTap();
    setSelectedSkills((prev) =>
      prev.includes(skillKey) ? prev.filter((s) => s !== skillKey) : [...prev, skillKey]
    );
  };

  // Step 3: Final Submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage(t('auth.enterFullName', 'Please enter your full name.'));
      setStep(2);
      return;
    }
    if (!workType) {
      setErrorMessage(t('onboarding.selectWorkerTypeAlert', 'Please select your profession / work type.'));
      return;
    }

    setLoading(true);
    playPop();

    try {
      const contactStr = phoneNumber.trim()
        ? `+91 ${phoneNumber.replace(/\D/g, '').slice(-10)}`
        : email.trim();

      await completeOnboarding({
        name: fullName.trim(),
        avatarUrl,
        gender,
        workType,
        cityKey: cityInput.trim() ? `cities.${cityInput.toLowerCase().trim()}` : 'cities.pune',
        experienceYears,
        skillKeys: selectedSkills,
        savingsGoal,
        weeklySaveGoal: Math.round(savingsGoal / 12),
        preferredLanguage: preferredLang,
        emergencyContact: contactStr,
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete registration.');
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
      <div className="relative z-10 mx-auto flex w-full max-w-md md:max-w-xl flex-1 flex-col px-5 py-4 md:py-8 justify-between">
        {/* Top Header */}
        <header className="pb-3 border-b border-[#E9DFCE]/80 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                playTap();
                if (step > 1) {
                  setStep((step - 1) as 1 | 2);
                } else {
                  navigate('/');
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-xl shadow-xs border border-[#E9DFCE] text-deepEmerald hover:bg-white hover:text-[#B34A26] transition-all active:scale-95"
              aria-label="Back"
            >
              <AppIcon name="arrow-back" size={18} />
            </button>
            <SetuLogo size="sm" />
            <LanguageSelector variant="icon" />
          </div>

          {/* Wizard Step Indicator & Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-warmCocoa">
              <span>
                {step === 1 && t('auth.step1Title', '1. Contact Verification')}
                {step === 2 && t('auth.step2Title', '2. Personal Details')}
                {step === 3 && t('auth.step3Title', '3. Work & Preferences')}
              </span>
              <span className="text-textMuted font-semibold">
                {t('auth.step', `Step ${step} of 3`, { current: step, total: 3 })}
              </span>
            </div>
            <div className="w-full h-2 bg-[#EFE3CF] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#B34A26] via-[#E5953E] to-[#F1B96B] rounded-full"
                initial={false}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </header>

        {/* Wizard Step Body */}
        <div className="my-auto py-5">
          {/* Missing Supabase Notice */}
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
                    ℹ️ Verification bypasses and simulated logins are strictly disabled.
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

          {/* ========================================================================= */}
          {/* STEP 1: CONTACT VERIFICATION */}
          {/* ========================================================================= */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-extrabold text-deepEmerald tracking-tight">
                  {t('auth.createAccount', 'Create Your Setu Account')}
                </h2>
                <p className="mt-1 text-xs md:text-sm text-textSecondary max-w-sm mx-auto">
                  {t(
                    'auth.signupSubtitle',
                    'Join FairWork Setu to access nearby work, cash flow insights, and skill passports'
                  )}
                </p>
              </div>

              {/* Method Tabs */}
              <div className="flex rounded-2xl bg-[#EFE6D8]/70 p-1 mb-4 border border-[#E2D5C2]">
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setAuthMethod('phone');
                    setErrorMessage(null);
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

              <div className="rounded-[24px] bg-white/90 backdrop-blur-xl p-5 md:p-6 shadow-xl shadow-warmAmber/5 border border-white/80 ring-1 ring-[#D8CCB5]/60">
                {authMethod === 'phone' ? (
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
                          {t(
                            'auth.smsVerificationNotice',
                            'We verify your mobile number with a secure SMS OTP to protect your earnings.'
                          )}
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
                    <form onSubmit={handlePhoneVerifyOtp} className="space-y-4">
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
                            }}
                            className="text-[11px] font-bold text-[#B34A26] hover:underline"
                          >
                            {t('common.edit', 'Change Number')} (+91 {phoneNumber})
                          </button>
                        </div>
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
                            <span>{t('auth.verifyAndContinue', 'Verify & Continue')}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )
                ) : (
                  <div>
                    {/* Sub-tabs for Email: OTP vs Password */}
                    <div className="flex rounded-xl bg-[#EFE6D8]/60 p-1 mb-4 border border-[#E2D5C2] text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setEmailAuthMode('otp');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className={`flex-1 py-1.5 rounded-lg transition-all ${
                          emailAuthMode === 'otp'
                            ? 'bg-white text-deepEmerald shadow-xs'
                            : 'text-textMuted hover:text-textPrimary'
                        }`}
                      >
                        ✉️ {t('auth.emailOtpMode', 'Email 6-Digit OTP')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailAuthMode('password');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className={`flex-1 py-1.5 rounded-lg transition-all ${
                          emailAuthMode === 'password'
                            ? 'bg-white text-deepEmerald shadow-xs'
                            : 'text-textMuted hover:text-textPrimary'
                        }`}
                      >
                        🔒 {t('auth.passwordMode', 'Password')}
                      </button>
                    </div>

                    {emailAuthMode === 'otp' ? (
                      !emailOtpSent ? (
                        <form onSubmit={handleEmailSendOtp} className="space-y-4">
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
                                <span>{t('auth.sendOtp', 'Send Verification OTP')}</span>
                                <AppIcon name="arrow-forward" size={16} />
                              </>
                            )}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleEmailVerifyOtp} className="space-y-4">
                          <div className="text-left">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-deepEmerald">
                                {t('auth.enterOtp', 'Enter 6-digit OTP')}
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setEmailOtpSent(false);
                                  setEmailOtpCode('');
                                  setErrorMessage(null);
                                }}
                                className="text-[11px] font-bold text-[#B34A26] hover:underline"
                              >
                                {t('common.edit', 'Change Email')} ({email})
                              </button>
                            </div>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={emailOtpCode}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setEmailOtpCode(val);
                              }}
                              placeholder="••••••"
                              className="w-full text-center tracking-[0.5em] text-xl font-extrabold py-3 rounded-2xl border border-[#D8CCB5] bg-white shadow-inner focus:border-deepEmerald focus:ring-2 focus:ring-deepEmerald/20 transition-all text-deepEmerald placeholder:text-textMuted/40"
                              required
                              autoFocus
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-textMuted">
                              {emailResendTimer > 0
                                ? t('auth.resendIn', `Resend in ${emailResendTimer}s`, { seconds: emailResendTimer })
                                : "Didn't receive the email?"}
                            </span>
                            <button
                              type="button"
                              disabled={emailResendTimer > 0 || loading}
                              onClick={handleEmailSendOtp}
                              className="font-extrabold text-[#B34A26] hover:underline disabled:opacity-40 disabled:no-underline"
                            >
                              {t('auth.resendOtp', 'Resend OTP')}
                            </button>
                          </div>

                          <button
                            type="submit"
                            disabled={loading || emailOtpCode.length < 6}
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
                                <span>{t('auth.verifyAndContinue', 'Verify & Continue')}</span>
                              </>
                            )}
                          </button>
                        </form>
                      )
                    ) : (
                      /* EMAIL + PASSWORD */
                      <form onSubmit={handleEmailSignUp} className="space-y-4">
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
                          disabled={loading || !email || password.length < 6}
                          className="emerald-gradient-btn w-full h-12 rounded-full text-sm font-extrabold text-white shadow-dockActive active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span>{t('auth.creating', 'Creating Account...')}</span>
                            </>
                          ) : (
                            <>
                              <span>{t('auth.verifyAndContinue', 'Create & Continue')}</span>
                              <AppIcon name="arrow-forward" size={16} />
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Already have an account */}
              <div className="pt-2 text-center">
                <span className="text-xs text-textSecondary">
                  {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
                </span>
                <Link
                  to="/login"
                  onClick={() => playTap()}
                  className="text-xs font-extrabold text-[#B34A26] hover:underline"
                >
                  {t('auth.logIn', 'Log In')} →
                </Link>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PERSONAL DETAILS & OPTIONAL PHOTO */}
          {/* ========================================================================= */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-extrabold text-deepEmerald tracking-tight">
                  {t('auth.tellUs', 'Tell Us About Yourself')}
                </h2>
                <p className="mt-1 text-xs md:text-sm text-textSecondary max-w-sm mx-auto">
                  {t(
                    'auth.tellUsHint',
                    'This helps us personalize job matches, safety features, and language for you.'
                  )}
                </p>
              </div>

              <div className="rounded-[24px] bg-white/90 backdrop-blur-xl p-5 md:p-6 shadow-xl shadow-warmAmber/5 border border-white/80 ring-1 ring-[#D8CCB5]/60 space-y-4">
                {/* Full Name */}
                <div className="text-left">
                  <label className="block text-xs font-bold text-deepEmerald mb-1.5">
                    {t('auth.fullName', 'Full Name')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center rounded-2xl border border-[#D8CCB5] bg-white shadow-inner focus-within:border-deepEmerald focus-within:ring-2 focus-within:ring-deepEmerald/20 transition-all">
                    <span className="pl-3.5 text-textMuted">
                      <AppIcon name="person" size={16} />
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('auth.namePlaceholder', 'e.g. Sunita Devi')}
                      className="w-full bg-transparent px-3 py-3 text-sm font-semibold text-deepEmerald placeholder:text-textMuted/60 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleVoiceNameInput}
                      className={`mr-2.5 flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                        isListeningName
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-warmAmber/20 text-[#B34A26] hover:bg-warmAmber/40'
                      }`}
                      title="Speak name"
                    >
                      <AppIcon name="mic" size={16} />
                    </button>
                  </div>
                  {isListeningName && (
                    <span className="block mt-1 text-[11px] font-bold text-red-600 animate-pulse">
                      🎙️ Listening... Speak your name clearly
                    </span>
                  )}
                </div>

                {/* Profile Photo / Selfie (Optional with Rationale & Cancel) */}
                <div className="text-left rounded-2xl bg-[#FDF8F0] p-4 border border-[#EBE0CF]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="block text-xs font-bold text-deepEmerald">
                        {t('auth.profilePhoto', 'Profile Photograph / Selfie (Optional)')}
                      </span>
                      <p className="mt-1 text-[11px] text-textSecondary leading-relaxed">
                        {t(
                          'auth.photoExplanation',
                          'Optional: Your photo helps clients identify you for work assignments. Camera or gallery access will only be requested if you choose to upload a picture.'
                        )}
                      </p>
                    </div>

                    {/* Avatar Preview */}
                    <div className="relative shrink-0">
                      {avatarUrl ? (
                        <div className="relative">
                          <img
                            src={avatarUrl}
                            alt="Profile preview"
                            className="h-16 w-16 rounded-full object-cover border-2 border-emerald-600 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              playTap();
                              setAvatarUrl('');
                            }}
                            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-[10px] shadow-xs hover:bg-red-700"
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warmAmber/25 border border-dashed border-[#D8CCB5] text-warmCocoa">
                          <AppIcon name="camera" size={24} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-deepEmerald border border-[#D8CCB5] shadow-xs hover:bg-white/90 active:scale-95 transition-all">
                      <AppIcon name="upload" size={14} />
                      <span>{avatarUrl ? 'Change Photo' : 'Upload or Take Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          playTap();
                          setAvatarUrl('');
                        }}
                        className="text-xs font-bold text-red-600 hover:underline px-2 py-1"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>

                {/* Preferred Language */}
                <div className="text-left">
                  <label className="block text-xs font-bold text-deepEmerald mb-1.5">
                    {t('onboarding.chooseLanguage', 'Preferred App Language')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_LANGUAGE_CODES.map((code) => {
                      const isSelected = preferredLang === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => handleLanguageSelect(code)}
                          className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-deepEmerald text-white shadow-dockActive'
                              : 'bg-white text-textSecondary border border-[#D8CCB5] hover:border-deepEmerald'
                          }`}
                        >
                          {LANGUAGE_NATIVE_NAMES[code]}
                        </button>
                      );
                    })}
                  </div>
                  <span className="block mt-1 text-[11px] text-textMuted">
                    {t(
                      'auth.languageNotice',
                      'You can change language anytime without losing entered details.'
                    )}
                  </span>
                </div>

                {/* Gender (Optional) */}
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-deepEmerald">
                      {t('auth.gender', 'Gender (Optional)')}
                    </label>
                    {gender && (
                      <button
                        type="button"
                        onClick={() => setGender(null)}
                        className="text-[11px] font-bold text-textMuted hover:text-red-600"
                      >
                        {t('common.clear', 'Clear')}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {genderOptions.map((opt) => {
                      const isSelected = gender === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            playTap();
                            setGender(opt.id as Gender);
                          }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            isSelected
                              ? 'border-deepEmerald bg-deepEmerald/5 text-deepEmerald font-extrabold ring-1 ring-deepEmerald'
                              : 'border-[#E9DFCE] bg-white text-textSecondary hover:border-[#D8CCB5]'
                          }`}
                        >
                          <AppIcon
                            name={opt.icon}
                            size={16}
                            className={isSelected ? 'text-deepEmerald' : 'text-textMuted'}
                          />
                          <span>{t(opt.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStep2Continue}
                  disabled={!fullName.trim()}
                  className="emerald-gradient-btn w-full h-12 rounded-full text-sm font-extrabold text-white shadow-dockActive active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  <span>{t('common.continue', 'Continue to Step 3')}</span>
                  <AppIcon name="arrow-forward" size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: WORK, SKILLS, SAVINGS GOAL */}
          {/* ========================================================================= */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-extrabold text-deepEmerald tracking-tight">
                  {t('auth.step3Title', 'Work & Livelihood Profile')}
                </h2>
                <p className="mt-1 text-xs md:text-sm text-textSecondary max-w-sm mx-auto">
                  {t(
                    'auth.step3Subtitle',
                    'Set your primary occupation, skills, and financial target to get matched with verified jobs.'
                  )}
                </p>
              </div>

              <div className="rounded-[24px] bg-white/90 backdrop-blur-xl p-5 md:p-6 shadow-xl shadow-warmAmber/5 border border-white/80 ring-1 ring-[#D8CCB5]/60 space-y-5">
                {/* Occupation / Worker Type */}
                <div className="text-left">
                  <label className="block text-xs font-bold text-deepEmerald mb-2">
                    {t('auth.workerType', 'Primary Occupation / Trade')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {workerTypeOptions.map((opt) => {
                      const isSelected = workType === opt.type;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => {
                            playTap();
                            setWorkType(opt.type);
                          }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                            isSelected
                              ? 'border-[#B34A26] bg-[#B34A26]/5 text-[#B34A26] ring-1 ring-[#B34A26]'
                              : 'border-[#E9DFCE] bg-white text-textSecondary hover:border-[#D8CCB5]'
                          }`}
                        >
                          <AppIcon
                            name={opt.icon}
                            size={16}
                            className={isSelected ? 'text-[#B34A26]' : 'text-textMuted'}
                          />
                          <span className="truncate">{t(opt.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* City */}
                <div className="text-left">
                  <label className="block text-xs font-bold text-deepEmerald mb-1.5">
                    {t('auth.city', 'City / Location')}
                  </label>
                  <div className="relative flex items-center rounded-2xl border border-[#D8CCB5] bg-white shadow-inner focus-within:border-deepEmerald focus-within:ring-2 focus-within:ring-deepEmerald/20 transition-all mb-2">
                    <span className="pl-3.5 text-textMuted">
                      <AppIcon name="location-outline" size={16} />
                    </span>
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder={t('auth.cityPlaceholder', 'Enter your city (e.g. Pune)')}
                      className="w-full bg-transparent px-3 py-2.5 text-sm font-semibold text-deepEmerald placeholder:text-textMuted/60 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Pune', 'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          playTap();
                          setCityInput(c);
                        }}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold border transition-all ${
                          cityInput.toLowerCase() === c.toLowerCase()
                            ? 'bg-[#B34A26] text-white border-[#B34A26]'
                            : 'bg-[#FDF8F0] text-textSecondary border-[#E5DAC6] hover:border-deepEmerald'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience in years */}
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-deepEmerald">
                      {t('auth.experience', 'Years of Experience')}
                    </label>
                    <span className="text-xs font-extrabold text-[#B34A26]">
                      {experienceYears} {experienceYears === 1 ? 'Year' : 'Years'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5, 8].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          playTap();
                          setExperienceYears(yr);
                        }}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          experienceYears === yr
                            ? 'bg-deepEmerald text-white border-deepEmerald shadow-xs'
                            : 'bg-white text-textSecondary border-[#E5DAC6] hover:border-deepEmerald'
                        }`}
                      >
                        {yr === 8 ? '8+ Yrs' : `${yr} Yr`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Core Skills Selection */}
                <div className="text-left">
                  <label className="block text-xs font-bold text-deepEmerald mb-1.5">
                    {t('auth.skills', 'Select Your Skills')} ({selectedSkills.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {SUGGESTED_SKILL_KEYS.map((skillKey) => {
                      const isSelected = selectedSkills.includes(skillKey);
                      return (
                        <SkillChip
                          key={skillKey}
                          label={t(skillKey)}
                          selected={isSelected}
                          onClick={() => toggleSkill(skillKey)}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Savings Goal */}
                <div className="text-left rounded-2xl bg-[#FDF8F0] p-4 border border-[#EBE0CF]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-deepEmerald">
                      {t('auth.savingsGoal', 'Monthly Savings Target (Optional)')}
                    </label>
                    <span className="text-xs font-extrabold text-[#B34A26]">
                      ₹{formatInr(savingsGoal)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={25000}
                    step={500}
                    value={savingsGoal}
                    onChange={(e) => setSavingsGoal(Number(e.target.value))}
                    className="w-full accent-deepEmerald"
                  />
                  <div className="flex justify-between text-[11px] text-textMuted mt-1">
                    <span>₹1,000</span>
                    <span>₹10,000</span>
                    <span>₹25,000</span>
                  </div>
                </div>

                {/* Final Submit Button */}
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading || submitted}
                  className="emerald-gradient-btn w-full h-14 rounded-full text-sm font-extrabold text-white shadow-dockActive active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitted ? (
                    <>
                      <AppIcon name="checkmark-circle" size={18} />
                      <span>{t('common.done', 'Account Ready! Opening Setu...')}</span>
                    </>
                  ) : loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t('auth.completing', 'Saving Profile...')}</span>
                    </>
                  ) : (
                    <>
                      <AppIcon name="shield-check" size={18} />
                      <span>{t('auth.completeRegistration', 'Complete Registration & Open Dashboard')}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>

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
