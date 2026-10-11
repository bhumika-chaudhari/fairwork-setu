import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { formatInr } from '../src/localization';

interface IncomeCardProps {
  todayIncome: number;
  weekDelta?: number;
}

export default function IncomeCard({ todayIncome, weekDelta = 0 }: IncomeCardProps) {
  const { t } = useTranslation();
  const up = weekDelta >= 0;

  return (
    <Card lifted style={styles.card}>
      <Text style={styles.label}>{t('home.todayIncome')}</Text>
      <Text style={styles.amount}>{t('common.currency', { amount: formatInr(todayIncome) })}</Text>
      <View style={[styles.deltaRow, { backgroundColor: up ? Colors.successSoft : Colors.dangerSoft }]}>
        <Ionicons name={up ? 'trending-up' : 'trending-down'} size={16} color={up ? Colors.success : Colors.danger} />
        <Text style={[styles.delta, { color: up ? Colors.success : Colors.danger }]}>
          {t(up ? 'home.weekDeltaUp' : 'home.weekDeltaDown', { amount: formatInr(Math.abs(weekDelta)) })}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primarySoft,
  },
  label: {
    fontSize: Typography.body,
    color: Colors.primaryDark,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.xs,
    lineHeight: Typography.bodyLineHeight,
  },
  amount: {
    fontSize: Typography.income,
    fontWeight: Typography.extraBold,
    fontFamily: Typography.fontFamily,
    color: Colors.primaryDark,
    lineHeight: Typography.incomeLineHeight,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  delta: {
    fontSize: Typography.secondary,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    lineHeight: Typography.secondaryLineHeight,
  },
});
