import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGE_CODES,
  changeAppLanguage,
  type LanguageCode,
} from '../src/localization';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  ButtonSizes,
} from '../constants/theme';
import { lightTap, successTap } from '../lib/haptics';

interface LanguageSelectorProps {
  variant?: 'grid' | 'icon';
}

export default function LanguageSelector({ variant = 'grid' }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const current = i18n.language as LanguageCode;

  const select = async (code: LanguageCode) => {
    lightTap();
    await changeAppLanguage(code);
    setOpen(false);
    successTap();
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  };

  const chips = (
    <View style={variant === 'grid' && !open ? styles.grid : styles.sheetGrid}>
      {SUPPORTED_LANGUAGE_CODES.map((code) => {
        const selected = current === code || current.startsWith(`${code}-`);
        return (
          <TouchableOpacity
            key={code}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => select(code)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={LANGUAGE_NATIVE_NAMES[code]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {LANGUAGE_NATIVE_NAMES[code]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <>
      {variant === 'icon' ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('common.chooseLanguage')}
        >
          <Ionicons name="language" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        chips
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.glass}>
              <Text style={styles.sheetTitle}>{t('common.chooseLanguage')}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>{chips}</ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={toastVisible} transparent animationType="fade">
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{t('common.languageChanged')}</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    minHeight: ButtonSizes.minTouchTarget,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  chipText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
    color: Colors.textSecondary,
    lineHeight: Typography.bodyLineHeight,
  },
  chipTextSelected: {
    color: Colors.primaryDark,
  },
  iconButton: {
    width: ButtonSizes.minTouchTarget,
    height: ButtonSizes.minTouchTarget,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '78%',
  },
  glass: {
    backgroundColor: Colors.glass,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  sheetTitle: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    lineHeight: Typography.headingLineHeight,
  },
  toastWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
  },
  toast: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.cardLifted,
  },
  toastText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    fontFamily: Typography.fontFamily,
  },
});
