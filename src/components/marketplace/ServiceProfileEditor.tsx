import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../lib/icons';
import { formatInr } from '../../localization';
import { useProfile } from '../../hooks/ProfileContext';
import {
  saveServiceProfile,
  fetchServiceProfile,
} from '../../services/marketplaceService';
import type { ServiceProfile } from '../../types/marketplace';

const TRADE_OPTIONS = [
  'electrician',
  'plumber',
  'tailor',
  'cleaner',
  'mechanic',
  'carpenter',
  'painter',
  'appliance_repair',
  'other',
];

const LANGUAGE_OPTIONS = ['Hindi', 'Marathi', 'English', 'Gujarati', 'Kannada', 'Telugu'];
const DAY_OPTIONS: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
];

export default function ServiceProfileEditor() {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [displayName, setDisplayName] = useState(profile.name || 'Ramesh Shinde');
  const [trade, setTrade] = useState<string>(profile.workType || 'electrician');
  const [skills, setSkills] = useState<string[]>([
    'House Wiring',
    'Inverter Fitting',
    'Short Circuit Repair',
  ]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [shortDescription, setShortDescription] = useState(
    'Experienced local professional providing honest, reliable, and prompt doorstep service.'
  );
  const [yearsOfExperience, setYearsOfExperience] = useState(profile.experienceYears || 5);
  const [approximateServiceArea, setApproximateServiceArea] = useState(
    profile.cityKey
      ? `${profile.cityKey.replace('cities.', '').replace(/^./, (c) => c.toUpperCase())} & nearby zones`
      : 'Kothrud & Western Pune'
  );
  const [serviceRadiusKm, setServiceRadiusKm] = useState(8);
  const [languages, setLanguages] = useState<string[]>(['Hindi', 'Marathi']);
  const [indicativePrice, setIndicativePrice] = useState(250);
  const [workingDays, setWorkingDays] = useState<
    ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[]
  >(['mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
  const [timeSlots, setTimeSlots] = useState<string[]>(['09:00 - 13:00', '14:00 - 18:00']);
  const [isPublished, setIsPublished] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [completedJobsCount, setCompletedJobsCount] = useState(0);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing profile from backend or localStorage
  useEffect(() => {
    async function load() {
      const userId =
        'usr-' + (profile.name || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const existing = await fetchServiceProfile(userId);
      if (existing) {
        setDisplayName(existing.displayName || profile.name);
        setTrade(existing.trade || profile.workType || 'electrician');
        if (existing.skills && existing.skills.length > 0) setSkills(existing.skills);
        if (existing.shortDescription) setShortDescription(existing.shortDescription);
        if (existing.yearsOfExperience) setYearsOfExperience(existing.yearsOfExperience);
        if (existing.approximateServiceArea) setApproximateServiceArea(existing.approximateServiceArea);
        if (existing.serviceRadiusKm) setServiceRadiusKm(existing.serviceRadiusKm);
        if (existing.languages && existing.languages.length > 0) setLanguages(existing.languages);
        if (existing.pricing?.indicativePrice) setIndicativePrice(existing.pricing.indicativePrice);
        if (existing.availability?.workingDays) setWorkingDays(existing.availability.workingDays);
        if (existing.availability?.timeSlots) setTimeSlots(existing.availability.timeSlots);
        setIsPublished(existing.isPublished);
        setIsPaused(existing.isPaused);
        setCompletedJobsCount(existing.completedJobsCount || 0);
        setRating(existing.rating);
      }
    }
    load();
  }, [profile]);

  const handleAddSkill = () => {
    const val = newSkillInput.trim();
    if (val && !skills.includes(val)) {
      setSkills([...skills, val]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const toggleDay = (day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun') => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const userId =
        'usr-' + (profile.name || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const profileData: ServiceProfile = {
        id: `sp-${userId}`,
        userId,
        displayName: displayName.trim(),
        trade,
        skills,
        shortDescription: shortDescription.trim(),
        yearsOfExperience,
        serviceCategories: [trade],
        approximateServiceArea: approximateServiceArea.trim(),
        serviceRadiusKm,
        languages,
        qualifications: ['Verified by Setu Worker Registry'],
        pricing: {
          type: 'visit_fee',
          indicativePrice,
          maxPrice: indicativePrice + 200,
          description: `₹${indicativePrice} visit and diagnosis fee. Extra for materials.`,
          materialsExtra: true,
        },
        availability: {
          workingDays,
          timeSlots,
          unavailableDates: [],
        },
        completedJobsCount,
        rating,
        reviewsCount: completedJobsCount > 0 ? completedJobsCount : 0,
        isPublished,
        isPaused,
        verificationStatus: 'verified_trade',
      };

      await saveServiceProfile(profileData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Selector: Edit Mode vs Public Preview */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2B3E] font-serif">
            My Service Profile
          </h2>
          <p className="text-xs text-[#231F20]/70 mt-0.5">
            Manage your public tradesperson listing so nearby customers can discover and book you directly.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#F4EBDD] shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'edit'
                ? 'bg-[#B34A26] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#1E2B3E]'
            }`}
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-[#B34A26] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#1E2B3E]'
            }`}
          >
            Customer Preview
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <AppIcon name="checkmark-circle" size={16} />
          <span>Your service profile has been saved and updated across the live local marketplace!</span>
        </div>
      )}

      {activeTab === 'preview' ? (
        /* Preview Card */
        <div className="rounded-3xl border-2 border-[#B34A26]/30 bg-white p-6 shadow-md space-y-4 max-w-xl mx-auto">
          <div className="flex items-center justify-between border-b border-[#F4EBDD] pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C2D16]">
              Customer View Live Preview
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                isPublished && !isPaused
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {isPublished && !isPaused ? '● Active in Marketplace' : 'Paused / Hidden'}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#B34A26] text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
                {displayName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1E2B3E]">{displayName}</h3>
                <p className="text-xs font-semibold text-[#7C2D16] capitalize">
                  {trade} Specialist • {yearsOfExperience} Years Experience
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
                  <AppIcon name="shield-checkmark" size={13} />
                  <span>Trade Verified by Setu</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-stone-400 block">Indicative Fee</span>
              <span className="text-lg font-black text-[#1E2B3E]">{formatInr(indicativePrice)}</span>
              <span className="text-[10px] text-stone-500 block">Visit & Inspection</span>
            </div>
          </div>

          <p className="text-xs text-stone-700 bg-[#FDF8F0] p-3 rounded-2xl border border-[#F1B96B]/30 leading-relaxed">
            {shortDescription}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-white border border-[#F1B96B]/50 text-[#1E2B3E] text-xs font-semibold"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#F4EBDD] text-xs">
            <div>
              <span className="text-stone-400 block text-[10px]">Service Area</span>
              <span className="font-semibold text-[#1E2B3E]">{approximateServiceArea}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px]">Languages</span>
              <span className="font-semibold text-[#1E2B3E]">{languages.join(', ')}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px]">Service Radius</span>
              <span className="font-semibold text-[#1E2B3E]">{serviceRadiusKm} km</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className="px-4 py-2 rounded-xl bg-[#B34A26] text-white text-xs font-bold shadow-sm"
            >
              Continue Editing
            </button>
          </div>
        </div>
      ) : (
        /* Edit Form */
        <form onSubmit={handleSave} className="rounded-3xl border border-[#F4EBDD] bg-white p-6 shadow-sm space-y-5">
          {/* Visibility Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FDF8F0] border border-[#F1B96B]/40">
            <div>
              <span className="font-bold text-xs text-[#7C2D16] block uppercase tracking-wider">
                Marketplace Visibility
              </span>
              <p className="text-xs text-[#231F20]/75 mt-0.5">
                Toggle your profile on or off. When paused, your card is hidden from customer searches.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#1E2B3E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded text-[#B34A26] focus:ring-[#B34A26]"
                />
                <span>Published in Directory</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs font-bold text-[#7C2D16] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaused}
                  onChange={(e) => setIsPaused(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Pause Bookings</span>
              </label>
            </div>
          </div>

          {/* Basic Info: Display Name, Trade, Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#1E2B3E] mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs font-semibold text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E2B3E] mb-1">
                Primary Trade *
              </label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs font-semibold text-[#1E2B3E] capitalize focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
              >
                {TRADE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1E2B3E] mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs font-semibold text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
              />
            </div>
          </div>

          {/* Short Bio */}
          <div className="space-y-1 text-xs">
            <label className="block font-bold text-[#1E2B3E]">
              Short Description / Introduction *
            </label>
            <textarea
              required
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Certified residential electrician with 8 years of trusted work across Kothrud. Prompt arrival, transparent pricing, and quality guaranteed."
              className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
            />
          </div>

          {/* Skills Management */}
          <div className="space-y-2 text-xs">
            <label className="block font-bold text-[#1E2B3E]">
              Skills & Services Offered
            </label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FDF8F0] border border-[#F1B96B] text-[#1E2B3E] font-semibold text-xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-stone-400 hover:text-red-600"
                  >
                    <AppIcon name="close" size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1 max-w-sm">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="Add another skill (e.g. Geyser installation)"
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#F4EBDD] text-xs text-[#1E2B3E] focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 rounded-xl bg-[#B34A26] text-white text-xs font-bold"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Area, Radius & Indicative Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#1E2B3E] mb-1">
                Approximate Service Area *
              </label>
              <input
                type="text"
                required
                value={approximateServiceArea}
                onChange={(e) => setApproximateServiceArea(e.target.value)}
                placeholder="e.g. Kothrud, Karve Nagar & Bavdhan"
                className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs font-semibold text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E2B3E] mb-1">
                Service Radius ({serviceRadiusKm} km)
              </label>
              <input
                type="range"
                min={2}
                max={25}
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                className="w-full mt-2 accent-[#B34A26]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E2B3E] mb-1">
                Indicative Visit / Diagnosis Fee (₹) *
              </label>
              <input
                type="number"
                min={100}
                max={5000}
                value={indicativePrice}
                onChange={(e) => setIndicativePrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#F4EBDD] bg-white text-xs font-semibold text-[#1E2B3E] focus:outline-none focus:ring-2 focus:ring-[#B34A26]/40"
              />
            </div>
          </div>

          {/* Languages Spoken */}
          <div className="space-y-1.5 text-xs">
            <label className="block font-bold text-[#1E2B3E]">Languages Spoken</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1 rounded-xl font-semibold border text-xs transition-colors ${
                    languages.includes(lang)
                      ? 'bg-[#B34A26] text-white border-[#B34A26]'
                      : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Working Days */}
          <div className="space-y-1.5 text-xs">
            <label className="block font-bold text-[#1E2B3E]">Available Working Days</label>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-3 py-1 rounded-xl font-bold uppercase text-[11px] border transition-colors ${
                    workingDays.includes(d)
                      ? 'bg-[#7C2D16] text-white border-[#7C2D16]'
                      : 'bg-stone-50 text-stone-500 border-stone-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-[#F4EBDD] flex items-center justify-between">
            <span className="text-[11px] text-[#231F20]/60 italic">
              Changes sync instantly to the local marketplace directory.
            </span>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#B34A26] hover:bg-[#7C2D16] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <AppIcon name="file-check" size={14} />
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
