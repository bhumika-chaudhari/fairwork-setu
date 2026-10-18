import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '../lib/icons';
import { useProfile } from '../hooks/ProfileContext';
import LanguageSelector from '../components/LanguageSelector';
import ListenButton from '../components/ListenButton';
import type { SpeechTrack } from '../lib/speechSynthesisContext';
import DoctorHeroCard from '../components/health/DoctorHeroCard';
import SymptomFollowUpModal from '../components/health/SymptomFollowUpModal';
import EmergencyHelpModal from '../components/health/EmergencyHelpModal';
import NearbyFacilitiesModal from '../components/health/NearbyFacilitiesModal';
import WelfareSchemesModal from '../components/health/WelfareSchemesModal';
import AskSetuHealthModal from '../components/health/AskSetuHealthModal';
import SafetyTipsModal from '../components/health/SafetyTipsModal';
import SavedResourcesModal from '../components/health/SavedResourcesModal';
import type { SymptomCategory, HealthFacility } from '../types/health';
import {
  fetchHealthFacilities,
  getSavedHealthItems,
} from '../services/healthService';

export default function SehatPage() {
  const { t, i18n } = useTranslation();
  const { profile } = useProfile();

  // Active Modals state
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomCategory | null>(null);
  const [selectedSymptomTitle, setSelectedSymptomTitle] = useState('');
  const [selectedSymptomIcon, setSelectedSymptomIcon] = useState('heart');

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isFacilitiesModalOpen, setIsFacilitiesModalOpen] = useState(false);
  const [facilitiesInitialType, setFacilitiesInitialType] = useState('all');

  const [isSchemesModalOpen, setIsSchemesModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState('');

  const [isSafetyTipsModalOpen, setIsSafetyTipsModalOpen] = useState(false);
  const [isSavedResourcesModalOpen, setIsSavedResourcesModalOpen] = useState(false);

  // Health Centres Preview Category Filter
  const [centresFilter, setCentresFilter] = useState('all');

  const userName = profile?.name || 'Ramesh Kumar';
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'R';

  // Facilities Query for Preview List
  const { data: previewFacilities = [] } = useQuery({
    queryKey: ['preview_health_facilities', centresFilter],
    queryFn: () => fetchHealthFacilities({ type: centresFilter }),
  });

  const savedCount = useMemo(() => {
    return getSavedHealthItems().length;
  }, [isSavedResourcesModalOpen]);

  const handleOpenSymptomCheckin = (cat: SymptomCategory, title: string, icon: string) => {
    setSelectedSymptom(cat);
    setSelectedSymptomTitle(title);
    setSelectedSymptomIcon(icon);
  };

  const pageSpeechTrack: SpeechTrack = {
    id: 'health-full-page-track',
    title: 'FairWork Setu Health',
    subtitle: 'Health & Wellbeing Companion',
    speech:
      'Welcome to Setu Health. Check in how you are feeling, call 112 for immediate emergencies, discover nearby government hospitals and health centres, and explore health benefits like Ayushman Bharat in your preferred language.',
    lang: i18n.language || 'en',
  };

  return (
    <div className="space-y-4 px-2 sm:px-4 pt-1 sm:pt-3 pb-16 animate-fade-in font-sans">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white font-extrabold text-lg shadow-md border border-[#F1B96B]/40">
            <AppIcon name="heart" size={22} className="text-white drop-shadow" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E2B3E] font-serif">
              {t('tabs.sehat', 'Health')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Quick Assistant Sparkle */}
          <button
            type="button"
            onClick={() => {
              setAssistantInitialQuery('');
              setIsAssistantModalOpen(true);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs border border-stone-200 text-[#3A757D] hover:bg-stone-50"
            title="Ask Setu Assistant"
            aria-label="Ask Setu Assistant"
          >
            <AppIcon name="sparkles" size={15} />
          </button>

          {/* Language Selector */}
          <LanguageSelector variant="icon" />

          {/* Listen Track Button */}
          <ListenButton track={pageSpeechTrack} size="sm" />
        </div>
      </header>

      {/* 2-COLUMN RESPONSIVE LAYOUT FOR DESKTOP / LAPTOP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* LEFT COLUMN: Doctor Hero Card, How are you feeling check-in, Nearby Health Centres, Safety */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* 2. HERO BANNER: DOCTOR ILLUSTRATION & HINDI SPEECH BUBBLE */}
          <DoctorHeroCard
            onCheckinClick={() =>
              handleOpenSymptomCheckin('fever', 'Fever or weakness', 'thermometer')
            }
            onVoiceClick={() => {
              setAssistantInitialQuery('');
              setIsAssistantModalOpen(true);
            }}
            lang={i18n.language}
          />

          {/* 3. "HOW ARE YOU FEELING TODAY?" CHECK-IN GRID */}
          <section className="space-y-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#1E2B3E] font-serif tracking-tight">
                How are you feeling today?
              </h2>
              <p className="text-xs text-[#231F20]/75">
                Tell Setu how you feel. We'll help you find the right support.
              </p>
            </div>

            {/* 7 Symptom Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {/* 1. Fever or weakness */}
              <button
                type="button"
                onClick={() =>
                  handleOpenSymptomCheckin('fever', 'Fever or weakness', 'thermometer')
                }
                className="flex flex-col items-center justify-center rounded-2xl bg-white/95 backdrop-blur-md p-3.5 text-center shadow-xs border border-[#F4EBDD] hover:border-[#3A757D] hover:shadow-md transition-all active:scale-95 group min-h-[96px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF5F3] text-[#3A757D] mb-2 group-hover:scale-105 transition-all">
                  <AppIcon name="thermometer" size={20} />
                </div>
                <span className="text-xs font-bold text-[#1E2B3E] leading-tight">
                  Fever or<br />weakness
                </span>
              </button>

              {/* 2. Dizziness or fatigue */}
              <button
                type="button"
                onClick={() =>
                  handleOpenSymptomCheckin('dizziness', 'Dizziness or fatigue', 'heart-pulse')
                }
                className="flex flex-col items-center justify-center rounded-2xl bg-white/95 backdrop-blur-md p-3.5 text-center shadow-xs border border-[#F4EBDD] hover:border-[#3A757D] hover:shadow-md transition-all active:scale-95 group min-h-[96px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF5F3] text-[#3A757D] mb-2 group-hover:scale-105 transition-all">
                  <AppIcon name="heart-pulse" size={20} />
                </div>
                <span className="text-xs font-bold text-[#1E2B3E] leading-tight">
                  Dizziness or<br />fatigue
                </span>
              </button>

              {/* 3. Pain or feeling unwell */}
              <button
                type="button"
                onClick={() =>
                  handleOpenSymptomCheckin('pain', 'Pain or feeling unwell', 'bandage')
                }
                className="flex flex-col items-center justify-center rounded-2xl bg-white/95 backdrop-blur-md p-3.5 text-center shadow-xs border border-[#F4EBDD] hover:border-[#3A757D] hover:shadow-md transition-all active:scale-95 group min-h-[96px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF5F3] text-[#3A757D] mb-2 group-hover:scale-105 transition-all">
                  <AppIcon name="bandage" size={20} />
                </div>
                <span className="text-xs font-bold text-[#1E2B3E] leading-tight">
                  Pain or<br />feeling unwell
                </span>
              </button>

              {/* 4. Cough, cold or breathing concerns */}
              <button
                type="button"
                onClick={() =>
                  handleOpenSymptomCheckin(
                    'cough',
                    'Cough, cold or breathing concerns',
                    'medical'
                  )
                }
                className="flex flex-col items-center justify-center rounded-2xl bg-white/95 backdrop-blur-md p-3.5 text-center shadow-xs border border-[#F4EBDD] hover:border-[#3A757D] hover:shadow-md transition-all active:scale-95 group min-h-[96px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF5F3] text-[#3A757D] mb-2 group-hover:scale-105 transition-all">
                  <AppIcon name="medical" size={20} />
                </div>
                <span className="text-xs font-bold text-[#1E2B3E] leading-tight">
                  Cough, cold or<br />breathing concerns
                </span>
              </button>

              {/* 5. Injury or accident */}
              <button
                type="button"
                onClick={() =>
                  handleOpenSymptomCheckin('injury', 'Injury or accident', 'pill')
                }
                className="flex flex-col items-center justify-center rounded-2xl bg-white/95 backdrop-blur-md p-3.5 text-center shadow-xs border border-[#F4EBDD] hover:border-[#3A757D] hover:shadow-md transition-all active:scale-95 group min-h-[96px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF5F3] text-[#3A757D] mb-2 group-hover:scale-105 transition-all">
                  <AppIcon name="pill" size={20} />
                </div>
                <span className="text-xs font-bold text-[#1E2B3E] leading-tight">
                  Injury or<br />accident
                </span>
              </button>

              {/* 6. I need health support */}
              <button
                type="button"
                onClick={() =>
                  handleOpenSymptomCheckin(
                    'support',
                    'I need health support',
                    'hand-heart'
                  )
                }
                className="flex flex-col items-center justify-center rounded-2xl bg-white/95 backdrop-blur-md p-3.5 text-center shadow-xs border border-[#F4EBDD] hover:border-[#3A757D] hover:shadow-md transition-all active:scale-95 group min-h-[96px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF5F3] text-[#3A757D] mb-2 group-hover:scale-105 transition-all">
                  <AppIcon name="hand-heart" size={20} />
                </div>
                <span className="text-xs font-bold text-[#1E2B3E] leading-tight">
                  I need<br />health support
                </span>
              </button>

              {/* 7. Something else */}
              <button
                type="button"
                onClick={() =>
                  handleOpenSymptomCheckin('other', 'Something else', 'ellipsis-horizontal-outline')
                }
                className="col-span-2 sm:col-span-2 flex flex-col items-center justify-center rounded-2xl bg-white/95 backdrop-blur-md p-3.5 text-center shadow-xs border border-[#F4EBDD] hover:border-[#3A757D] hover:shadow-md transition-all active:scale-95 group min-h-[96px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-600 mb-2 group-hover:scale-105 transition-all">
                  <AppIcon name="ellipsis-horizontal-outline" size={20} />
                </div>
                <span className="text-xs font-bold text-[#1E2B3E] leading-tight">
                  Something else
                </span>
              </button>
            </div>
          </section>

          {/* 5. "NEARBY HEALTH CENTRES" SECTION */}
          <section className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3A757D]/15 text-[#3A757D]">
                  <AppIcon name="location-outline" size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1E2B3E] font-serif">
                    Nearby Health Centres
                  </h3>
                  <p className="text-[11px] text-[#231F20]/70">
                    Find the nearest medical facilities, get directions and more.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFacilitiesInitialType(centresFilter);
                  setIsFacilitiesModalOpen(true);
                }}
                className="text-xs font-bold text-[#3A757D] hover:underline flex items-center gap-0.5 shrink-0"
              >
                <span>View All</span>
                <AppIcon name="chevron-forward" size={14} />
              </button>
            </div>

            {/* Filter Pills: All, Hospitals, Clinics, PHCs, Pharmacies */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'hospital', label: 'Hospitals' },
                { id: 'clinic', label: 'Clinics' },
                { id: 'phc', label: 'PHCs' },
                { id: 'pharmacy', label: 'Pharmacies' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setCentresFilter(chip.id)}
                  className={`py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    centresFilter === chip.id
                      ? 'bg-[#1E2B3E] text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Preview Cards */}
            <div className="space-y-2">
              {previewFacilities.slice(0, 3).map((facility) => (
                <div
                  key={facility.id}
                  onClick={() => setIsFacilitiesModalOpen(true)}
                  className="rounded-2xl border border-[#F4EBDD] bg-white p-3.5 shadow-xs hover:border-[#3A757D]/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#3A757D]/10 text-[#3A757D] border border-[#3A757D]/20">
                      <AppIcon name="hospital" size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#1E2B3E] truncate">
                        {facility.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                        {facility.categoryLabel} • {facility.distance}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5 truncate">
                        🕒 {facility.timings}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {facility.phone && (
                      <a
                        href={`tel:${facility.phone.replace(/[^0-9]/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#B34A26] transition-all"
                        title="Call"
                      >
                        <AppIcon name="call" size={14} />
                      </a>
                    )}
                    <a
                      href={facility.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-[#3A757D]/10 hover:bg-[#3A757D]/20 text-[#3A757D] transition-all"
                      title="Directions"
                    >
                      <AppIcon name="navigation" size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 8. OCCUPATIONAL SAFETY & SAVED RESOURCES STRIP */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setIsSafetyTipsModalOpen(true)}
              className="p-3 rounded-2xl bg-white border border-[#F4EBDD] shadow-xs hover:border-[#E5953E] text-left transition-all flex items-center gap-2.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#B34A26]">
                <AppIcon name="shield-checkmark" size={18} />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[#1E2B3E] truncate">
                  Work Safety Tips
                </span>
                <span className="block text-[10px] text-stone-500 truncate">
                  Hydration & Lifting
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsSavedResourcesModalOpen(true)}
              className="p-3 rounded-2xl bg-white border border-[#F4EBDD] shadow-xs hover:border-[#B34A26] text-left transition-all flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <AppIcon name="bookmark" size={18} />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-[#1E2B3E] truncate">
                    Saved Resources
                  </span>
                  <span className="block text-[10px] text-stone-500 truncate">
                    {savedCount > 0 ? `${savedCount} items bookmarked` : 'Empty'}
                  </span>
                </div>
              </div>
              {savedCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#B34A26] text-white text-[10px] font-black shrink-0">
                  {savedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Emergency Help, Voice Pill, Healthcare Near You, Welfare Schemes, Ask Setu */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Emergency Help Card (Call 112) */}
          <div
            onClick={() => setIsEmergencyModalOpen(true)}
            className="rounded-3xl bg-red-50/90 border border-red-200 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group min-h-[140px]"
          >
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-2.5">
                <AppIcon name="siren" size={20} />
              </div>
              <h3 className="text-sm font-black text-red-900 font-serif leading-snug">
                Emergency Help
              </h3>
              <p className="text-[11px] text-red-800/80 mt-1 leading-relaxed">
                For immediate medical danger, call <strong>112</strong> (National Emergency).
              </p>
            </div>

            <div className="pt-3">
              <a
                href="tel:112"
                onClick={(e) => e.stopPropagation()}
                className="w-full py-2 px-3 rounded-full bg-[#B34A26] hover:bg-[#7C2D16] text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <AppIcon name="call" size={13} />
                <span>Call 112 Immediately</span>
              </a>
            </div>
          </div>

          {/* COMPACT VOICE ASSISTANT PILL */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#EFF7F8] border border-[#3A757D]/30 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3A757D] text-white shadow-xs">
                <AppIcon name="mic" size={16} />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[#1E2B3E] truncate">
                  Tell Setu how you feel
                </span>
                <span className="block text-[10px] text-[#231F20]/70 truncate">
                  Speak symptoms in your preferred language
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAssistantInitialQuery('');
                setIsAssistantModalOpen(true);
              }}
              className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#3A757D] hover:bg-[#2A5960] transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
              aria-label="Talk to Setu Health"
            >
              <AppIcon name="mic" size={13} />
              <span>Talk to Setu</span>
            </button>
          </div>

          {/* Healthcare Near You Card */}
          <div
            onClick={() => {
              setFacilitiesInitialType('all');
              setIsFacilitiesModalOpen(true);
            }}
            className="rounded-3xl bg-[#EBF5F3]/80 border border-[#C6E2D8] p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group min-h-[130px]"
          >
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#3A757D]/15 text-[#3A757D] mb-2">
                <AppIcon name="location-outline" size={20} />
              </div>
              <h3 className="text-sm font-black text-[#1E2B3E] font-serif leading-snug">
                Healthcare near you
              </h3>
              <p className="text-[11px] text-[#231F20]/75 mt-1 leading-relaxed">
                Hospitals, clinics, PHCs, pharmacies and emergency centres.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#3A757D] group-hover:underline">Browse facilities</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#3A757D] shadow-xs group-hover:translate-x-1 transition-all">
                <AppIcon name="arrow-forward" size={13} />
              </div>
            </div>
          </div>

          {/* Welfare Schemes Card */}
          <div
            onClick={() => setIsSchemesModalOpen(true)}
            className="rounded-3xl bg-amber-50/80 border border-[#F1B96B]/50 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group min-h-[130px]"
          >
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#E5953E]/20 text-[#B34A26] mb-2">
                <AppIcon name="hand-heart" size={20} />
              </div>
              <h3 className="text-sm font-black text-[#7C2D16] font-serif leading-snug">
                Health Benefits for You
              </h3>
              <p className="text-[11px] text-[#231F20]/75 mt-1 leading-relaxed">
                Explore government schemes, Ayushman Bharat, insurance and worker support.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#B34A26] group-hover:underline">Explore schemes</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#B34A26] shadow-xs group-hover:translate-x-1 transition-all">
                <AppIcon name="arrow-forward" size={13} />
              </div>
            </div>
          </div>

          {/* Ask Setu AI Card */}
          <div
            onClick={() => {
              setAssistantInitialQuery('');
              setIsAssistantModalOpen(true);
            }}
            className="rounded-3xl bg-white/95 border border-[#F4EBDD] p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#3A757D]/8 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-3 min-w-0 relative z-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3A757D] to-[#1E2B3E] text-white shadow-xs">
                <AppIcon name="ai" size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-[#1E2B3E] font-serif">
                  Ask Setu AI Assistant
                </h3>
                <p className="text-xs text-[#231F20]/75 truncate mt-0.5">
                  Ask health questions in your language.
                </p>
              </div>
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 group-hover:bg-[#3A757D] group-hover:text-white transition-all relative z-10">
              <AppIcon name="arrow-forward" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* 9. MEDICAL DISCLAIMER */}
      <footer className="pt-2 text-center">
        <p className="text-[11px] text-stone-500 leading-normal max-w-lg mx-auto">
          ⚠️ <strong>Medical Notice:</strong> FairWork Setu provides livelihood health information and navigation only. It cannot diagnose conditions or prescribe medications. For life-threatening emergencies, dial <strong>112</strong> immediately.
        </p>
      </footer>

      {/* MODALS SUITE */}

      {/* 1. Symptom Follow-Up Flow */}
      {selectedSymptom && (
        <SymptomFollowUpModal
          category={selectedSymptom}
          categoryTitle={selectedSymptomTitle}
          categoryIcon={selectedSymptomIcon}
          onClose={() => setSelectedSymptom(null)}
          onOpenFacilities={(type) => {
            setFacilitiesInitialType(type || 'all');
            setIsFacilitiesModalOpen(true);
          }}
          onOpenAssistant={(q) => {
            setAssistantInitialQuery(q || '');
            setIsAssistantModalOpen(true);
          }}
          onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        />
      )}

      {/* 2. Emergency Help Modal */}
      {isEmergencyModalOpen && (
        <EmergencyHelpModal
          onClose={() => setIsEmergencyModalOpen(false)}
          locality="Kothrud / Pune West"
        />
      )}

      {/* 3. Nearby Facilities Modal */}
      {isFacilitiesModalOpen && (
        <NearbyFacilitiesModal
          initialType={facilitiesInitialType}
          onClose={() => setIsFacilitiesModalOpen(false)}
        />
      )}

      {/* 4. Welfare Schemes Modal */}
      {isSchemesModalOpen && (
        <WelfareSchemesModal onClose={() => setIsSchemesModalOpen(false)} />
      )}

      {/* 5. Ask Setu Health Assistant Modal */}
      {isAssistantModalOpen && (
        <AskSetuHealthModal
          initialQuery={assistantInitialQuery}
          onClose={() => setIsAssistantModalOpen(false)}
          onOpenEmergency={() => {
            setIsAssistantModalOpen(false);
            setIsEmergencyModalOpen(true);
          }}
        />
      )}

      {/* 6. Safety Tips Modal */}
      {isSafetyTipsModalOpen && (
        <SafetyTipsModal onClose={() => setIsSafetyTipsModalOpen(false)} />
      )}

      {/* 7. Saved Resources Modal */}
      {isSavedResourcesModalOpen && (
        <SavedResourcesModal
          onClose={() => setIsSavedResourcesModalOpen(false)}
          onOpenFacility={() => {
            setIsSavedResourcesModalOpen(false);
            setIsFacilitiesModalOpen(true);
          }}
          onOpenScheme={() => {
            setIsSavedResourcesModalOpen(false);
            setIsSchemesModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
