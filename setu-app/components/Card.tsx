import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'accent' | 'success' | 'health' | 'warning';
  lifted?: boolean;
}

export default function Card({ children, style, variant = 'default', lifted = false }: CardProps) {
  const borderColorMap = {
    default: 'transparent',
    accent: Colors.accent,
    success: Colors.success,
    health: Colors.health,
    warning: Colors.warning,
  };

  const bgTintMap = {
    default: Colors.card,
    accent: Colors.accentLight,
    success: Colors.successLight,
    health: Colors.healthLight,
    warning: Colors.warningLight,
  };

  return (
    <View
      style={[
        styles.card,
        lifted ? Shadows.cardLifted : Shadows.card,
        variant !== 'default' && {
          borderLeftWidth: 4,
          borderLeftColor: borderColorMap[variant],
          backgroundColor: bgTintMap[variant],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.cardGap,
  },
});
