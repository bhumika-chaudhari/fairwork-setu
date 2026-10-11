import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';
import SkillChip from '../components/SkillChip';
import { useProfile, type Gender } from '../hooks/ProfileContext';
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

const AVAILABILITY_OPTIONS: { id: Availability; label: string }[] = [
  { id: 'anytime', label: 'Full Time / Any time' },
  { id: 'today', label: 'Immediate / Today' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile, updateProfile, strength } = useProfile();

  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<Gender | null>(profile.gender || null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [cityKey, setCityKey] = useState(profile.cityKey);
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'en'
  );
  const [workType, setWorkType] = useState<WorkerType>(profile.workType || 'driver');
  const [skillKeys, setSkillKeys] = useState<string[]>(profile.skillKeys);
  const [customSkills, setCustomSkills] = useState<string[]>(profile.customSkills);
  const [newSkillText, setNewSkillText] = useState('');
  const [experienceYears, setExperienceYears] = useState(String(profile.experienceYears));
  const [availability, setAvailability] = useState<Availability>(profile.availability);
  const [payMin, setPayMin] = useState(String(profile.payMin));
  const [payMax, setPayMax] = useState(String(profile.payMax));
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact);
  const [savingsGoal, setSavingsGoal] = useState(String(profile.savingsGoal));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setAvatarUrl(dataUrl);
          updateProfile({ avatarUrl: dataUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = newSkillText.trim();
    if (!trimmed) return;
    if (!customSkills.includes(trimmed)) {
      setCustomSkills([...customSkills, trimmed]);
    }
    setNewSkillText('');
  };

  const handleRemoveSkillKey = (key: string) => {
    setSkillKeys(skillKeys.filter((k) => k !== key));
  };

  const handleRemoveCustomSkill = (skill: string) => {
    setCustomSkills(customSkills.filter((s) => s !== skill));
  };

  const handleLangSelect = async (code: LanguageCode) => {
    setSelectedLang(code);
    await changeAppLanguage(code);
  };

  const handleSave = async () => {
    setValidationError(null);
    if (!name.trim()) {
      setValidationError(t('profileScreen.validationName') || 'Please enter your name.');
      return;
    }
    const minP = Number(payMin) || 0;
    const maxP = Number(payMax) || 0;
    if (minP > maxP && maxP > 0) {
      setValidationError(t('profileScreen.validationMinPay'));
      return;
    }
    const cleanedContact = emergencyContact.trim().replace(/\D/g, '');
    if (emergencyContact.trim() && cleanedContact.length < 10) {
      setValidationError(t('profileScreen.validationContact'));
      return;
    }

    setIsSaving(true);
    try {
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
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
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
    setValidationError(null);
    navigate(-1);
  };

  return (
    <div className="min-h-screen w-full bg-transparent px-4 py-4 md:py-8 pb-28">
      <div className="mx-auto w-full max-w-md md:max-w-xl space-y-4">
        {/* Top Header matching reference Screen 9 */}
        <header className="flex items-center justify-between border-b border-white/60 pb-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 backdrop-blur-md shadow-glass border border-white/80 hover:bg-white/85 text-deepEmerald transition-all active:scale-95"
            aria-label="Back"
          >
            <AppIcon name="arrow-back" size={20} />
          </button>
          <h1 className="text-xl font-extrabold text-deepEmerald">
            {t('profileScreen.title')}
          </h1>
          <div className="w-10" />
        </header>

        {/* Profile Photo Avatar & Strength Card matching reference Screen 9 */}
        <Card className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <input
              id="profile-photo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <label
              htmlFor="profile-photo-input"
              className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#073B3A] to-[#087F73] text-2xl font-black text-white shadow-card ring-2 ring-white overflow-hidden group"
              title="Upload photo / Selfie"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                name.charAt(0) || 'R'
              )}
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-mint text-deepEmerald shadow-xs border border-white">
                <AppIcon name="camera-outline" size={13} />
              </div>
            </label>
            <div>
              <h2 className="text-base font-extrabold text-deepEmerald">{name}</h2>
              <p className="text-xs font-semibold text-primaryTeal mt-0.5">
                {t(`workerTypes.${workType}`)} • {t(cityKey)}
              </p>
              <label
                htmlFor="profile-photo-input"
                className="text-xs font-bold text-primary hover:underline mt-1 block cursor-pointer"
              >
                {t('profileScreen.changePhoto')}
              </label>
            </div>
          </div>

          {/* Strength Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-deepEmerald">
                {t('profileScreen.strength', { percent: strength })}
              </span>
              <span className="text-[11px] font-bold text-success">{t('profileScreen.stabilityGood')}</span>
            </div>
            <ProgressBar
              progress={strength / 100}
              color="#087F73"
              trackColor="#E6F7F2"
            />
            <p className="text-[11px] text-textMuted mt-1">
              {t('profileScreen.strengthHint')}
            </p>
          </div>
        </Card>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="rounded-2xl bg-danger/10 border border-danger/30 p-3.5 flex items-center gap-2.5 text-danger text-xs font-bold animate-fade-in">
            <AppIcon name="alert-circle" size={18} />
            <span>{validationError}</span>
          </div>
        )}

        {/* FORM INPUTS matching reference Screen 9 */}
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('profileScreen.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md px-3.5 py-3 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          {/* Gender Selection (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-deepEmerald">
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
                    onClick={() => setGender(isSelected ? null : opt.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-r from-deepEmerald to-teal-700 text-white shadow-glass border border-emerald-400/40'
                        : 'bg-white/50 backdrop-blur-md text-textSecondary border border-white/70 hover:bg-white/80 shadow-xs'
                    }`}
                  >
                    <AppIcon name={opt.icon} size={14} />
                    <span>{t(opt.labelKey)}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-textMuted">
              {t('gender.helperText')}
            </p>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('profileScreen.city')}
            </label>
            <select
              value={cityKey}
              onChange={(e) => setCityKey(e.target.value)}
              className="w-full rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md px-3.5 py-3 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-primary/30 focus:outline-none"
            >
              {CITY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(k)}
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('profileScreen.preferredLanguage')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_LANGUAGE_CODES.slice(0, 5).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLangSelect(code)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
                    selectedLang === code
                      ? 'bg-gradient-to-r from-deepEmerald to-teal-700 text-white shadow-glass border border-emerald-400/40'
                      : 'bg-white/50 backdrop-blur-md text-textSecondary border border-white/70 hover:bg-white/80 shadow-xs'
                  }`}
                >
                  {LANGUAGE_NATIVE_NAMES[code]}
                </button>
              ))}
            </div>
          </div>

          {/* Work Type */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('profileScreen.workType')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {workerTypeOptions.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setWorkType(opt.type)}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                    workType === opt.type
                      ? 'bg-teal-500/15 border-2 border-primary text-deepEmerald shadow-glass'
                      : 'bg-white/50 backdrop-blur-md text-textSecondary border border-white/70 hover:bg-white/80 shadow-xs'
                  }`}
                >
                  <AppIcon name={opt.icon} size={15} />
                  <span className="truncate">{t(opt.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editable Skills */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('profileScreen.skills')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skillKeys.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1 rounded-full bg-[#E4FAF2] border border-[#72E5C2]/60 px-3 py-1 text-xs font-bold text-deepEmerald"
                >
                  <span>{t(sk)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkillKey(sk)}
                    className="text-textMuted hover:text-danger ml-1"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {customSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1 rounded-full bg-primarySoft border border-primary/30 px-3 py-1 text-xs font-bold text-primary"
                >
                  <span>{sk}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomSkill(sk)}
                    className="text-textMuted hover:text-danger ml-1"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            {/* Add Custom Skill field */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                placeholder={t('profileScreen.skillPlaceholder')}
                className="flex-1 rounded-xl border border-white/80 bg-white/70 backdrop-blur-md px-3 py-2 text-xs font-medium text-textPrimary focus:ring-2 focus:ring-primary/30 focus:outline-none shadow-inner"
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
                className="rounded-xl bg-gradient-to-r from-deepEmerald to-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-glass hover:brightness-110 active:scale-95 transition-all"
              >
                + {t('common.add')}
              </button>
            </div>
          </div>

          {/* Experience Years */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('profileScreen.experience')}
            </label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md px-3.5 py-3 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('profileScreen.availability')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABILITY_OPTIONS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvailability(av.id)}
                  className={`rounded-xl p-2.5 text-xs font-bold text-center transition-all active:scale-95 ${
                    availability === av.id
                      ? 'bg-gradient-to-r from-deepEmerald to-teal-700 text-white shadow-glass border border-emerald-400/40'
                      : 'bg-white/50 backdrop-blur-md text-textSecondary border border-white/70 hover:bg-white/80 shadow-xs'
                  }`}
                >
                  {t(`availability.${av.id}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Expected Daily Pay Range */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('profileScreen.payRange')} (₹ / day)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={payMin}
                onChange={(e) => setPayMin(e.target.value)}
                placeholder="Min (e.g. 400)"
                className="w-full rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md px-3.5 py-3 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-primary/30 focus:outline-none"
              />
              <input
                type="number"
                value={payMax}
                onChange={(e) => setPayMax(e.target.value)}
                placeholder="Max (e.g. 700)"
                className="w-full rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md px-3.5 py-3 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-primary/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('profileScreen.emergencyContact')}
            </label>
            <input
              type="tel"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md px-3.5 py-3 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          {/* Savings Goal */}
          <div>
            <label className="block text-xs font-bold text-deepEmerald mb-1">
              {t('profileScreen.savingsGoal')}
            </label>
            <input
              type="number"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
              placeholder="10000"
              className="w-full rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md px-3.5 py-3 text-sm font-medium text-textPrimary shadow-inner focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          {/* Save & Cancel Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 rounded-full border border-white/80 bg-white/60 backdrop-blur-md py-3 text-xs font-bold text-textSecondary hover:bg-white/85 transition-all shadow-xs active:scale-95"
            >
              {t('profileScreen.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 py-3 text-xs font-bold text-white shadow-glass hover:shadow-glassHover border border-emerald-400/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isSaving && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{isSaving ? t('profileScreen.saving') : t('profileScreen.saveChanges')}</span>
            </button>
          </div>
        </div>

        {/* Confirmation Toast matching reference Screen 9 ("Profile updated successfully!") */}
        {savedSuccess && (
          <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 animate-fade-in">
            <div className="flex items-center gap-2 rounded-full bg-deepEmerald px-6 py-3 text-sm font-extrabold text-white shadow-lifted border border-mint">
              <AppIcon name="checkmark-circle" size={18} className="text-mint" />
              <span>{t('profileScreen.saved')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
