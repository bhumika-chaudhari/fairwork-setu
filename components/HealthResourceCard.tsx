import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Card from './Card';
import Badge from './Badge';
import { Colors, Spacing, Typography, BorderRadius, ButtonSizes } from '../constants/theme';
import type { HealthResource } from '../data/mockData';

interface HealthResourceCardProps {
  resource: HealthResource;
}

export default function HealthResourceCard({ resource }: HealthResourceCardProps) {
  const { t } = useTranslation();

  return (
    <Card variant="health">
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={resource.isGovernment ? 'shield-checkmark' : 'medical'}
            size={22}
            color={Colors.health}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{t(resource.nameKey)}</Text>
          <Text style={styles.type}>{t(resource.typeKey)}</Text>
        </View>
        <Badge label={resource.distance} tone="health" />
      </View>

      <Text style={styles.services}>{t(resource.servicesKey)}</Text>

      <View style={styles.footer}>
        {resource.phone ? (
          <TouchableOpacity
            style={styles.phoneButton}
            onPress={() => Linking.openURL(`tel:${resource.phone}`)}
          >
            <Ionicons name="call-outline" size={16} color={Colors.health} />
            <Text style={styles.phoneText}>{resource.phone}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>{t('sehat.viewSource')}</Text>
          <Ionicons name="open-outline" size={14} color={Colors.health} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.healthLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.cardTitleLineHeight,
  },
  type: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  services: {
    fontSize: 14,
    color: Colors.health,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    minHeight: ButtonSizes.minTouchTarget,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ButtonSizes.minTouchTarget,
  },
  phoneText: {
    fontSize: 14,
    color: Colors.health,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    marginLeft: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ButtonSizes.minTouchTarget,
  },
  linkText: {
    fontSize: 14,
    color: Colors.health,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    marginRight: 4,
  },
});
