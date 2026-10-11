import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../constants/theme';

interface FieldProps {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}

export default function Field({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
}: FieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        accessibilityLabel={label}
      />
      <Text style={styles.hint}>{error ?? hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.bodyLineHeight,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.bodyLineHeight,
  },
  hint: {
    marginTop: Spacing.sm,
    fontSize: Typography.secondary,
    lineHeight: Typography.secondaryLineHeight,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
  },
});
