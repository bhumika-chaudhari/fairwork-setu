import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../hooks/ProfileContext';
import { AppIcon } from '../lib/icons';
import { playTap, playPop } from '../lib/feedback';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { t } = useTranslation();
  const {
    isSupabaseConfigured,
    sendEmailLoginOtp,
    sendEmailSignupOtp,
    verifyEmailOtp,
  } = useProfile();

  // Mode: Sign In vs Sign Up
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailOtpToken, setEmailOtpToken] = useState('');
  const [emailStep, setEmailStep] = useState<'input_email' | 'input_otp'>('input_email');
  const [emailResendTimer, setEmailResendTimer] = useState(0);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUserNotFound, setIsUserNotFound] = useState(false);
  const [isAccountAlreadyExists, setIsAccountAlreadyExists] = useState(false);

  // Countdown timer for Email OTP resend
  useEffect(() => {
    if (emailResendTimer > 0) {
      const timer = setTimeout(() => setEmailResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailResendTimer]);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setLoading(false);
      setIsUserNotFound(false);
      setIsAccountAlreadyExists(false);
      setEmailStep('input_email');
      setEmailOtpToken('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsUserNotFound(false);
    setIsAccountAlreadyExists(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg(t('auth.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg(
        t(
          'auth.serviceNotConfigured',
          'Authentication service is not configured. Please configure Supabase environment variables.'
        )
      );
      return;
    }

    if (isSignUp && (!fullName.trim() || fullName.trim().length < 2)) {
      setErrorMsg(t('auth.enterFullName', 'Please enter your full name (at least 2 letters)'));
      return;
    }

    setLoading(true);
    playTap();

    try {
      const res = isSignUp
        ? await sendEmailSignupOtp(cleanEmail, fullName.trim())
        : await sendEmailLoginOtp(cleanEmail);

      if (res.error) {
        const msg = res.error.message || 'Failed to send verification code';
        if (
          msg.toLowerCase().includes("account doesn't exist") ||
          msg.toLowerCase().includes('not found') ||
          msg.toLowerCase().includes('signups not allowed') ||
          msg.toLowerCase().includes('sign up first') ||
          msg.toLowerCase().includes('create an account')
        ) {
          setIsUserNotFound(true);
          setErrorMsg(
            t(
              'auth.accountDoesNotExist',
              "Account doesn't exist. Please sign up first."
            )
          );
        } else if (
          msg.toLowerCase().includes('already exists') ||
          msg.toLowerCase().includes('log in instead')
        ) {
          setIsAccountAlreadyExists(true);
          setErrorMsg(
            t(
              'auth.accountAlreadyExists',
              'An account already exists with this email. Please log in instead.'
            )
          );
        } else {
          setErrorMsg(msg);
        }
      } else {
        setEmailStep('input_otp');
        setEmailResendTimer(30);
        setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanToken = emailOtpToken.trim();
    if (cleanToken.length < 6) {
      setErrorMsg(t('auth.invalidOtp', 'Please enter the complete 6-digit OTP code.'));
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg('Authentication service is not configured.');
      return;
    }

    setLoading(true);
    playTap();

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await verifyEmailOtp(cleanEmail, cleanToken);

      if (res.error) {
        setErrorMsg(
          t(
            'auth.invalidOrExpiredOtp',
            'Verification code is incorrect or has expired. Please check or request a new code.'
          )
        );
      } else {
        playPop();
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#FAF5EE] border border-[#E8D9C5] shadow-2xl"
        >
          {/* Header banner */}
          <div className="bg-gradient-to-r from-[#B34A26] to-[#8C3415] px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
                  <AppIcon name="shield-check" size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">FairWork Setu</h2>
                  <p className="text-xs text-white/80">
                    {isSignUp ? 'नया खाता बनाएं • Create Account' : 'सुरक्षित लॉगिन • Passwordless Email Login'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playTap();
                  onClose();
                }}
                className="rounded-full p-1.5 text-white/80 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <AppIcon name="close" size={20} />
              </button>
            </div>

            {/* Mode Toggle: Login vs Sign Up */}
            <div className="mt-4 flex rounded-xl bg-black/20 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setIsSignUp(false);
                  setIsUserNotFound(false);
                  setIsAccountAlreadyExists(false);
                  setErrorMsg(null);
                  setEmailStep('input_email');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  !isSignUp
                    ? 'bg-white text-[#B34A26] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                लॉगिन (Sign In)
              </button>
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setIsSignUp(true);
                  setIsUserNotFound(false);
                  setIsAccountAlreadyExists(false);
                  setErrorMsg(null);
                  setEmailStep('input_email');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  isSignUp
                    ? 'bg-white text-[#B34A26] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                नया खाता (Sign Up)
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Feedback Banners */}
            {errorMsg && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
                <AppIcon name="message-warning" size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">
                  <div>{errorMsg}</div>
                  {isUserNotFound && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          playTap();
                          setIsSignUp(true);
                          setIsUserNotFound(false);
                          setErrorMsg(null);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#B34A26] text-white text-xs font-bold shadow-xs hover:bg-[#8C3415] transition-all"
                      >
                        <span>{t('auth.signUp', 'Sign Up')}</span>
                        <span>→</span>
                      </button>
                    </div>
                  )}
                  {isAccountAlreadyExists && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          playTap();
                          setIsSignUp(false);
                          setIsAccountAlreadyExists(false);
                          setErrorMsg(null);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#B34A26] text-white text-xs font-bold shadow-xs hover:bg-[#8C3415] transition-all"
                      >
                        <span>{t('auth.logIn', 'Log In')}</span>
                        <span>→</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
                <AppIcon name="check" size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span className="flex-1">{successMsg}</span>
              </div>
            )}

            {!isSupabaseConfigured && (
              <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/70 p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                <AppIcon name="info" size={15} className="text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Configuration Notice:</strong> Real authentication requires configured Supabase credentials.
                </span>
              </div>
            )}

            {emailStep === 'input_email' ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-bold text-[#5A4535] mb-1.5">
                      पूरा नाम (Full Name) <span className="text-[#B34A26]">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="आपका नाम (e.g. Ramesh Kumar)"
                      className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-3 text-sm font-semibold text-[#2C2117] placeholder:text-[#A39281] outline-hidden focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#5A4535] mb-1.5">
                    ईमेल पता (Email Address) <span className="text-[#B34A26]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-3 text-sm font-semibold text-[#2C2117] placeholder:text-[#A39281] outline-hidden focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20"
                    autoFocus
                    required
                  />
                  <p className="mt-1 text-[11px] text-[#7C6956]">
                    हम आपके ईमेल पर 6 अंकों का सुरक्षित सत्यापन कोड भेजेंगे।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || (isSignUp && !fullName.trim())}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#8C3415] py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <span>कोड भेजा जा रहा है... (Sending Code...)</span>
                  ) : (
                    <>
                      <span>
                        {isSignUp
                          ? 'सत्यापन कोड भेजें (Send Verification Code)'
                          : 'सत्यापन कोड भेजें (Send Verification Code)'}
                      </span>
                      <AppIcon name="arrow-forward" size={16} />
                    </>
                  )}
                </button>

                {/* Quick-fill demo account */}
                <div className="pt-2 border-t border-[#EFE6D8] text-left">
                  <span className="text-[10px] font-bold text-[#7C6956] uppercase tracking-wider block mb-1">
                    अधिकृत डेमो प्रोफाइल (Authorized Demo Profile)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playTap();
                      setIsSignUp(false);
                      setEmail('sadia.sakharkar@cumminscollege.in');
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF5EE] border border-[#D5C5B2] text-xs font-medium text-[#2C2117] hover:bg-white transition-all"
                  >
                    <span>👤</span>
                    <span>Sadia Sakharkar</span>
                    <span className="text-[10px] text-textMuted font-mono">
                      (sadia.sakharkar@cumminscollege.in)
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              /* VERIFY EMAIL OTP STEP */
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#5A4535]">
                      6-अंकीय सत्यापन कोड दर्ज करें (Enter 6-digit Code)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        playTap();
                        setEmailStep('input_email');
                        setEmailOtpToken('');
                        setErrorMsg(null);
                      }}
                      className="text-[11px] font-bold text-[#B34A26] hover:underline"
                    >
                      बदलें (Change Email)
                    </button>
                  </div>

                  <p className="text-[11px] text-[#7C6956] mb-2">
                    सत्यापन कोड भेजा गया: <strong className="text-[#2C2117]">{email}</strong>
                  </p>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={emailOtpToken}
                    onChange={(e) => setEmailOtpToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-3 text-center text-xl font-bold tracking-widest text-[#2C2117] outline-hidden focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#7C6956]">
                  <span>
                    {emailResendTimer > 0 ? `पुनः भेजें ${emailResendTimer}s में` : 'कोड नहीं मिला?'}
                  </span>
                  <button
                    type="button"
                    disabled={emailResendTimer > 0 || loading}
                    onClick={handleSendEmailOtp}
                    className="font-bold text-[#B34A26] hover:underline disabled:opacity-50"
                  >
                    पुनः भेजें (Resend Code)
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || emailOtpToken.length < 6}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#8C3415] py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <span>सत्यापित हो रहा है... (Verifying...)</span>
                  ) : (
                    <>
                      <AppIcon name="shield-check" size={16} />
                      <span>{isSignUp ? 'सत्यापित करें और आगे बढ़ें (Verify & Continue)' : 'सत्यापित करें और लॉगिन करें (Verify & Login)'}</span>
                    </>
                  )}
                </button>

                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2 text-left">
                  <span className="text-amber-700 shrink-0 mt-0.5">💡</span>
                  <span>
                    यदि ईमेल इनबॉक्स में नहीं मिला, तो कृपया अपना Spam / Junk फोल्डर भी जांचें।
                  </span>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
