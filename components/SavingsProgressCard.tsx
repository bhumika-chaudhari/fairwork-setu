import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface SavingsProgressCardProps {
  target: number;
  saved: number;
  label?: string;
}

export default function SavingsProgressCard({ target, saved, label }: SavingsProgressCardProps) {
  const progress = Math.min(saved / target, 1);
  const percentage = Math.round(progress * 100);

  return (
    <Card variant="success">
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={22} color={Colors.success} />
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>{label || 'इमरजेंसी बचत'}</Text>
          <Text style={styles.amounts}>
            ₹{saved.toLocaleString('en-IN')} / ₹{target.toLocaleString('en-IN')}
          </Text>
        </View>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>

      <Text style={styles.remaining}>
        बचत लक्ष्य तक ₹{(target - saved).toLocaleString('en-IN')} और बचाना है
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    marginBottom: 2,
  },
  amounts: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  percentage: {
    fontSize: 22,
    fontWeight: Typography.extraBold,
    color: Colors.success,
  },
  progressBg: {
    height: 10,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
  },
  remaining: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
});
