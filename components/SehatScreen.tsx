import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import HealthResourceCard from './HealthResourceCard';
import DisclaimerText from './DisclaimerText';
import SearchField from './SearchField';
import ScreenContainer from './ScreenContainer';
import AppHeader from './AppHeader';
import EmptyState from './EmptyState';
import { Colors, Spacing, Typography, BorderRadius, Shadows, ButtonSizes } from '../constants/theme';
import { healthResources } from '../data/mockData';

interface SehatScreenProps {
  onBack: () => void;
}

export default function SehatScreen({ onBack }: SehatScreenProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return healthResources;
    return healthResources.filter((r) => {
      const haystack = `${t(r.nameKey)} ${t(r.typeKey)} ${t(r.servicesKey)}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [searchQuery, t]);

  return (
    <ScreenContainer
      padded={false}
      header={<AppHeader title={t('sehat.title')} onBack={onBack} />}
    >
      <View style={styles.body}>
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('sehat.searchPlaceholder')}
        />

        <Text style={styles.sectionTitle}>{t('sehat.emergency')}</Text>
        <View style={styles.emergencyRow}>
          <TouchableOpacity
            style={[styles.emergencyCard, styles.emergencyDanger]}
            onPress={() => Linking.openURL('tel:108')}
            accessibilityRole="button"
            accessibilityLabel={`108 ${t('sehat.ambulance')}`}
          >
            <View style={styles.emergencyIcon}>
              <Ionicons name="medkit" size={26} color={Colors.white} />
            </View>
            <Text style={styles.emergencyNumber}>108</Text>
            <Text style={styles.emergencyLabel}>{t('sehat.ambulance')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emergencyCard, styles.emergencyHealth]}
            onPress={() => Linking.openURL('tel:112')}
            accessibilityRole="button"
            accessibilityLabel={`112 ${t('sehat.emergency')}`}
          >
            <View style={styles.emergencyIcon}>
              <Ionicons name="call" size={26} color={Colors.white} />
            </View>
            <Text style={styles.emergencyNumber}>112</Text>
            <Text style={styles.emergencyLabel}>{t('sehat.emergency')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('sehat.nearby')}</Text>
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <HealthResourceCard key={resource.id} resource={resource} />
          ))
        ) : (
          <EmptyState icon="medkit-outline" message={t('kaam.noJobsHint')} />
        )}

        <DisclaimerText text={t('sehat.disclaimer')} variant="health" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
    lineHeight: Typography.cardTitleLineHeight,
  },
  emergencyRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  emergencyCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPadding,
    minHeight: 128,
    ...Shadows.card,
  },
  emergencyDanger: {
    backgroundColor: Colors.danger,
  },
  emergencyHealth: {
    backgroundColor: Colors.health,
  },
  emergencyIcon: {
    width: ButtonSizes.minTouchTarget,
    height: ButtonSizes.minTouchTarget,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emergencyNumber: {
    fontSize: Typography.heading,
    fontWeight: Typography.extraBold,
    fontFamily: Typography.fontFamily,
    color: Colors.white,
    lineHeight: Typography.headingLineHeight,
  },
  emergencyLabel: {
    fontSize: Typography.body,
    color: Colors.white,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
    lineHeight: Typography.bodyLineHeight,
  },
});
