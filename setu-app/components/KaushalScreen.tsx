import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import SkillChip from './SkillChip';
import PrimaryButton from './PrimaryButton';
import DisclaimerText from './DisclaimerText';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { workerProfile, skillCourses } from '../data/mockData';

interface KaushalScreenProps {
  onBack: () => void;
}

export default function KaushalScreen({ onBack }: KaushalScreenProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>कौशल पासपोर्ट</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Summary */}
        <Card lifted>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {workerProfile.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{workerProfile.name}</Text>
              <Text style={styles.profileOccupation}>{workerProfile.occupation}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.profileCity}>{workerProfile.city}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color={Colors.accent} />
              <Text style={styles.ratingText}>{workerProfile.rating}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{workerProfile.completedJobs}</Text>
              <Text style={styles.statLabel}>काम पूरे</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{workerProfile.experience}</Text>
              <Text style={styles.statLabel}>अनुभव</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{workerProfile.languages.length}</Text>
              <Text style={styles.statLabel}>भाषाएं</Text>
            </View>
          </View>
        </Card>

        {/* Skills */}
        <Text style={styles.sectionTitle}>कौशल</Text>
        <View style={styles.skillsRow}>
          {workerProfile.skills.map((skill, i) => (
            <SkillChip key={i} label={skill} variant="primary" />
          ))}
        </View>

        {/* Languages */}
        <Text style={styles.sectionTitle}>भाषाएं</Text>
        <View style={styles.skillsRow}>
          {workerProfile.languages.map((lang, i) => (
            <SkillChip key={i} label={lang} icon="chatbubble-outline" />
          ))}
        </View>

        {/* Skill Passport Card */}
        <Card variant="accent" style={styles.passportCard}>
          <View style={styles.passportHeader}>
            <Ionicons name="document-text" size={28} color={Colors.accent} />
            <View style={styles.passportInfo}>
              <Text style={styles.passportTitle}>Skill Passport</Text>
              <Text style={styles.passportSubtext}>आपकी स्किल्स का डिजिटल प्रमाण</Text>
            </View>
          </View>
          <PrimaryButton
            title="PDF डाउनलोड करें"
            onPress={() => Alert.alert('डाउनलोड', 'PDF डाउनलोड शुरू हो रहा है...')}
            variant="accent"
            icon={<Ionicons name="download-outline" size={20} color={Colors.text} />}
          />
        </Card>

        {/* Recommended Courses */}
        <Text style={styles.sectionTitle}>सुझाए गए कोर्स</Text>
        {skillCourses.map((course) => (
          <Card key={course.id}>
            <View style={styles.courseRow}>
              <View style={styles.courseIcon}>
                <Ionicons name={course.icon as any} size={24} color={Colors.primary} />
              </View>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.titleHi}</Text>
                <Text style={styles.courseMeta}>
                  {course.provider} · {course.durationHi} · {course.levelHi}
                </Text>
              </View>
              {course.isFree && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeText}>मुफ़्त</Text>
                </View>
              )}
            </View>
          </Card>
        ))}

        {/* Disclaimer */}
        <DisclaimerText
          text="यह प्रोफ़ाइल आपकी स्किल्स दिखाने के लिए है। यह सरकारी प्रमाणपत्र नहीं है।"
          variant="info"
        />
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 12,
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
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },

  // Profile
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
    lineHeight: Typography.cardTitleLineHeight,
  },
  profileOccupation: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  profileCity: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginLeft: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: Typography.extraBold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.divider,
    alignSelf: 'center',
  },

  // Skills & Languages
  sectionTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  // Passport
  passportCard: {
    marginTop: Spacing.lg,
  },
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  passportInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  passportTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  passportSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Courses
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
    lineHeight: Typography.bodyLineHeight,
  },
  courseMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  freeBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  freeText: {
    fontSize: 13,
    fontWeight: Typography.bold,
    color: Colors.success,
  },
});
