import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Availability, WorkerType } from '../data/mockData';

const PROFILE_KEY = '@setu/profile';
const ONBOARDING_KEY = '@setu/onboarding-complete';

export interface ProfileState {
  name: string;
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
}

export const defaultProfile: ProfileState = {
  name: 'Ramesh Kumar',
  cityKey: 'cities.pune',
  workType: 'electrician',
  skillKeys: ['skills.wiring', 'skills.fanRepair'],
  customSkills: [],
  experienceYears: 8,
  availability: 'anytime',
  payMin: 700,
  payMax: 1200,
  emergencyContact: '',
  savingsGoal: 5000,
  weeklySaveGoal: 350,
};

function computeStrength(profile: ProfileState): number {
  const checks = [
    profile.name.trim().length > 1,
    !!profile.cityKey,
    !!profile.workType,
    profile.skillKeys.length + profile.customSkills.length >= 2,
    profile.experienceYears > 0,
    !!profile.availability,
    profile.payMax > 0,
    profile.emergencyContact.trim().length >= 8,
    profile.savingsGoal > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

interface ProfileContextValue {
  profile: ProfileState;
  ready: boolean;
  onboardingComplete: boolean;
  strength: number;
  isIncomplete: boolean;
  updateProfile: (patch: Partial<ProfileState>) => Promise<void>;
  completeOnboarding: (patch?: Partial<ProfileState>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileState>(defaultProfile);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [raw, onboarded] = await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          AsyncStorage.getItem(ONBOARDING_KEY),
        ]);
        if (raw) setProfile({ ...defaultProfile, ...JSON.parse(raw) });
        setOnboardingComplete(onboarded === '1');
      } catch {
        // Keep defaults.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: ProfileState) => {
    setProfile(next);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<ProfileState>) => {
      const next = { ...profile, ...patch };
      await persist(next);
    },
    [persist, profile]
  );

  const completeOnboarding = useCallback(
    async (patch?: Partial<ProfileState>) => {
      const next = { ...profile, ...patch };
      await persist(next);
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
      setOnboardingComplete(true);
    },
    [persist, profile]
  );

  const strength = useMemo(() => computeStrength(profile), [profile]);

  const value = useMemo(
    () => ({
      profile,
      ready,
      onboardingComplete,
      strength,
      isIncomplete: strength < 90,
      updateProfile,
      completeOnboarding,
    }),
    [completeOnboarding, onboardingComplete, profile, ready, strength, updateProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
