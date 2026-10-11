import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import type { HealthResource } from '../data/mockData';

interface HealthResourceCardProps {
  resource: HealthResource;
}

export default function HealthResourceCard({ resource }: HealthResourceCardProps) {
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
          <Text style={styles.name}>{resource.name}</Text>
          <Text style={styles.type}>{resource.typeHi}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Ionicons name="navigate-outline" size={14} color={Colors.health} />
          <Text style={styles.distance}>{resource.distance}</Text>
        </View>
      </View>

      <View style={styles.services}>
        {resource.servicesHi.map((service, i) => (
          <View key={i} style={styles.serviceChip}>
            <Text style={styles.serviceText}>{service}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        {resource.phone && (
          <TouchableOpacity
            style={styles.phoneButton}
            onPress={() => Linking.openURL(`tel:${resource.phone}`)}
          >
            <Ionicons name="call-outline" size={16} color={Colors.health} />
            <Text style={styles.phoneText}>{resource.phone}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>स्रोत देखें</Text>
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
    fontWeight: Typography.bold,
    color: Colors.text,
    lineHeight: Typography.cardTitleLineHeight,
  },
  type: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.healthLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  distance: {
    fontSize: 13,
    fontWeight: Typography.semibold,
    color: Colors.health,
    marginLeft: 4,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  serviceChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.healthLight,
  },
  serviceText: {
    fontSize: 13,
    color: Colors.health,
    fontWeight: Typography.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    color: Colors.health,
    fontWeight: Typography.medium,
    marginLeft: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: Colors.health,
    fontWeight: Typography.semibold,
    marginRight: 4,
  },
});
