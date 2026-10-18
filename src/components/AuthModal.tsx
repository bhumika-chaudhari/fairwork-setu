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
    loginWithEmail,
    signupWithEmail,
    sendMagicLink,
    continueAsGuest,
  } = useProfile();

  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');

  // Phone states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input_phone' | 'input_otp'>('input_phone');
  const [resendTimer, setResendTimer] = useState(0);

  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setLoading(false);
      setPhoneStep('input_phone');
      setOtpToken('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const clean = phoneNumber.replace(/[\s-]/g, '');
    if (clean.length < 10) {
      setErrorMsg(t('auth.validPhoneRequired', 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें (Please enter a valid 10-digit mobile number)'));
      return;
    }

    setLoading(true);
    playTap();

    if (!isSupabaseConfigured) {
      // In offline / mock mode, simulate instantaneous OTP dispatch for test demo
      setTimeout(() => {
        setLoading(false);
        setPhoneStep('input_otp');
        setResendTimer(30);
        setSuccessMsg('डेमो ओटीपी भेजा गया: 123456 (Demo OTP sent: 123456)');
      }, 600);
      return;
    }

    const res = await loginWithPhone(phoneNumber);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message || 'ओटीपी भेजने में असमर्थ (Failed to send OTP)');
    } else {
      setPhoneStep('input_otp');
      setResendTimer(30);
      setSuccessMsg(res.message || 'ओटीपी सफलतापूर्वक भेजा गया (OTP sent successfully)');
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpToken.trim().length < 6) {
      setErrorMsg('कृपया 6 अंकों का ओटीपी दर्ज करें (Please enter the 6-digit OTP)');
      return;
    }

    setLoading(true);
    playTap();

    if (!isSupabaseConfigured) {
      // Offline / Demo mode acceptance: accept 123456 or any 6 digits for testing
      setTimeout(() => {
        setLoading(false);
        playPop();
        onClose();
        if (onSuccess) onSuccess();
      }, 500);
      return;
    }

    const res = await verifyPhoneOtp(phoneNumber, otpToken);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message || 'अमान्य ओटीपी कोड (Invalid OTP code)');
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
      setErrorMsg('कृपया मान्य ईमेल पता दर्ज करें (Please enter a valid email address)');
      return;
    }

    setLoading(true);
    playTap();

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setLoading(false);
        playPop();
        onClose();
        if (onSuccess) onSuccess();
      }, 500);
      return;
    }

    if (useMagicLink) {
      const res = await sendMagicLink(email);
      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error.message);
      } else {
        setSuccessMsg(res.message || 'जादुई लॉगिन लिंक भेजा गया (Magic link sent)');
      }
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setLoading(false);
        setErrorMsg('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Password must be at least 6 characters)');
        return;
      }
      const res = await signupWithEmail(email, password, fullName);
      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error.message);
      } else {
        playPop();
        setSuccessMsg('खाता सफलतापूर्वक बनाया गया (Account created successfully)');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 800);
      }
    } else {
      const res = await loginWithEmail(email, password);
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

  const handleGuestContinue = () => {
    playTap();
    continueAsGuest();
    onClose();
    if (onSuccess) onSuccess();
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
                  <strong>ऑफ़लाइन डेमो मोड सक्रिय (Local Demo Active):</strong> आप बिना लाइव क्रेडेंशियल के सीधे टेस्ट कर सकते हैं (Use test OTP: <strong>123456</strong> या Continue as Demo).
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
                          6-अंकों का ओटीपी दर्ज करें (Enter 6-digit OTP)
                        </label>
                        <button
                          type="button"
                          onClick={() => setPhoneStep('input_phone')}
                          className="text-[11px] font-bold text-[#B34A26] hover:underline"
                        >
                          बदलें (Change)
                        </button>
                      </div>
                      <p className="text-[11px] text-[#7C6956] mb-2">
                        +91 {phoneNumber} पर भेजा गया कोड:
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                        placeholder="• • • • • •"
                        className="w-full tracking-widest text-center text-xl font-extrabold rounded-xl border border-[#D5C5B2] bg-white py-3 text-[#2C2117] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 outline-hidden"
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      {resendTimer > 0 ? (
                        <span className="text-[#8C7A68]">
                          पुनः भेजें {resendTimer}s में (Resend in {resendTimer}s)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          className="font-bold text-[#B34A26] hover:underline"
                        >
                          ओटीपी फिर से भेजें (Resend OTP)
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpToken.length < 6}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#8C3415] py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      {loading ? (
                        <span>पुष्टि की जा रही है... (Verifying...)</span>
                      ) : (
                        <>
                          <AppIcon name="check" size={16} />
                          <span>सत्यापित करें और आगे बढ़ें (Verify & Sign In)</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: EMAIL & PASSWORD */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-bold text-[#5A4535] mb-1">
                      आपका पूरा नाम (Full Name)
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-2.5 text-sm font-medium text-[#2C2117] focus:border-[#B34A26] outline-hidden"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#5A4535] mb-1">
                    ईमेल पता (Email Address)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-2.5 text-sm font-medium text-[#2C2117] focus:border-[#B34A26] outline-hidden"
                    autoFocus
                  />
                </div>

                {!useMagicLink && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#5A4535]">
                        पासवर्ड (Password)
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseMagicLink(true)}
                        className="text-[11px] font-bold text-[#B34A26] hover:underline"
                      >
                        बिना पासवर्ड लिंक का उपयोग करें
                      </button>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#D5C5B2] bg-white px-3.5 py-2.5 text-sm font-medium text-[#2C2117] focus:border-[#B34A26] outline-hidden"
                    />
                  </div>
                )}

                {useMagicLink && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#7C6956]">हम आपके इनबॉक्स में लॉगिन लिंक भेजेंगे</span>
                    <button
                      type="button"
                      onClick={() => setUseMagicLink(false)}
                      className="font-bold text-[#B34A26] hover:underline"
                    >
                      पासवर्ड का उपयोग करें
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#8C3415] py-3 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <span>प्रतीक्षा करें... (Please wait...)</span>
                  ) : useMagicLink ? (
                    <span>जादुई लिंक भेजें (Send Magic Link)</span>
                  ) : isSignUp ? (
                    <span>खाता बनाएं (Create Account)</span>
                  ) : (
                    <span>साइन इन करें (Sign In)</span>
                  )}
                </button>

                <div className="text-center pt-1">
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

            {/* SEPARATOR */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#DECDBD]" />
              </div>
              <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-wider text-[#9E8B7A]">
                <span className="bg-[#FAF5EE] px-3">या / OR</span>
              </div>
            </div>

            {/* GUEST / DEMO MODE BUTTON */}
            <button
              type="button"
              onClick={handleGuestContinue}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#D5C5B2] bg-white py-3 text-xs font-bold text-[#5A4535] hover:bg-[#F3EBE0] hover:border-[#B34A26]/40 transition-all active:scale-[0.98]"
            >
              <AppIcon name="user" size={15} className="text-[#8C5E38]" />
              <span>डेमो / गेस्ट के रूप में जारी रखें (Continue as Demo Guest)</span>
            </button>
            <p className="mt-1.5 text-center text-[10px] text-[#8C7A68]">
              समीक्षा और मूल्यांकन के लिए: सभी एआई मॉडल और डेमो लेन-देन तुरंत उपलब्ध होंगे।
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
