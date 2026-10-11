import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import SehatScreen from '../../components/SehatScreen';
import KaushalScreen from '../../components/KaushalScreen';
import ScreenContainer from '../../components/ScreenContainer';
import AppHeader from '../../components/AppHeader';
import LanguageSelector from '../../components/LanguageSelector';
import { Colors, Spacing, Typography, BorderRadius, Shadows, ButtonSizes } from '../../constants/theme';
import { welfareSchemes } from '../../data/mockData';

type SubScreen = 'menu' | 'sehat' | 'kaushal';

export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState<SubScreen>('menu');

  if (activeScreen === 'sehat') {
    return <SehatScreen onBack={() => setActiveScreen('menu')} />;
  }

  if (activeScreen === 'kaushal') {
    return <KaushalScreen onBack={() => setActiveScreen('menu')} />;
  }

  return (
    <ScreenContainer
      padded={false}
      header={
        <AppHeader title={t('more.title')} right={<LanguageSelector variant="icon" />} />
      }
    >
      <View style={styles.content}>
        <View style={styles.cardGrid}>
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.85}
            onPress={() => setActiveScreen('sehat')}
          >
            <View style={[styles.serviceIconCircle, { backgroundColor: Colors.healthLight }]}>
              <Ionicons name="heart" size={32} color={Colors.health} />
            </View>
            <Text style={styles.serviceTitle}>{t('more.healthTitle')}</Text>
            <Text style={styles.serviceDesc}>{t('more.healthDesc')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.85}
            onPress={() => setActiveScreen('kaushal')}
          >
            <View style={[styles.serviceIconCircle, { backgroundColor: Colors.accentLight }]}>
              <Ionicons name="school" size={32} color={Colors.accent} />
            </View>
            <Text style={styles.serviceTitle}>{t('more.skillTitle')}</Text>
            <Text style={styles.serviceDesc}>{t('more.skillDesc')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.profileRow}
          activeOpacity={0.85}
          onPress={() => router.push('/profile')}
        >
          <View style={[styles.serviceIconCircle, styles.profileIcon, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="person" size={26} color={Colors.primary} />
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.serviceTitle}>{t('more.profileTitle')}</Text>
            <Text style={styles.serviceDesc}>{t('more.profileDesc')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('more.schemes')}</Text>
        {welfareSchemes.map((scheme) => (
          <Card key={scheme.id}>
            <View style={styles.schemeRow}>
              <View style={styles.schemeIcon}>
                <Ionicons name={scheme.icon as never} size={24} color={Colors.primary} />
              </View>
              <View style={styles.schemeInfo}>
                <Text style={styles.schemeName}>{t(scheme.nameKey)}</Text>
                <Text style={styles.schemeDesc}>{t(scheme.descriptionKey)}</Text>
                <View style={styles.schemeEligibility}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
                  <Text style={styles.eligibilityText}>{t(scheme.eligibilityKey)}</Text>
                </View>
              </View>
            </View>
          </Card>
        ))}

        <Text style={styles.sectionTitle}>{t('more.quickLinks')}</Text>
        <Card>
          {(
            [
              { icon: 'help-circle-outline' as const, labelKey: 'more.help', color: Colors.primary },
              { icon: 'document-text-outline' as const, labelKey: 'more.terms', color: Colors.textSecondary },
              { icon: 'information-circle-outline' as const, labelKey: 'more.about', color: Colors.textSecondary },
            ] as const
          ).map((item, i) => (
            <TouchableOpacity key={item.labelKey} style={[styles.linkRow, i > 0 && styles.linkRowBorder]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
              <Text style={styles.linkText}>{t(item.labelKey)}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  cardGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPaddingLarge,
    ...Shadows.card,
    minHeight: 170,
  },
  serviceIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  profileIcon: {
    marginBottom: 0,
    marginRight: Spacing.md,
    width: ButtonSizes.minTouchTarget,
    height: ButtonSizes.minTouchTarget,
  },
  serviceTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.cardTitleLineHeight,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    lineHeight: Typography.secondaryLineHeight,
    flex: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.xxl,
    ...Shadows.card,
  },
  profileCopy: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: Typography.cardTitleLineHeight,
  },
  schemeRow: {
    flexDirection: 'row',
  },
  schemeIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  schemeInfo: {
    flex: 1,
  },
  schemeName: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.bodyLineHeight,
  },
  schemeDesc: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
    lineHeight: Typography.secondaryLineHeight,
  },
  schemeEligibility: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  eligibilityText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    marginLeft: 4,
    flex: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ButtonSizes.minTouchTarget,
    paddingVertical: Spacing.md,
  },
  linkRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  linkText: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    marginLeft: Spacing.md,
  },
});
