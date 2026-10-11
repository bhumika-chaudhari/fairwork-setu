import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import PrimaryButton from './PrimaryButton';
import GhostButton from './GhostButton';
import Card from './Card';
import VoiceButton from './VoiceButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { formatInr } from '../src/localization';
import { voiceExpense, voiceIncome } from '../data/mockData';
import { successTap } from '../lib/haptics';

interface VoiceEntryModalProps {
  visible: boolean;
  onClose: () => void;
}

type Stage = 'listening' | 'result' | 'saved' | 'typing';

export default function VoiceEntryModal({ visible, onClose }: VoiceEntryModalProps) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>('listening');
  const [typed, setTyped] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setStage('listening');
      setTyped('');
      const timer = setTimeout(() => setStage('result'), 2000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    if (stage === 'listening') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [pulseAnim, stage]);

  const handleSave = () => {
    successTap();
    setStage('saved');
  };
  const handleRetry = () => {
    setStage('listening');
    setTimeout(() => setStage('result'), 2000);
  };
  const handleClose = () => {
    setStage('listening');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('voice.title')}</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={styles.closeHit}
            >
              <Ionicons name="close" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {stage === 'listening' && (
            <View style={styles.center}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <VoiceButton onPress={() => undefined} size={104} />
              </Animated.View>
              <Text style={styles.listeningText}>{t('voice.listening')}</Text>
              <Text style={styles.hint}>{t('voice.listeningHint')}</Text>
              <GhostButton title={t('voice.typeInstead')} onPress={() => setStage('typing')} />
            </View>
          )}

          {stage === 'typing' && (
            <View>
              <TextInput
                style={styles.typed}
                value={typed}
                onChangeText={setTyped}
                placeholder={t('voice.typePlaceholder')}
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              <PrimaryButton title={t('common.save')} onPress={handleSave} style={styles.cta} />
              <GhostButton title={t('voice.speakAgain')} onPress={handleRetry} />
            </View>
          )}

          {stage === 'result' && (
            <View>
              <Card>
                <Text style={styles.smallLabel}>{t('voice.youSaid')}</Text>
                <Text style={styles.transcript}>{t('voice.transcript')}</Text>
              </Card>
              <View style={styles.miniRow}>
                <Card style={styles.miniCard} variant="success">
                  <Text style={styles.miniLabel}>{t('voice.income')}</Text>
                  <Text style={styles.miniValue}>{t('common.currency', { amount: formatInr(voiceIncome) })}</Text>
                </Card>
                <Card style={styles.miniCard} variant="warning">
                  <Text style={styles.miniLabel}>{t('voice.expense')}</Text>
                  <Text style={[styles.miniValue, { color: Colors.danger }]}>
                    {t('common.currency', { amount: formatInr(voiceExpense) })}
                  </Text>
                </Card>
              </View>
              <Text style={styles.hint}>{t('voice.category')}</Text>
              <PrimaryButton
                title={t('common.save')}
                onPress={handleSave}
                icon={<Ionicons name="checkmark-circle" size={22} color={Colors.white} />}
                style={styles.cta}
              />
              <GhostButton
                title={t('common.retry')}
                onPress={handleRetry}
                icon={<Ionicons name="refresh" size={20} color={Colors.primary} />}
              />
            </View>
          )}

          {stage === 'saved' && (
            <View style={styles.center}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
              </View>
              <Text style={styles.listeningText}>{t('voice.savedTitle')}</Text>
              <Text style={styles.hint}>
                {t('voice.savedSub', {
                  income: formatInr(voiceIncome),
                  expense: formatInr(voiceExpense),
                })}
              </Text>
              <PrimaryButton title={t('common.close')} onPress={handleClose} style={styles.cta} />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.glass,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.sm,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.headingLineHeight,
    flex: 1,
  },
  closeHit: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  listeningText: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    textAlign: 'center',
    lineHeight: Typography.headingLineHeight,
  },
  hint: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
    lineHeight: Typography.bodyLineHeight,
  },
  smallLabel: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.sm,
  },
  transcript: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.cardTitleLineHeight,
  },
  miniRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  miniCard: {
    flex: 1,
  },
  miniLabel: {
    fontSize: Typography.secondary,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
  },
  miniValue: {
    fontSize: Typography.heading,
    fontWeight: Typography.extraBold,
    fontFamily: Typography.fontFamily,
    color: Colors.success,
    marginTop: 4,
  },
  cta: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typed: {
    minHeight: 96,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    fontSize: Typography.body,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
    lineHeight: Typography.bodyLineHeight,
    marginBottom: Spacing.lg,
    textAlignVertical: 'top',
  },
});
