import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Card from './Card';
import Badge from './Badge';
import { Colors, Spacing, Typography, BorderRadius, ButtonSizes } from '../constants/theme';
import { formatInr } from '../src/localization';
import type { Job } from '../data/mockData';

interface JobCardProps {
  job: Job;
  onPress?: () => void;
}

export default function JobCard({ job, onPress }: JobCardProps) {
  const { t } = useTranslation();
  const tone = job.skillMatch >= 85 ? 'success' : job.skillMatch >= 70 ? 'warning' : 'primary';

  return (
    <Card>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Ionicons name={job.workIcon as never} size={22} color={Colors.primary} />
        </View>
        <View style={styles.titles}>
          <Text style={styles.title}>{t(job.titleKey)}</Text>
          <Text style={styles.employer}>{t(job.employerKey)}</Text>
        </View>
        <Badge label={t('kaam.skillMatch', { percent: job.skillMatch })} tone={tone} />
      </View>

      <Text style={styles.meta}>
        {job.distance} · {t('kaam.payRange', { min: formatInr(job.payMin), max: formatInr(job.payMax) })}
      </Text>
      <Text style={styles.submeta}>
        {t(job.locationKey)} · {t(job.payTypeKey)} · {t(job.workTypeKey)}
      </Text>

      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.buttonText}>{t('kaam.show')}</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    flex: 1,
  },
  title: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.cardTitleLineHeight,
  },
  employer: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  meta: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.primary,
    marginBottom: 4,
  },
  submeta: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ButtonSizes.minTouchTarget,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginHorizontal: -Spacing.cardPaddingLarge,
    marginBottom: -Spacing.cardPaddingLarge,
    paddingHorizontal: Spacing.cardPaddingLarge,
  },
  buttonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
});
