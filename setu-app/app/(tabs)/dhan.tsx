import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import SavingsProgressCard from '../../components/SavingsProgressCard';
import SkillChip from '../../components/SkillChip';
import DisclaimerText from '../../components/DisclaimerText';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { weeklyIncome, expenseCategories } from '../../data/mockData';

export default function DhanScreen() {
  const totalWeeklyIncome = weeklyIncome.reduce((sum, d) => sum + d.amount, 0);
  const maxIncome = Math.max(...weeklyIncome.map((d) => d.amount), 1);
  const totalExpenses = expenseCategories.reduce((sum, e) => sum + e.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>पैसा</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Summary */}
        <Card lifted>
          <Text style={styles.summaryLabel}>इस हफ्ते की कमाई</Text>
          <Text style={styles.summaryAmount}>₹{totalWeeklyIncome.toLocaleString('en-IN')}</Text>
          <View style={styles.summaryMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="arrow-down-circle" size={18} color={Colors.success} />
              <Text style={styles.metaText}>कमाई ₹{totalWeeklyIncome.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="arrow-up-circle" size={18} color={Colors.danger} />
              <Text style={styles.metaText}>खर्चा ₹{totalExpenses.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </Card>

        {/* Bar Chart — Simple custom bars */}
        <SectionHeader title="पिछले 7 दिन" />
        <Card>
          <View style={styles.chartContainer}>
            {weeklyIncome.map((day, i) => {
              const barHeight = day.amount > 0 ? (day.amount / maxIncome) * 120 : 4;
              const isToday = i === weeklyIncome.length - 2; // Saturday = most recent work day
              return (
                <View key={i} style={styles.barColumn}>
                  <Text style={styles.barAmount}>
                    {day.amount > 0 ? `₹${day.amount}` : '-'}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: day.amount > 0
                            ? isToday ? Colors.accent : Colors.primary
                            : Colors.divider,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDay, isToday && styles.barDayActive]}>
                    {day.dayHi}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Expense Categories */}
        <SectionHeader title="खर्चे की श्रेणियां" />
        <View style={styles.expenseChips}>
          {expenseCategories.map((exp, i) => (
            <SkillChip
              key={i}
              label={`${exp.categoryHi} ₹${exp.amount}`}
              icon={exp.icon}
              variant={exp.amount > 0 ? 'default' : 'default'}
            />
          ))}
        </View>

        {/* Savings Progress */}
        <SectionHeader title="बचत लक्ष्य" />
        <SavingsProgressCard target={10000} saved={3800} />

        {/* Predicted Earnings */}
        <Card variant="accent">
          <View style={styles.predictRow}>
            <Ionicons name="trending-up" size={24} color={Colors.accent} />
            <View style={styles.predictInfo}>
              <Text style={styles.predictLabel}>अगले हफ्ते की अनुमानित कमाई</Text>
              <Text style={styles.predictAmount}>₹4,200 – ₹5,000</Text>
            </View>
          </View>
        </Card>

        {/* Financial Score */}
        <Card>
          <View style={styles.scoreRow}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>62</Text>
              <Text style={styles.scoreOf}>/100</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreTitle}>Financial Stability Score</Text>
              <Text style={styles.scoreSubtext}>आर्थिक स्थिरता का अनुमान</Text>
            </View>
          </View>
          <DisclaimerText
            text="यह केवल जानकारी के लिए है, लोन निर्णय के लिए नहीं।"
            variant="warning"
          />
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },

  // Summary
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: Typography.incomeLarge,
    fontWeight: Typography.extraBold,
    color: Colors.text,
    lineHeight: Typography.incomeLarge * 1.15,
  },
  summaryMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
    fontWeight: Typography.medium,
  },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: Spacing.md,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barAmount: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    marginBottom: 6,
  },
  barTrack: {
    flex: 1,
    width: '60%',
    justifyContent: 'flex-end',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: BorderRadius.sm,
    minHeight: 4,
  },
  barDay: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    marginTop: 6,
  },
  barDayActive: {
    color: Colors.accent,
    fontWeight: Typography.bold,
  },

  // Expenses
  expenseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },

  // Predicted
  predictRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  predictLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    marginBottom: 2,
  },
  predictAmount: {
    fontSize: 22,
    fontWeight: Typography.extraBold,
    color: Colors.text,
  },

  // Score
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
    flexDirection: 'row',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: Typography.extraBold,
    color: Colors.text,
  },
  scoreOf: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  scoreSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
