import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import SavingsProgressCard from '../../components/SavingsProgressCard';
import SkillChip from '../../components/SkillChip';
import DisclaimerText from '../../components/DisclaimerText';
import ScreenContainer from '../../components/ScreenContainer';
import AppHeader from '../../components/AppHeader';
import IncomeChart from '../../components/IncomeChart';
import StabilityGauge from '../../components/StabilityGauge';
import { Colors, Spacing, Typography, ColorTokenMap } from '../../constants/theme';
import {
  weeklyIncome,
  expenseCategories,
  weeklySavingsSaved,
  nextWeekMin,
  nextWeekMax,
  stabilityScore,
} from '../../data/mockData';
import { formatInr } from '../../src/localization';
import { useProfile } from '../../context/ProfileContext';

export default function DhanScreen() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const totalWeeklyIncome = weeklyIncome.reduce((sum, d) => sum + d.amount, 0);
  const totalExpenses = expenseCategories.reduce((sum, e) => sum + e.amount, 0);
  const savingsTarget = profile.savingsGoal || 10000;

  return (
    <ScreenContainer padded={false} header={<AppHeader title={t('dhan.title')} />}>
      <View style={styles.content}>
        <Card lifted style={styles.summary}>
          <Text style={styles.summaryLabel}>{t('dhan.weeklyIncome')}</Text>
          <Text style={styles.summaryAmount}>{t('common.currency', { amount: formatInr(totalWeeklyIncome) })}</Text>
          <View style={styles.summaryMeta}>
            <Text style={styles.metaText}>{t('dhan.income', { amount: formatInr(totalWeeklyIncome) })}</Text>
            <Text style={styles.metaText}>{t('dhan.expense', { amount: formatInr(totalExpenses) })}</Text>
          </View>
        </Card>

        <SectionHeader title={t('dhan.last7Days')} />
        <Card>
          <IncomeChart days={weeklyIncome} />
        </Card>

        <SectionHeader title={t('dhan.expenseCategories')} />
        <View style={styles.expenseChips}>
          {expenseCategories.map((exp) => (
            <SkillChip
              key={exp.categoryKey}
              label={t('dhan.expenseChip', { category: t(exp.categoryKey), amount: formatInr(exp.amount) })}
              icon={exp.icon}
              color={ColorTokenMap[exp.colorToken]}
            />
          ))}
        </View>

        <SectionHeader title={t('dhan.savingsGoal')} />
        <SavingsProgressCard target={savingsTarget} saved={weeklySavingsSaved} title={t('dhan.savingsGoal')} />

        <Card variant="accent">
          <View style={styles.predictRow}>
            <Ionicons name="trending-up" size={24} color={Colors.accent} />
            <View style={styles.predictInfo}>
              <Text style={styles.predictLabel}>{t('dhan.expectedIncome')}</Text>
              <Text style={styles.predictAmount}>
                {t('dhan.expectedRange', { min: formatInr(nextWeekMin), max: formatInr(nextWeekMax) })}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.scoreRow}>
            <StabilityGauge score={stabilityScore} />
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreTitle}>{t('dhan.stabilityScore')}</Text>
              <Text style={styles.scoreSubtext}>{t('dhan.stabilityHint')}</Text>
            </View>
          </View>
          <DisclaimerText text={t('dhan.disclaimer')} variant="warning" />
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  summary: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primarySoft,
  },
  summaryLabel: {
    fontSize: Typography.secondary,
    color: Colors.primaryDark,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: Typography.income,
    fontWeight: Typography.extraBold,
    fontFamily: Typography.fontFamily,
    color: Colors.primaryDark,
    lineHeight: Typography.incomeLineHeight,
  },
  summaryMeta: {
    marginTop: Spacing.md,
    gap: 4,
  },
  metaText: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    fontWeight: Typography.medium,
  },
  expenseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  predictRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  predictLabel: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    marginBottom: 2,
  },
  predictAmount: {
    fontSize: 22,
    fontWeight: Typography.extraBold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.cardTitleLineHeight,
  },
  scoreSubtext: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
    lineHeight: Typography.secondaryLineHeight,
  },
});
