import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatInr } from '../localization';
import type { Job } from '../data/mockData';
import { AppIcon } from '../lib/icons';
import { buildJobSpeechText } from '../lib/speechContextualContent';
import Card from './Card';
import PrimaryButton from './PrimaryButton';
import ListenButton from './ListenButton';

export default function JobCard({
  job,
  onPress,
  compact = false,
}: {
  job: Job;
  onPress?: () => void;
  compact?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  const jobSpeech = buildJobSpeechText(job, i18n.language, t);
  const jobTrack = {
    id: `job-${job.id}`,
    title: jobSpeech.title,
    subtitle: `${t(job.employerKey)} • ${job.distance}`,
    speech: jobSpeech.speech,
    lang: i18n.language,
  };

  // Logo styling & colors by employer
  const employerKey = job.employerKey.toLowerCase();
  let logoBg = 'bg-[#B34A26] text-white';
  let logoText = 'S';

  if (employerKey.includes('zomato')) {
    logoBg = 'bg-[#E23744] text-white';
    logoText = 'Z';
  } else if (employerKey.includes('swiggy')) {
    logoBg = 'bg-[#FC8019] text-white';
    logoText = 'S';
  } else if (employerKey.includes('amazon') || employerKey.includes('warehouse')) {
    logoBg = 'bg-[#1E2B3E] text-[#E5A823]';
    logoText = 'A';
  } else if (employerKey.includes('urban') || employerKey.includes('company')) {
    logoBg = 'bg-[#231F20] text-white';
    logoText = 'U';
  } else if (employerKey.includes('family') || employerKey.includes('home')) {
    logoBg = 'bg-[#7C2D16] text-[#F1B96B]';
    logoText = 'H';
  }

  // AI match explanation
  const getAiExplanation = () => {
    if (job.titleKey.includes('delivery')) {
      return 'Your driving & local area experience matches this role.';
    }
    if (job.titleKey.includes('warehouse') || job.titleKey.includes('helper')) {
      return 'Your physical work experience and reliability are a great fit.';
    }
    if (job.titleKey.includes('house') || job.titleKey.includes('domestic') || job.titleKey.includes('cook') || job.titleKey.includes('cleaner')) {
      return 'Your verified home care & cooking experience matches this family\'s requirements.';
    }
    if (job.titleKey.includes('electrician') || job.titleKey.includes('repair')) {
      return 'Your electrical and wiring expertise matches 4 requested tasks.';
    }
    return 'Your profile and preferred location match 90%+ of requirements.';
  };

  const handleOpen = () => {
    if (onPress) {
      onPress();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <Card className="hover:border-terracotta/40 transition-all duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black text-lg shadow-sm ${logoBg}`}>
              {logoText}
            </div>
            <div>
              <h3 className="text-base font-bold text-warmCocoa leading-snug">
                {t(job.titleKey)}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-textSecondary">
                {t(job.employerKey)} • {job.distance}
              </p>
              <p className="mt-1 text-xs font-bold text-terracotta">
                {t('kaam.payRange', { min: formatInr(job.payMin), max: formatInr(job.payMax) })}
                <span className="ml-1 text-[11px] font-normal text-textMuted">
                  • {t(job.payTypeKey)}
                </span>
              </p>
            </div>
          </div>

          {/* Skill match pill */}
          <div className="shrink-0 rounded-full bg-saffronGold/15 border border-saffronGold/30 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-warmCocoa shadow-xs">
            {t('kaam.skillMatch', { percent: job.skillMatch })}
          </div>
        </div>

        {/* Tags row */}
        {!compact && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skillKeys.map((sk) => (
              <span
                key={sk}
                className="rounded-xl bg-cleanWhite/90 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-textSecondary border border-softBorder shadow-xs"
              >
                {t(sk)}
              </span>
            ))}
            <span className="rounded-xl bg-cleanWhite/90 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-textMuted border border-softBorder shadow-xs">
              {t(job.workTypeKey)}
            </span>
          </div>
        )}

        {/* AI match explanation */}
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-cleanWhite/80 backdrop-blur-xl p-2.5 border border-softBorder shadow-xs">
          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-successSoft text-success">
            <AppIcon name="checkmark-circle" size={12} />
          </div>
          <p className="text-xs text-textSecondary leading-relaxed">
            {getAiExplanation()}
          </p>
        </div>

        {/* Action Buttons: Listen Explainer + View Details */}
        <div className="mt-3.5 flex items-center justify-between">
          <ListenButton track={jobTrack} />

          <button
            type="button"
            onClick={handleOpen}
            className="emerald-gradient-btn flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white transition-all active:scale-95"
          >
            <span>{t('kaam.viewDetails')}</span>
            <AppIcon name="arrow-forward" size={13} />
          </button>
        </div>
      </Card>

      {/* Job Details Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-deepNavy/35 p-4 backdrop-blur-xl animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-[32px] bg-cleanWhite/95 p-6 shadow-modal backdrop-blur-3xl border border-softBorder max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="flex items-start justify-between gap-3 border-b border-softBorder pb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black text-xl shadow-glass ${logoBg}`}>
                  {logoText}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-warmCocoa">{t(job.titleKey)}</h2>
                  <p className="text-sm text-textSecondary">{t(job.employerKey)} • {t(job.locationKey)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-warmCream/80 hover:bg-white text-textMuted hover:text-warmCocoa border border-softBorder transition-all"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-warmAmber/20 backdrop-blur-md p-3 border border-warmAmber/30 shadow-xs">
                  <span className="text-xs text-textMuted font-semibold">{t('kaam.payRate')}</span>
                  <p className="text-lg font-black text-warmCocoa">
                    {t('kaam.payRange', { min: formatInr(job.payMin), max: formatInr(job.payMax) })}
                  </p>
                  <span className="text-xs font-bold text-terracotta">{t(job.payTypeKey)}</span>
                </div>
                <div className="rounded-2xl bg-saffronGold/15 backdrop-blur-md p-3 border border-saffronGold/30 shadow-xs">
                  <span className="text-xs text-textMuted font-semibold">{t('kaam.aiMatchScore')}</span>
                  <p className="text-lg font-black text-warmCocoa">{t('kaam.skillMatch', { percent: job.skillMatch })}</p>
                  <span className="text-xs font-bold text-success">{t('kaam.verifiedHighFit')}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-cleanWhite/90 backdrop-blur-md p-3.5 border border-softBorder shadow-xs">
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-1">
                  {t('kaam.whyMatch')}
                </h4>
                <p className="text-sm text-textSecondary">{getAiExplanation()}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-2">
                  {t('kaam.skillsRequirements')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.skillKeys.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-full bg-warmAmber/20 px-3 py-1 text-xs font-semibold text-terracotta border border-warmAmber/30"
                    >
                      ✓ {t(sk)}
                    </span>
                  ))}
                  <span className="rounded-full bg-saffronGold/20 px-3 py-1 text-xs font-semibold text-warmCocoa border border-saffronGold/30">
                    {t(job.workTypeKey)}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Apply, WhatsApp, Call */}
              <div className="space-y-2.5 pt-2">
                {applied ? (
                  <div className="rounded-2xl bg-successSoft p-4 text-center">
                    <p className="font-bold text-success">{t('kaam.applySuccess')}</p>
                    <p className="text-xs text-textSecondary mt-1">
                      {t('kaam.applySuccessBody')}
                    </p>
                  </div>
                ) : (
                  <PrimaryButton
                    title={t('kaam.applyWithProfile')}
                    onPress={() => setApplied(true)}
                  />
                )}

                {/* Direct WhatsApp Contact Button */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    i18n.language === 'en'
                      ? `Hello! I saw your job listing on Setu: ${t(job.titleKey)} (${t(job.employerKey)}). Pay: ₹${job.payMin} - ₹${job.payMax} (${t(job.payTypeKey)}). I am available to work. Please contact me.`
                      : i18n.language === 'mr'
                      ? `नमस्कार! मी सेतु ॲपवर तुमची कामाची संधी पाहिली: ${t(job.titleKey)} (${t(job.employerKey)}). मोबदला: ₹${job.payMin} - ₹${job.payMax} (${t(job.payTypeKey)}). मी कामासाठी उपलब्ध आहे. कृपया माझ्याशी संपर्क साधावा.`
                      : `नमस्ते! मैंने सेतु ऐप पर आपकी नौकरी देखी: ${t(job.titleKey)} (${t(job.employerKey)}). वेतन: ₹${job.payMin} - ₹${job.payMax} (${t(job.payTypeKey)}). मैं काम के लिए उपलब्ध हूँ। कृपया मुझसे संपर्क करें।`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-xs font-bold text-white shadow-card transition-all hover:brightness-105 active:scale-[0.98]"
                >
                  <AppIcon name="logo-whatsapp" size={15} />
                  <span>{t('kaam.chatWhatsApp')}</span>
                </a>

                {/* Direct Phone Call */}
                <a
                  href="tel:9876543210"
                  className="flex w-full items-center justify-center gap-1.5 rounded-full border border-softBorder bg-cleanWhite/90 px-4 py-2.5 text-xs font-bold text-warmCocoa shadow-xs hover:bg-white transition-all active:scale-[0.98]"
                >
                  <AppIcon name="call" size={14} />
                  <span>{t('kaam.callEmployer')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
