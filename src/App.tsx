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
import RootRedirect from './pages/RootRedirect';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import KaamPage from './pages/KaamPage';
import DhanPage from './pages/DhanPage';
import SehatPage from './pages/SehatPage';
import KaushalPage from './pages/KaushalPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient();

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initLanguage().finally(() => setReady(true));
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
                <Routes>
                  {/* Entry & Onboarding */}
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/welcome" element={<LandingPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />

                  {/* Main App with Shared Navigation */}
                  <Route element={<TabLayout />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/kaam" element={<KaamPage />} />
                    <Route path="/work" element={<Navigate to="/kaam" replace />} />
                    <Route path="/dhan" element={<DhanPage />} />
                    <Route path="/money" element={<Navigate to="/dhan" replace />} />
                    <Route path="/sehat" element={<SehatPage />} />
                    <Route path="/health" element={<Navigate to="/sehat" replace />} />
                    <Route path="/kaushal" element={<KaushalPage />} />
                    <Route path="/skills" element={<Navigate to="/kaushal" replace />} />
                    <Route path="/voice" element={<HomePage />} />
                  </Route>

                  {/* Profile & Utility */}
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
                <AudioPlayerBar />
              </BrowserRouter>
            </div>
          </SpeechProvider>
          </TransactionProvider>
        </ProfileProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
