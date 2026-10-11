import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, ButtonSizes } from '../constants/theme';

interface SkillChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'accent';
  style?: ViewStyle;
  color?: string;
}

export default function SkillChip({
  label,
  icon,
  selected = false,
  onPress,
  variant = 'default',
  style,
  color,
}: SkillChipProps) {
  const getColors = () => {
    if (selected) {
      return { bg: Colors.primary, text: Colors.textOnPrimary, border: Colors.primary };
    }
    if (color) {
      return { bg: Colors.surface, text: color, border: color };
    }
    switch (variant) {
      case 'primary':
        return { bg: Colors.primaryLight, text: Colors.primaryDark, border: Colors.primaryLight };
      case 'accent':
        return { bg: Colors.accentLight, text: Colors.warning, border: Colors.accentLight };
      default:
        return { bg: Colors.surface, text: Colors.textPrimary, border: Colors.border };
    }
  };

  const colors = getColors();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {icon ? (
        <Ionicons name={icon as never} size={16} color={colors.text} style={styles.icon} />
      ) : null}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: ButtonSizes.minTouchTarget,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
  },
});
