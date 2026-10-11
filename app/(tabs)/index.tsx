import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import IncomeCard from '../../components/IncomeCard';
import JobCard from '../../components/JobCard';
import SavingsProgressCard from '../../components/SavingsProgressCard';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import VoiceButton from '../../components/VoiceButton';
import VoiceEntryModal from '../../components/VoiceEntryModal';
import LanguageSelector from '../../components/LanguageSelector';
import ProgressBar from '../../components/ProgressBar';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import {
  mockJobs,
  healthResources,
  todayIncome,
  weekIncomeDelta,
  emergencySaved,
  todaySaveSuggestion,
} from '../../data/mockData';
import { useProfile } from '../../context/ProfileContext';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile, strength, isIncomplete } = useProfile();
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const savingsTarget = profile.savingsGoal || 5000;

  return (
    <ScreenContainer>
      <View style={styles.greetingRow}>
        <View style={styles.greetingCopy}>
          <Text style={styles.greeting}>{t('home.greeting', { name: profile.name })}</Text>
          <Text style={styles.subGreeting}>{t('home.todayOverview')}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel={t('more.profileTitle')}
          >
            <Ionicons name="person-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <LanguageSelector variant="icon" />
        </View>
      </View>

      <Card variant="soft">
        <Text style={styles.banner}>{t('home.newUserBanner')}</Text>
      </Card>

      <IncomeCard todayIncome={todayIncome} weekDelta={weekIncomeDelta} />

      <SavingsProgressCard
        target={savingsTarget}
        saved={emergencySaved}
        suggestion={todaySaveSuggestion}
      />

      <View style={styles.voiceSection}>
        <VoiceButton onPress={() => setVoiceModalVisible(true)} size={76} />
        <Text style={styles.voiceLabel}>{t('home.addByVoice')}</Text>
        <Text style={styles.voiceHint}>{t('home.addByVoiceHint')}</Text>
      </View>

      {isIncomplete ? (
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push('/profile')}>
          <Card variant="accent">
            <Text style={styles.completeTitle}>{t('home.completeProfile')}</Text>
            <Text style={styles.completeHint}>{t('home.completeProfileHint')}</Text>
            <Text style={styles.ready}>{t('home.profileReady', { percent: strength })}</Text>
            <ProgressBar progress={strength / 100} color={Colors.accent} trackColor={Colors.accentSoft} />
          </Card>
        </TouchableOpacity>
      ) : null}

      <SectionHeader
        title={t('home.jobSuggestions')}
        actionLabel={t('common.seeAll')}
        onAction={() => router.push('/(tabs)/kaam')}
      />
      {mockJobs.slice(0, 2).map((job) => (
        <JobCard key={job.id} job={job} />
      ))}

      <SectionHeader title={t('home.healthSupport')} />
      <Card variant="health">
        <View style={styles.healthRow}>
          <View style={styles.healthIcon}>
            <Ionicons name="medical" size={22} color={Colors.health} />
          </View>
          <View style={styles.healthInfo}>
            <Text style={styles.healthName}>{t(healthResources[0].nameKey)}</Text>
            <Text style={styles.healthType}>
              {healthResources[0].distance} · {t(healthResources[0].servicesKey)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.health} />
        </View>
      </Card>

      <VoiceEntryModal visible={voiceModalVisible} onClose={() => setVoiceModalVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  greetingCopy: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.headingLineHeight,
  },
  subGreeting: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
    lineHeight: Typography.bodyLineHeight,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  banner: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    lineHeight: Typography.bodyLineHeight,
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  voiceLabel: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    lineHeight: Typography.cardTitleLineHeight,
  },
  voiceHint: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginTop: 4,
    lineHeight: Typography.secondaryLineHeight,
  },
  completeTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.cardTitleLineHeight,
  },
  completeHint: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginVertical: Spacing.sm,
    lineHeight: Typography.secondaryLineHeight,
  },
  ready: {
    fontSize: Typography.secondary,
    fontWeight: Typography.semibold,
    color: Colors.warning,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.sm,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.healthSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  healthInfo: {
    flex: 1,
  },
  healthName: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.bodyLineHeight,
  },
  healthType: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
    lineHeight: Typography.secondaryLineHeight,
  },
});
