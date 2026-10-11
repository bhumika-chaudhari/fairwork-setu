import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

type BadgeTone = 'success' | 'warning' | 'danger' | 'health' | 'primary' | 'accent';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

const toneMap: Record<BadgeTone, { bg: string; text: string }> = {
  success: { bg: Colors.successLight, text: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  danger: { bg: Colors.dangerLight, text: Colors.danger },
  health: { bg: Colors.healthLight, text: Colors.health },
  primary: { bg: Colors.primaryLight, text: Colors.primaryDark },
  accent: { bg: Colors.accentLight, text: Colors.warning },
};

export default function Badge({ label, tone = 'primary', style }: BadgeProps) {
  const colors = toneMap[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
  },
});
