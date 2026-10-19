import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import SetuLogo from '../components/SetuLogo';
import SkillChip from '../components/SkillChip';
import Card from '../components/Card';
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
import { AppIcon } from '../lib/icons';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile, completeOnboarding, onboardingComplete } = useProfile();

  // If already onboarded, never trap user in onboarding again
  useEffect(() => {
    if (onboardingComplete) {
      navigate('/home', { replace: true });
    }
  }, [onboardingComplete, navigate]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'en'
  );
  const [fullName, setFullName] = useState(profile.name || '');
  const [gender, setGender] = useState<Gender | null>(profile.gender || null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [emergencyCountryCode, setEmergencyCountryCode] = useState('+91');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState(
    profile.emergencyContact ? profile.emergencyContact.replace(/^(\+\d{1,4})\s*/, '') : ''
  );
  const [experienceYears, setExperienceYears] = useState(profile.experienceYears || 3);
  const [isListeningName, setIsListeningName] = useState(false);
  const [workType, setWorkType] = useState<WorkerType | null>(profile.workType || null);
  const [cityInput, setCityInput] = useState(
    profile.cityKey ? profile.cityKey.replace(/^cities\./i, '') : ''
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    profile.skillKeys && profile.skillKeys.length > 0 ? profile.skillKeys : []
  );
  const [savingsGoal, setSavingsGoal] = useState<number>(profile.savingsGoal || 5000);
  const [submitted, setSubmitted] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Sync if profile resolves asynchronously after mount
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
    if (profile.emergencyContact && !emergencyContactNumber) {
      const match = profile.emergencyContact.match(/^(\+\d{1,4})\s*(.*)$/);
      if (match) {
        setEmergencyCountryCode(match[1]);
        setEmergencyContactNumber(match[2].replace(/\D/g, ''));
      } else {
        setEmergencyContactNumber(profile.emergencyContact.replace(/\D/g, ''));
      }
    }
  }, [profile]);

  const handleLanguageChange = async (code: LanguageCode) => {
    setSelectedLanguage(code);
    await changeAppLanguage(code);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setAvatarUrl(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
        selectedLanguage === 'mr' ? 'mr-IN' : selectedLanguage === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningName(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setFullName(transcript.trim());
          setErrorText(null);
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

  const toggleSkill = (skillKey: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillKey) ? prev.filter((s) => s !== skillKey) : [...prev, skillKey]
    );
  };

  const handleStep1Next = () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorText(t('auth.enterFullName', 'Please enter your full name (at least 2 letters)'));
      return;
    }
    const cleanEmergency = emergencyContactNumber.replace(/\D/g, '');
    if (cleanEmergency) {
      if (emergencyCountryCode === '+91' && cleanEmergency.length !== 10) {
        setErrorText(
          t('auth.invalidEmergencyContact', 'Please enter a valid 10-digit Indian phone number or leave it empty')
        );
        return;
      }
      if (emergencyCountryCode !== '+91' && (cleanEmergency.length < 7 || cleanEmergency.length > 14)) {
        setErrorText(
          t('auth.invalidEmergencyContact', 'Please enter a valid phone number or leave it empty')
        );
        return;
      }
    }
    setErrorText(null);
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!workType) {
      setErrorText(t('onboarding.selectWorkerTypeAlert', 'Please select your profession / work type'));
      return;
    }
    setErrorText(null);
    setStep(3);
  };

  const handleFinish = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorText(t('auth.enterFullName', 'Please enter your full name'));
      setStep(1);
      return;
    }
    const cleanEmergency = emergencyContactNumber.replace(/\D/g, '');
    if (cleanEmergency) {
      if (emergencyCountryCode === '+91' && cleanEmergency.length !== 10) {
        setErrorText(
          t('auth.invalidEmergencyContact', 'Please enter a valid 10-digit Indian phone number or leave it empty')
        );
        setStep(1);
        return;
      }
      if (emergencyCountryCode !== '+91' && (cleanEmergency.length < 7 || cleanEmergency.length > 14)) {
        setErrorText(
          t('auth.invalidEmergencyContact', 'Please enter a valid phone number or leave it empty')
        );
        setStep(1);
        return;
      }
    }
    if (!workType) {
      setErrorText(t('onboarding.selectWorkerTypeAlert', 'Please select your profession'));
      setStep(2);
      return;
    }

    setErrorText(null);
    setSubmitted(true);
    const resolvedCity = cityInput.trim()
      ? (cityInput.trim().toLowerCase().startsWith('cities.')
          ? cityInput.trim().toLowerCase()
          : `cities.${cityInput.trim().toLowerCase()}`)
      : 'cities.pune';

    const finalEmergency = cleanEmergency
      ? `${emergencyCountryCode} ${cleanEmergency}`
      : (profile.emergencyContact || '');

    await completeOnboarding({
      name: fullName.trim(),
      gender,
      avatarUrl,
      emergencyContact: finalEmergency,
      experienceYears,
      workType,
      cityKey: resolvedCity,
      skillKeys: selectedSkills,
      savingsGoal,
      weeklySaveGoal: Math.round(savingsGoal / 12),
      preferredLanguage: selectedLanguage,
    });

    // Pause briefly so worker sees positive completion state
    setTimeout(() => {
      navigate('/home', { replace: true });
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full bg-transparent overflow-x-hidden py-4 md:py-8 px-4 sm:px-6">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-saffronGold/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -left-20 h-96 w-96 rounded-full bg-terracotta/10 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-md md:max-w-2xl lg:max-w-3xl">
        {/* Top bar with back arrow, logo, step progress */}
        <header className="mb-4 space-y-3 border-b border-softBorder/80 pb-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (step > 1) {
                  setStep((step - 1) as 1 | 2);
                } else {
                  navigate('/');
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-cleanWhite/80 backdrop-blur-md shadow-glass border border-softBorder hover:bg-cleanWhite text-warmCocoa transition-all active:scale-95"
              aria-label="Back"
            >
              <AppIcon name="arrow-back" size={20} />
            </button>
            <SetuLogo size="sm" />
            <div className="flex items-center gap-1.5 rounded-full bg-cleanWhite/80 backdrop-blur-md border border-softBorder px-3 py-1 shadow-xs">
              <span className="text-xs font-bold text-warmCocoa">Step {step}/3</span>
            </div>
          </div>

          {/* Wizard Progress Bar */}
          <div className="w-full h-1.5 bg-warmAmber/25 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#B34A26] via-[#E5953E] to-[#F1B96B] rounded-full"
              initial={false}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              {/* Validation Alert */}
              <AnimatePresence>
                {errorText && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-2xl bg-danger/10 border border-danger/30 p-3.5 flex items-center gap-2.5 text-danger text-xs font-bold shadow-xs"
                  >
                    <AppIcon name="alert-circle" size={18} className="shrink-0" />
                    <span>{errorText}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ========================================================================= */}
              {/* STEP 1: AAPKA PARICHAY (Language, Name, Photo, Phone) */}
              {/* ========================================================================= */}
              {step === 1 && (
                <>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-warmCocoa">
                      Aapka Parichay • Who Are You?
                    </h1>
                    <p className="mt-1 text-sm text-textSecondary leading-relaxed">
                      Choose your preferred language and tell us your name.
                    </p>
                  </div>

                  {/* Language Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-2">
                      {t('onboarding.chooseLanguage')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SUPPORTED_LANGUAGE_CODES.slice(0, 6).map((code) => {
                        const isSelected = selectedLanguage === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => handleLanguageChange(code)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-warm border border-saffronGold/40'
                                : 'bg-cleanWhite/80 backdrop-blur-md text-textSecondary border border-softBorder hover:bg-cleanWhite shadow-xs'
                            }`}
                          >
                            {LANGUAGE_NATIVE_NAMES[code]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Personal Identity Details Card */}
                  <div className="relative rounded-[26px] bg-cleanWhite/85 backdrop-blur-2xl p-5 shadow-glass border border-softBorder overflow-hidden space-y-4">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cleanWhite to-transparent" />
                    {/* Photo / Selfie Upload */}
                    <div className="flex items-center gap-4 border-b border-softBorder pb-4">
                      <input
                        id="onboarding-photo-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <label
                        htmlFor="onboarding-photo-input"
                        className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-2xl font-black text-white shadow-card ring-2 ring-white overflow-hidden group"
                        title="Upload photo / Selfie"
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          fullName.charAt(0) || 'R'
                        )}
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-saffronGold text-deepNavy shadow-xs border border-white">
                          <AppIcon name="camera-outline" size={13} />
                        </div>
                      </label>
                      <div>
                        <label
                          htmlFor="onboarding-photo-input"
                          className="text-sm font-extrabold text-warmCocoa cursor-pointer block hover:underline"
                        >
                          {avatarUrl ? 'Photo Uploaded ✓ (Tap to change)' : 'Selfie / Photo Lagayein'}
                        </label>
                        <p className="text-xs text-textSecondary mt-0.5">
                          Employers trust verified workers with a photo.
                        </p>
                      </div>
                    </div>

                    {/* Name Input with Voice Mic */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-warmCocoa">
                          Pura Naam / Full Name <span className="text-danger">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleVoiceNameInput}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                            isListeningName
                              ? 'bg-danger text-white animate-pulse'
                              : 'bg-warmAmber/20 text-terracotta hover:bg-warmAmber/30 border border-warmAmber/40'
                          }`}
                          title="Bol kar naam likhein"
                        >
                          <AppIcon name="mic" size={13} />
                          <span>{isListeningName ? 'Sun rahe hain...' : 'Bol kar likhein'}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-terracotta">
                          <AppIcon name="person" size={18} />
                        </div>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Jaise: Ramesh Kumar / Sunita Devi / Amit Patil"
                          className="w-full rounded-2xl border border-softBorder bg-cleanWhite/90 backdrop-blur-md pl-10 pr-4 py-3 text-sm font-medium text-textPrimary shadow-inner placeholder:text-textMuted focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Emergency Contact Number (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-warmCocoa">
                          {t('auth.emergencyContactNumber', 'Emergency Contact Number (optional)')}
                        </label>
                        <span className="text-[11px] font-normal text-textMuted">
                          ({t('gender.optionalBadge', 'Optional')})
                        </span>
                      </div>
                      <p className="text-[11px] text-textMuted mb-2">
                        {t('auth.emergencyContactHint', 'Someone we can contact if you need urgent help.')}
                      </p>
                      <div className="relative flex items-center rounded-2xl border border-softBorder bg-cleanWhite/90 backdrop-blur-md shadow-inner focus-within:ring-2 focus-within:ring-terracotta/30 focus-within:border-terracotta transition-all">
                        <div className="flex items-center gap-1 pl-3 pr-2 py-2.5 border-r border-softBorder text-xs font-bold text-warmCocoa select-none bg-cleanWhite/70 rounded-l-2xl">
                          <select
                            value={emergencyCountryCode}
                            onChange={(e) => setEmergencyCountryCode(e.target.value)}
                            className="bg-transparent text-xs font-bold text-warmCocoa focus:outline-none cursor-pointer"
                            aria-label="Country code"
                          >
                            <option value="+91">🇮🇳 +91</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+971">🇦🇪 +971</option>
                            <option value="+966">🇸🇦 +966</option>
                            <option value="+977">🇳🇵 +977</option>
                            <option value="+880">🇧🇩 +880</option>
                            <option value="+65">🇸🇬 +65</option>
                          </select>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={12}
                          value={emergencyContactNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setEmergencyContactNumber(val);
                            setErrorText(null);
                          }}
                          placeholder={t('auth.emergencyContactPlaceholder', '10-digit phone number')}
                          className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-textPrimary placeholder:text-textMuted focus:outline-none"
                        />
                        {emergencyContactNumber && (
                          <button
                            type="button"
                            onClick={() => setEmergencyContactNumber('')}
                            className="mr-3 text-textMuted hover:text-danger text-xs font-bold"
                            title="Clear"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Gender Selection (Optional, Non-Discriminatory) */}
                    <div className="pt-2 border-t border-softBorder">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-warmCocoa">
                          {t('gender.label')}{' '}
                          <span className="text-[11px] font-normal text-textMuted">
                            ({t('gender.optionalBadge')})
                          </span>
                        </label>
                        <span className="text-[10px] font-medium text-textMuted">
                          {t('gender.noRestrictionNotice')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {genderOptions.map((opt) => {
                          const isSelected = gender === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setGender(isSelected ? null : opt.id)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-warm border border-saffronGold/40'
                                  : 'bg-cleanWhite/80 backdrop-blur-md text-textSecondary hover:bg-cleanWhite border border-softBorder shadow-xs'
                              }`}
                            >
                              <AppIcon name={opt.icon} size={14} />
                              <span>{t(opt.labelKey)}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1.5 text-[11px] text-textMuted leading-tight">
                        {t('gender.helperText')}
                      </p>
                    </div>
                  </div>

                  {/* Step 1 Actions */}
                  <div className="flex items-center justify-between gap-4 pt-2 pb-6">
                    <div />
                    <button
                      type="button"
                      onClick={handleStep1Next}
                      className="flex h-12 items-center gap-2 rounded-full emerald-gradient-btn px-8 text-sm font-bold text-white shadow-warm hover:brightness-105 active:scale-95 transition-all"
                    >
                      <span>{t('common.next')}</span>
                      <AppIcon name="arrow-forward" size={16} />
                    </button>
                  </div>
                </>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: AAPKA KAAM (Trade, Experience, City) */}
              {/* ========================================================================= */}
              {step === 2 && (
                <>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-warmCocoa">
                      Aapka Kaam • What Work Do You Do?
                    </h1>
                    <p className="mt-1 text-sm text-textSecondary leading-relaxed">
                      Select your profession and your working city.
                    </p>
                  </div>

                  {/* Worker Type Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-sm font-bold text-warmCocoa">
                        {t('onboarding.selectWorkerType')}
                      </label>
                      <span className="text-xs text-textMuted">{t('onboarding.tapToSelect')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                      {workerTypeOptions.map((opt) => {
                        const isSelected = workType === opt.type;
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setWorkType(opt.type)}
                            className={`flex flex-col items-center justify-center rounded-[20px] p-3 text-center transition-all duration-200 active:scale-95 ${
                              isSelected
                                ? 'bg-warmAmber/20 border-2 border-terracotta shadow-warm scale-[1.02]'
                                : 'bg-cleanWhite/80 backdrop-blur-xl border border-softBorder hover:bg-cleanWhite shadow-glass'
                            }`}
                          >
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-2xl mb-2 transition-colors ${
                                isSelected
                                  ? 'bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-xs'
                                  : 'bg-warmAmber/20 text-terracotta'
                              }`}
                            >
                              <AppIcon name={opt.icon} size={22} />
                            </div>
                            <span
                              className={`text-xs font-bold leading-tight ${
                                isSelected ? 'text-warmCocoa' : 'text-textPrimary'
                              }`}
                            >
                              {t(opt.labelKey)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Experience in Years */}
                  <div className="relative rounded-[24px] bg-cleanWhite/85 backdrop-blur-2xl p-4 shadow-glass border border-softBorder overflow-hidden">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cleanWhite to-transparent" />
                    <label className="block text-xs font-bold text-warmCocoa mb-2">
                      Kitne saal ka anubhav hai? / Years of Experience
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 5, 8].map((yrs) => (
                        <button
                          key={yrs}
                          type="button"
                          onClick={() => setExperienceYears(yrs)}
                          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 ${
                            experienceYears === yrs
                              ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-warm border border-saffronGold/40'
                              : 'bg-cleanWhite/80 backdrop-blur-md text-textSecondary hover:bg-cleanWhite border border-softBorder shadow-xs'
                          }`}
                        >
                          {yrs === 8 ? '8+ yr' : `${yrs} yr`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* City Input */}
                  <div>
                    <label className="block text-sm font-bold text-warmCocoa mb-1.5">
                      {t('onboarding.cityTitle')}
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-terracotta">
                        <AppIcon name="location-outline" size={18} />
                      </div>
                      <input
                        type="text"
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        placeholder={t('onboarding.cityPlaceholder')}
                        className="w-full rounded-2xl border border-softBorder bg-cleanWhite/90 backdrop-blur-md pl-10 pr-4 py-3 text-sm font-medium text-textPrimary shadow-inner placeholder:text-textMuted focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta focus:outline-none"
                      />
                    </div>
                    {/* Quick city suggestions */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CITY_KEYS.slice(0, 5).map((key) => {
                        const cityName = t(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCityInput(cityName)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors active:scale-95 ${
                              cityInput.toLowerCase() === cityName.toLowerCase()
                                ? 'bg-terracotta text-white font-bold border border-terracotta shadow-xs'
                                : 'bg-cleanWhite/80 backdrop-blur-xs text-textMuted hover:bg-cleanWhite hover:text-textPrimary border border-softBorder'
                            }`}
                          >
                            {cityName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2 Actions */}
                  <div className="flex items-center justify-between gap-4 pt-2 pb-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex h-12 items-center gap-1.5 rounded-full border border-softBorder bg-cleanWhite/80 backdrop-blur-md px-6 text-sm font-bold text-warmCocoa hover:bg-cleanWhite transition-all shadow-xs active:scale-95"
                    >
                      <AppIcon name="arrow-back" size={16} />
                      <span>{t('common.back')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStep2Next}
                      className="flex h-12 items-center gap-2 rounded-full emerald-gradient-btn px-8 text-sm font-bold text-white shadow-warm hover:brightness-105 active:scale-95 transition-all"
                    >
                      <span>{t('common.next')}</span>
                      <AppIcon name="arrow-forward" size={16} />
                    </button>
                  </div>
                </>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: SKILLS AUR BACHAT GOAL (Skills, Savings, Live Card) */}
              {/* ========================================================================= */}
              {step === 3 && (
                <>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-warmCocoa">
                      Skills & Bachat Goal
                    </h1>
                    <p className="mt-1 text-sm text-textSecondary leading-relaxed">
                      Select your skills and set an emergency fund savings goal.
                    </p>
                  </div>

                  {/* Multi-select Skills */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-bold text-warmCocoa">
                        {t('onboarding.skillsTitle')}
                      </label>
                      {selectedSkills.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-terracotta bg-warmAmber/20 px-2 py-0.5 rounded-full border border-warmAmber/30">
                            {t('auth.skillsSelectedCount', '{{count}} selected', { count: selectedSkills.length })}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedSkills([])}
                            className="text-xs font-bold text-textMuted hover:text-danger"
                          >
                            {t('common.clear', 'Clear')}
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-textSecondary mb-2.5">
                      {t('onboarding.skillsHint')}
                    </p>
                    <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1.5 border border-softBorder/60 rounded-2xl bg-cleanWhite/40 shadow-inner">
                      {SUGGESTED_SKILL_KEYS.map((key) => {
                        const isSelected = selectedSkills.includes(key);
                        return (
                          <SkillChip
                            key={key}
                            label={t(key)}
                            selected={isSelected}
                            showToggleIcon={true}
                            onPress={() => toggleSkill(key)}
                            onClick={() => toggleSkill(key)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Savings Goal Slider */}
                  <div className="pt-1">
                    <label className="text-sm font-bold text-warmCocoa block mb-2">
                      Emergency Bachat Goal / Savings Target
                    </label>
                    <Card className="bg-cleanWhite/85 backdrop-blur-2xl border border-softBorder p-4 shadow-glass">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-textSecondary">
                          Target Emergency Fund
                        </span>
                        <span className="text-lg font-black text-warmCocoa">
                          {t('common.currency', { amount: formatInr(savingsGoal) })}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="1000"
                        max="20000"
                        step="500"
                        value={savingsGoal}
                        onChange={(e) => setSavingsGoal(Number(e.target.value))}
                        className="w-full accent-terracotta h-2 bg-warmAmber/25 rounded-lg cursor-pointer"
                      />

                      <div className="mt-3 flex justify-between gap-2">
                        {[2000, 5000, 10000, 15000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setSavingsGoal(amt)}
                            className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all active:scale-95 ${
                              savingsGoal === amt
                                ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-warm border border-saffronGold/40'
                                : 'bg-cleanWhite/80 backdrop-blur-md text-textSecondary border border-softBorder hover:bg-cleanWhite shadow-xs'
                            }`}
                          >
                            ₹{amt / 1000}k
                          </button>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Live Setu ID Badge preview card */}
                  <div className="relative overflow-hidden rounded-2xl bg-cleanWhite/85 backdrop-blur-2xl p-4 border border-softBorder shadow-glass flex items-center gap-3.5">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cleanWhite to-transparent" />
                    <div className="relative shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="h-13 w-13 rounded-full object-cover shadow-xs ring-2 ring-white"
                        />
                      ) : (
                        <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white font-black text-lg shadow-warm ring-2 ring-white">
                          {(fullName.trim() || 'R').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-saffronGold text-deepNavy shadow-xs border border-white">
                        <AppIcon name="checkmark-circle" size={12} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-warmCocoa truncate">
                          {fullName.trim() || 'Aapka Naam'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-warmAmber/20 px-2 py-0.5 text-[10px] font-bold text-warmCocoa border border-saffronGold/50">
                          ✓ Setu Verified
                        </span>
                      </div>
                      <p className="text-xs text-terracotta font-medium truncate mt-0.5">
                        {workType && workerTypeOptions.find((o) => o.type === workType)?.labelKey
                          ? t(workerTypeOptions.find((o) => o.type === workType)!.labelKey)
                          : t('common.worker', 'Worker')}{' '}
                        • {cityInput || 'Pune'} • {experienceYears} Years Exp
                      </p>
                    </div>
                  </div>

                  {/* Step 3 Actions */}
                  <div className="flex items-center justify-between gap-4 pt-2 pb-6">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex h-12 items-center gap-1.5 rounded-full border border-softBorder bg-cleanWhite/80 backdrop-blur-md px-6 text-sm font-bold text-warmCocoa hover:bg-cleanWhite transition-all shadow-xs active:scale-95"
                    >
                      <AppIcon name="arrow-back" size={16} />
                      <span>{t('common.back')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="flex h-12 items-center gap-2 rounded-full emerald-gradient-btn px-8 text-sm font-bold text-white shadow-warm hover:brightness-105 active:scale-95 transition-all"
                    >
                      <span>{t('onboarding.start')}</span>
                      <AppIcon name="checkmark" size={17} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            /* Profile Created Success State */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-saffronGold/20 text-terracotta shadow-warm mb-4 border-2 border-saffronGold">
                <AppIcon name="checkmark-circle" size={44} />
              </div>
              <h2 className="text-2xl font-black text-warmCocoa">
                {t('onboarding.profileCreated')}
              </h2>
              <p className="mt-1 text-sm text-textSecondary max-w-xs">
                {t('onboarding.welcomeSubtitle', { name: fullName.trim() || profile.name || 'Setu Worker' })}
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-terracotta">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
                <span>{t('onboarding.loadingDashboard')}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
