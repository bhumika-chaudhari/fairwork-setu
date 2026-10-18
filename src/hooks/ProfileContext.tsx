import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Availability, WorkerType } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { apiClient } from '../services/apiClient';
import { setCurrentAuthUserId } from '../services/transactionService';
import { changeAppLanguage, type LanguageCode } from '../localization';
import type { User, Session } from '@supabase/supabase-js';

const PROFILE_KEY_PREFIX = '@setu/profile_';
const ONBOARDING_KEY_PREFIX = '@setu/onboarding_';

export type Gender = 'woman' | 'man' | 'non_binary' | 'prefer_not_to_say';

export interface ProfileState {
  name: string;
  avatarUrl?: string;
  gender?: Gender | null;
  cityKey: string;
  workType: WorkerType | null;
  skillKeys: string[];
  customSkills: string[];
  experienceYears: number;
  availability: Availability;
  payMin: number;
  payMax: number;
  emergencyContact: string;
  savingsGoal: number;
  weeklySaveGoal: number;
  preferredLanguage?: string;
  speechRate?: number;
  voiceSilenceTimeout?: number;
  privacyMaskEarnings?: boolean;
}

export const emptyProfile: ProfileState = {
  name: '',
  avatarUrl: '',
  gender: null,
  cityKey: 'cities.pune',
  workType: 'driver',
  skillKeys: [],
  customSkills: [],
  experienceYears: 1,
  availability: 'anytime',
  payMin: 400,
  payMax: 700,
  emergencyContact: '',
  savingsGoal: 5000,
  weeklySaveGoal: 350,
  preferredLanguage: 'en',
  speechRate: 0.95,
  voiceSilenceTimeout: 5,
  privacyMaskEarnings: false,
};

export const defaultProfile = emptyProfile;

function computeStrength(profile: ProfileState): number {
  if (!profile || !profile.name || !profile.name.trim()) return 0;
  const checks = [
    profile.name.trim().length > 1,
    !!profile.cityKey,
    !!profile.workType,
    profile.skillKeys.length + profile.customSkills.length >= 1,
    profile.experienceYears > 0,
    !!profile.availability,
    profile.payMax > 0,
    profile.savingsGoal > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function mapBackendToProfileState(backendProfile: any, fallback: ProfileState): ProfileState {
  if (!backendProfile) return fallback;
  return {
    name: backendProfile.full_name || fallback.name || '',
    avatarUrl: backendProfile.avatar_url || fallback.avatarUrl || '',
    gender: (backendProfile.gender as Gender) || fallback.gender || null,
    cityKey: backendProfile.city_key || fallback.cityKey || 'cities.pune',
    workType: (backendProfile.work_type as WorkerType) || fallback.workType || 'driver',
    skillKeys: backendProfile.skills
      ? (typeof backendProfile.skills === 'string' ? backendProfile.skills.split(',').filter(Boolean) : backendProfile.skills)
      : fallback.skillKeys,
    customSkills: backendProfile.custom_skills
      ? (typeof backendProfile.custom_skills === 'string' ? backendProfile.custom_skills.split(',').filter(Boolean) : backendProfile.custom_skills)
      : fallback.customSkills,
    experienceYears: backendProfile.experience_years ?? fallback.experienceYears ?? 1,
    availability: (backendProfile.availability as Availability) || fallback.availability || 'anytime',
    payMin: backendProfile.pay_min ?? fallback.payMin ?? 400,
    payMax: backendProfile.pay_max ?? fallback.payMax ?? 700,
    emergencyContact: backendProfile.emergency_contact || fallback.emergencyContact || '',
    savingsGoal: backendProfile.savings_goal ?? fallback.savingsGoal ?? 5000,
    weeklySaveGoal: backendProfile.weekly_save_goal ?? fallback.weeklySaveGoal ?? 350,
    preferredLanguage: backendProfile.preferred_language || fallback.preferredLanguage || 'en',
    speechRate: backendProfile.speech_rate ?? fallback.speechRate ?? 0.95,
    voiceSilenceTimeout: backendProfile.voice_silence_timeout ?? fallback.voiceSilenceTimeout ?? 5,
    privacyMaskEarnings: backendProfile.privacy_mask_earnings ?? fallback.privacyMaskEarnings ?? false,
  };
}

function mapProfileStateToBackendPayload(profile: ProfileState) {
  return {
    name: profile.name.trim(),
    avatarUrl: profile.avatarUrl || '',
    gender: profile.gender || null,
    cityKey: profile.cityKey,
    workType: profile.workType,
    skills: profile.skillKeys.join(','),
    customSkills: profile.customSkills.join(','),
    experienceYears: profile.experienceYears,
    availability: profile.availability,
    payMin: profile.payMin,
    payMax: profile.payMax,
    emergencyContact: profile.emergencyContact,
    savingsGoal: profile.savingsGoal,
    weeklySaveGoal: profile.weeklySaveGoal,
    preferredLanguage: profile.preferredLanguage || 'en',
    speechRate: profile.speechRate ?? 0.95,
    voiceSilenceTimeout: profile.voiceSilenceTimeout ?? 5,
    privacyMaskEarnings: profile.privacyMaskEarnings ?? false,
  };
}

interface ProfileContextValue {
  profile: ProfileState;
  ready: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  strength: number;
  isIncomplete: boolean;
  updateProfile: (patch: Partial<ProfileState>) => Promise<void>;
  completeOnboarding: (patch?: Partial<ProfileState>) => Promise<void>;
  logout: () => Promise<void>;

  // Authentication state & actions
  user: User | null;
  session: Session | null;
  isCloudConnected: boolean;
  isSupabaseConfigured: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  loginWithPhone: (phoneNumber: string) => Promise<{ error: Error | null; message?: string }>;
  verifyPhoneOtp: (phoneNumber: string, token: string) => Promise<{ error: Error | null; user?: User | null }>;
  loginWithEmail: (email: string, password?: string) => Promise<{ error: Error | null; user?: User | null }>;
  signupWithEmail: (email: string, password: string, name?: string) => Promise<{ error: Error | null; user?: User | null }>;
  sendMagicLink: (email: string) => Promise<{ error: Error | null; message?: string }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileState>(emptyProfile);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [ready, setReady] = useState(false);

  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  // Fetch or sync remote profile from FastAPI backend when authenticated
  const syncRemoteProfile = useCallback(async (activeUser: User) => {
    try {
      const res = await apiClient.get('/user/profile');
      if (res.data?.profile) {
        const mapped = mapBackendToProfileState(res.data.profile, emptyProfile);
        setProfile(mapped);
        localStorage.setItem(`${PROFILE_KEY_PREFIX}${activeUser.id}`, JSON.stringify(mapped));
        const hasCompleted = Boolean(mapped.name && mapped.name.trim().length > 1);
        setOnboardingComplete(hasCompleted);
        if (hasCompleted) {
          localStorage.setItem(`${ONBOARDING_KEY_PREFIX}${activeUser.id}`, '1');
        }
        if (mapped.preferredLanguage) {
          changeAppLanguage(mapped.preferredLanguage as LanguageCode);
        }
        return;
      }
    } catch (err: any) {
      console.warn('[ProfileSync] Remote profile fetch warning:', err.response?.status || err.message);
    }

    // Fallback to user-scoped local storage if backend is unreachable
    try {
      const cached = localStorage.getItem(`${PROFILE_KEY_PREFIX}${activeUser.id}`);
      const cachedOnboarding = localStorage.getItem(`${ONBOARDING_KEY_PREFIX}${activeUser.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setProfile({ ...emptyProfile, ...parsed });
        setOnboardingComplete(cachedOnboarding === '1' && Boolean(parsed.name && parsed.name.trim().length > 1));
      } else {
        setProfile(emptyProfile);
        setOnboardingComplete(false);
      }
    } catch {
      setProfile(emptyProfile);
      setOnboardingComplete(false);
    }
  }, []);

  // Session validation and auth listener
  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setSession(null);
      setCurrentAuthUserId(null);
      setProfile(emptyProfile);
      setOnboardingComplete(false);
      setAuthLoading(false);
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentAuthUserId(session.user.id);
        syncRemoteProfile(session.user).finally(() => {
          setAuthLoading(false);
          setReady(true);
        });
      } else {
        setCurrentAuthUserId(null);
        setProfile(emptyProfile);
        setOnboardingComplete(false);
        setAuthLoading(false);
        setReady(true);
      }
    }).catch((err) => {
      console.warn('[Supabase] Initial session check error:', err);
      setUser(null);
      setSession(null);
      setCurrentAuthUserId(null);
      setProfile(emptyProfile);
      setOnboardingComplete(false);
      setAuthLoading(false);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setAuthLoading(false);

      if (event === 'SIGNED_OUT' || !newSession?.user) {
        setCurrentAuthUserId(null);
        setProfile(emptyProfile);
        setOnboardingComplete(false);
      } else if (newSession?.user) {
        setCurrentAuthUserId(newSession.user.id);
        await syncRemoteProfile(newSession.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncRemoteProfile]);

  const persist = useCallback(async (next: ProfileState) => {
    setProfile(next);
    if (user) {
      localStorage.setItem(`${PROFILE_KEY_PREFIX}${user.id}`, JSON.stringify(next));
      if (isSupabaseConfigured) {
        try {
          await apiClient.put('/user/profile', mapProfileStateToBackendPayload(next));
        } catch (err) {
          console.warn('[ProfileContext] Background profile sync failed:', err);
        }
      }
    }
  }, [user]);

  const updateProfile = useCallback(
    async (patch: Partial<ProfileState>) => {
      await persist({ ...profile, ...patch });
    },
    [persist, profile]
  );

  const completeOnboarding = useCallback(
    async (patch?: Partial<ProfileState>) => {
      const next = { ...profile, ...patch };
      await persist(next);
      if (user) {
        localStorage.setItem(`${ONBOARDING_KEY_PREFIX}${user.id}`, '1');
      }
      setOnboardingComplete(true);
    },
    [persist, profile, user]
  );

  const logout = useCallback(async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Supabase] Signout error:', err);
      }
    }
    if (user) {
      localStorage.removeItem(`${PROFILE_KEY_PREFIX}${user.id}`);
      localStorage.removeItem(`${ONBOARDING_KEY_PREFIX}${user.id}`);
    }
    setCurrentAuthUserId(null);
    setUser(null);
    setSession(null);
    setProfile(emptyProfile);
    setOnboardingComplete(false);
  }, [user]);

  // Phone OTP Login
  const loginWithPhone = useCallback(async (phoneNumber: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error(
          'Authentication service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
        ),
      };
    }
    const cleanNumber = phoneNumber.replace(/[\s-]/g, '');
    const formatted = cleanNumber.startsWith('+') ? cleanNumber : `+91${cleanNumber.replace(/^0+/, '')}`;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formatted,
      });
      if (error) return { error };
      return { error: null, message: `OTP sent successfully to ${formatted}` };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  // Verify Phone OTP
  const verifyPhoneOtp = useCallback(async (phoneNumber: string, token: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error(
          'Authentication service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
        ),
      };
    }
    const cleanNumber = phoneNumber.replace(/[\s-]/g, '');
    const formatted = cleanNumber.startsWith('+') ? cleanNumber : `+91${cleanNumber.replace(/^0+/, '')}`;

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: token.trim(),
        type: 'sms',
      });
      if (error) return { error };
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        setCurrentAuthUserId(data.user.id);
        setIsAuthModalOpen(false);
        await syncRemoteProfile(data.user);
      }
      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err };
    }
  }, [syncRemoteProfile]);

  // Email Login
  const loginWithEmail = useCallback(async (email: string, password?: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error(
          'Authentication service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
        ),
      };
    }
    try {
      if (password && password.trim().length > 0) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) return { error };
        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          setCurrentAuthUserId(data.user.id);
          setIsAuthModalOpen(false);
          await syncRemoteProfile(data.user);
        }
        return { error: null, user: data.user };
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
        });
        if (error) return { error };
        return { error: null, message: 'Magic sign-in link sent to your email.' };
      }
    } catch (err: any) {
      return { error: err };
    }
  }, [syncRemoteProfile]);

  // Email Sign Up
  const signupWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error(
          'Authentication service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
        ),
      };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name || '',
          },
        },
      });
      if (error) return { error };
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        setCurrentAuthUserId(data.user.id);
        setIsAuthModalOpen(false);
        if (name) {
          setProfile((prev) => ({ ...prev, name }));
        }
      }
      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  // Magic Link
  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error(
          'Authentication service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
        ),
      };
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });
      if (error) return { error };
      return { error: null, message: `Magic sign-in link sent to ${email}` };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  const strength = useMemo(() => computeStrength(profile), [profile]);
  const isAuthenticated = Boolean(user);

  const value = useMemo(
    () => ({
      profile,
      ready,
      authLoading,
      isAuthenticated,
      onboardingComplete,
      strength,
      isIncomplete: strength < 80,
      updateProfile,
      completeOnboarding,
      logout,
      user,
      session,
      isCloudConnected: Boolean(user),
      isSupabaseConfigured,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      loginWithPhone,
      verifyPhoneOtp,
      loginWithEmail,
      signupWithEmail,
      sendMagicLink,
    }),
    [
      authLoading,
      closeAuthModal,
      completeOnboarding,
      isAuthenticated,
      isAuthModalOpen,
      loginWithEmail,
      loginWithPhone,
      logout,
      onboardingComplete,
      openAuthModal,
      profile,
      ready,
      sendMagicLink,
      session,
      signupWithEmail,
      strength,
      updateProfile,
      user,
      verifyPhoneOtp,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
