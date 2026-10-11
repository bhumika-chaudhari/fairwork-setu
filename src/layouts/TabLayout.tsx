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
    <div className="flex min-h-screen flex-col bg-page">
      {/* Desktop Top Navigation Bar (>= md) */}
      <header className="sticky top-0 z-40 hidden md:block w-full border-b border-[rgba(8,127,115,0.16)] bg-white/85 backdrop-blur-md shadow-glass">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          {/* Logo */}
          <div className="cursor-pointer" onClick={() => navigate('/home')}>
            <SetuLogo size="md" />
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1.5">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#073B3A] to-[#087F73] text-white shadow-card'
                      : 'text-textSecondary hover:bg-white/80 hover:text-deepEmerald'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <AppIcon
                      name={tab.icon}
                      size={17}
                      className={isActive ? 'text-mint' : 'text-textMuted'}
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
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#087F73] to-[#72E5C2] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
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
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-gradient font-bold text-white shadow-sm ring-2 ring-white transition-all hover:scale-105 overflow-hidden"
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
      <main className="flex-1 w-full mx-auto max-w-5xl md:px-6 md:py-6 pb-24 md:pb-6">
        <div className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile Floating Action Button (FAB) for Quick Voice Entry from any tab */}
      <button
        type="button"
        onClick={() => setVoiceModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 md:hidden flex h-13 w-13 items-center justify-center rounded-full bg-emerald-gradient p-3.5 text-white shadow-lifted ring-4 ring-white/80 transition-all hover:scale-105 active:scale-95"
        aria-label="Quick Voice Entry"
        title={t('home.voiceA11y')}
      >
        <AppIcon name="mic" size={22} className="text-white drop-shadow" />
      </button>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-[rgba(8,127,115,0.16)] bg-white/90 backdrop-blur-xl shadow-nav pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-16 items-center justify-around px-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex min-w-[56px] flex-col items-center justify-center py-1 transition-all ${
                  isActive ? 'text-deepEmerald scale-105' : 'text-textMuted hover:text-textSecondary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                      isActive ? 'bg-[#E4FAF2] border border-mint/40 text-deepEmerald shadow-sm' : ''
                    }`}
                  >
                    <AppIcon
                      name={tab.icon}
                      size={19}
                      className={isActive ? 'text-primary' : 'text-textMuted'}
                    />
                  </div>
                  <span
                    className={`text-[10px] tracking-tight mt-0.5 ${
                      isActive ? 'font-extrabold text-deepEmerald' : 'font-semibold text-textMuted'
                    }`}
                  >
                    {t(tab.key)}
                  </span>
                  {isActive && (
                    <div className="h-[2.5px] w-3.5 rounded-full bg-primary mt-0.5" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

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
