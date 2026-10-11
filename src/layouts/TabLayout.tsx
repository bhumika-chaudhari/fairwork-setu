import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../lib/icons';
import SetuLogo from '../components/SetuLogo';
import LanguageSelector from '../components/LanguageSelector';
import VoiceEntryModal from '../components/VoiceEntryModal';
import { useProfile } from '../hooks/ProfileContext';

const tabs = [
  { to: '/home', key: 'tabs.home', icon: 'home' },
  { to: '/kaam', key: 'tabs.kaam', icon: 'briefcase' },
  { to: '/dhan', key: 'tabs.dhan', icon: 'wallet' },
  { to: '/ai-lab', key: 'tabs.aiLab', icon: 'sparkles' },
  { to: '/sehat', key: 'tabs.sehat', icon: 'heart' },
  { to: '/kaushal', key: 'tabs.kaushal', icon: 'school' },
] as const;

export default function TabLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // If user navigates directly to /voice, show modal
  const isVoiceRoute = location.pathname === '/voice';

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      {/* Desktop Top Navigation Bar (>= md) */}
      <header className="sticky top-0 z-40 hidden md:block w-full border-b border-white/80 bg-white/75 backdrop-blur-2xl shadow-[0_8px_30px_rgba(7,59,58,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          {/* Logo */}
          <div className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]" onClick={() => navigate('/home')}>
            <SetuLogo size="md" />
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1.5 p-1 rounded-full bg-white/50 backdrop-blur-xl border border-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#073B3A] to-[#087F73] text-white shadow-dockActive border border-mint/40'
                      : 'text-textSecondary hover:bg-white/80 hover:text-deepEmerald active:scale-95'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <AppIcon
                      name={tab.icon}
                      size={17}
                      className={isActive ? 'text-mint drop-shadow-[0_1px_4px_rgba(114,229,194,0.4)]' : 'text-textMuted'}
                    />
                    <span>{t(tab.key)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Icons: Mic, Language, Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Mic Action */}
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="emerald-gradient-btn flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
              aria-label="Voice Entry"
            >
              <AppIcon name="mic" size={14} className="text-white drop-shadow" />
              <span>{t('tabs.voice')}</span>
            </button>

            {/* Language dropdown */}
            <LanguageSelector variant="icon" />

            {/* Profile Avatar button */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-gradient font-bold text-white shadow-glass ring-2 ring-white transition-all hover:scale-105 active:scale-95 overflow-hidden"
              aria-label="Profile"
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
      <main className="flex-1 w-full mx-auto max-w-5xl md:px-6 md:py-6 pb-28 md:pb-8">
        <div className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile Floating Action Button (FAB) for Quick Voice Entry positioned above floating dock */}
      <button
        type="button"
        onClick={() => setVoiceModalOpen(true)}
        className="fixed bottom-24 right-5 z-40 md:hidden flex h-13 w-13 items-center justify-center rounded-full bg-emerald-gradient p-3.5 text-white shadow-lifted ring-4 ring-white/70 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="Quick Voice Entry"
        title={t('home.voiceA11y')}
      >
        <AppIcon name="mic" size={22} className="text-white drop-shadow" />
      </button>

      {/* Mobile Floating Apple-Inspired Liquid Glass Dock (< md) */}
      <div className="fixed bottom-3 inset-x-3 z-40 md:hidden flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <nav
          role="navigation"
          aria-label="Bottom Navigation"
          className="pointer-events-auto flex h-[66px] w-full max-w-md items-center justify-around rounded-[30px] bg-white/78 backdrop-blur-3xl border border-white/90 shadow-dock p-1.5 transition-all duration-300"
        >
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center justify-center h-full rounded-[22px] py-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActive
                    ? 'bg-gradient-to-br from-[#073B3A] to-[#087F73] text-white shadow-dockActive border border-mint/40 scale-[1.02]'
                    : 'text-textSecondary hover:text-deepEmerald active:scale-95 hover:bg-white/40'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex h-7 w-7 items-center justify-center transition-transform">
                    <AppIcon
                      name={tab.icon}
                      size={19}
                      className={isActive ? 'text-mint drop-shadow-[0_1px_4px_rgba(114,229,194,0.4)]' : 'text-textMuted'}
                    />
                  </div>
                  <span
                    className={`text-[9.5px] leading-tight tracking-tight truncate max-w-[52px] text-center transition-all ${
                      isActive
                        ? 'font-black text-white'
                        : 'font-semibold text-textSecondary'
                    }`}
                  >
                    {t(tab.key)}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-mint shadow-[0_0_6px_#72E5C2]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Global Voice Entry Modal */}
      <VoiceEntryModal
        visible={voiceModalOpen || isVoiceRoute}
        onClose={() => {
          setVoiceModalOpen(false);
          if (isVoiceRoute) {
            navigate(-1);
          }
        }}
      />
    </div>
  );
}
