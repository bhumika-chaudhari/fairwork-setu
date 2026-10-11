import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { Colors, Spacing, Typography } from '../constants/theme';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
}

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: Typography.income,
    fontWeight: Typography.extraBold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.incomeLineHeight,
  },
  hint: {
    marginTop: Spacing.sm,
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
  },
});
