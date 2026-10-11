import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import JobCard from '../../components/JobCard';
import SkillChip from '../../components/SkillChip';
import EmptyState from '../../components/EmptyState';
import AppHeader from '../../components/AppHeader';
import SearchField from '../../components/SearchField';
import DisclaimerText from '../../components/DisclaimerText';
import ScreenContainer from '../../components/ScreenContainer';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { mockJobs } from '../../data/mockData';
import { useProfile } from '../../context/ProfileContext';

type SkillFilter = 'all' | 'wiring' | 'repair' | 'installation';
type AvailFilter = 'all' | 'today' | 'week';

export default function KaamScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useProfile();
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState<SkillFilter>('all');
  const [cityOn, setCityOn] = useState(true);
  const [availability, setAvailability] = useState<AvailFilter>('all');

  const filteredJobs = useMemo(() => {
    return mockJobs.filter((job) => {
      const haystack = `${t(job.titleKey)} ${t(job.locationKey)} ${t(job.employerKey)}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      const matchesSkill = skill === 'all' || job.filterTags.includes(skill);
      const matchesCity = cityOn;
      const matchesAvail = availability !== 'today' || job.id !== 'j003';
      return matchesQuery && matchesSkill && matchesCity && matchesAvail;
    });
  }, [availability, cityOn, query, skill, t]);

  return (
    <ScreenContainer
      scroll={false}
      padded={false}
      header={<AppHeader title={t('kaam.findWork')} />}
    >
      <View style={styles.searchPad}>
        <SearchField value={query} onChangeText={setQuery} placeholder={t('kaam.searchPlaceholder')} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <SkillChip label={t('kaam.filterAll')} selected={skill === 'all'} onPress={() => setSkill('all')} />
        <SkillChip label={t('kaam.filterWiring')} selected={skill === 'wiring'} onPress={() => setSkill('wiring')} />
        <SkillChip label={t('kaam.filterRepair')} selected={skill === 'repair'} onPress={() => setSkill('repair')} />
        <SkillChip
          label={t('kaam.filterInstallation')}
          selected={skill === 'installation'}
          onPress={() => setSkill('installation')}
        />
        <SkillChip
          icon="location-outline"
          label={t(profile.cityKey)}
          selected={cityOn}
          onPress={() => setCityOn((v) => !v)}
        />
        <SkillChip label={t('kaam.availAll')} selected={availability === 'all'} onPress={() => setAvailability('all')} />
        <SkillChip
          label={t('kaam.availToday')}
          selected={availability === 'today'}
          onPress={() => setAvailability('today')}
        />
        <SkillChip
          label={t('kaam.availWeek')}
          selected={availability === 'week'}
          onPress={() => setAvailability('week')}
        />
      </ScrollView>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {t('kaam.jobsFound', { count: filteredJobs.length, city: t(profile.cityKey) })}
        </Text>
        <Text style={styles.sortText}>{t('kaam.sortDistance')}</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <EmptyState
            icon="briefcase-outline"
            message={t('kaam.noJobs')}
            submessage={t('kaam.noJobsHint')}
            actionLabel={t('kaam.updateProfile')}
            onAction={() => router.push('/profile')}
          />
        )}
        <DisclaimerText text={t('kaam.disclaimer')} variant="info" />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchPad: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
  },
  filters: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
  },
  infoText: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    fontWeight: Typography.medium,
  },
  sortText: {
    fontSize: Typography.secondary,
    color: Colors.primary,
    fontFamily: Typography.fontFamily,
    fontWeight: Typography.semibold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xxl,
  },
});
