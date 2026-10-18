import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import ModalPortal from '../components/ModalPortal';
import { useProfile, type Gender } from '../hooks/ProfileContext';
import { useVoiceAssistant } from '../hooks/VoiceAssistantContext';
import { useTransactions } from '../hooks/TransactionContext';
import {
  CITY_KEYS,
  SUGGESTED_SKILL_KEYS,
  workerTypeOptions,
  genderOptions,
  type Availability,
  type WorkerType,
} from '../data/mockData';
import { AppIcon } from '../lib/icons';
import {
  changeAppLanguage,
  SUPPORTED_LANGUAGE_CODES,
  LANGUAGE_NATIVE_NAMES,
  type LanguageCode,
} from '../localization';
import { seedDemoTransactions } from '../services/transactionService';
import NotificationSettingsSection from '../components/notifications/NotificationSettingsSection';
import { feedback, playTap, playPop, playSelect } from '../lib/feedback';
import { readTextAloud, setSpeechRate, getSpeechRate } from '../lib/speechSynthesis';

type ProfileTab = 'personal' | 'work' | 'language' | 'notifications' | 'privacy' | 'preferences';

const AVAILABILITY_OPTIONS: { id: Availability; label: string }[] = [
  { id: 'anytime', label: 'Full Time / Any time' },
  { id: 'today', label: 'Immediate / Today' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
];

const SILENCE_TIMEOUT_OPTIONS = [
  { sec: 3, label: '3 Seconds (Fast)' },
  { sec: 5, label: '5 Seconds (Balanced)' },
  { sec: 8, label: '8 Seconds (Relaxed)' },
];

const SPEECH_SPEED_OPTIONS = [
  { rate: 0.85, label: '0.85x (Slower)' },
  { rate: 0.95, label: '0.95x (Standard)' },
  { rate: 1.15, label: '1.15x (Faster)' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    profile,
    updateProfile,
    strength,
    logout,
    user,
    isCloudConnected,
    openAuthModal,
  } = useProfile();
  const { syncWithCloud } = useTransactions();
  const { openAssistant } = useVoiceAssistant();

  const [syncingCloud, setSyncingCloud] = useState(false);

  // Active Tab

  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

  // Personal Information
  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<Gender | null>(profile.gender || null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [cityKey, setCityKey] = useState(profile.cityKey);
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact);

  // Work & Skills
  const [workType, setWorkType] = useState<WorkerType>(profile.workType || 'driver');
  const [experienceYears, setExperienceYears] = useState(String(profile.experienceYears));
  const [availability, setAvailability] = useState<Availability>(profile.availability);
  const [payMin, setPayMin] = useState(String(profile.payMin));
  const [payMax, setPayMax] = useState(String(profile.payMax));
  const [savingsGoal, setSavingsGoal] = useState(String(profile.savingsGoal));
  const [weeklySaveGoal, setWeeklySaveGoal] = useState(String(profile.weeklySaveGoal || 350));
  const [skillKeys, setSkillKeys] = useState<string[]>(profile.skillKeys);
  const [customSkills, setCustomSkills] = useState<string[]>(profile.customSkills);
  const [newSkillText, setNewSkillText] = useState('');

  // Language & Accessibility
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(
    (profile.preferredLanguage as LanguageCode) || (i18n.language as LanguageCode) || 'en'
  );
  const [speechSpeed, setSpeechSpeed] = useState<number>(() => {
    return profile.speechRate || getSpeechRate();
  });
  const [silenceTimeout, setSilenceTimeout] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('@setu/voice_silence_timeout');
      return stored ? parseInt(stored, 10) : profile.voiceSilenceTimeout || 5;
    } catch {
      return 5;
    }
  });
  const [soundMuted, setSoundMuted] = useState(() => feedback.isMuted);
  const [autoReadout, setAutoReadout] = useState(() => {
    try {
      return localStorage.getItem('@setu/auto_readout') === 'true';
    } catch {
      return false;
    }
  });

  // Privacy & Security
  const [privacyMaskEarnings, setPrivacyMaskEarnings] = useState<boolean>(() => {
    return !!profile.privacyMaskEarnings;
  });

  // App Preferences
  const [expenseAlerts, setExpenseAlerts] = useState(() => {
    try {
      return localStorage.getItem('@setu/expense_alerts') !== 'false';
    } catch {
      return true;
    }
  });
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Status & Modal states
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [demoResetSuccess, setDemoResetSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Online status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Synchronize sound muted state with feedback manager
  useEffect(() => {
    return feedback.subscribe((muted) => {
      setSoundMuted(muted);
    });
  }, []);

  // Keep state in sync if profile updates externally
  useEffect(() => {
    setName(profile.name);
    setGender(profile.gender || null);
    setAvatarUrl(profile.avatarUrl || '');
    setCityKey(profile.cityKey);
    setWorkType(profile.workType || 'driver');
    setSkillKeys(profile.skillKeys);
    setCustomSkills(profile.customSkills);
    setExperienceYears(String(profile.experienceYears));
    setAvailability(profile.availability);
    setPayMin(String(profile.payMin));
    setPayMax(String(profile.payMax));
    setEmergencyContact(profile.emergencyContact);
    setSavingsGoal(String(profile.savingsGoal));
    setWeeklySaveGoal(String(profile.weeklySaveGoal || 350));
    setPrivacyMaskEarnings(!!profile.privacyMaskEarnings);
  }, [profile]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setAvatarUrl(dataUrl);
          playTap();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    playTap();
  };

  const handleAddCustomSkill = () => {
    const trimmed = newSkillText.trim();
    if (!trimmed) return;
    if (!customSkills.includes(trimmed)) {
      setCustomSkills([...customSkills, trimmed]);
      playPop();
    }
    setNewSkillText('');
  };

  const handleAddSuggestedSkill = (key: string) => {
    if (!skillKeys.includes(key)) {
      setSkillKeys([...skillKeys, key]);
      playPop();
    }
  };

  const handleRemoveSkillKey = (key: string) => {
    setSkillKeys(skillKeys.filter((k) => k !== key));
    playTap();
  };

  const handleRemoveCustomSkill = (skill: string) => {
    setCustomSkills(customSkills.filter((s) => s !== skill));
    playTap();
  };

  const handleToggleSound = () => {
    const nextMuted = feedback.toggleMute();
    setSoundMuted(nextMuted);
  };

  const handleTestSpeech = () => {
    playTap();
    readTextAloud(
      selectedLang === 'hi'
        ? 'नमस्ते! यह सेतु का आवाज़ सहायक है।'
        : selectedLang === 'mr'
        ? 'नमस्कार! हे सेतूचे व्हॉइस असिस्टंट आहे.'
        : 'Hello! This is your Setu voice companion test.',
      selectedLang
    );
  };

  const handleTestHaptic = () => {
    playPop();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 60, 40]);
    }
  };

  const handleSave = async () => {
    setValidationError(null);
    if (!name.trim()) {
      setValidationError(t('profileScreen.validationName') || 'Please enter your name.');
      setActiveTab('personal');
      return;
    }

    const minP = Number(payMin) || 0;
    const maxP = Number(payMax) || 0;
    if (minP > maxP && maxP > 0) {
      setValidationError(t('profileScreen.validationMinPay') || 'Maximum pay must be greater than or equal to minimum pay.');
      setActiveTab('work');
      return;
    }

    const cleanedContact = emergencyContact.trim().replace(/\D/g, '');
    if (emergencyContact.trim() && cleanedContact.length < 10) {
      setValidationError(t('profileScreen.validationContact') || 'Please enter a valid 10-digit phone number.');
      setActiveTab('personal');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update Core Profile
      await updateProfile({
        name: name.trim(),
        gender,
        avatarUrl,
        cityKey,
        workType,
        skillKeys,
        customSkills,
        experienceYears: Number(experienceYears) || 5,
        availability,
        payMin: minP || 400,
        payMax: maxP || 700,
        emergencyContact: emergencyContact.trim(),
        savingsGoal: Number(savingsGoal) || 10000,
        weeklySaveGoal: Number(weeklySaveGoal) || 350,
        preferredLanguage: selectedLang,
        speechRate: speechSpeed,
        voiceSilenceTimeout: silenceTimeout,
        privacyMaskEarnings,
      });

      // 2. Persist Audio, Voice & App Preferences to storage
      setSpeechRate(speechSpeed);
      localStorage.setItem('@setu/voice_silence_timeout', String(silenceTimeout));
      localStorage.setItem('@setu/auto_readout', String(autoReadout));
      localStorage.setItem('@setu/expense_alerts', String(expenseAlerts));

      // 3. Update Language if changed
      if (selectedLang !== i18n.language) {
        await changeAppLanguage(selectedLang);
      }

      playPop();
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    playTap();
    // Reset all local edits back to profile values
    setName(profile.name);
    setGender(profile.gender || null);
    setAvatarUrl(profile.avatarUrl || '');
    setCityKey(profile.cityKey);
    setWorkType(profile.workType || 'driver');
    setSkillKeys(profile.skillKeys);
    setCustomSkills(profile.customSkills);
    setExperienceYears(String(profile.experienceYears));
    setAvailability(profile.availability);
    setPayMin(String(profile.payMin));
    setPayMax(String(profile.payMax));
    setEmergencyContact(profile.emergencyContact);
    setSavingsGoal(String(profile.savingsGoal));
    setWeeklySaveGoal(String(profile.weeklySaveGoal || 350));
    setSelectedLang((profile.preferredLanguage as LanguageCode) || (i18n.language as LanguageCode) || 'en');
    setSpeechSpeed(profile.speechRate || getSpeechRate());
    setSilenceTimeout(profile.voiceSilenceTimeout || 5);
    setPrivacyMaskEarnings(!!profile.privacyMaskEarnings);
    setValidationError(null);
    navigate(-1);
  };

  const handleLogout = async () => {
    playTap();
    await logout();
    navigate('/', { replace: true });
  };

  const handleResetDemoData = () => {
    playTap();
    seedDemoTransactions();
    setDemoResetSuccess(true);
    setTimeout(() => setDemoResetSuccess(false), 2500);
  };

  const handleExportProfile = () => {
    playTap();
    const exportData = {
      app: 'FairWork Setu',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      profile: {
        ...profile,
        name,
        gender,
        cityKey,
        workType,
        skillKeys,
        customSkills,
        experienceYears,
        availability,
        payMin,
        payMax,
        emergencyContact,
        savingsGoal,
        weeklySaveGoal,
        preferredLanguage: selectedLang,
      },
      settings: {
        speechSpeed,
        silenceTimeoutSeconds: silenceTimeout,
        soundMuted,
        autoReadout,
        privacyMaskEarnings,
        expenseAlerts,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairwork-setu-${name.toLowerCase().replace(/\s+/g, '-')}-profile.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleClearCache = () => {
    playTap();
    try {
      localStorage.removeItem('@setu/privacy_mask');
      localStorage.removeItem('@setu/expense_alerts');
      localStorage.removeItem('@setu/auto_readout');
      setShowClearDataConfirm(false);
      setDemoResetSuccess(true);
      setTimeout(() => setDemoResetSuccess(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen w-full bg-transparent px-4 py-4 md:py-8 pb-36">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between border-b border-softBorder pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playTap();
                navigate(-1);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-cleanWhite/90 backdrop-blur-md shadow-card border border-softBorder hover:bg-cleanWhite text-warmCocoa transition-all active:scale-95"
              aria-label="Back"
            >
              <AppIcon name="arrow-back" size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-warmCocoa font-serif">
                {t('profileScreen.title', 'Profile & Settings')}
              </h1>
              <p className="text-xs text-textSecondary font-medium">
                {name} • {t(`workerTypes.${workType}`)} • {t(cityKey)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playTap();
                openAssistant();
              }}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
              aria-label="Voice Assistant"
            >
              <AppIcon name="mic" size={14} className="text-white drop-shadow" />
              <span>Voice</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTap();
                setShowLogoutConfirm(true);
              }}
              className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all shadow-xs active:scale-95"
              title={t('profileScreen.logout', 'Log Out')}
            >
              <AppIcon name="close" size={14} className="text-rose-600" />
              <span>{t('profileScreen.logout', 'Log Out')}</span>
            </button>
          </div>
        </header>

        {/* Profile Strength & Identity Card */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <input
                id="profile-photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <label
                htmlFor="profile-photo-input"
                className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-2xl font-black text-white shadow-card ring-2 ring-white overflow-hidden group transition-transform hover:scale-105"
                title="Upload Photo / Selfie"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  name.charAt(0) || 'R'
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <AppIcon name="camera-outline" size={18} />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-saffronGold text-deepNavy shadow-xs border border-white">
                  <AppIcon name="camera-outline" size={12} />
                </div>
              </label>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-extrabold text-warmCocoa leading-tight">
                    {name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase tracking-wider">
                    {t('profileScreen.readOnlyBadge', 'Verified on Device')} ✓
                  </span>
                </div>
                <p className="text-xs font-semibold text-terracotta mt-0.5">
                  {t(`workerTypes.${workType}`)} • {t(cityKey)} • {experienceYears} yrs
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <label
                    htmlFor="profile-photo-input"
                    className="text-xs font-bold text-terracotta hover:underline cursor-pointer"
                  >
                    {t('profileScreen.changePhoto')}
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Strength Widget */}
            <div className="sm:w-64 sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-softBorder">
              <div className="flex items-center justify-between sm:justify-end gap-2 mb-1.5">
                <span className="text-xs font-bold text-warmCocoa">
                  {t('profileScreen.strength', { percent: strength })}
                </span>
                <span className="text-[11px] font-extrabold text-success">
                  {strength >= 80 ? 'Excellent' : t('profileScreen.stabilityGood')}
                </span>
              </div>
              <ProgressBar
                progress={strength / 100}
                color="#B34A26"
                trackColor="#FDF3EE"
              />
              <p className="text-[11px] text-textMuted mt-1">
                {t('profileScreen.strengthHint')}
              </p>
            </div>
          </div>
        </Card>

        {/* Cloud Account & Database Sync Banner */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isCloudConnected
              ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border-emerald-200/80 text-emerald-950 shadow-xs'
              : 'bg-gradient-to-r from-amber-50/90 to-orange-50/70 border-amber-200/80 text-amber-950 shadow-xs'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                  isCloudConnected ? 'bg-emerald-600 text-white' : 'bg-[#B34A26] text-white'
                }`}
              >
                <AppIcon name={isCloudConnected ? 'shield-check' : 'user'} size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {isCloudConnected ? '☁️ Supabase Cloud Synced' : '💾 Local Storage / Demo Mode'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isCloudConnected
                        ? 'bg-emerald-200/80 text-emerald-800'
                        : 'bg-amber-200/80 text-amber-800'
                    }`}
                  >
                    {isCloudConnected ? 'Active' : 'Offline Safe'}
                  </span>
                </div>
                <p className="text-xs mt-0.5 opacity-90">
                  {isCloudConnected
                    ? `Signed in as ${user?.phone || user?.email || 'Authenticated Worker'}. Transactions and profile are backed up in PostgreSQL.`
                    : 'Currently saving data on device. Sign in with Phone OTP or Email to sync across devices.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isCloudConnected ? (
                <button
                  type="button"
                  disabled={syncingCloud}
                  onClick={async () => {
                    playTap();
                    setSyncingCloud(true);
                    await syncWithCloud();
                    setTimeout(() => setSyncingCloud(false), 600);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-white border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-xs active:scale-95 transition-all"
                >
                  <AppIcon name="refresh" size={13} className={syncingCloud ? 'animate-spin' : ''} />
                  <span>{syncingCloud ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    openAuthModal();
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#8C3415] text-white px-4 py-2 text-xs font-bold shadow-sm hover:shadow-md active:scale-95 transition-all"
                >
                  <AppIcon name="user" size={14} />
                  <span>Sign In / Cloud Sync</span>
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Validation Error Banner */}
        {validationError && (
          <div className="rounded-2xl bg-danger/10 border border-danger/30 p-3.5 flex items-center gap-2.5 text-danger text-xs font-bold animate-fade-in">
            <AppIcon name="alert-circle" size={18} />
            <span>{validationError}</span>
          </div>
        )}

        {/* 5-Tab Segmented Navigation Bar */}
        <nav
          aria-label="Profile and Settings Tabs"
          className="flex items-center p-1.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-[#F4EBDD] shadow-xs overflow-x-auto gap-1"
        >
          <button
            type="button"
            onClick={() => {
              playSelect();
              setActiveTab('personal');
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'personal'
                ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-md'
                : 'text-textSecondary hover:bg-white hover:text-deepEmerald'
            }`}
          >
            <AppIcon name="person" size={15} />
            <span>{t('profileScreen.tabsPersonal', 'Personal')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSelect();
              setActiveTab('work');
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'work'
                ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-md'
                : 'text-textSecondary hover:bg-white hover:text-deepEmerald'
            }`}
          >
            <AppIcon name="briefcase" size={15} />
            <span>{t('profileScreen.tabsWork', 'Work & Skills')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSelect();
              setActiveTab('language');
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'language'
                ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-md'
                : 'text-textSecondary hover:bg-white hover:text-deepEmerald'
            }`}
          >
            <AppIcon name="globe" size={15} />
            <span>{t('profileScreen.tabsLanguage', 'Language & Audio')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSelect();
              setActiveTab('notifications');
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-md'
                : 'text-textSecondary hover:bg-white hover:text-deepEmerald'
            }`}
          >
            <AppIcon name="notifications" size={15} />
            <span>{t('profileScreen.tabsNotifications', 'Notifications')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSelect();
              setActiveTab('privacy');
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'privacy'
                ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-md'
                : 'text-textSecondary hover:bg-white hover:text-deepEmerald'
            }`}
          >
            <AppIcon name="shield-checkmark" size={15} />
            <span>{t('profileScreen.tabsPrivacy', 'Privacy & Data')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSelect();
              setActiveTab('preferences');
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'preferences'
                ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-md'
                : 'text-textSecondary hover:bg-white hover:text-deepEmerald'
            }`}
          >
            <AppIcon name="settings" size={15} />
            <span>{t('profileScreen.tabsPreferences', 'App Preferences')}</span>
          </button>
        </nav>

        {/* TAB 1: PERSONAL INFORMATION */}
        {activeTab === 'personal' && (
          <div className="space-y-4 animate-fade-in">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-softBorder pb-2">
                <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                  {t('profileScreen.tabsPersonal', 'Personal Information')}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                  {t('profileScreen.editableBadge', 'Editable')}
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-warmCocoa mb-1">
                  {t('profileScreen.name')} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-2xl border border-softBorder bg-warmCream/40 backdrop-blur-md px-3.5 py-2.5 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-terracotta/30 focus:outline-none"
                />
                <p className="text-[11px] text-textMuted mt-1">
                  {t('profileScreen.nameHint', 'Your legal or preferred trade name')}
                </p>
              </div>

              {/* Gender Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-warmCocoa">
                    {t('gender.label')}{' '}
                    <span className="text-[11px] font-normal text-textMuted">
                      ({t('gender.optionalBadge')})
                    </span>
                  </label>
                  <span className="text-[10px] text-textMuted">
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
                        onClick={() => {
                          playTap();
                          setGender(isSelected ? null : opt.id);
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-card border border-saffronGold/40'
                            : 'bg-warmCream/60 backdrop-blur-md text-textSecondary border border-softBorder hover:bg-cleanWhite shadow-xs'
                        }`}
                      >
                        <AppIcon name={opt.icon} size={14} />
                        <span>{t(opt.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operating City */}
              <div>
                <label className="block text-xs font-bold text-warmCocoa mb-1">
                  {t('profileScreen.city')} *
                </label>
                <select
                  value={cityKey}
                  onChange={(e) => setCityKey(e.target.value)}
                  className="w-full rounded-2xl border border-softBorder bg-warmCream/40 backdrop-blur-md px-3.5 py-2.5 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-terracotta/30 focus:outline-none"
                >
                  {CITY_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {t(k)}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-textMuted mt-1">
                  {t('profileScreen.cityHint', 'Your primary city for local gig and marketplace discovery')}
                </p>
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-xs font-bold text-warmCocoa mb-1">
                  {t('profileScreen.emergencyContact')} *
                </label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-2xl border border-softBorder bg-warmCream/40 backdrop-blur-md px-3.5 py-2.5 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-terracotta/30 focus:outline-none"
                />
                <p className="text-[11px] text-textMuted mt-1">
                  {t('profileScreen.emergencyHint', '10-digit phone number for urgent job and health alerts')}
                </p>
              </div>
            </Card>

            {/* Read-Only System Details Card */}
            <Card className="p-4 bg-stone-50/70 border border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-textMuted uppercase tracking-wider">
                  {t('profileScreen.readOnlyBadge', 'System & Device Credentials')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-black">
                  Read Only
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-textMuted block">FairWork Setu Worker ID</span>
                  <span className="font-mono font-bold text-[#1E2B3E]">SETU-IND-7782</span>
                </div>
                <div>
                  <span className="text-textMuted block">Registration Mode</span>
                  <span className="font-semibold text-emerald-800">Local Verified Sandbox</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: WORK & SKILLS */}
        {activeTab === 'work' && (
          <div className="space-y-4 animate-fade-in">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-softBorder pb-2">
                <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                  {t('profileScreen.tabsWork', 'Trade, Skills & Compensation')}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                  {t('profileScreen.editableBadge', 'Editable')}
                </span>
              </div>

              {/* Primary Work Type */}
              <div>
                <label className="block text-xs font-bold text-warmCocoa mb-1.5">
                  {t('profileScreen.workType')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {workerTypeOptions.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => {
                        playTap();
                        setWorkType(opt.type);
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                        workType === opt.type
                          ? 'bg-terracotta/10 border-2 border-terracotta text-warmCocoa shadow-card'
                          : 'bg-warmCream/60 backdrop-blur-md text-textSecondary border border-softBorder hover:bg-cleanWhite shadow-xs'
                      }`}
                    >
                      <AppIcon name={opt.icon} size={16} />
                      <span className="truncate">{t(opt.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Years & Savings Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warmCocoa mb-1">
                    {t('profileScreen.experience')} (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full rounded-2xl border border-softBorder bg-warmCream/40 backdrop-blur-md px-3.5 py-2.5 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-terracotta/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-warmCocoa mb-1">
                    {t('profileScreen.weeklySaveGoal', 'Weekly Savings Target')} (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={weeklySaveGoal}
                    onChange={(e) => setWeeklySaveGoal(e.target.value)}
                    placeholder="350"
                    className="w-full rounded-2xl border border-softBorder bg-warmCream/40 backdrop-blur-md px-3.5 py-2.5 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-terracotta/30 focus:outline-none"
                  />
                  <p className="text-[11px] text-textMuted mt-1">
                    {t('profileScreen.weeklySaveGoalHint', 'Emergency savings target calculated in Dhan')}
                  </p>
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs font-bold text-warmCocoa mb-1.5">
                  {t('profileScreen.availability')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AVAILABILITY_OPTIONS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        playTap();
                        setAvailability(av.id);
                      }}
                      className={`rounded-xl p-2.5 text-xs font-bold text-center transition-all active:scale-95 ${
                        availability === av.id
                          ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-card border border-saffronGold/40'
                          : 'bg-warmCream/60 backdrop-blur-md text-textSecondary border border-softBorder hover:bg-cleanWhite shadow-xs'
                      }`}
                    >
                      {t(`availability.${av.id}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pay Range Expectations */}
              <div>
                <label className="block text-xs font-bold text-warmCocoa mb-1">
                  {t('profileScreen.payRange')} (₹ / day)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-textMuted block mb-0.5">Min Pay (₹)</span>
                    <input
                      type="number"
                      step="50"
                      value={payMin}
                      onChange={(e) => setPayMin(e.target.value)}
                      placeholder="400"
                      className="w-full rounded-2xl border border-softBorder bg-warmCream/40 backdrop-blur-md px-3.5 py-2.5 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-terracotta/30 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-textMuted block mb-0.5">Max Pay (₹)</span>
                    <input
                      type="number"
                      step="50"
                      value={payMax}
                      onChange={(e) => setPayMax(e.target.value)}
                      placeholder="700"
                      className="w-full rounded-2xl border border-softBorder bg-warmCream/40 backdrop-blur-md px-3.5 py-2.5 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-terracotta/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Declared & Custom Skills */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-warmCocoa">
                  {t('profileScreen.skills')}
                </label>

                {/* Current Skills list */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-2xl bg-warmCream/30 border border-softBorder">
                  {skillKeys.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1 rounded-full bg-warmAmber/20 border border-warmAmber/30 px-3 py-1 text-xs font-bold text-warmCocoa"
                    >
                      <span>{t(sk)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillKey(sk)}
                        className="text-textMuted hover:text-danger ml-1"
                        aria-label="Remove skill"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {customSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1 rounded-full bg-[#B34A26]/10 border border-[#B34A26]/30 px-3 py-1 text-xs font-bold text-terracotta"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSkill(sk)}
                        className="text-textMuted hover:text-danger ml-1"
                        aria-label="Remove skill"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {skillKeys.length === 0 && customSkills.length === 0 && (
                    <span className="text-xs text-textMuted italic py-1">No skills added yet. Choose from suggestions below.</span>
                  )}
                </div>

                {/* Add Custom Skill */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                    placeholder={t('profileScreen.skillPlaceholder')}
                    className="flex-1 rounded-xl border border-softBorder bg-warmCream/40 backdrop-blur-md px-3 py-2 text-xs font-medium text-textPrimary focus:ring-2 focus:ring-terracotta/30 focus:outline-none shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSkill();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="rounded-xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] px-3.5 py-2 text-xs font-bold text-white shadow-card hover:brightness-110 active:scale-95 transition-all"
                  >
                    + {t('common.add')}
                  </button>
                </div>

                {/* Suggestions */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-textMuted block mb-1.5">
                    Suggested Trade Skills (Click to add):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_SKILL_KEYS.filter((k) => !skillKeys.includes(k)).slice(0, 8).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleAddSuggestedSkill(k)}
                        className="rounded-full bg-white/80 hover:bg-white text-deepEmerald border border-softBorder px-2.5 py-1 text-[11px] font-bold shadow-xs active:scale-95 transition-all"
                      >
                        + {t(k)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Link to Skills Passport */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/70 border border-[#F4EBDD] shadow-xs">
              <div className="flex items-center gap-2.5">
                <AppIcon name="school" size={20} className="text-terracotta" />
                <div>
                  <span className="text-xs font-bold text-warmCocoa block">Setu Kaushal Skill Passport</span>
                  <span className="text-[11px] text-textSecondary">View certificates and shareable passport PDF</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playTap();
                  navigate('/kaushal');
                }}
                className="text-xs font-bold text-terracotta hover:underline"
              >
                Open Passport →
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: LANGUAGE & ACCESSIBILITY */}
        {activeTab === 'language' && (
          <div className="space-y-4 animate-fade-in">
            {/* Preferred Language */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-softBorder pb-2">
                <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                  {t('profileScreen.preferredLanguage')}
                </h3>
                <span className="text-xs font-bold text-terracotta">
                  {LANGUAGE_NATIVE_NAMES[selectedLang]} ({selectedLang.toUpperCase()})
                </span>
              </div>
              <p className="text-xs text-textSecondary">
                Choose the language you prefer for voice conversations, text, audio readouts, and medical cards.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {SUPPORTED_LANGUAGE_CODES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      playSelect();
                      setSelectedLang(code);
                    }}
                    className={`rounded-2xl p-3 text-xs font-bold transition-all text-center active:scale-95 ${
                      selectedLang === code
                        ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-card border border-saffronGold/40 ring-2 ring-saffronGold/30'
                        : 'bg-warmCream/60 backdrop-blur-md text-textSecondary border border-softBorder hover:bg-cleanWhite shadow-xs'
                    }`}
                  >
                    <span className="block text-sm font-black mb-0.5">{LANGUAGE_NATIVE_NAMES[code]}</span>
                    <span className="text-[10px] opacity-80 uppercase tracking-wider">{code}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Voice Assistant & Speech Settings */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-softBorder pb-2">
                <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                  Voice Assistant & Speech Guidance
                </h3>
                <button
                  type="button"
                  onClick={handleTestSpeech}
                  className="inline-flex items-center gap-1 rounded-full bg-warmCream px-2.5 py-1 text-[11px] font-bold text-terracotta border border-warmAmber/40 hover:bg-white active:scale-95"
                >
                  <AppIcon name="volume-high" size={12} />
                  <span>Test Voice</span>
                </button>
              </div>

              {/* Speech Speed */}
              <div>
                <label className="block text-xs font-bold text-warmCocoa mb-1.5">
                  {t('profileScreen.voiceRate', 'Assistant Speech Speed')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SPEECH_SPEED_OPTIONS.map((opt) => (
                    <button
                      key={opt.rate}
                      type="button"
                      onClick={() => {
                        playTap();
                        setSpeechSpeed(opt.rate);
                        setSpeechRate(opt.rate);
                      }}
                      className={`rounded-xl py-2 px-3 text-xs font-bold transition-all active:scale-95 ${
                        speechSpeed === opt.rate
                          ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-sm'
                          : 'bg-warmCream/60 text-textSecondary border border-softBorder hover:bg-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Silence Detection Timeout */}
              <div>
                <label className="block text-xs font-bold text-warmCocoa mb-1.5">
                  {t('profileScreen.voiceSilence', 'Continuous Speech Silence Window')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SILENCE_TIMEOUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.sec}
                      type="button"
                      onClick={() => {
                        playTap();
                        setSilenceTimeout(opt.sec);
                      }}
                      className={`rounded-xl py-2 px-3 text-xs font-bold transition-all active:scale-95 ${
                        silenceTimeout === opt.sec
                          ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-sm'
                          : 'bg-warmCream/60 text-textSecondary border border-softBorder hover:bg-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-textMuted mt-1">
                  How long the microphone listens during continuous conversational speech before automatic submission.
                </p>
              </div>

              {/* Auto Readout Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-warmCream/40 border border-softBorder">
                <div>
                  <span className="text-xs font-bold text-warmCocoa block">
                    Automatic Audio Prompts
                  </span>
                  <span className="text-[11px] text-textSecondary">
                    Read aloud doctor guidelines and financial summaries upon opening modals
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setAutoReadout(!autoReadout);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoReadout ? 'bg-[#B34A26]' : 'bg-stone-300'
                  }`}
                  role="switch"
                  aria-checked={autoReadout}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoReadout ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </Card>

            {/* Sound Effects & Haptics */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-softBorder pb-2">
                <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                  Tactile Feedback & Sounds
                </h3>
                <button
                  type="button"
                  onClick={handleTestHaptic}
                  className="inline-flex items-center gap-1 rounded-full bg-warmCream px-2.5 py-1 text-[11px] font-bold text-terracotta border border-warmAmber/40 hover:bg-white active:scale-95"
                >
                  <AppIcon name="sparkles" size={12} />
                  <span>Test Feedback</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-warmCream/40 border border-softBorder">
                <div>
                  <span className="text-xs font-bold text-warmCocoa block">
                    Audio Chimes on Touch & Actions
                  </span>
                  <span className="text-[11px] text-textSecondary">
                    Subtle auditory chimes when tapping buttons, switching tabs, and submitting forms
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    !soundMuted ? 'bg-[#B34A26]' : 'bg-stone-300'
                  }`}
                  role="switch"
                  aria-checked={!soundMuted}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      !soundMuted ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: SMART NOTIFICATIONS */}
        {activeTab === 'notifications' && <NotificationSettingsSection />}

        {/* TAB 5: PRIVACY & DATA */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 animate-fade-in">
            {/* Privacy Masking Card */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-softBorder pb-2">
                <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                  {t('profileScreen.privacyMaskTitle', 'Privacy Masking')}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase">
                  Safety Feature
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-warmCream/40 border border-softBorder">
                <div className="max-w-md">
                  <span className="text-xs font-bold text-warmCocoa block">
                    Mask Exact Rupee Balances on Dashboard
                  </span>
                  <span className="text-[11px] text-textSecondary block mt-0.5">
                    {t('profileScreen.privacyMaskSub', 'Hides exact rupee earnings (shows ₹••••) on Home Dashboard to prevent shoulder-surfing in public transit or tea stalls.')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setPrivacyMaskEarnings(!privacyMaskEarnings);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    privacyMaskEarnings ? 'bg-[#B34A26]' : 'bg-stone-300'
                  }`}
                  role="switch"
                  aria-checked={privacyMaskEarnings}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      privacyMaskEarnings ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </Card>

            {/* Local Storage & Data Export Card */}
            <Card className="p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-softBorder pb-2">
                <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                  Device Storage & Data Portability
                </h3>
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <span>●</span> Local Encrypted
                </span>
              </div>
              <p className="text-xs text-textSecondary leading-relaxed">
                FairWork Setu operates privacy-first. All profile information, logged transactions, and offline notes are stored directly within your device’s sandbox. No personal data is brokered or sold.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportProfile}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white border border-[#F4EBDD] hover:bg-warmCream/60 px-4 py-2.5 text-xs font-bold text-deepEmerald shadow-xs transition-all active:scale-95"
                >
                  <AppIcon name="download-outline" size={15} />
                  <span>{t('profileScreen.exportProfile', 'Export Profile (JSON)')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-warmCream/60 hover:bg-white border border-warmAmber/40 px-4 py-2.5 text-xs font-bold text-terracotta shadow-xs transition-all active:scale-95"
                >
                  <AppIcon name="refresh" size={15} />
                  <span>{t('profileScreen.reloadDemo', 'Reload 5-Day Demo Data')}</span>
                </button>
              </div>
            </Card>

            {/* Clear Local Cache */}
            <Card className="p-4 bg-rose-50/50 border border-rose-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-800 block">
                    Reset Cached Preferences
                  </span>
                  <span className="text-[11px] text-rose-600/90">
                    Clears non-essential UI caches while keeping your main profile and earnings safe.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearDataConfirm(true)}
                  className="rounded-xl bg-white border border-rose-300 text-rose-700 px-3 py-1.5 text-xs font-bold hover:bg-rose-100 shadow-xs active:scale-95 transition-all"
                >
                  Clear Cache
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: APP PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 animate-fade-in">
            {/* Network & Offline Status */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-softBorder pb-2">
                <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                  {t('profileScreen.offlineStatus', 'Network & Synchronization Status')}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-textSecondary">
                {isOnline
                  ? t('profileScreen.offlineOnline', 'Online • Device is connected. AI models & local cache ready.')
                  : t('profileScreen.offlineOffline', 'Offline • Working in offline cached mode. Logged entries will sync.')}
              </p>
            </Card>

            {/* Financial Alerts */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-softBorder pb-2">
                <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                  Proactive Worker Safety Alerts
                </h3>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-warmCream/40 border border-softBorder">
                <div>
                  <span className="text-xs font-bold text-warmCocoa block">
                    Daily High-Expense Warning
                  </span>
                  <span className="text-[11px] text-textSecondary">
                    Show gentle alert when today's expenses exceed 50% of today's earnings
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setExpenseAlerts(!expenseAlerts);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    expenseAlerts ? 'bg-[#B34A26]' : 'bg-stone-300'
                  }`}
                  role="switch"
                  aria-checked={expenseAlerts}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      expenseAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </Card>

            {/* Session & Logout Section */}
            <Card className="p-5 space-y-3 border-rose-200 bg-rose-50/30">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
                <h3 className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                  {t('profileScreen.accountSession', 'Account Session')}
                </h3>
              </div>
              <p className="text-xs text-textSecondary">
                Logging out safely ends your active session and returns to the initial welcome screen. Your stored transactions and credentials remain safely cached on this phone.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setShowLogoutConfirm(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white py-3 px-5 text-xs font-bold shadow-card active:scale-95 transition-all"
                >
                  <AppIcon name="close" size={15} />
                  <span>{t('profileScreen.logout', 'Log Out of Setu')}</span>
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* STICKY BOTTOM SAVE & CANCEL BAR */}
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-[#F4EBDD] py-3.5 px-4 shadow-[0_-8px_30px_rgba(7,59,58,0.08)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 sm:flex-initial sm:min-w-[130px] rounded-full border border-softBorder bg-cleanWhite/90 backdrop-blur-md py-3 px-4 text-xs font-bold text-textSecondary hover:bg-cleanWhite transition-all shadow-xs active:scale-95"
            >
              {t('profileScreen.cancel', 'Cancel')}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="emerald-gradient-btn flex-[2] sm:flex-initial sm:min-w-[200px] flex items-center justify-center gap-2 rounded-full py-3 px-6 text-xs font-extrabold text-white shadow-card hover:shadow-cardHover border border-saffronGold/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isSaving && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{isSaving ? t('profileScreen.saving', 'Saving...') : t('profileScreen.saveChanges', 'Save Changes')}</span>
            </button>
          </div>
        </div>

        {/* LOGOUT CONFIRMATION MODAL */}
        <ModalPortal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          maxWidthClass="sm:max-w-sm"
        >
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 border border-rose-200">
              <AppIcon name="close" size={26} />
            </div>
            <div>
              <h3 className="text-base font-black text-warmCocoa">
                {t('profileScreen.logoutPromptTitle', 'Log Out of Setu?')}
              </h3>
              <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                {t('profileScreen.logoutPromptSub', 'You will be returned to the welcome screen. Your saved transactions and details will remain safe in local storage.')}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-softBorder bg-cleanWhite/80 py-2.5 text-xs font-bold text-textSecondary hover:bg-white transition-all shadow-xs active:scale-95"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white shadow-card hover:bg-rose-700 transition-all active:scale-95"
              >
                {t('profileScreen.confirmLogout', 'Yes, Log Out')}
              </button>
            </div>
          </div>
        </ModalPortal>

        {/* CLEAR CACHE CONFIRMATION MODAL */}
        <ModalPortal
          isOpen={showClearDataConfirm}
          onClose={() => setShowClearDataConfirm(false)}
          maxWidthClass="sm:max-w-sm"
        >
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-300">
              <AppIcon name="refresh" size={26} />
            </div>
            <div>
              <h3 className="text-base font-black text-warmCocoa">
                Reset UI Caches?
              </h3>
              <p className="text-xs text-textSecondary mt-1">
                This resets cached display flags while keeping your primary profile credentials, bank data, and job records intact.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearDataConfirm(false)}
                className="flex-1 rounded-full border border-softBorder bg-cleanWhite/80 py-2.5 text-xs font-bold text-textSecondary hover:bg-white transition-all shadow-xs active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearCache}
                className="flex-1 rounded-full bg-amber-600 py-2.5 text-xs font-bold text-white shadow-card hover:bg-amber-700 transition-all active:scale-95"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </ModalPortal>

        {/* SUCCESS TOASTS */}
        {savedSuccess && (
          <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 animate-fade-in pointer-events-none">
            <div className="flex items-center gap-2 rounded-full bg-[#1E2B3E] px-6 py-3 text-sm font-extrabold text-white shadow-lifted border border-saffronGold/40">
              <AppIcon name="checkmark-circle" size={18} className="text-saffronGold" />
              <span>{t('profileScreen.saved', 'Profile updated successfully!')}</span>
            </div>
          </div>
        )}

        {demoResetSuccess && (
          <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 animate-fade-in pointer-events-none">
            <div className="flex items-center gap-2 rounded-full bg-[#1E2B3E] px-6 py-3 text-sm font-extrabold text-white shadow-lifted border border-saffronGold/40">
              <AppIcon name="checkmark-circle" size={18} className="text-saffronGold" />
              <span>Demo transactions loaded for past 5 days!</span>
            </div>
          </div>
        )}

        {exportSuccess && (
          <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 animate-fade-in pointer-events-none">
            <div className="flex items-center gap-2 rounded-full bg-[#1E2B3E] px-6 py-3 text-sm font-extrabold text-white shadow-lifted border border-saffronGold/40">
              <AppIcon name="checkmark-circle" size={18} className="text-saffronGold" />
              <span>{t('profileScreen.exportSuccess', 'Profile data exported successfully!')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
