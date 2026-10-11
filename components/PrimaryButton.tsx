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
    accent: Colors.text,
    outline: Colors.primary,
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        size === 'small' && styles.buttonSmall,
        { backgroundColor: bgColor[variant] },
        variant === 'outline' && styles.outlineButton,
        variant === 'primary' && Shadows.button,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
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
              icon ? { marginLeft: 8 } : undefined,
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
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    minWidth: ButtonSizes.minTouchTarget,
  },
  buttonSmall: {
    height: 42,
    paddingHorizontal: Spacing.lg,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    lineHeight: Typography.bodyLineHeight,
  },
  textSmall: {
    fontSize: 14,
  },
});
