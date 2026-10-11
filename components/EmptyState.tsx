import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import GhostButton from './GhostButton';

interface EmptyStateProps {
  icon?: string;
  message: string;
  submessage?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = 'search-outline',
  message,
  submessage,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon as never} size={40} color={Colors.primary} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {submessage ? <Text style={styles.submessage}>{submessage}</Text> : null}
      {actionLabel && onAction ? (
        <GhostButton title={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  message: {
    fontSize: Typography.body,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.bodyLineHeight,
  },
  submessage: {
    fontSize: Typography.secondary,
    lineHeight: Typography.secondaryLineHeight,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  action: {
    marginTop: Spacing.lg,
    alignSelf: 'stretch',
  },
});
