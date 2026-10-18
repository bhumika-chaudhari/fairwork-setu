import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import SetuLogo from '../components/SetuLogo';
import LanguageSelector from '../components/LanguageSelector';
import { AppIcon } from '../lib/icons';
import { useProfile } from '../hooks/ProfileContext';

import SoundToggle from '../components/SoundToggle';
import { playTap, playPop } from '../lib/feedback';


const FEATURE_CARDS = [
  {
    key: 'landing.featureWork',
    subKey: 'landing.featureWorkSub',
    icon: 'briefcase',
    bg: 'bg-[#EFF7F8]',
    border: 'border-[#3A757D]/35',
    iconColor: 'text-[#3A757D]',
    spotlight: 'rgba(58, 117, 125, 0.16)',
    title: 'Kaam',
    sub: 'Nearby jobs & skill matching',
  },
  {
    key: 'landing.featureMoney',
    subKey: 'landing.featureMoneySub',
    icon: 'wallet',
    bg: 'bg-[#FEF4E8]',
    border: 'border-[#E5953E]/45',
    iconColor: 'text-[#B34A26]',
    spotlight: 'rgba(229, 149, 62, 0.18)',
    title: 'Dhan',
    sub: 'Track income, save money',
  },
  {
    key: 'landing.featureHealth',
    subKey: 'landing.featureHealthSub',
    icon: 'heart',
    bg: 'bg-[#FDF3EE]',
    border: 'border-[#B34A26]/30',
    iconColor: 'text-[#B34A26]',
    spotlight: 'rgba(179, 74, 38, 0.16)',
    title: 'Sehat',
    sub: 'Health & welfare support',
  },
  {
    key: 'landing.featureSkills',
    subKey: 'landing.featureSkillsSub',
    icon: 'school',
    bg: 'bg-[#FEF9EC]',
    border: 'border-[#E5A823]/40',
    iconColor: 'text-[#E5A823]',
    spotlight: 'rgba(229, 168, 35, 0.18)',
    title: 'Kaushal',
    sub: 'Build your skill passport',
  },
] as const;

function SpotlightFeatureCard({
  card,
  idx,
  t,
}: {
  card: (typeof FEATURE_CARDS)[number];
  idx: number;
  t: (key: string) => string;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 + idx * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      onMouseMove={handleMouseMove}
      onClick={() => playTap()}
      className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 rounded-[22px] bg-white/80 backdrop-blur-xl p-3.5 shadow-sm border border-[#E9DFCE] hover:border-[#E5953E]/50 transition-colors duration-200 overflow-hidden cursor-pointer select-none touch-manipulation transform-gpu"
    >
      {/* Dynamic Cursor Spotlight Effect - Desktop only to prevent mobile touch flashes */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[22px] opacity-0 transition-opacity duration-300 hidden md:block group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              160px circle at ${mouseX}px ${mouseY}px,
              ${card.spotlight},
              transparent 80%
            )
          `,
        }}
      />

      {/* Top Glass Rim Line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      {/* Icon */}
      <div
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${card.bg} ${card.border} border shadow-xs transition-transform duration-200 group-hover:scale-105`}
      >
        <AppIcon name={card.icon} size={20} className={card.iconColor} />
      </div>

      <div className="relative min-w-0">
        <span className="block text-sm font-bold text-deepEmerald leading-tight transition-colors duration-200 group-hover:text-black">
          {t(card.key)}
        </span>
        <span className="block text-[11px] text-textMuted leading-tight mt-0.5 truncate font-medium">
          {t(card.subKey)}
        </span>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, onboardingComplete } = useProfile();

  const handleGetStarted = () => {
    playPop();
    navigate('/onboarding');
  };

  const handleGoToDashboard = () => {
    playTap();
    navigate('/home');
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#FDF8F0] via-[#F8EFE2] to-[#FAF5EC] overflow-x-hidden flex flex-col justify-between selection:bg-amber-200">
      {/* Living Atmospheric Glow Orbs - Hardware Accelerated */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[340px] md:h-[480px] w-[340px] md:w-[480px] rounded-full bg-[#E5953E]/35 blur-[80px] md:blur-[120px] transform-gpu" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-[340px] md:h-[480px] w-[340px] md:w-[480px] rounded-full bg-[#E5953E]/30 blur-[80px] md:blur-[130px] transform-gpu" />
      <div className="pointer-events-none absolute bottom-10 left-1/4 h-[300px] md:h-[380px] w-[300px] md:w-[380px] rounded-full bg-[#B34A26]/20 blur-[90px] md:blur-[140px] transform-gpu" />

      {/* Main container */}
      <div className="relative z-10 mx-auto flex w-full max-w-md md:max-w-2xl lg:max-w-4xl flex-1 flex-col px-5 py-4 md:py-8">
        {/* Top bar with Sound Toggle, Language, and Profile Icon */}
        <header className="flex items-center justify-between pb-3">
          <SetuLogo size="md" />
          <div className="flex items-center gap-2">
            <SoundToggle />
            <LanguageSelector variant="icon" />
            <button
              type="button"
              onClick={() => {
                playTap();
                navigate('/profile');
              }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-xl shadow-sm border border-[#E9DFCE] text-deepEmerald hover:bg-white hover:text-[#B34A26] hover:border-[#E5953E]/50 transition-all active:scale-95"
              title={t('profileScreen.title', 'Profile')}
              aria-label={t('profileScreen.title', 'Profile')}
            >
              <AppIcon name="person" size={18} />
            </button>
          </div>
        </header>

        {/* Hero Headline & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
          className="my-5 flex justify-center"
        >
          <div
            className="group relative w-full overflow-hidden rounded-[28px] bg-white/60 backdrop-blur-2xl p-2.5 shadow-xl shadow-[#7C2D16]/8 border border-white/80 ring-1 ring-[#D8CCB5]/60 transform-gpu"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />



            <img
              src="/images/hero-illustration.jpg"
              alt={t('landing.heroAlt')}
              className="h-auto w-full rounded-[22px] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              loading="eager"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-[22px] bg-gradient-to-t from-[#F4E9D8]/80 via-[#F4E9D8]/30 to-transparent" />
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 my-2">
          {FEATURE_CARDS.map((card, idx) => (
            <SpotlightFeatureCard key={card.title} card={card} idx={idx} t={t} />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-2 space-y-2.5">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleGetStarted}
            className="group relative overflow-hidden emerald-gradient-btn flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-extrabold text-white shadow-xl shadow-emerald-950/25 active:shadow-md transition-all duration-300"
          >
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
              className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
            />
            <span className="relative z-10">{t('landing.getStarted')}</span>
            <div className="relative z-10 transition-transform duration-200 group-hover:translate-x-1">
              <AppIcon name="arrow-forward" size={18} />
            </div>
          </motion.button>

          {onboardingComplete && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.55 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoToDashboard}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/80 hover:bg-white/95 text-sm font-extrabold text-deepEmerald shadow-sm border border-[#E0D4C0] backdrop-blur-md hover:border-[#E5953E]/50 hover:shadow-md transition-all duration-300"
            >
              <AppIcon name="home" size={16} className="text-primary" />
              <span>{t('landing.goToDashboard', 'Proceed to Dashboard')} ({profile.name}) →</span>
            </motion.button>
          )}
        </div>

        {/* Bottom Language Selector */}
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