import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Card from './Card';
import SkillChip from './SkillChip';
import PrimaryButton from './PrimaryButton';
import DisclaimerText from './DisclaimerText';
import ScreenContainer from './ScreenContainer';
import AppHeader from './AppHeader';
import Badge from './Badge';
import EmptyState from './EmptyState';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { skillCourses, rating, completedJobs } from '../data/mockData';
import { useProfile } from '../context/ProfileContext';

interface KaushalScreenProps {
  onBack: () => void;
}

const PROFILE_LANG_KEYS = ['profile.langHindi', 'profile.langMarathi'];

export default function KaushalScreen({ onBack }: KaushalScreenProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const occupation = profile.workType ? t(`workerTypes.${profile.workType}`) : t('workerTypes.other');
  const skills = [...profile.skillKeys.map((key) => t(key)), ...profile.customSkills];

  return (
    <ScreenContainer
      padded={false}
      header={<AppHeader title={t('kaushal.title')} onBack={onBack} />}
    >
      <View style={styles.body}>
        <Card lifted>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileOccupation}>{occupation}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.profileCity}>{t(profile.cityKey)}</Text>
              </View>
            </View>
            <Badge label={String(rating)} tone="warning" />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completedJobs}</Text>
              <Text style={styles.statLabel}>{t('kaushal.jobsDone')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {t('profileScreen.years', { count: profile.experienceYears })}
              </Text>
              <Text style={styles.statLabel}>{t('kaushal.experience')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{PROFILE_LANG_KEYS.length}</Text>
              <Text style={styles.statLabel}>{t('kaushal.languages')}</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>{t('kaushal.skills')}</Text>
        {skills.length > 0 ? (
          <View style={styles.skillsRow}>
            {skills.map((skill) => (
              <SkillChip key={skill} label={skill} variant="primary" />
            ))}
          </View>
        ) : (
          <EmptyState icon="sparkles-outline" message={t('kaushal.emptySkills')} />
        )}

        <Text style={styles.sectionTitle}>{t('kaushal.languages')}</Text>
        <View style={styles.skillsRow}>
          {PROFILE_LANG_KEYS.map((key) => (
            <SkillChip key={key} label={t(key)} icon="chatbubble-outline" />
          ))}
        </View>

        <Card variant="accent" style={styles.passportCard}>
          <View style={styles.passportHeader}>
            <View style={styles.courseIcon}>
              <Ionicons name="document-text" size={26} color={Colors.accent} />
            </View>
            <View style={styles.passportInfo}>
              <Text style={styles.passportTitle}>{t('kaushal.passportPreview')}</Text>
              <Text style={styles.passportSubtext}>{t('kaushal.passportSub')}</Text>
            </View>
          </View>
          <PrimaryButton
            title={t('kaushal.downloadPdf')}
            onPress={() => Alert.alert(t('kaushal.downloadStarted'), t('kaushal.downloadMessage'))}
            variant="accent"
            icon={<Ionicons name="download-outline" size={20} color={Colors.textPrimary} />}
          />
        </Card>

        <Text style={styles.sectionTitle}>{t('kaushal.recommended')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseScroll}
        >
          {skillCourses.map((course) => (
            <Card key={course.id} style={styles.courseCard}>
              <View style={styles.courseIcon}>
                <Ionicons name={course.icon as never} size={24} color={Colors.primary} />
              </View>
              <Text style={styles.courseTitle}>{t(course.titleKey)}</Text>
              <Text style={styles.courseMeta}>
                {course.provider} · {t(course.durationKey)} · {t(course.levelKey)}
              </Text>
              {course.isFree ? <Badge label={t('kaushal.free')} tone="success" /> : null}
            </Card>
          ))}
        </ScrollView>

        <DisclaimerText text={t('kaushal.disclaimer')} variant="info" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.cardTitleLineHeight,
  },
  profileOccupation: {
    fontSize: Typography.secondary,
    color: Colors.primary,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  profileCity: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.body,
    fontWeight: Typography.extraBold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
    lineHeight: Typography.cardTitleLineHeight,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  passportCard: {
    marginTop: Spacing.lg,
  },
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  passportInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  passportTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.cardTitleLineHeight,
  },
  passportSubtext: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
    lineHeight: Typography.secondaryLineHeight,
  },
  courseScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  courseCard: {
    width: 220,
    marginBottom: 0,
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  courseTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.bodyLineHeight,
    marginBottom: 4,
  },
  courseMeta: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.sm,
  },
});
