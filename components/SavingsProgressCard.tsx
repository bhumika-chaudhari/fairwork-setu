import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Card from './Card';
import ProgressRing from './ProgressRing';
import { Colors, Spacing, Typography } from '../constants/theme';
import { formatInr } from '../src/localization';

interface SavingsProgressCardProps {
  target: number;
  saved: number;
  suggestion?: number;
  title?: string;
}

export default function SavingsProgressCard({
  target,
  saved,
  suggestion,
  title,
}: SavingsProgressCardProps) {
  const { t } = useTranslation();
  const progress = target > 0 ? Math.min(saved / target, 1) : 0;
  const remaining = Math.max(target - saved, 0);

  return (
    <Card variant="accent" lifted>
      <View style={styles.row}>
        <ProgressRing progress={progress} color={Colors.accent} />
        <View style={styles.info}>
          <Text style={styles.label}>{title ?? t('home.emergencySavings')}</Text>
          <Text style={styles.amounts}>
            {t('common.currency', { amount: formatInr(saved) })} / {t('common.currency', { amount: formatInr(target) })}
          </Text>
          <Text style={styles.suggestion}>
            {suggestion
              ? t('home.savingsSuggestion', { amount: formatInr(suggestion) })
              : t('dhan.remaining', { amount: formatInr(remaining) })}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
    lineHeight: Typography.secondaryLineHeight,
  },
  amounts: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.cardTitleLineHeight,
  },
  suggestion: {
    fontSize: Typography.secondary,
    color: Colors.warning,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    marginTop: Spacing.sm,
    lineHeight: Typography.secondaryLineHeight,
  },
});
