import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import DisclaimerText from '../components/DisclaimerText';
import SkillChip from '../components/SkillChip';
import LanguageSelector from '../components/LanguageSelector';
import { AppIcon } from '../lib/icons';
import { getSkillCourses, getWorkerStats } from '../services/workerService';
import { useProfile } from '../hooks/ProfileContext';
import { SUGGESTED_SKILL_KEYS } from '../data/mockData';
import { downloadSkillPassportFile } from '../lib/pdfGenerator';

const VERIFIED_COMPETENCIES = [
  'Safe Driving & Local Navigation Protocol',
  'Professional Conduct & Punctuality (4.8★ Rating)',
  'UPI & Digital Payments Handling',
  'Government Identity & Background Verified',
];

export default function KaushalPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: getSkillCourses });
  const statsQuery = useQuery({ queryKey: ['worker-stats'], queryFn: getWorkerStats });

  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const [editSkillsModalOpen, setEditSkillsModalOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(profile.skillKeys);
  const [customSkills, setCustomSkills] = useState<string[]>(profile.customSkills);
  const [newCustomSkill, setNewCustomSkill] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state if profile changes
  useEffect(() => {
    setSelectedSkills(profile.skillKeys);
    setCustomSkills(profile.customSkills);
  }, [profile.skillKeys, profile.customSkills]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const occupation = profile.workType
    ? t(`workerTypes.${profile.workType}`)
    : 'Driver';

  const userDeclaredSkillLabels = [
    ...selectedSkills.map((sk) => t(sk)),
    ...customSkills,
  ];

  // Functional PDF Download using pure client-side PDF generator
  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      downloadSkillPassportFile({
        name: profile.name || 'Ramesh Kumar',
        occupation,
        city: t(profile.cityKey),
        experienceYears: profile.experienceYears || 5,
        languages: ['Hindi', 'Marathi', 'English'],
        jobsCompleted: 48,
        avgDailyPay: 750,
        clientRating: 4.8,
        verifiedCompetencies: VERIFIED_COMPETENCIES,
        userDeclaredSkills: userDeclaredSkillLabels.length > 0 ? userDeclaredSkillLabels : ['Driving', 'Cleaning'],
        verificationId: `SETU-${profile.name.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        issuedDate: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      });
      showToast(t('kaushal.pdfSuccess'));
    } catch {
      showToast(t('kaushal.pdfError'));
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  // Toggle skills in edit modal
  const handleToggleSkill = (skillKey: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillKey) ? prev.filter((k) => k !== skillKey) : [...prev, skillKey]
    );
  };

  // Add custom skill in edit modal
  const handleAddCustomSkill = () => {
    const trimmed = newCustomSkill.trim();
    if (!trimmed) return;
    if (!customSkills.includes(trimmed)) {
      setCustomSkills([...customSkills, trimmed]);
    }
    setNewCustomSkill('');
  };

  // Remove custom skill in edit modal
  const handleRemoveCustomSkill = (skill: string) => {
    setCustomSkills(customSkills.filter((s) => s !== skill));
  };

  // Save updated skills
  const handleSaveSkills = async () => {
    await updateProfile({
      skillKeys: selectedSkills,
      customSkills,
    });
    setEditSkillsModalOpen(false);
    showToast(t('profileScreen.saved'));
  };

  // Formatted WhatsApp Share text localized dynamically
  const buildShareText = () => {
    const cityName = t(profile.cityKey);
    const skillsListStr = userDeclaredSkillLabels.slice(0, 5).join(', ');
    if (i18n.language === 'en') {
      return (
        `*Setu Verified Worker Profile*\n` +
        `👤 *Name:* ${profile.name}\n` +
        `🛠️ *Occupation:* ${occupation} (${profile.experienceYears} Years Exp)\n` +
        `📍 *Location:* ${cityName}\n` +
        `⭐ *Rating:* 4.8★ (48 Jobs Completed)\n` +
        `💵 *Avg. Daily Pay:* ₹750/day\n` +
        `✅ *Skills:* ${skillsListStr}\n` +
        `🔗 *Verification:* https://setu-livelihood.in/verify/${profile.name.replace(/\s+/g, '').toLowerCase()}`
      );
    }
    if (i18n.language === 'gu') {
      return (
        `*સેતુ ચકાસાયેલ કારીગર પ્રોફાઇલ*\n` +
        `👤 *નામ:* ${profile.name}\n` +
        `🛠️ *કામ:* ${occupation} (${profile.experienceYears} વર્ષ અનુભવ)\n` +
        `📍 *શહેર:* ${cityName}\n` +
        `⭐ *રેટિંગ:* 4.8★ (48 કામ પૂર્ણ)\n` +
        `💵 *સરેરાશ દૈનિક આવક:* ₹750/દિવસ\n` +
        `✅ *આવડત:* ${skillsListStr}\n` +
        `🔗 *ચકાસણી:* https://setu-livelihood.in/verify/${profile.name.replace(/\s+/g, '').toLowerCase()}`
      );
    }
    if (i18n.language === 'mr') {
      return (
        `*सेतु पडताळणीकृत कामगार प्रोफाइल*\n` +
        `👤 *नाव:* ${profile.name}\n` +
        `🛠️ *काम:* ${occupation} (${profile.experienceYears} वर्षे अनुभव)\n` +
        `📍 *शहर:* ${cityName}\n` +
        `⭐ *रेटिंग:* 4.8★ (48 कामे पूर्ण)\n` +
        `💵 *सरासरी कमाई:* ₹750/दिवस\n` +
        `✅ *कौशल्ये:* ${skillsListStr}\n` +
        `🔗 *पडताळणी:* https://setu-livelihood.in/verify/${profile.name.replace(/\s+/g, '').toLowerCase()}`
      );
    }
    return (
      `*सेतु सत्यापित श्रमिक प्रोफ़ाइल*\n` +
      `👤 *नाम:* ${profile.name}\n` +
      `🛠️ *काम:* ${occupation} (${profile.experienceYears} साल अनुभव)\n` +
      `📍 *शहर:* ${cityName}\n` +
      `⭐ *रेटिंग:* 4.8★ (48 काम सफल)\n` +
      `💵 *औसत दैनिक आय:* ₹750/दिन\n` +
      `✅ *कौशल:* ${skillsListStr}\n` +
      `🔗 *सत्यापन:* https://setu-livelihood.in/verify/${profile.name.replace(/\s+/g, '').toLowerCase()}`
    );
  };

  const handleCopyLink = () => {
    const text = buildShareText();
    navigator.clipboard.writeText(text);
    showToast(t('kaushal.linkCopied'));
  };

  return (
    <div className="space-y-4 px-4 pt-3 pb-8">
      {/* Header bar matching reference Screen 8 */}
      <header className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#073B3A] to-[#087F73] text-white font-black text-base shadow-glass border border-emerald-400/30">
            K
          </div>
          <h1 className="text-xl font-extrabold text-deepEmerald">
            {t('kaushal.title')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditSkillsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 px-3 py-1.5 text-xs font-bold text-deepEmerald shadow-xs hover:bg-white/85 transition-all active:scale-95"
          >
            <AppIcon name="create-outline" size={13} className="text-primary" />
            <span>{t('kaushal.editSkills')}</span>
          </button>
          <button
            type="button"
            onClick={() => setPassportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-black shadow-glass hover:bg-white border border-white/90 transition-all active:scale-95"
          >
            <AppIcon name="document-text" size={13} className="text-black" />
            <span className="text-black font-bold">{t('kaushal.viewPassport')}</span>
          </button>
          <div className="md:hidden">
            <LanguageSelector variant="icon" />
          </div>
        </div>
      </header>

      {/* WORKER SUMMARY CARD matching reference Screen 8 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="p-4">
          <div className="flex items-center gap-3.5 mb-3">
            {/* Worker Photo Avatar */}
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-14 w-14 rounded-full object-cover shadow-card ring-2 ring-white"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#073B3A] to-[#087F73] text-xl font-black text-white shadow-card ring-2 ring-white">
                  {profile.name.charAt(0) || 'R'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-mint text-deepEmerald shadow-xs border border-white">
                <AppIcon name="checkmark-circle" size={12} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-deepEmerald leading-tight truncate">
                  {profile.name}
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="text-xs font-bold text-primary hover:underline shrink-0"
                >
                  {t('profileScreen.editProfile')}
                </button>
              </div>
              <p className="text-xs font-bold text-primaryTeal mt-0.5">
                {occupation} • {t(profile.cityKey)}
              </p>
              <p className="text-[11px] text-textMuted font-medium mt-0.5">
                {profile.experienceYears} yrs experience • Hindi, Marathi, English
              </p>
            </div>
          </div>

          {/* Skill Chips from actual profile state */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
                {t('kaushal.declaredSkills')} ({userDeclaredSkillLabels.length})
              </span>
              <button
                type="button"
                onClick={() => setEditSkillsModalOpen(true)}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <AppIcon name="create-outline" size={12} />
                <span>{t('kaushal.editSkills')}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {userDeclaredSkillLabels.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[#E4FAF2] border border-[#72E5C2]/60 px-2.5 py-1 text-xs font-bold text-deepEmerald shadow-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Work History / Completed Stats Row */}
          <div className="mt-3.5 grid grid-cols-3 divide-x divide-white/60 rounded-2xl bg-white/40 backdrop-blur-md p-2.5 border border-white/80 shadow-inner">
            <div className="text-center">
              <span className="text-base font-black text-deepEmerald">48</span>
              <span className="block text-[10px] font-semibold text-textMuted uppercase">
                {t('kaushal.jobsDone')}
              </span>
            </div>
            <div className="text-center">
              <span className="text-base font-black text-deepEmerald">₹750</span>
              <span className="block text-[10px] font-semibold text-textMuted uppercase">
                {t('dhan.avgDailyIncome')}
              </span>
            </div>
            <div className="text-center">
              <span className="text-base font-black text-deepEmerald">⭐ 4.8</span>
              <span className="block text-[10px] font-semibold text-textMuted uppercase">
                {t('kaushal.rating')}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* SKILL PASSPORT PREVIEW CARD */}
      <Card
        onClick={() => setPassportModalOpen(true)}
        variant="emerald"
        className="p-4 cursor-pointer hover:shadow-glassHover transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#073B3A] to-[#087F73] text-mint shadow-glass border border-emerald-400/30">
              <AppIcon name="document-text" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-deepEmerald">
                  {t('kaushal.passportPreview')}
                </h3>
                <span className="rounded-full bg-mint/40 border border-mint/60 px-2 py-0.5 text-[10px] font-bold text-deepEmerald">
                  {t('kaushal.verified')}
                </span>
              </div>
              <p className="text-xs text-textSecondary mt-0.5">
                {profile.name} • {occupation} • 4 Verified Competencies
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-black shadow-glass hover:bg-white border border-white/90"
          >
            <span className="text-black font-bold">{t('kaushal.viewPassport')}</span>
            <AppIcon name="chevron-forward" size={13} className="text-black" />
          </button>
        </div>
      </Card>

      {/* AI SUMMARY CARD */}
      <Card variant="warning" className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-saffron/20 text-[#D97706]">
            <AppIcon name="sparkles" size={14} />
          </div>
          <h3 className="text-xs font-extrabold text-[#92400E] uppercase tracking-wider">
            {t('kaushal.aiSummaryTitle')}
          </h3>
        </div>
        <p className="text-xs text-textPrimary leading-relaxed">
          {t('kaushal.aiSummary')}
        </p>
      </Card>

      {/* RECOMMENDED COURSES */}
      <div>
        <h3 className="text-sm font-extrabold text-deepEmerald mb-2.5">
          {t('kaushal.recommended')}
        </h3>
        <div className="space-y-2.5">
          {(coursesQuery.data ?? []).map((course) => (
            <Card key={course.id} className="mb-0 p-3.5 flex items-center justify-between gap-3 hover:border-mint/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primarySoft text-primary">
                  <AppIcon name={course.icon} size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-deepEmerald truncate">
                    {t(course.titleKey)}
                  </h4>
                  <p className="text-[11px] text-textMuted mt-0.5">
                    {course.provider} • {t(course.durationKey)} • {t(course.levelKey)}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-successSoft px-2.5 py-0.5 text-[11px] font-bold text-success border border-mint/40">
                {t('kaushal.free')}
              </span>
            </Card>
          ))}
        </div>
      </div>

      {/* FUNCTIONAL ACTIONS: WHATSAPP SHARE + DOWNLOAD PDF + COPY LINK */}
      <div className="space-y-2 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(buildShareText())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] px-5 font-bold text-white shadow-glass transition-all hover:brightness-110 active:scale-[0.98] border border-green-300/40"
          >
            <AppIcon name="logo-whatsapp" size={18} />
            <span>{t('kaushal.shareWhatsApp')}</span>
          </a>

          <PrimaryButton
            title={downloading ? t('kaushal.downloadMessage') : t('kaushal.downloadPdf')}
            onPress={handleDownloadPdf}
            icon={<AppIcon name="download-outline" size={18} />}
            disabled={downloading}
          />
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-white/80 bg-white/60 backdrop-blur-md py-2.5 text-xs font-bold text-deepEmerald shadow-xs hover:bg-white/85 transition-all active:scale-[0.98]"
        >
          <AppIcon name="copy-outline" size={14} className="text-primary" />
          <span>{t('kaushal.copyLink')}</span>
        </button>
      </div>

      {/* Disclaimer */}
      <div className="pt-1">
        <DisclaimerText text={t('kaushal.disclaimer')} variant="info" />
      </div>

      {/* ========================================================================= */}
      {/* FULL SKILL PASSPORT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {passportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setPassportModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white/85 backdrop-blur-2xl p-6 shadow-glassModal border border-white/90 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-deepEmerald text-base">
                  {t('kaushal.previewTitle')}
                </span>
                <span className="rounded-full bg-mint/30 px-2 py-0.5 text-[10px] font-bold text-deepEmerald border border-mint">
                  ✓ Verified
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPassportModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-textMuted hover:text-deepEmerald"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-center">
              {/* Avatar and Identity */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-gradient text-2xl font-black text-white shadow-card ring-2 ring-mint">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  profile.name.charAt(0) || 'R'
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-deepEmerald">{profile.name}</h3>
                <p className="text-xs font-bold text-primaryTeal">
                  {occupation} • {t(profile.cityKey)}
                </p>
                <p className="text-[11px] text-textMuted mt-0.5">
                  {profile.experienceYears} Years Verified Experience • Languages: Hindi, Marathi, English
                </p>
              </div>

              {/* Stats Box */}
              <div className="flex justify-around rounded-2xl bg-surfaceAlt p-3 border border-border/50">
                <div>
                  <span className="text-lg font-black text-deepEmerald">48</span>
                  <span className="block text-[10px] text-textMuted uppercase">
                    {t('kaushal.jobsDone')}
                  </span>
                </div>
                <div>
                  <span className="text-lg font-black text-deepEmerald">₹750</span>
                  <span className="block text-[10px] text-textMuted uppercase">
                    {t('dhan.avgDailyIncome')}
                  </span>
                </div>
                <div>
                  <span className="text-lg font-black text-deepEmerald">⭐ 4.8</span>
                  <span className="block text-[10px] text-textMuted uppercase">
                    {t('kaushal.rating')}
                  </span>
                </div>
              </div>

              {/* SECTION A: Verified Competencies */}
              <div className="text-left rounded-2xl bg-[#E4FAF2] p-3.5 border border-mint/60">
                <div className="flex items-center gap-1.5 mb-2">
                  <AppIcon name="shield-checkmark" size={15} className="text-[#087F73]" />
                  <span className="text-xs font-extrabold text-deepEmerald">
                    {t('kaushal.verifiedCompetencies')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {VERIFIED_COMPETENCIES.map((comp) => (
                    <div
                      key={comp}
                      className="flex items-center justify-between text-xs font-medium text-deepEmerald bg-white/80 rounded-xl px-2.5 py-1.5 border border-white"
                    >
                      <span>✓ {comp}</span>
                      <span className="text-[10px] font-bold text-primary shrink-0 ml-2">
                        {t('kaushal.authenticated')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION B: User-Declared Skills */}
              <div className="text-left rounded-2xl bg-white p-3.5 border border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-deepEmerald">
                    {t('kaushal.declaredSkills')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPassportModalOpen(false);
                      setEditSkillsModalOpen(true);
                    }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {t('kaushal.editSkills')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {userDeclaredSkillLabels.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-surfaceAlt px-2.5 py-1 text-xs font-bold text-deepEmerald border border-border/70"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 space-y-2">
                <PrimaryButton
                  title={downloading ? t('kaushal.downloadMessage') : t('kaushal.downloadPdf')}
                  onPress={handleDownloadPdf}
                  icon={<AppIcon name="download-outline" size={18} />}
                  disabled={downloading}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full rounded-full border border-border/80 bg-white py-2.5 text-xs font-bold text-deepEmerald hover:bg-surfaceAlt transition-all"
                >
                  {t('kaushal.copyLink')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT SKILLS MODAL */}
      {/* ========================================================================= */}
      {editSkillsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setEditSkillsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white/85 backdrop-blur-2xl p-6 shadow-glassModal border border-white/90 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/60 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-deepEmerald text-base">
                  {t('kaushal.editSkills')}
                </h3>
                <p className="text-xs text-textSecondary mt-0.5">
                  {t('onboarding.skillsHint')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditSkillsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-textMuted hover:text-deepEmerald"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Predefined skill chips to toggle */}
              <div>
                <label className="text-xs font-bold text-deepEmerald block mb-2">
                  {t('kaushal.selectSkillsHint')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SKILL_KEYS.map((key) => {
                    const isSelected = selectedSkills.includes(key);
                    return (
                      <SkillChip
                        key={key}
                        label={t(key)}
                        selected={isSelected}
                        showToggleIcon
                        onPress={() => handleToggleSkill(key)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Custom Skills */}
              <div className="border-t border-white/60 pt-3">
                <label className="text-xs font-bold text-deepEmerald block mb-1.5">
                  {t('kaushal.customSkills')}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {customSkills.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 border border-mint/30 px-2.5 py-1 text-xs font-bold text-primary shadow-xs"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSkill(c)}
                        className="text-textMuted hover:text-danger ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomSkill}
                    onChange={(e) => setNewCustomSkill(e.target.value)}
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

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setEditSkillsModalOpen(false)}
                  className="rounded-full px-4 py-2.5 text-xs font-bold text-textSecondary hover:bg-white/60 transition-colors"
                >
                  {t('profileScreen.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSkills}
                  className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2.5 text-xs font-bold text-white shadow-glass hover:shadow-glassHover border border-emerald-400/30 active:scale-95 transition-all"
                >
                  {t('kaushal.saveSkills')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {toastMessage && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 animate-fade-in pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-deepEmerald px-6 py-3 text-xs font-extrabold text-white shadow-lifted border border-mint">
            <AppIcon name="checkmark-circle" size={16} className="text-mint" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
