import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, ButtonSizes } from '../constants/theme';

interface GhostButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export default function GhostButton({ title, onPress, icon, style }: GhostButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.8}>
      {icon}
      <Text style={[styles.text, icon ? styles.textWithIcon : undefined]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: ButtonSizes.minTouchTarget,
    height: ButtonSizes.primaryHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  text: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.primary,
  },
  textWithIcon: {
    marginLeft: Spacing.sm,
  },
});
