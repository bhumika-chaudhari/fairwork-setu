import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import JobCard from '../../components/JobCard';
import SkillChip from '../../components/SkillChip';
import EmptyState from '../../components/EmptyState';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { mockJobs } from '../../data/mockData';

type FilterType = 'all' | 'wiring' | 'repair' | 'installation';

const filters: { key: FilterType; labelHi: string }[] = [
  { key: 'all', labelHi: 'सभी' },
  { key: 'wiring', labelHi: 'वायरिंग' },
  { key: 'repair', labelHi: 'रिपेयर' },
  { key: 'installation', labelHi: 'इंस्टालेशन' },
];

export default function KaamScreen() {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  const filteredJobs = selectedFilter === 'all'
    ? mockJobs
    : mockJobs.filter((job) =>
        job.skills.some((s) => s.toLowerCase().includes(selectedFilter))
      );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>काम खोजें</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="filter-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {filters.map((filter) => (
            <SkillChip
              key={filter.key}
              label={filter.labelHi}
              selected={selectedFilter === filter.key}
              onPress={() => setSelectedFilter(filter.key)}
              style={styles.filterChip}
            />
          ))}
        </ScrollView>
      </View>

      {/* Job Info Bar */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {filteredJobs.length > 0
            ? `${filteredJobs.length} काम मिले · पुणे`
            : 'कोई काम नहीं मिला'}
        </Text>
        <TouchableOpacity>
          <Text style={styles.sortText}>दूरी ↑</Text>
        </TouchableOpacity>
      </View>

      {/* Job list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <EmptyState
            icon="briefcase-outline"
            message="अभी आपके शहर में मैचिंग काम नहीं मिला।"
            submessage="बाद में फिर से देखें या फ़िल्टर बदलें"
          />
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    backgroundColor: Colors.white,
    paddingBottom: Spacing.md,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  filterChip: {
    marginRight: 0,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  sortText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.screenPadding,
  },
});
