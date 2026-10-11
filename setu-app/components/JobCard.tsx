import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import type { Job } from '../data/mockData';

interface JobCardProps {
  job: Job;
  onPress?: () => void;
}

export default function JobCard({ job, onPress }: JobCardProps) {
  const matchColor =
    job.skillMatch >= 85 ? Colors.success : job.skillMatch >= 70 ? Colors.warning : Colors.textSecondary;

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{job.titleHi}</Text>
          <View style={[styles.matchBadge, { backgroundColor: matchColor + '18' }]}>
            <Text style={[styles.matchText, { color: matchColor }]}>{job.skillMatch}% मैच</Text>
          </View>
        </View>
        <Text style={styles.location}>
          <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
          {'  '}{job.location} · {job.distance}
        </Text>
      </View>

      <View style={styles.details}>
        <View style={styles.payRow}>
          <Text style={styles.pay}>₹{job.payMin.toLocaleString('en-IN')}–₹{job.payMax.toLocaleString('en-IN')}</Text>
          <Text style={styles.payType}>{job.payTypeHi}</Text>
        </View>
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{job.workTypeHi}</Text>
          </View>
          <Text style={styles.posted}>{job.postedAgoHi}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.buttonText}>दिखाएं</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
    lineHeight: Typography.cardTitleLineHeight,
  },
  matchBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  matchText: {
    fontSize: 13,
    fontWeight: Typography.bold,
  },
  location: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  details: {
    marginBottom: Spacing.md,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  pay: {
    fontSize: 20,
    fontWeight: Typography.extraBold,
    color: Colors.primary,
  },
  payType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 13,
    fontWeight: Typography.medium,
    color: Colors.primaryDark,
  },
  posted: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  buttonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
});
