import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import IncomeCard from '../../components/IncomeCard';
import JobCard from '../../components/JobCard';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import VoiceButton from '../../components/VoiceButton';
import VoiceEntryModal from '../../components/VoiceEntryModal';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { workerProfile, mockJobs, healthResources } from '../../data/mockData';

export default function HomeScreen() {
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  const suggestedJobs = mockJobs.slice(0, 2);
  const nearbyHealth = healthResources[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>नमस्ते, रमेश 👋</Text>
            <Text style={styles.subGreeting}>आज आपका दिन शानदार हो!</Text>
          </View>
          <View style={styles.notifIcon}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          </View>
        </View>

        {/* Today's Income */}
        <IncomeCard todayIncome={750} savingSuggestion={50} />

        {/* Voice Entry CTA */}
        <View style={styles.voiceSection}>
          <VoiceButton onPress={() => setVoiceModalVisible(true)} size={68} />
          <Text style={styles.voiceLabel}>बोलकर जोड़ें</Text>
          <Text style={styles.voiceHint}>कमाई या खर्चा बोलकर दर्ज करें</Text>
        </View>

        {/* Suggested Work */}
        <SectionHeader title="आपके लिए काम" actionLabel="सभी देखें" onAction={() => {}} />
        {suggestedJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}

        {/* Nearby Health */}
        <SectionHeader title="नज़दीकी सुविधाएं" />
        <Card variant="health">
          <View style={styles.healthRow}>
            <View style={styles.healthIcon}>
              <Ionicons name="medical" size={22} color={Colors.health} />
            </View>
            <View style={styles.healthInfo}>
              <Text style={styles.healthName}>{nearbyHealth.name}</Text>
              <Text style={styles.healthType}>
                {nearbyHealth.typeHi} · {nearbyHealth.distance}
              </Text>
            </View>
            <View style={styles.healthArrow}>
              <Ionicons name="chevron-forward" size={20} color={Colors.health} />
            </View>
          </View>
        </Card>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Voice Modal */}
      <VoiceEntryModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
      />
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
    paddingTop: Spacing.lg,
  },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.headingLarge,
    fontWeight: Typography.bold,
    color: Colors.text,
    lineHeight: Typography.headingLineHeight + 4,
  },
  subGreeting: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },

  // Voice section
  voiceSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  voiceLabel: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  voiceHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Health
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.healthLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  healthInfo: {
    flex: 1,
  },
  healthName: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  healthType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  healthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.healthLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
