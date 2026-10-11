import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface DisclaimerTextProps {
  text: string;
  variant?: 'info' | 'warning' | 'health';
}

export default function DisclaimerText({ text, variant = 'info' }: DisclaimerTextProps) {
  const colorMap = {
    info: Colors.textSecondary,
    warning: Colors.warning,
    health: Colors.health,
  };

  const bgMap = {
    info: Colors.background,
    warning: Colors.warningLight,
    health: Colors.healthLight,
  };

  const iconMap = {
    info: 'information-circle-outline' as const,
    warning: 'alert-circle-outline' as const,
    health: 'medkit-outline' as const,
  };

  return (
    <View style={[styles.container, { backgroundColor: bgMap[variant] }]}>
      <Ionicons name={iconMap[variant]} size={18} color={colorMap[variant]} style={styles.icon} />
      <Text style={[styles.text, { color: colorMap[variant] }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.sm,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: Typography.regular,
  },
});
