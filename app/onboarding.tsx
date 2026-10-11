import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { workerTypeOptions, WorkerType } from '../data/mockData';

export default function OnboardingScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [selectedType, setSelectedType] = useState<WorkerType | null>(null);

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="people" size={40} color={Colors.white} />
          </View>
          <Text style={styles.appName}>सेतु</Text>
          <Text style={styles.tagline}>
            आपके काम, पैसा, सेहत और स्किल का साथी
          </Text>
        </View>

        {/* Language Selection */}
        <Text style={styles.sectionLabel}>भाषा चुनें / Choose Language</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langOption, language === 'hi' && styles.langSelected]}
            onPress={() => setLanguage('hi')}
            activeOpacity={0.8}
          >
            <Text style={[styles.langText, language === 'hi' && styles.langTextSelected]}>
              हिंदी
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langOption, language === 'en' && styles.langSelected]}
            onPress={() => setLanguage('en')}
            activeOpacity={0.8}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextSelected]}>
              English
            </Text>
          </TouchableOpacity>
        </View>

        {/* Worker Type Selection */}
        <Text style={styles.sectionLabel}>
          {language === 'hi' ? 'आप क्या काम करते हैं?' : 'What work do you do?'}
        </Text>
        <View style={styles.typeGrid}>
          {workerTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.typeCard,
                selectedType === option.type && styles.typeCardSelected,
              ]}
              onPress={() => setSelectedType(option.type)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.typeIconCircle,
                  selectedType === option.type && styles.typeIconCircleSelected,
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={26}
                  color={selectedType === option.type ? Colors.white : Colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.typeLabel,
                  selectedType === option.type && styles.typeLabelSelected,
                ]}
              >
                {language === 'hi' ? option.labelHi : option.labelEn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <PrimaryButton
          title={language === 'hi' ? 'आगे बढ़ें' : 'Continue'}
          onPress={handleContinue}
          disabled={!selectedType}
          icon={<Ionicons name="arrow-forward" size={20} color={Colors.white} />}
          style={styles.continueButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xxxl,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.button,
  },
  appName: {
    fontSize: 36,
    fontWeight: Typography.extraBold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.bodyLineHeight,
    paddingHorizontal: Spacing.xl,
  },

  // Language
  sectionLabel: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  langOption: {
    flex: 1,
    height: 54,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  langSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  langText: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  langTextSelected: {
    color: Colors.primary,
  },

  // Worker types
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  typeCard: {
    width: '30%',
    aspectRatio: 0.9,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.card,
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  typeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  typeIconCircleSelected: {
    backgroundColor: Colors.primary,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: Typography.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: Colors.primaryDark,
  },

  continueButton: {
    marginTop: Spacing.md,
  },
});
