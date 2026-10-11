import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import SehatScreen from '../../components/SehatScreen';
import KaushalScreen from '../../components/KaushalScreen';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { welfareSchemes } from '../../data/mockData';

type SubScreen = 'menu' | 'sehat' | 'kaushal';

export default function MoreScreen() {
  const [activeScreen, setActiveScreen] = useState<SubScreen>('menu');

  if (activeScreen === 'sehat') {
    return <SehatScreen onBack={() => setActiveScreen('menu')} />;
  }

  if (activeScreen === 'kaushal') {
    return <KaushalScreen onBack={() => setActiveScreen('menu')} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>सेवा</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Service Cards */}
        <View style={styles.cardGrid}>
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.85}
            onPress={() => setActiveScreen('sehat')}
          >
            <View style={[styles.serviceIconCircle, { backgroundColor: Colors.healthLight }]}>
              <Ionicons name="heart" size={32} color={Colors.health} />
            </View>
            <Text style={styles.serviceTitle}>सेहत और मदद</Text>
            <Text style={styles.serviceDesc}>अस्पताल, दवाइयाँ, इमरजेंसी</Text>
            <View style={styles.serviceArrow}>
              <Ionicons name="arrow-forward-circle" size={28} color={Colors.health} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.85}
            onPress={() => setActiveScreen('kaushal')}
          >
            <View style={[styles.serviceIconCircle, { backgroundColor: Colors.accentLight }]}>
              <Ionicons name="school" size={32} color={Colors.accent} />
            </View>
            <Text style={styles.serviceTitle}>कौशल पासपोर्ट</Text>
            <Text style={styles.serviceDesc}>स्किल्स, कोर्स, प्रोफ़ाइल</Text>
            <View style={styles.serviceArrow}>
              <Ionicons name="arrow-forward-circle" size={28} color={Colors.accent} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Welfare Schemes */}
        <Text style={styles.sectionTitle}>सरकारी योजनाएं</Text>
        {welfareSchemes.map((scheme) => (
          <Card key={scheme.id}>
            <View style={styles.schemeRow}>
              <View style={styles.schemeIcon}>
                <Ionicons name={scheme.icon as any} size={24} color={Colors.primary} />
              </View>
              <View style={styles.schemeInfo}>
                <Text style={styles.schemeName}>{scheme.nameHi}</Text>
                <Text style={styles.schemeDesc}>{scheme.descriptionHi}</Text>
                <View style={styles.schemeEligibility}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
                  <Text style={styles.eligibilityText}>{scheme.eligibilityHi}</Text>
                </View>
              </View>
            </View>
          </Card>
        ))}

        {/* Quick links */}
        <Text style={styles.sectionTitle}>त्वरित लिंक</Text>
        <Card>
          {[
            { icon: 'help-circle-outline', label: 'सहायता और शिकायत', color: Colors.primary },
            { icon: 'document-text-outline', label: 'नियम और शर्तें', color: Colors.textSecondary },
            { icon: 'information-circle-outline', label: 'Setu के बारे में', color: Colors.textSecondary },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[styles.linkRow, i > 0 && styles.linkRowBorder]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
              <Text style={styles.linkText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </Card>

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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },

  // Service Cards
  cardGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: Colors.white,
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
  serviceTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
    lineHeight: Typography.cardTitleLineHeight,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    flex: 1,
  },
  serviceArrow: {
    alignSelf: 'flex-end',
    marginTop: Spacing.md,
  },

  // Schemes
  sectionTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
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
    color: Colors.text,
    lineHeight: Typography.bodyLineHeight,
  },
  schemeDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
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
    marginLeft: 4,
  },

  // Quick links
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  linkRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  linkText: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.text,
    fontWeight: Typography.medium,
    marginLeft: Spacing.md,
  },
});
