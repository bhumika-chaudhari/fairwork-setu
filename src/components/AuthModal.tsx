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
    loginWithPhone,
    verifyPhoneOtp,
    sendEmailOtp,
    verifyEmailOtp,
    loginWithEmail,
    signupWithEmail,
    sendMagicLink,
  } = useProfile();

  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');

  // Phone states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input_phone' | 'input_otp'>('input_phone');
  const [resendTimer, setResendTimer] = useState(0);

  // Email states
  const [emailAuthMode, setEmailAuthMode] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState('');
  const [emailOtpToken, setEmailOtpToken] = useState('');
  const [emailStep, setEmailStep] = useState<'input_email' | 'input_otp'>('input_email');
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer for Phone OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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
      setPhoneStep('input_phone');
      setEmailStep('input_email');
      setOtpToken('');
      setEmailOtpToken('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const clean = phoneNumber.replace(/[\s-]/g, '');
    if (clean.length < 10) {
      setErrorMsg(t('auth.validPhoneRequired', 'Please enter a valid 10-digit mobile number'));
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

    setLoading(true);
    playTap();

    const res = await loginWithPhone(clean);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message || 'Failed to send OTP. Please check your number.');
    } else {
      setPhoneStep('input_otp');
      setResendTimer(30);
      setSuccessMsg(res.message || 'OTP sent successfully to your mobile number');
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpToken.trim().length < 6) {
      setErrorMsg(t('auth.enterCompleteOtp', 'Please enter the 6-digit OTP'));
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg('Authentication service is not configured.');
      return;
    }

    setLoading(true);
    playTap();

    const clean = phoneNumber.replace(/[\s-]/g, '');
    const res = await verifyPhoneOtp(clean, otpToken.trim());
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message || 'Invalid or expired OTP code');
    } else {
      playPop();
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg(t('auth.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg('Authentication service is not configured.');
      return;
    }

    setLoading(true);
    playTap();

    const res = await sendEmailOtp(email.trim());
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message || 'Failed to send email verification code');
    } else {
      setEmailStep('input_otp');
      setEmailResendTimer(30);
      setSuccessMsg(res.message || `Verification code sent to ${email.trim()}`);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (emailOtpToken.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit verification code');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg('Authentication service is not configured.');
      return;
    }

    setLoading(true);
    playTap();

    const res = await verifyEmailOtp(email.trim(), emailOtpToken.trim());
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message || 'Invalid or expired verification code');
    } else {
      playPop();
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg(t('auth.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg('Authentication service is not configured.');
      return;
    }

    setLoading(true);
    playTap();

    if (useMagicLink) {
      const res = await sendMagicLink(email.trim());
      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error.message);
      } else {
        setSuccessMsg(res.message || 'Magic sign-in link sent to your email');
      }
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setLoading(false);
        setErrorMsg('Password must be at least 6 characters');
        return;
      }
      const res = await signupWithEmail(email.trim(), password, fullName);
      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error.message);
      } else {
        playPop();
        setSuccessMsg('Account created successfully');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 800);
      }
    } else {
      const res = await loginWithEmail(email.trim(), password);
      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error.message);
      } else {
        playPop();
        onClose();
        if (onSuccess) onSuccess();
      }
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
                  <h2 className="text-lg font-bold tracking-tight">FairWork Setu Login</h2>
                  <p className="text-xs text-white/80">सुरक्षित क्लाउड सिंक • Secure Cloud Sync</p>
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

            {/* Auth Method Tabs */}
            <div className="mt-4 flex rounded-xl bg-black/20 p-1">
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setActiveTab('phone');
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                  activeTab === 'phone'
                    ? 'bg-white text-[#B34A26] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                📱 मोबाइल ओटीपी (Phone OTP)
              </button>
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setActiveTab('email');
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                  activeTab === 'email'
                    ? 'bg-white text-[#B34A26] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                ✉️ ईमेल (Email)
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Feedback Banners */}
            {errorMsg && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
                <AppIcon name="message-warning" size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
                <AppIcon name="check" size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {!isSupabaseConfigured && (
              <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/70 p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                <AppIcon name="info" size={15} className="text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Configuration Notice:</strong> Real authentication requires configured Supabase credentials. Simulated bypasses are disabled.
                </span>
              </div>
            )}

            {/* TAB 1: PHONE NUMBER & OTP */}
            {activeTab === 'phone' && (
              <div>
                {phoneStep === 'input_phone' ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5A4535] mb-1.5">
                        मोबाइल नंबर (Mobile Phone Number)
                      </label>
                      <div className="flex rounded-xl border border-[#D5C5B2] bg-white overflow-hidden focus-within:border-[#B34A26] focus-within:ring-2 focus-within:ring-[#B34A26]/20 transition-all">
                        <span className="flex items-center px-3.5 bg-[#F0E6D8] text-xs font-bold text-[#6B5746] border-r border-[#D5C5B2]">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="98765 43210"
                          className="w-full px-3.5 py-3 text-sm font-semibold text-[#2C2117] placeholder:text-[#A39281] outline-hidden"
                          autoFocus
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-[#7C6956]">
                        हम आपके नंबर पर 6 अंकों का सुरक्षित एसएमएस ओटीपी भेजेंगे।
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || phoneNumber.length < 10}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#8C3415] py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      {loading ? (
                        <span>ओटीपी भेजा जा रहा है... (Sending OTP...)</span>
                      ) : (
                        <>
                          <span>ओटीपी भेजें (Send Verification OTP)</span>
                          <AppIcon name="arrow-forward" size={16} />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#5A4535]">
                          6-अंकीय ओटीपी दर्ज करें (Enter 6-digit OTP)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneStep('input_phone');
                            setOtpToken('');
                          }}
                          className="text-[11px] font-bold text-[#B34A26] hover:underline"
                        >
                          बदलें (Change)
                        </button>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-3 text-center text-xl font-bold tracking-widest text-[#2C2117] outline-hidden focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20"
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#7C6956]">
                      <span>
                        {resendTimer > 0 ? `पुनः भेजें ${resendTimer}s में` : 'ओटीपी नहीं मिला?'}
                      </span>
                      <button
                        type="button"
                        disabled={resendTimer > 0 || loading}
                        onClick={handleSendPhoneOtp}
                        className="font-bold text-[#B34A26] hover:underline disabled:opacity-50"
                      >
                        पुनः भेजें (Resend OTP)
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpToken.length < 6}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#8C3415] py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      {loading ? (
                        <span>सत्यापित हो रहा है... (Verifying...)</span>
                      ) : (
                        <>
                          <AppIcon name="shield-check" size={16} />
                          <span>सत्यापित करें और लॉगिन करें (Verify & Login)</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: EMAIL */}
            {activeTab === 'email' && (
              <div>
                <div className="flex rounded-xl bg-[#EFE6D8] p-1 mb-4 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailAuthMode('otp');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      emailAuthMode === 'otp'
                        ? 'bg-white text-[#B34A26] shadow-xs'
                        : 'text-textMuted'
                    }`}
                  >
                    ईमेल ओटीपी (Email OTP)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailAuthMode('password');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      emailAuthMode === 'password'
                        ? 'bg-white text-[#B34A26] shadow-xs'
                        : 'text-textMuted'
                    }`}
                  >
                    पासवर्ड (Password)
                  </button>
                </div>

                {emailAuthMode === 'otp' ? (
                  emailStep === 'input_email' ? (
                    <form onSubmit={handleSendEmailOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#5A4535] mb-1.5">
                          ईमेल पता (Email Address)
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="worker@example.com"
                          className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-3 text-sm font-semibold text-[#2C2117] placeholder:text-[#A39281] outline-hidden focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20"
                          autoFocus
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#8C3415] py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
                      >
                        {loading ? 'ओटीपी भेजा जा रहा है...' : 'ओटीपी भेजें (Send Email OTP)'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-[#5A4535]">
                            6-अंकीय कोड दर्ज करें (Enter 6-digit Code)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailStep('input_email');
                              setEmailOtpToken('');
                            }}
                            className="text-[11px] font-bold text-[#B34A26] hover:underline"
                          >
                            बदलें (Change)
                          </button>
                        </div>
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
                        {loading ? 'सत्यापित हो रहा है...' : 'सत्यापित करें (Verify Code)'}
                      </button>
                    </form>
                  )
                ) : (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {isSignUp && (
                      <div>
                        <label className="block text-xs font-bold text-[#5A4535] mb-1.5">
                          पूरा नाम (Full Name)
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="आपका नाम (Your Name)"
                          className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-3 text-sm font-semibold text-[#2C2117] placeholder:text-[#A39281] outline-hidden focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#5A4535] mb-1.5">
                        ईमेल पता (Email Address)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="worker@example.com"
                        className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-3 text-sm font-semibold text-[#2C2117] placeholder:text-[#A39281] outline-hidden focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20"
                        autoFocus
                        required
                      />
                    </div>

                    {!useMagicLink && (
                      <div>
                        <label className="block text-xs font-bold text-[#5A4535] mb-1.5">
                          पासवर्ड (Password)
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="कम से कम 6 अक्षर (Min 6 chars)"
                          className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-3 text-sm font-semibold text-[#2C2117] placeholder:text-[#A39281] outline-hidden focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20"
                          required
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setUseMagicLink(!useMagicLink)}
                        className="font-semibold text-[#B34A26] hover:underline"
                      >
                        {useMagicLink ? 'पासवर्ड से लॉगिन करें' : 'जादुई लिंक से लॉगिन करें'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email || (!useMagicLink && password.length < 6)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#8C3415] py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      {loading ? (
                        <span>प्रक्रिया जारी है... (Processing...)</span>
                      ) : (
                        <>
                          <AppIcon name="lock-closed" size={16} />
                          <span>
                            {useMagicLink
                              ? 'जादुई लिंक भेजें (Send Magic Link)'
                              : isSignUp
                              ? 'खाता बनाएं (Create Account)'
                              : 'साइन इन करें (Sign In)'}
                          </span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          playTap();
                          setIsSignUp(!isSignUp);
                          setErrorMsg(null);
                        }}
                        className="text-xs font-semibold text-[#7C6956] hover:text-[#B34A26]"
                      >
                        {isSignUp
                          ? 'पहले से खाता है? साइन इन करें (Already have an account? Sign In)'
                          : 'नया उपयोगकर्ता? नया खाता बनाएं (New to Setu? Sign Up)'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
