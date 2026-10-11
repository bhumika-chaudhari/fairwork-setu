import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, ButtonSizes, Shadows } from '../constants/theme';
import { lightTap } from '../lib/haptics';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'normal' | 'small';
  accessibilityLabel?: string;
}

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  size = 'normal',
  accessibilityLabel,
}: PrimaryButtonProps) {
  const bgColor = {
    primary: Colors.primary,
    secondary: Colors.textSecondary,
    accent: Colors.accent,
    outline: 'transparent',
  };

  const textColor = {
    primary: Colors.textOnPrimary,
    secondary: Colors.textOnPrimary,
    accent: Colors.textPrimary,
    outline: Colors.primary,
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        size === 'small' && styles.buttonSmall,
        { backgroundColor: bgColor[variant] },
        variant === 'outline' && styles.outlineButton,
        variant === 'primary' && Shadows.clay,
        disabled && styles.disabled,
        style,
      ]}
      onPress={() => {
        lightTap();
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.86}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              size === 'small' && styles.textSmall,
              { color: textColor[variant] },
              icon ? { marginLeft: Spacing.sm } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: ButtonSizes.primaryHeight,
    minHeight: ButtonSizes.minTouchTarget,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  buttonSmall: {
    height: ButtonSizes.secondaryHeight,
    paddingHorizontal: Spacing.lg,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.semibold,
    lineHeight: Typography.bodyLineHeight,
    fontFamily: Typography.fontFamily,
  },
  textSmall: {
    fontSize: Typography.body,
  },
});
