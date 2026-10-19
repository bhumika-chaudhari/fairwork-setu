import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../lib/icons';
import SetuLogo from '../components/SetuLogo';
import LanguageSelector from '../components/LanguageSelector';
import SoundToggle from '../components/SoundToggle';
import NotificationBellButton from '../components/notifications/NotificationBellButton';
import { useProfile } from '../hooks/ProfileContext';
import { useVoiceAssistant } from '../hooks/VoiceAssistantContext';
import { playTap, playSelect } from '../lib/feedback';

const tabs = [
  { to: '/home', key: 'tabs.home', icon: 'home' },
  { to: '/kaam', key: 'tabs.kaam', icon: 'briefcase' },
  { to: '/dhan', key: 'tabs.dhan', icon: 'wallet' },
  { to: '/sehat', key: 'tabs.sehat', icon: 'heart' },
  { to: '/kaushal', key: 'tabs.kaushal', icon: 'school' },
  { to: '/haq', key: 'tabs.haqSetu', icon: 'shield-checkmark' },
] as const;

export default function TabLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const { openAssistant } = useVoiceAssistant();

  // Listen for Native Shake-to-Log & Quick Tile Voice Triggers
  const [searchParams, setSearchParams] = useSearchParams();
  const lastVoiceActionRef = useRef<number>(0);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'voice') {
      const now = Date.now();
      if (now - lastVoiceActionRef.current > 1200) {
        lastVoiceActionRef.current = now;
        openAssistant();
      }
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    }
  }, [searchParams, openAssistant, setSearchParams]);

  useEffect(() => {
    let lastVoiceEventTime = 0;
    const handleVoiceEvent = () => {
      const now = Date.now();
      if (now - lastVoiceEventTime > 1200) {
        lastVoiceEventTime = now;
        openAssistant();
      }
    };
    window.addEventListener('setu-open-voice', handleVoiceEvent);
    return () => window.removeEventListener('setu-open-voice', handleVoiceEvent);
  }, [openAssistant]);

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      {/* Desktop Top Navigation Bar (>= md) */}
      <header className="sticky top-0 z-40 hidden md:block w-full border-b border-white/80 bg-white/75 backdrop-blur-2xl shadow-[0_8px_30px_rgba(7,59,58,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]" onClick={() => navigate('/home')}>
            <SetuLogo size="md" />
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 p-1 rounded-full bg-white/50 backdrop-blur-xl border border-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                onClick={() => playSelect()}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-2.5 lg:px-3.5 py-1.5 text-xs lg:text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-dockActive border border-[#E5953E]/50'
                      : 'text-textSecondary hover:bg-white/80 hover:text-deepEmerald active:scale-95'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <AppIcon
                      name={tab.icon}
                      size={16}
                      className={isActive ? 'text-saffronGold drop-shadow-[0_1px_4px_rgba(229,149,62,0.4)]' : 'text-textMuted'}
                    />
                    <span>{t(tab.key)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Icons: Mic, Sound Toggle, Language, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick Mic Action */}
            <button
              type="button"
              onClick={() => {
                playTap();
                openAssistant();
              }}
              className="emerald-gradient-btn flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
              aria-label="Voice Entry"
            >
              <AppIcon name="mic" size={14} className="text-white drop-shadow" />
              <span>{t('tabs.voice')}</span>
            </button>

            {/* Smart Notification Bell Button */}
            <NotificationBellButton size="sm" />

            {/* Sound & Haptics Global Toggle */}
            <SoundToggle size="sm" />

            {/* Language dropdown */}
            <LanguageSelector variant="icon" size="sm" />

            {/* Profile Avatar button */}
            <button
              type="button"
              onClick={() => {
                playTap();
                navigate('/profile');
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#B34A26] to-[#7C2D16] font-bold text-white shadow-warm ring-2 ring-white transition-all hover:scale-105 active:scale-95 overflow-hidden"
              title={t('profileScreen.title', 'Profile & Settings')}
              aria-label={t('profileScreen.title', 'Profile & Settings')}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                profile.name.charAt(0) || 'R'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 md:py-6 pb-28 md:pb-12">
        <Outlet />
      </main>

      {/* Mobile Floating Action Buttons (FABs) positioned consistently in bottom-right corner */}
      <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40 md:hidden flex flex-col items-center gap-2">
        <NotificationBellButton size="sm" />
        <SoundToggle size="sm" />
        <LanguageSelector variant="icon" size="sm" />
        <button
          type="button"
          onClick={() => {
            playTap();
            openAssistant();
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-lifted ring-4 ring-white/80 border border-[#E5953E]/50 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Quick Voice Entry"
          title={t('home.voiceA11y')}
        >
          <AppIcon name="mic" size={20} className="text-white drop-shadow" />
        </button>
      </div>

      {/* Mobile Floating Apple-Inspired Liquid Glass Dock (< md) */}
      <div className="fixed bottom-3 inset-x-3 z-40 md:hidden flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <nav
          role="navigation"
          aria-label="Bottom Navigation"
          className="pointer-events-auto flex h-[66px] w-full max-w-lg items-center justify-around rounded-[30px] bg-white/90 backdrop-blur-3xl border border-[#F4EBDD] shadow-dock p-1 transition-all duration-300"
        >
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              onClick={() => playSelect()}
              className={({ isActive }) =>
                `relative flex flex-1 min-w-0 flex-col items-center justify-center h-full rounded-[16px] sm:rounded-[20px] py-0.5 px-0.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActive
                    ? 'bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-dockActive border border-[#E5953E]/50 scale-[1.02]'
                    : 'text-textSecondary hover:text-warmCocoa active:scale-95 hover:bg-white/40'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center transition-transform shrink-0">
                    <AppIcon
                      name={tab.icon}
                      size={16}
                      className={isActive ? 'text-saffronGold drop-shadow-[0_1px_4px_rgba(229,149,62,0.4)]' : 'text-textMuted'}
                    />
                  </div>
                  <span
                    className={`text-[8px] leading-tight tracking-tight truncate w-full max-w-full text-center px-0.5 transition-all ${
                      isActive
                        ? 'font-black text-white'
                        : 'font-semibold text-textSecondary'
                    }`}
                  >
                    {t(tab.key)}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-saffronGold shadow-[0_0_6px_#E5953E]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
