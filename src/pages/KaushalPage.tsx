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
import ModalPortal from '../components/ModalPortal';
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white font-black text-base shadow-card border border-warmAmber/30">
            K
          </div>
          <h1 className="text-xl font-extrabold text-warmCocoa">
            {t('kaushal.title')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditSkillsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-cleanWhite/90 backdrop-blur-md border border-softBorder px-3 py-1.5 text-xs font-bold text-warmCocoa shadow-xs hover:bg-cleanWhite transition-all active:scale-95"
          >
            <AppIcon name="create-outline" size={13} className="text-terracotta" />
            <span>{t('kaushal.editSkills')}</span>
          </button>
          <button
            type="button"
            onClick={() => setPassportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-cleanWhite/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-warmCocoa shadow-xs hover:bg-white border border-softBorder transition-all active:scale-95"
          >
            <AppIcon name="document-text" size={13} className="text-warmCocoa" />
            <span className="text-warmCocoa font-bold">{t('kaushal.viewPassport')}</span>
          </button>
          <div className="md:hidden">
            <LanguageSelector variant="icon" />
          </div>
        </div>
      </header>

      {/* 2-Column Responsive Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column: Worker Summary, Skill Passport Preview, Functional Actions & Disclaimer */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-4">
          {/* WORKER SUMMARY CARD matching reference Screen 8 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="p-4 md:p-5">
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
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-xl font-black text-white shadow-card ring-2 ring-white">
                      {profile.name.charAt(0) || 'R'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-saffronGold text-deepNavy shadow-xs border border-white">
                    <AppIcon name="checkmark-circle" size={12} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-warmCocoa leading-tight truncate">
                      {profile.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className="text-xs font-bold text-terracotta hover:underline shrink-0"
                    >
                      {t('profileScreen.editProfile')}
                    </button>
                  </div>
                  <p className="text-xs font-bold text-terracotta mt-0.5">
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
                    className="text-[11px] font-bold text-terracotta hover:underline flex items-center gap-1"
                  >
                    <AppIcon name="create-outline" size={12} />
                    <span>{t('kaushal.editSkills')}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {userDeclaredSkillLabels.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-warmAmber/20 border border-warmAmber/30 px-2.5 py-1 text-xs font-bold text-warmCocoa shadow-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Work History / Completed Stats Row */}
              <div className="mt-3.5 grid grid-cols-3 divide-x divide-softBorder rounded-2xl bg-warmCream/60 backdrop-blur-md p-2.5 border border-softBorder shadow-xs">
                <div className="text-center">
                  <span className="text-base font-black text-warmCocoa">48</span>
                  <span className="block text-[10px] font-semibold text-textMuted uppercase">
                    {t('kaushal.jobsDone')}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-base font-black text-warmCocoa">₹750</span>
                  <span className="block text-[10px] font-semibold text-textMuted uppercase">
                    {t('dhan.avgDailyIncome')}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-base font-black text-warmCocoa">⭐ 4.8</span>
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
            className="p-4 cursor-pointer hover:shadow-cardHover transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-saffronGold shadow-card border border-warmAmber/30">
                  <AppIcon name="document-text" size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-warmCocoa">
                      {t('kaushal.passportPreview')}
                    </h3>
                    <span className="rounded-full bg-saffronGold/20 border border-saffronGold/40 px-2 py-0.5 text-[10px] font-bold text-warmCocoa">
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
                className="flex items-center gap-1 rounded-full bg-cleanWhite/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-warmCocoa shadow-xs hover:bg-white border border-softBorder"
              >
                <span className="text-warmCocoa font-bold">{t('kaushal.viewPassport')}</span>
                <AppIcon name="chevron-forward" size={13} className="text-warmCocoa" />
              </button>
            </div>
          </Card>

          {/* FUNCTIONAL ACTIONS: WHATSAPP SHARE + DOWNLOAD PDF + COPY LINK */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(buildShareText())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] px-5 font-bold text-white shadow-card transition-all hover:brightness-110 active:scale-[0.98] border border-green-300/40"
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
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-softBorder bg-cleanWhite/90 backdrop-blur-md py-2.5 text-xs font-bold text-warmCocoa shadow-xs hover:bg-white transition-all active:scale-[0.98]"
            >
              <AppIcon name="copy-outline" size={14} className="text-terracotta" />
              <span>{t('kaushal.copyLink')}</span>
            </button>
          </div>

          {/* Disclaimer */}
          <div className="pt-1">
            <DisclaimerText text={t('kaushal.disclaimer')} variant="info" />
          </div>
        </div>

        {/* Right Column: AI Summary, Verified Competencies Showcase, Recommended Courses */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-4">
          {/* AI SUMMARY CARD */}
          <Card variant="warning" className="p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-warmAmber/20 text-terracotta">
                <AppIcon name="sparkles" size={14} />
              </div>
              <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                {t('kaushal.aiSummaryTitle')}
              </h3>
            </div>
            <p className="text-xs text-textPrimary leading-relaxed">
              {t('kaushal.aiSummary')}
            </p>
          </Card>

          {/* VERIFIED COMPETENCIES SHOWCASE */}
          <Card className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-success">
                  <AppIcon name="shield-checkmark" size={14} />
                </div>
                <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
                  {t('kaushal.verifiedCompetencies')}
                </h3>
              </div>
              <span className="rounded-full bg-saffronGold/20 px-2 py-0.5 text-[10px] font-bold text-warmCocoa border border-saffronGold/30">
                100% {t('kaushal.authenticated')}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {VERIFIED_COMPETENCIES.map((comp) => (
                <div
                  key={comp}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-warmCream/60 border border-softBorder text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-success font-black text-xs shrink-0">
                      ✓
                    </span>
                    <span className="font-semibold text-warmCocoa">{comp}</span>
                  </div>
                  <span className="text-[10px] font-bold text-terracotta shrink-0 font-mono">
                    {t('kaushal.authenticated')}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* RECOMMENDED COURSES */}
          <div>
            <h3 className="text-sm font-extrabold text-warmCocoa mb-2.5 px-1">
              {t('kaushal.recommended')}
            </h3>
            <div className="space-y-2.5">
              {(coursesQuery.data ?? []).map((course) => (
                <Card key={course.id} className="mb-0 p-3.5 flex items-center justify-between gap-3 hover:border-terracotta/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warmAmber/20 text-terracotta">
                      <AppIcon name={course.icon} size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-warmCocoa truncate">
                        {t(course.titleKey)}
                      </h4>
                      <p className="text-[11px] text-textMuted mt-0.5">
                        {course.provider} • {t(course.durationKey)} • {t(course.levelKey)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-successSoft px-2.5 py-0.5 text-[11px] font-bold text-success border border-success/30">
                    {t('kaushal.free')}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL SKILL PASSPORT PREVIEW MODAL */}
      {/* ========================================================================= */}
      <ModalPortal
        isOpen={passportModalOpen}
        onClose={() => setPassportModalOpen(false)}
        maxWidthClass="sm:max-w-lg"
      >
        {/* Pinned Header */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-3 pb-3 border-b border-softBorder">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-warmCocoa text-base">
                  {t('kaushal.previewTitle')}
                </span>
                <span className="rounded-full bg-saffronGold/20 px-2 py-0.5 text-[10px] font-bold text-warmCocoa border border-saffronGold/40">
                  ✓ Verified
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPassportModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-warmCream/80 text-textMuted hover:text-warmCocoa"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 text-center">
              {/* Avatar and Identity */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-2xl font-black text-white shadow-card ring-2 ring-saffronGold">
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
                <h3 className="text-xl font-black text-warmCocoa">{profile.name}</h3>
                <p className="text-xs font-bold text-terracotta">
                  {occupation} • {t(profile.cityKey)}
                </p>
                <p className="text-[11px] text-textMuted mt-0.5">
                  {profile.experienceYears} Years Verified Experience • Languages: Hindi, Marathi, English
                </p>
              </div>

              {/* Stats Box */}
              <div className="flex justify-around rounded-2xl bg-warmCream/60 p-3 border border-softBorder">
                <div>
                  <span className="text-lg font-black text-warmCocoa">48</span>
                  <span className="block text-[10px] text-textMuted uppercase">
                    {t('kaushal.jobsDone')}
                  </span>
                </div>
                <div>
                  <span className="text-lg font-black text-warmCocoa">₹750</span>
                  <span className="block text-[10px] text-textMuted uppercase">
                    {t('dhan.avgDailyIncome')}
                  </span>
                </div>
                <div>
                  <span className="text-lg font-black text-warmCocoa">⭐ 4.8</span>
                  <span className="block text-[10px] text-textMuted uppercase">
                    {t('kaushal.rating')}
                  </span>
                </div>
              </div>

              {/* SECTION A: Verified Competencies */}
              <div className="text-left rounded-2xl bg-warmAmber/15 p-3.5 border border-warmAmber/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <AppIcon name="shield-checkmark" size={15} className="text-terracotta" />
                  <span className="text-xs font-extrabold text-warmCocoa">
                    {t('kaushal.verifiedCompetencies')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {VERIFIED_COMPETENCIES.map((comp) => (
                    <div
                      key={comp}
                      className="flex items-center justify-between text-xs font-medium text-warmCocoa bg-cleanWhite/90 rounded-xl px-2.5 py-1.5 border border-softBorder"
                    >
                      <span>✓ {comp}</span>
                      <span className="text-[10px] font-bold text-terracotta shrink-0 ml-2">
                        {t('kaushal.authenticated')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION B: User-Declared Skills */}
              <div className="text-left rounded-2xl bg-cleanWhite p-3.5 border border-softBorder">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-warmCocoa">
                    {t('kaushal.declaredSkills')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPassportModalOpen(false);
                      setEditSkillsModalOpen(true);
                    }}
                    className="text-xs font-bold text-terracotta hover:underline"
                  >
                    {t('kaushal.editSkills')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {userDeclaredSkillLabels.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-warmCream/60 px-2.5 py-1 text-xs font-bold text-warmCocoa border border-softBorder"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pinned Modal Actions Footer */}
            <div className="shrink-0 px-5 py-3 border-t border-softBorder bg-warmCream/40 space-y-2">
              <PrimaryButton
                title={downloading ? t('kaushal.downloadMessage') : t('kaushal.downloadPdf')}
                onPress={handleDownloadPdf}
                icon={<AppIcon name="download-outline" size={18} />}
                disabled={downloading}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full rounded-full border border-softBorder bg-cleanWhite py-2 text-xs font-bold text-warmCocoa hover:bg-warmCream/60 transition-all"
              >
                {t('kaushal.copyLink')}
              </button>
            </div>
      </ModalPortal>

      {/* ========================================================================= */}
      {/* EDIT SKILLS MODAL */}
      {/* ========================================================================= */}
      <ModalPortal
        isOpen={editSkillsModalOpen}
        onClose={() => setEditSkillsModalOpen(false)}
        maxWidthClass="sm:max-w-md"
      >
        {/* Pinned Header */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-3 pb-3 border-b border-softBorder">
              <div>
                <h3 className="font-extrabold text-warmCocoa text-base">
                  {t('kaushal.editSkills')}
                </h3>
                <p className="text-xs text-textSecondary mt-0.5">
                  {t('onboarding.skillsHint')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditSkillsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-warmCream/80 text-textMuted hover:text-warmCocoa"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
              {/* Predefined skill chips to toggle */}
              <div>
                <label className="text-xs font-bold text-warmCocoa block mb-2">
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
              <div className="border-t border-softBorder pt-3">
                <label className="text-xs font-bold text-warmCocoa block mb-1.5">
                  {t('kaushal.customSkills')}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {customSkills.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full bg-warmAmber/20 border border-warmAmber/35 px-2.5 py-1 text-xs font-bold text-warmCocoa shadow-xs"
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
              </div>
            </div>

            {/* Pinned Actions Footer */}
            <div className="shrink-0 px-5 py-3 border-t border-softBorder bg-warmCream/40 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditSkillsModalOpen(false)}
                className="rounded-full px-4 py-2.5 text-xs font-bold text-textSecondary hover:bg-warmCream/60 transition-colors"
              >
                {t('profileScreen.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveSkills}
                className="emerald-gradient-btn rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-card hover:shadow-cardHover border border-saffronGold/30 active:scale-95 transition-all"
              >
                {t('kaushal.saveSkills')}
              </button>
            </div>
      </ModalPortal>

      {/* Confirmation Toast */}
      {toastMessage && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 animate-fade-in pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-[#1E2B3E] px-6 py-3 text-xs font-extrabold text-white shadow-lifted border border-saffronGold/40">
            <AppIcon name="checkmark-circle" size={16} className="text-saffronGold" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
