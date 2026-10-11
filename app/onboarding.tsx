import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../components/ScreenContainer';
import PrimaryButton from '../components/PrimaryButton';
import GhostButton from '../components/GhostButton';
import LanguageSelector from '../components/LanguageSelector';
import SkillChip from '../components/SkillChip';
import Card from '../components/Card';
import { Colors, Spacing, Typography, BorderRadius, Shadows, ButtonSizes } from '../constants/theme';
import {
  CITY_KEYS,
  SUGGESTED_SKILL_KEYS,
  workerTypeOptions,
  WorkerType,
} from '../data/mockData';
import { useProfile } from '../context/ProfileContext';
import { formatInr } from '../src/localization';

type Step = 'intro' | 'language' | 'work' | 'money' | 'welcome';

const CAROUSEL = [
  { key: 'onboarding.carousel1', icon: 'wallet-outline' as const },
  { key: 'onboarding.carousel2', icon: 'briefcase-outline' as const },
  { key: 'onboarding.carousel3', icon: 'leaf-outline' as const },
  { key: 'onboarding.carousel4', icon: 'heart-outline' as const },
  { key: 'onboarding.carousel5', icon: 'ribbon-outline' as const },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { completeOnboarding } = useProfile();
  const [step, setStep] = useState<Step>('intro');
  const [slide, setSlide] = useState(0);
  const [workType, setWorkType] = useState<WorkerType | null>('electrician');
  const [cityKey, setCityKey] = useState('cities.pune');
  const [skillKeys, setSkillKeys] = useState<string[]>(['skills.wiring']);
  const [weeklySaveGoal, setWeeklySaveGoal] = useState(350);

  const finish = async (extra?: { weeklySaveGoal?: number }) => {
    await completeOnboarding({
      workType,
      cityKey,
      skillKeys,
      weeklySaveGoal: extra?.weeklySaveGoal ?? weeklySaveGoal,
      savingsGoal: (extra?.weeklySaveGoal ?? weeklySaveGoal) * 12,
    });
    router.replace('/(tabs)');
  };

  if (step === 'intro') {
    const item = CAROUSEL[slide];
    return (
      <ScreenContainer>
        <Text style={styles.kicker}>{t('onboarding.howHelps')}</Text>
        <Card lifted style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name={item.icon} size={36} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>{t(item.key)}</Text>
          <View style={styles.dots}>
            {CAROUSEL.map((_, i) => (
              <View key={i} style={[styles.dot, i === slide && styles.dotOn]} />
            ))}
          </View>
        </Card>
        <PrimaryButton
          title={slide < CAROUSEL.length - 1 ? t('common.next') : t('common.continue')}
          onPress={() => (slide < CAROUSEL.length - 1 ? setSlide(slide + 1) : setStep('language'))}
        />
        <GhostButton title={t('common.skip')} onPress={() => setStep('language')} style={styles.skip} />
      </ScreenContainer>
    );
  }

  if (step === 'language') {
    return (
      <ScreenContainer>
        <StepMark current={1} />
        <Text style={styles.heading}>{t('onboarding.chooseLanguage')}</Text>
        <Text style={styles.hint}>{t('onboarding.languageHint')}</Text>
        <LanguageSelector variant="grid" />
        <PrimaryButton title={t('common.continue')} onPress={() => setStep('work')} style={styles.cta} />
      </ScreenContainer>
    );
  }

  if (step === 'work') {
    return (
      <ScreenContainer>
        <StepMark current={2} />
        <Text style={styles.heading}>{t('onboarding.whatWork')}</Text>
        <Text style={styles.hint}>{t('onboarding.workHint')}</Text>
        <View style={styles.typeGrid}>
          {workerTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[styles.typeCard, workType === option.type && styles.typeCardSelected]}
              onPress={() => setWorkType(option.type)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: workType === option.type }}
            >
              <Ionicons
                name={option.icon as never}
                size={24}
                color={workType === option.type ? Colors.white : Colors.primary}
              />
              <Text style={[styles.typeLabel, workType === option.type && styles.typeLabelOn]}>
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>{t('onboarding.cityTitle')}</Text>
        <Text style={styles.hint}>{t('onboarding.cityHint')}</Text>
        <View style={styles.wrap}>
          {CITY_KEYS.map((key) => (
            <SkillChip key={key} label={t(key)} selected={cityKey === key} onPress={() => setCityKey(key)} />
          ))}
        </View>

        <Text style={styles.section}>{t('onboarding.skillsTitle')}</Text>
        <Text style={styles.hint}>{t('onboarding.skillsHint')}</Text>
        <View style={styles.wrap}>
          {SUGGESTED_SKILL_KEYS.map((key) => (
            <SkillChip
              key={key}
              label={t(key)}
              selected={skillKeys.includes(key)}
              onPress={() =>
                setSkillKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
              }
            />
          ))}
        </View>

        <PrimaryButton title={t('common.continue')} onPress={() => setStep('money')} style={styles.cta} />
        <GhostButton title={t('common.skip')} onPress={() => setStep('money')} style={styles.skip} />
      </ScreenContainer>
    );
  }

  if (step === 'money') {
    return (
      <ScreenContainer>
        <StepMark current={3} />
        <Text style={styles.heading}>{t('onboarding.moneyTitle')}</Text>
        <Text style={styles.hint}>{t('onboarding.moneyHint')}</Text>
        <Text style={styles.section}>{t('onboarding.weeklyGoal')}</Text>
        <View style={styles.wrap}>
          {[200, 350, 500].map((amt) => (
            <SkillChip
              key={amt}
              label={t('common.currency', { amount: formatInr(amt) })}
              selected={weeklySaveGoal === amt}
              onPress={() => setWeeklySaveGoal(amt)}
            />
          ))}
        </View>
        <PrimaryButton title={t('common.continue')} onPress={() => setStep('welcome')} style={styles.cta} />
        <GhostButton
          title={t('common.skip')}
          onPress={() => {
            setWeeklySaveGoal(0);
            setStep('welcome');
          }}
          style={styles.skip}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.welcomeIcon}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
      </View>
      <Text style={styles.heading}>{t('onboarding.welcomeTitle')}</Text>
      <Text style={styles.hint}>{t('onboarding.welcomeBody')}</Text>
      <PrimaryButton title={t('onboarding.start')} onPress={() => finish()} style={styles.cta} />
    </ScreenContainer>
  );
}

function StepMark({ current }: { current: number }) {
  const { t } = useTranslation();
  const labels = [t('onboarding.stepLanguage'), t('onboarding.stepWork'), t('onboarding.stepMoney')];
  return (
    <View style={styles.steps}>
      {labels.map((label, i) => {
        const n = i + 1;
        const on = n === current;
        const done = n < current;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, (on || done) && styles.stepDotOn]}>
              <Text style={styles.stepN}>{n}</Text>
            </View>
            <Text style={styles.stepLabel}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: Typography.secondary,
    color: Colors.primaryDark,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    marginBottom: Spacing.xxl,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: Typography.headingLineHeight,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotOn: {
    width: 22,
    backgroundColor: Colors.primary,
  },
  heading: {
    fontSize: Typography.headingLarge,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.headingLineHeight,
    marginBottom: Spacing.sm,
  },
  hint: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    lineHeight: Typography.bodyLineHeight,
    marginBottom: Spacing.lg,
  },
  section: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    lineHeight: Typography.cardTitleLineHeight,
  },
  cta: {
    marginTop: Spacing.xxl,
  },
  skip: {
    marginTop: Spacing.md,
    height: ButtonSizes.secondaryHeight,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  typeCard: {
    width: '30%',
    minHeight: 96,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  typeCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeLabel: {
    fontSize: Typography.secondary,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily,
    lineHeight: Typography.secondaryLineHeight,
  },
  typeLabelOn: {
    color: Colors.white,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  welcomeIcon: {
    alignSelf: 'center',
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.lg,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotOn: {
    backgroundColor: Colors.primary,
  },
  stepN: {
    color: Colors.white,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    fontSize: 12,
  },
  stepLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
});
