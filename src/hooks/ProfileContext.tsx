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
  cityKey: '',
  workType: null,
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

export function isProfileComplete(p: ProfileState | null | undefined): boolean {
  if (!p) return false;
  const hasName = Boolean(p.name && p.name.trim().length >= 2);
  const hasWorkType = Boolean(p.workType);
  const hasCity = Boolean(p.cityKey && p.cityKey.trim().length > 0);
  return hasName && hasWorkType && hasCity;
}

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

  // Normalize skills list
  let resolvedSkillKeys: string[] = fallback.skillKeys || [];
  if (backendProfile.skills) {
    if (Array.isArray(backendProfile.skills)) {
      resolvedSkillKeys = backendProfile.skills;
    } else if (typeof backendProfile.skills === 'string') {
      resolvedSkillKeys = backendProfile.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  } else if (Array.isArray(backendProfile.skillKeys)) {
    resolvedSkillKeys = backendProfile.skillKeys;
  }

  // Normalize custom skills list
  let resolvedCustomSkills: string[] = fallback.customSkills || [];
  const rawCustom = backendProfile.custom_skills || backendProfile.customSkills;
  if (rawCustom) {
    if (Array.isArray(rawCustom)) {
      resolvedCustomSkills = rawCustom;
    } else if (typeof rawCustom === 'string') {
      resolvedCustomSkills = rawCustom.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  return {
    name: backendProfile.full_name || backendProfile.name || fallback.name || '',
    avatarUrl: backendProfile.avatar_url || backendProfile.avatarUrl || fallback.avatarUrl || '',
    gender: (backendProfile.gender as Gender) || fallback.gender || null,
    cityKey: backendProfile.city_key || backendProfile.cityKey || fallback.cityKey || 'cities.pune',
    workType: (backendProfile.work_type as WorkerType) || (backendProfile.workType as WorkerType) || fallback.workType || null,
    skillKeys: resolvedSkillKeys,
    customSkills: resolvedCustomSkills,
    experienceYears: backendProfile.experience_years ?? backendProfile.experienceYears ?? fallback.experienceYears ?? 1,
    availability: (backendProfile.availability as Availability) || fallback.availability || 'anytime',
    payMin: backendProfile.pay_min ?? backendProfile.payMin ?? fallback.payMin ?? 400,
    payMax: backendProfile.pay_max ?? backendProfile.payMax ?? fallback.payMax ?? 700,
    emergencyContact: backendProfile.emergency_contact || backendProfile.emergencyContact || fallback.emergencyContact || '',
    savingsGoal: backendProfile.savings_goal ?? backendProfile.savingsGoal ?? fallback.savingsGoal ?? 5000,
    weeklySaveGoal: backendProfile.weekly_save_goal ?? backendProfile.weeklySaveGoal ?? fallback.weeklySaveGoal ?? 350,
    preferredLanguage: backendProfile.preferred_language || backendProfile.preferredLanguage || fallback.preferredLanguage || 'en',
    speechRate: backendProfile.speech_rate ?? backendProfile.speechRate ?? fallback.speechRate ?? 0.95,
    voiceSilenceTimeout: backendProfile.voice_silence_timeout ?? backendProfile.voiceSilenceTimeout ?? fallback.voiceSilenceTimeout ?? 5,
    privacyMaskEarnings: backendProfile.privacy_mask_earnings ?? backendProfile.privacyMaskEarnings ?? fallback.privacyMaskEarnings ?? false,
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
  sendEmailLoginOtp: (email: string) => Promise<{ error: Error | null; message?: string }>;
  sendEmailSignupOtp: (email: string, name?: string) => Promise<{ error: Error | null; message?: string }>;
  sendEmailOtp: (email: string) => Promise<{ error: Error | null; message?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: Error | null; user?: User | null }>;
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

  // Fetch or sync remote profile from FastAPI backend or direct Supabase when authenticated
  const syncRemoteProfile = useCallback(async (activeUser: User) => {
    let resolvedProfile: ProfileState | null = null;

    // 1. Try FastAPI backend first
    try {
      const res = await apiClient.get('/user/profile');
      if (res.data?.profile) {
        resolvedProfile = mapBackendToProfileState(res.data.profile, emptyProfile);
      }
    } catch (err: any) {
      console.warn('[ProfileSync] Backend profile fetch notice:', err.response?.status || err.message);
    }

    // 2. If FastAPI backend failed or profile had no name, query direct Supabase table
    if ((!resolvedProfile || !resolvedProfile.name) && supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeUser.id)
          .maybeSingle();
        if (!error && data) {
          resolvedProfile = mapBackendToProfileState(data, emptyProfile);
        }
      } catch (sbErr) {
        console.warn('[ProfileSync] Direct Supabase fetch notice:', sbErr);
      }
    }

    // 3. Fallback to user-scoped local storage if network is offline or cold-starting
    if (!resolvedProfile || !resolvedProfile.name) {
      try {
        const cached = localStorage.getItem(`${PROFILE_KEY_PREFIX}${activeUser.id}`);
        if (cached) {
          resolvedProfile = { ...emptyProfile, ...JSON.parse(cached) };
        }
      } catch {
        // ignore JSON parse error
      }
    }

    if (resolvedProfile && resolvedProfile.name && resolvedProfile.name.trim().length > 1) {
      setProfile(resolvedProfile);
      localStorage.setItem(`${PROFILE_KEY_PREFIX}${activeUser.id}`, JSON.stringify(resolvedProfile));
      const hasCompleted = isProfileComplete(resolvedProfile);
      setOnboardingComplete(hasCompleted);
      if (hasCompleted) {
        localStorage.setItem(`${ONBOARDING_KEY_PREFIX}${activeUser.id}`, '1');
      }
      if (resolvedProfile.preferredLanguage) {
        changeAppLanguage(resolvedProfile.preferredLanguage as LanguageCode);
      }
    } else {
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
    const complete = isProfileComplete(next);
    setOnboardingComplete(complete);

    if (user) {
      localStorage.setItem(`${PROFILE_KEY_PREFIX}${user.id}`, JSON.stringify(next));
      if (complete) {
        localStorage.setItem(`${ONBOARDING_KEY_PREFIX}${user.id}`, '1');
      }

      // Dual Persistence: Direct Supabase PostgreSQL upsert
      if (supabase && isSupabaseConfigured) {
        try {
          await supabase.from('profiles').upsert(
            {
              id: user.id,
              full_name: next.name.trim(),
              avatar_url: next.avatarUrl || null,
              gender: next.gender || null,
              city_key: next.cityKey || 'cities.pune',
              work_type: next.workType || 'driver',
              skills: next.skillKeys.join(','),
              custom_skills: next.customSkills.join(','),
              experience_years: next.experienceYears,
              availability: next.availability || 'anytime',
              pay_min: next.payMin,
              pay_max: next.payMax,
              emergency_contact: next.emergencyContact || null,
              savings_goal: next.savingsGoal,
              weekly_save_goal: next.weeklySaveGoal,
              preferred_language: next.preferredLanguage || 'en',
              speech_rate: next.speechRate,
              voice_silence_timeout: next.voiceSilenceTimeout,
              privacy_mask_earnings: next.privacyMaskEarnings,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch (supabaseErr) {
          console.warn('[ProfileContext] Direct Supabase upsert notice:', supabaseErr);
        }
      }

      // FastAPI Backend sync (ensures ML microservice cache is updated)
      if (isSupabaseConfigured) {
        try {
          await apiClient.put('/user/profile', mapProfileStateToBackendPayload(next));
        } catch (err) {
          console.warn('[ProfileContext] Backend profile sync notice:', err);
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

  // Send 6-Digit Email OTP for Login (strictly prevents new account creation)
  const sendEmailLoginOtp = useCallback(async (email: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error(
          'Authentication service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
        ),
      };
    }
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false, // Ensures existing user accounts only!
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes('signups not allowed') ||
          msg.includes('user not found') ||
          msg.includes('signup disabled') ||
          (error as any).status === 400
        ) {
          return {
            error: new Error("We couldn't find an account with this email. Please create an account first."),
          };
        }
        if (msg.includes('rate limit') || (error as any).status === 429) {
          return {
            error: new Error('Too many requests. Please wait a few moments before requesting another code.'),
          };
        }
        return { error };
      }
      return { error: null, message: `6-digit verification code sent to ${cleanEmail}` };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  // Send 6-Digit Email OTP for Signup (creates new account with metadata)
  const sendEmailSignupOtp = useCallback(async (email: string, name?: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error(
          'Authentication service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
        ),
      };
    }
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: name?.trim() || '',
            name: name?.trim() || '',
          },
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('rate limit') || (error as any).status === 429) {
          return {
            error: new Error('Too many requests. Please wait a few moments before requesting another code.'),
          };
        }
        return { error };
      }
      return { error: null, message: `6-digit verification code sent to ${cleanEmail}` };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  // Backward-compatible wrapper
  const sendEmailOtp = useCallback(async (email: string) => {
    return sendEmailLoginOtp(email);
  }, [sendEmailLoginOtp]);

  // Verify 6-Digit Email OTP
  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error: new Error(
          'Authentication service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.'
        ),
      };
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();
    try {
      // First try standard email OTP verification
      let result = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      // If email type fails and user might have just signed up, try signup type
      if (result.error && (result.error.message?.toLowerCase().includes('type') || (result.error as any).status === 400)) {
        const signupRetry = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'signup',
        });
        if (!signupRetry.error) {
          result = signupRetry;
        }
      }

      if (result.error) {
        const msg = result.error.message.toLowerCase();
        if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token')) {
          return {
            error: new Error('Verification code is incorrect or has expired. Please check the code or request a new one.'),
          };
        }
        return { error: result.error };
      }

      if (result.data?.user) {
        setUser(result.data.user);
        setSession(result.data.session);
        setCurrentAuthUserId(result.data.user.id);
        setIsAuthModalOpen(false);
        await syncRemoteProfile(result.data.user);
      }
      return { error: null, user: result.data?.user, session: result.data?.session };
    } catch (err: any) {
      return { error: err };
    }
  }, [syncRemoteProfile]);

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
      sendEmailLoginOtp,
      sendEmailSignupOtp,
      sendEmailOtp,
      verifyEmailOtp,
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
      sendEmailLoginOtp,
      sendEmailSignupOtp,
      sendEmailOtp,
      sendMagicLink,
      session,
      signupWithEmail,
      strength,
      updateProfile,
      user,
      verifyEmailOtp,
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
