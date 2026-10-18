import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import SetuLogo from '../components/SetuLogo';
import LanguageSelector from '../components/LanguageSelector';
import { AppIcon } from '../lib/icons';
import { useProfile } from '../hooks/ProfileContext';

const FEATURE_CARDS = [
  {
    key: 'landing.featureWork',
    subKey: 'landing.featureWorkSub',
    icon: 'briefcase',
    bg: 'bg-[#E6F7F2]',
    border: 'border-[#72E5C2]/50',
    iconColor: 'text-[#087F73]',
    title: 'Kaam',
    sub: 'Nearby jobs & skill matching',
  },
  {
    key: 'landing.featureMoney',
    subKey: 'landing.featureMoneySub',
    icon: 'wallet',
    bg: 'bg-[#FEF7E8]',
    border: 'border-[#F4B544]/50',
    iconColor: 'text-[#D97706]',
    title: 'Dhan',
    sub: 'Track income, save money',
  },
  {
    key: 'landing.featureHealth',
    subKey: 'landing.featureHealthSub',
    icon: 'heart',
    bg: 'bg-[#FEE2E2]/60',
    border: 'border-[#EF4444]/30',
    iconColor: 'text-[#DC2626]',
    title: 'Sehat',
    sub: 'Health & welfare support',
  },
  {
    key: 'landing.featureSkills',
    subKey: 'landing.featureSkillsSub',
    icon: 'school',
    bg: 'bg-[#E0F2FE]',
    border: 'border-[#38BDF8]/40',
    iconColor: 'text-[#0284C7]',
    title: 'Kaushal',
    sub: 'Build your skill passport',
  },
] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, onboardingComplete } = useProfile();

  return (
    <div className="relative min-h-screen w-full bg-transparent overflow-x-hidden flex flex-col justify-between">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-mint/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />

      {/* Main container */}
      <div className="relative z-10 mx-auto flex w-full max-w-md md:max-w-2xl lg:max-w-4xl flex-1 flex-col px-5 py-4 md:py-8">
        {/* Top bar matching reference Screen 1 */}
        <header className="flex items-center justify-between pb-3">
          <SetuLogo size="md" />
          <LanguageSelector variant="icon" />
        </header>

        {/* Hero Headline and subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-3"
        >
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-deepEmerald leading-[1.25]">
            {t('landing.title')}
          </h1>
          <p className="mt-2 text-sm md:text-base text-textSecondary leading-relaxed">
            {t('landing.subtitle')}
          </p>
        </motion.div>

        {/* Hero Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="my-5 flex justify-center"
        >
          <div className="relative w-full overflow-hidden rounded-[26px] bg-white/50 backdrop-blur-2xl p-2.5 shadow-glass border border-white/80">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent" />
            <img
              src="/images/hero-illustration.jpg"
              alt={t('landing.heroAlt')}
              className="h-auto w-full rounded-[20px] object-cover transition-transform duration-300 hover:scale-[1.01]"
              loading="eager"
            />
            {/* Subtle soft gradient fade at bottom of image */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-[20px] bg-gradient-to-t from-white/40 to-transparent" />
          </div>
        </motion.div>

        {/* Four Feature Cards Grid (2x2 matching reference image) */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 my-2">
          {FEATURE_CARDS.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 + idx * 0.07 }}
              className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 rounded-[22px] bg-white/50 backdrop-blur-xl p-3.5 shadow-glass border border-white/75 transition-all duration-300 hover:border-white hover:bg-white/65 hover:shadow-glassHover overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${card.bg} ${card.border} border shadow-xs`}
              >
                <AppIcon name={card.icon} size={20} className={card.iconColor} />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-bold text-deepEmerald leading-tight">
                  {t(card.key)}
                </span>
                <span className="block text-[11px] text-textMuted leading-tight mt-0.5 truncate">
                  {t(card.subKey)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons (Get Started + Quick Dashboard shortcut if already onboarded) */}
        <div className="mt-6 pt-2 space-y-2.5">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            type="button"
            onClick={() => navigate('/onboarding')}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-base font-extrabold text-white shadow-glass hover:shadow-glassHover border border-emerald-400/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <span>{t('landing.getStarted')}</span>
            <AppIcon name="arrow-forward" size={18} />
          </motion.button>

          {onboardingComplete && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.55 }}
              type="button"
              onClick={() => navigate('/home')}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/70 hover:bg-white text-sm font-extrabold text-deepEmerald shadow-xs border border-white/90 backdrop-blur-md hover:shadow-sm active:scale-95 transition-all"
            >
              <AppIcon name="home" size={16} className="text-primary" />
              <span>{t('landing.goToDashboard', 'Proceed to Dashboard')} ({profile.name}) →</span>
            </motion.button>
          )}
        </div>

        {/* Bottom Language Selector Pills row */}
        <footer className="mt-5 pb-3">
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
            <span className="text-xs text-textMuted mr-1">🌐</span>
            <LanguageSelector variant="grid" />
          </div>
        </footer>
      </div>
    </div>
  );
}
