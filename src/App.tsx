import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n, { initLanguage } from './localization';
import { ProfileProvider } from './hooks/ProfileContext';
import { TransactionProvider } from './hooks/TransactionContext';
import { SpeechProvider } from './lib/speechSynthesisContext';
import AudioPlayerBar from './components/AudioPlayerBar';
import AtmosphericBackground from './components/AtmosphericBackground';
import TabLayout from './layouts/TabLayout';
import { VoiceAssistantProvider } from './hooks/VoiceAssistantContext';
import UnifiedVoiceAssistantModal from './components/UnifiedVoiceAssistantModal';
import { NotificationProvider } from './hooks/NotificationContext';
import NotificationCenterDrawer from './components/notifications/NotificationCenterDrawer';
import { attachGlobalFeedback } from './lib/feedback';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import KaamPage from './pages/KaamPage';
import DhanPage from './pages/DhanPage';
import SehatPage from './pages/SehatPage';
import KaushalPage from './pages/KaushalPage';
import ProfilePage from './pages/ProfilePage';
import HaqSetuPage from './pages/HaqSetuPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthModal } from './components/AuthModal';

import { useProfile } from './hooks/ProfileContext';

function GlobalAuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useProfile();
  return <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated, onboardingComplete } = useProfile();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-mint border-t-deepEmerald" />
          <span className="text-sm font-bold text-deepEmerald">Setu • सेतु</span>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function RequireAuthForOnboarding({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated, onboardingComplete } = useProfile();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-mint border-t-deepEmerald" />
          <span className="text-sm font-bold text-deepEmerald">Setu • सेतु</span>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/signup" replace />;
  }
  if (onboardingComplete) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}

const queryClient = new QueryClient();

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initLanguage().finally(() => setReady(true));
    const detachFeedback = attachGlobalFeedback();
    return () => detachFeedback();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-mint border-t-deepEmerald" />
          <span className="text-sm font-bold text-deepEmerald">Setu • सेतु</span>
        </div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>
          <TransactionProvider>
            <SpeechProvider>
              <div className="relative min-h-screen w-full bg-transparent text-textPrimary">
                <AtmosphericBackground />
                <BrowserRouter>
                  <NotificationProvider>
                    <VoiceAssistantProvider>
                      <Routes>
                        {/* Public Auth Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/welcome" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignUpPage />} />

                        {/* Profile Setup / Onboarding for Authenticated Users */}
                        <Route
                          path="/onboarding"
                          element={
                            <RequireAuthForOnboarding>
                              <OnboardingPage />
                            </RequireAuthForOnboarding>
                          }
                        />

                        {/* Main Dashboard & App Tabs (Protected by Auth & Profile Completion) */}
                        <Route
                          element={
                            <RequireAuth>
                              <TabLayout />
                            </RequireAuth>
                          }
                        >
                          <Route path="/home" element={<HomePage />} />
                          <Route path="/kaam" element={<KaamPage />} />
                          <Route path="/work" element={<Navigate to="/kaam" replace />} />
                          <Route path="/dhan" element={<DhanPage />} />
                          <Route path="/money" element={<Navigate to="/dhan" replace />} />
                          <Route path="/sehat" element={<SehatPage />} />
                          <Route path="/health" element={<Navigate to="/sehat" replace />} />
                          <Route path="/kaushal" element={<KaushalPage />} />
                          <Route path="/skills" element={<Navigate to="/kaushal" replace />} />
                          <Route path="/ai-lab" element={<Navigate to="/home" replace />} />
                          <Route path="/ml" element={<Navigate to="/home" replace />} />
                          <Route path="/haq" element={<HaqSetuPage />} />
                          <Route path="/haq-setu" element={<Navigate to="/haq" replace />} />
                          <Route path="/rights" element={<Navigate to="/haq" replace />} />
                          <Route path="/voice" element={<HomePage />} />
                        </Route>

                        {/* Profile & Settings (Protected by Auth) */}
                        <Route
                          path="/profile"
                          element={
                            <RequireAuth>
                              <ProfilePage />
                            </RequireAuth>
                          }
                        />
                        <Route path="/404" element={<NotFoundPage />} />
                        <Route path="*" element={<Navigate to="/404" replace />} />
                      </Routes>
                      <UnifiedVoiceAssistantModal />
                      <NotificationCenterDrawer />
                      <AudioPlayerBar />
                      <GlobalAuthModal />
                    </VoiceAssistantProvider>

                  </NotificationProvider>
                </BrowserRouter>
            </div>
          </SpeechProvider>
          </TransactionProvider>
        </ProfileProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
