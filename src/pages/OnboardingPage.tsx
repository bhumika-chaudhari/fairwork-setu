import { useState } from 'react';
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

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'en'
  );
  const [fullName, setFullName] = useState(profile.name || '');
  const [gender, setGender] = useState<Gender | null>(profile.gender || null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState(profile.experienceYears || 3);
  const [isListeningName, setIsListeningName] = useState(false);
  const [workType, setWorkType] = useState<WorkerType>('driver');
  const [cityInput, setCityInput] = useState('Pune');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'skills.driving',
    'skills.cleaning',
  ]);
  const [savingsGoal, setSavingsGoal] = useState<number>(5000);
  const [submitted, setSubmitted] = useState(false);

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

  const handleFinish = async () => {
    setSubmitted(true);
    await completeOnboarding({
      name: fullName.trim() || profile.name || 'Setu Worker',
      gender,
      avatarUrl,
      emergencyContact: phoneNumber.trim()
        ? `+91 ${phoneNumber.replace(/^\+91\s*/, '')}`
        : (profile.emergencyContact || ''),
      experienceYears,
      workType,
      cityKey: cityInput ? `cities.${cityInput.toLowerCase()}` : 'cities.pune',
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

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-xs font-bold text-warmCocoa mb-1.5">
                        {t('profileScreen.emergencyContact')}
                      </label>
                      <div className="relative flex">
                        <span className="inline-flex items-center rounded-l-2xl border border-r-0 border-softBorder bg-cleanWhite/80 backdrop-blur-md px-3 text-xs font-bold text-warmCocoa shadow-inner">
                          +91
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="98765 43210"
                          className="w-full rounded-r-2xl border border-softBorder bg-cleanWhite/90 backdrop-blur-md px-3 py-2.5 text-sm font-medium text-textPrimary shadow-inner placeholder:text-textMuted focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta focus:outline-none"
                        />
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
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-bold text-textMuted hover:text-warmCocoa"
                    >
                      {t('common.skip')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
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
                      onClick={() => setStep(3)}
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
                    <label className="block text-sm font-bold text-warmCocoa mb-1">
                      {t('onboarding.skillsTitle')}
                    </label>
                    <p className="text-xs text-textSecondary mb-2.5">
                      {t('onboarding.skillsHint')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_SKILL_KEYS.map((key) => {
                        const isSelected = selectedSkills.includes(key);
                        return (
                          <SkillChip
                            key={key}
                            label={t(key)}
                            selected={isSelected}
                            showToggleIcon
                            onPress={() => toggleSkill(key)}
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
                        {workerTypeOptions.find((o) => o.type === workType)?.labelKey
                          ? t(workerTypeOptions.find((o) => o.type === workType)!.labelKey)
                          : 'Driver'}{' '}
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
