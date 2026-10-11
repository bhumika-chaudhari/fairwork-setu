import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'accent' | 'success' | 'health' | 'warning' | 'soft';
  lifted?: boolean;
}

export default function Card({ children, style, variant = 'default', lifted = false }: CardProps) {
  const extras: ViewStyle =
    variant === 'soft'
      ? { backgroundColor: Colors.surfaceAlt }
      : variant !== 'default'
        ? {
            borderLeftWidth: 4,
            borderLeftColor: {
              accent: Colors.accent,
              success: Colors.success,
              health: Colors.health,
              warning: Colors.warning,
              default: 'transparent',
              soft: 'transparent',
            }[variant],
            backgroundColor: {
              accent: Colors.accentSoft,
              success: Colors.successSoft,
              health: Colors.healthSoft,
              warning: Colors.warningSoft,
              default: Colors.surface,
              soft: Colors.surfaceAlt,
            }[variant],
          }
        : {};

  return (
    <View style={[styles.card, lifted ? Shadows.cardLifted : Shadows.card, extras, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.cardPaddingLarge,
    marginBottom: Spacing.cardGap,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
