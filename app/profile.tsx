import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../components/ScreenContainer';
import AppHeader from '../components/AppHeader';
import Field from '../components/Field';
import SkillChip from '../components/SkillChip';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';
import Card from '../components/Card';
import LanguageSelector from '../components/LanguageSelector';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useProfile } from '../context/ProfileContext';
import {
  CITY_KEYS,
  SUGGESTED_SKILL_KEYS,
  workerTypeOptions,
  type Availability,
} from '../data/mockData';
import { successTap } from '../lib/haptics';

const AVAIL: Availability[] = ['anytime', 'today', 'weekdays', 'weekends'];

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, updateProfile, strength } = useProfile();
  const [name, setName] = useState(profile.name);
  const [cityKey, setCityKey] = useState(profile.cityKey);
  const [workType, setWorkType] = useState(profile.workType);
  const [skillKeys, setSkillKeys] = useState(profile.skillKeys);
  const [customSkills, setCustomSkills] = useState(profile.customSkills);
  const [draftSkill, setDraftSkill] = useState('');
  const [experienceYears, setExperienceYears] = useState(String(profile.experienceYears));
  const [availability, setAvailability] = useState(profile.availability);
  const [payMin, setPayMin] = useState(String(profile.payMin));
  const [payMax, setPayMax] = useState(String(profile.payMax));
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact);
  const [savingsGoal, setSavingsGoal] = useState(String(profile.savingsGoal));
  const [nameError, setNameError] = useState('');

  const addCustomSkill = () => {
    const next = draftSkill.trim();
    if (!next) return;
    setCustomSkills((prev) => [...prev, next]);
    setDraftSkill('');
  };

  const save = async () => {
    if (name.trim().length < 2) {
      setNameError(t('profileScreen.validationName'));
      return;
    }
    setNameError('');
    await updateProfile({
      name: name.trim(),
      cityKey,
      workType,
      skillKeys,
      customSkills,
      experienceYears: Number(experienceYears) || 0,
      availability,
      payMin: Number(payMin) || 0,
      payMax: Number(payMax) || 0,
      emergencyContact: emergencyContact.trim(),
      savingsGoal: Number(savingsGoal) || 0,
    });
    successTap();
    Alert.alert(t('profileScreen.saved'), t('profileScreen.savedBody'));
    router.back();
  };

  return (
    <ScreenContainer
      padded={false}
      header={<AppHeader title={t('profileScreen.title')} onBack={() => router.back()} />}
    >
      <View style={styles.body}>
        <Card lifted>
          <View style={styles.photoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name.trim().charAt(0) || 'S'}</Text>
            </View>
            <View style={styles.photoMeta}>
              <Text style={styles.photoLabel}>{t('profileScreen.photo')}</Text>
              <Ionicons name="camera-outline" size={22} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.strength}>{t('profileScreen.strength', { percent: strength })}</Text>
          <ProgressBar progress={strength / 100} color={Colors.primary} trackColor={Colors.primarySoft} />
          <Text style={styles.strengthHint}>{t('profileScreen.strengthHint')}</Text>
        </Card>

        <Field
          label={t('profileScreen.name')}
          hint={t('profileScreen.nameHint')}
          value={name}
          onChangeText={setName}
          error={nameError}
        />

        <Text style={styles.label}>{t('common.language')}</Text>
        <LanguageSelector variant="grid" />

        <Text style={styles.label}>{t('profileScreen.city')}</Text>
        <Text style={styles.hint}>{t('profileScreen.cityHint')}</Text>
        <View style={styles.wrap}>
          {CITY_KEYS.map((key) => (
            <SkillChip key={key} label={t(key)} selected={cityKey === key} onPress={() => setCityKey(key)} />
          ))}
        </View>

        <Text style={styles.label}>{t('profileScreen.workType')}</Text>
        <Text style={styles.hint}>{t('profileScreen.workHint')}</Text>
        <View style={styles.wrap}>
          {workerTypeOptions.map((opt) => (
            <SkillChip
              key={opt.type}
              icon={opt.icon}
              label={t(opt.labelKey)}
              selected={workType === opt.type}
              onPress={() => setWorkType(opt.type)}
            />
          ))}
        </View>

        <Text style={styles.label}>{t('profileScreen.skills')}</Text>
        <Text style={styles.hint}>{t('profileScreen.skillsHint')}</Text>
        <View style={styles.wrap}>
          {SUGGESTED_SKILL_KEYS.map((key) => (
            <SkillChip
              key={key}
              label={t(key)}
              selected={skillKeys.includes(key)}
              onPress={() =>
                setSkillKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
              }
            />
          ))}
          {customSkills.map((skill) => (
            <SkillChip
              key={skill}
              label={skill}
              selected
              onPress={() => setCustomSkills((prev) => prev.filter((s) => s !== skill))}
            />
          ))}
        </View>
        <Field
          label={t('common.add')}
          hint={t('profileScreen.skillsHint')}
          value={draftSkill}
          onChangeText={setDraftSkill}
          placeholder={t('profileScreen.skillPlaceholder')}
        />
        <PrimaryButton title={t('common.add')} onPress={addCustomSkill} size="small" variant="outline" />

        <Field
          label={t('profileScreen.experience')}
          hint={t('profileScreen.experienceHint')}
          value={experienceYears}
          onChangeText={setExperienceYears}
          keyboardType="numeric"
        />

        <Text style={styles.label}>{t('profileScreen.availability')}</Text>
        <Text style={styles.hint}>{t('profileScreen.availabilityHint')}</Text>
        <View style={styles.wrap}>
          {AVAIL.map((key) => (
            <SkillChip
              key={key}
              label={t(`availability.${key}`)}
              selected={availability === key}
              onPress={() => setAvailability(key)}
            />
          ))}
        </View>

        <Field
          label={`${t('profileScreen.payRange')} (min)`}
          hint={t('profileScreen.payHint')}
          value={payMin}
          onChangeText={setPayMin}
          keyboardType="numeric"
        />
        <Field
          label={`${t('profileScreen.payRange')} (max)`}
          value={payMax}
          onChangeText={setPayMax}
          keyboardType="numeric"
        />
        <Field
          label={t('profileScreen.emergencyContact')}
          hint={t('profileScreen.emergencyHint')}
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          keyboardType="phone-pad"
        />
        <Field
          label={t('profileScreen.savingsGoal')}
          hint={t('profileScreen.savingsHint')}
          value={savingsGoal}
          onChangeText={setSavingsGoal}
          keyboardType="numeric"
        />

        <PrimaryButton title={t('common.save')} onPress={save} style={styles.save} />
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
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
  },
  photoMeta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
  },
  strength: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.cardTitleLineHeight,
  },
  strengthHint: {
    marginTop: Spacing.sm,
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    lineHeight: Typography.secondaryLineHeight,
  },
  label: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    lineHeight: Typography.bodyLineHeight,
  },
  hint: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.md,
    lineHeight: Typography.secondaryLineHeight,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  save: {
    marginTop: Spacing.xxl,
  },
});
