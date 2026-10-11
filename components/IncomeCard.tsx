import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface IncomeCardProps {
  todayIncome: number;
  savingSuggestion?: number;
}

export default function IncomeCard({ todayIncome, savingSuggestion }: IncomeCardProps) {
  return (
    <Card lifted>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={28} color={Colors.primary} />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>आज की कमाई</Text>
          <Text style={styles.amount}>₹{todayIncome.toLocaleString('en-IN')}</Text>
        </View>
      </View>
      {savingSuggestion !== undefined && savingSuggestion > 0 && (
        <View style={styles.savingRow}>
          <View style={styles.savingBadge}>
            <Ionicons name="trending-up" size={16} color={Colors.success} />
            <Text style={styles.savingText}>
              आज ₹{savingSuggestion} बचा सकते हो
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    marginBottom: 2,
  },
  amount: {
    fontSize: Typography.income,
    fontWeight: Typography.extraBold,
    color: Colors.text,
    lineHeight: Typography.income * 1.2,
  },
  savingRow: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  savingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  savingText: {
    fontSize: 14,
    fontWeight: Typography.semibold,
    color: Colors.success,
    marginLeft: Spacing.sm,
  },
});
