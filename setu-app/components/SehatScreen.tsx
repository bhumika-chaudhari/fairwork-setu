import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import HealthResourceCard from './HealthResourceCard';
import DisclaimerText from './DisclaimerText';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { healthResources } from '../data/mockData';

interface SehatScreenProps {
  onBack: () => void;
}

export default function SehatScreen({ onBack }: SehatScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = healthResources.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.typeHi.includes(searchQuery)
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>सेहत और मदद</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="अस्पताल, स्कीम या मदद खोजें"
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Emergency Numbers */}
        <Card variant="warning">
          <View style={styles.emergencyHeader}>
            <Ionicons name="warning" size={22} color={Colors.warning} />
            <Text style={styles.emergencyTitle}>इमरजेंसी नंबर</Text>
          </View>
          <View style={styles.emergencyNumbers}>
            <TouchableOpacity
              style={styles.emergencyItem}
              onPress={() => Linking.openURL('tel:108')}
            >
              <View style={[styles.emergencyIcon, { backgroundColor: Colors.dangerLight }]}>
                <Ionicons name="medical" size={20} color={Colors.danger} />
              </View>
              <View>
                <Text style={styles.emergencyNumber}>108</Text>
                <Text style={styles.emergencyLabel}>एम्बुलेंस</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emergencyItem}
              onPress={() => Linking.openURL('tel:112')}
            >
              <View style={[styles.emergencyIcon, { backgroundColor: Colors.warningLight }]}>
                <Ionicons name="call" size={20} color={Colors.warning} />
              </View>
              <View>
                <Text style={styles.emergencyNumber}>112</Text>
                <Text style={styles.emergencyLabel}>इमरजेंसी</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Nearby Resources */}
        <Text style={styles.sectionTitle}>नज़दीकी स्वास्थ्य सेवाएं</Text>
        {filteredResources.map((resource) => (
          <HealthResourceCard key={resource.id} resource={resource} />
        ))}

        {/* Disclaimer */}
        <DisclaimerText
          text="Setu चिकित्सा सलाह नहीं देता। कृपया आधिकारिक स्रोत से पुष्टि करें।"
          variant="health"
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.text,
    marginLeft: Spacing.sm,
    padding: 0,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emergencyTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  emergencyNumbers: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  emergencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  emergencyNumber: {
    fontSize: 20,
    fontWeight: Typography.extraBold,
    color: Colors.text,
  },
  emergencyLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
});
