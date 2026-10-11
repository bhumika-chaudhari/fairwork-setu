import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import Card from './Card';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface VoiceEntryModalProps {
  visible: boolean;
  onClose: () => void;
}

type Stage = 'listening' | 'result' | 'saved';

export default function VoiceEntryModal({ visible, onClose }: VoiceEntryModalProps) {
  const [stage, setStage] = useState<Stage>('listening');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setStage('listening');
      // Simulate listening → result after 2 seconds
      const timer = setTimeout(() => setStage('result'), 2000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    if (stage === 'listening') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [stage]);

  const handleSave = () => {
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
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>बोलकर जोड़ें</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Listening State */}
          {stage === 'listening' && (
            <View style={styles.listeningContainer}>
              <Animated.View style={[styles.micCircleOuter, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.micCircle}>
                  <Ionicons name="mic" size={48} color={Colors.white} />
                </View>
              </Animated.View>
              <Text style={styles.listeningText}>सुन रहे हैं...</Text>
              <Text style={styles.listeningHint}>अपनी कमाई या खर्चा बोलें</Text>
              <View style={styles.dotsRow}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.dot, { opacity: 0.3 + (i * 0.3) }]} />
                ))}
              </View>
            </View>
          )}

          {/* Result State */}
          {stage === 'result' && (
            <View style={styles.resultContainer}>
              <Card style={styles.transcriptCard}>
                <View style={styles.transcriptHeader}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} />
                  <Text style={styles.transcriptLabel}>आपने कहा:</Text>
                </View>
                <Text style={styles.transcriptText}>
                  "आज 800 रुपये कमाए, 150 पेट्रोल में गए।"
                </Text>
              </Card>

              <Card variant="accent" style={styles.extractedCard}>
                <Text style={styles.extractedTitle}>समझा गया:</Text>
                <View style={styles.extractedRow}>
                  <View style={styles.extractedItem}>
                    <Ionicons name="arrow-down-circle" size={24} color={Colors.success} />
                    <Text style={styles.extractedLabel}>कमाई</Text>
                    <Text style={styles.extractedAmount}>₹800</Text>
                  </View>
                  <View style={styles.extractedDivider} />
                  <View style={styles.extractedItem}>
                    <Ionicons name="arrow-up-circle" size={24} color={Colors.danger} />
                    <Text style={styles.extractedLabel}>खर्चा</Text>
                    <Text style={[styles.extractedAmount, { color: Colors.danger }]}>₹150</Text>
                  </View>
                </View>
                <View style={styles.categoryRow}>
                  <Ionicons name="pricetag-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.categoryText}>श्रेणी: यात्रा/ईंधन</Text>
                </View>
              </Card>

              <View style={styles.buttonRow}>
                <PrimaryButton
                  title="सहेजें"
                  onPress={handleSave}
                  icon={<Ionicons name="checkmark-circle" size={22} color={Colors.white} />}
                  style={styles.saveButton}
                />
                <PrimaryButton
                  title="फिर से बोलें"
                  onPress={handleRetry}
                  variant="outline"
                  icon={<Ionicons name="refresh" size={20} color={Colors.primary} />}
                  style={styles.retryButton}
                />
              </View>
            </View>
          )}

          {/* Saved State */}
          {stage === 'saved' && (
            <View style={styles.savedContainer}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
              </View>
              <Text style={styles.savedTitle}>आज की एंट्री सहेज ली गई ✅</Text>
              <Text style={styles.savedSubtext}>कमाई ₹800 · खर्चा ₹150</Text>
              <PrimaryButton
                title="बंद करें"
                onPress={handleClose}
                style={{ marginTop: Spacing.xxl }}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 56,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    justifyContent: 'center',
  },

  // Listening
  listeningContainer: {
    alignItems: 'center',
  },
  micCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  micCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningText: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  listeningHint: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },

  // Result
  resultContainer: {
    flex: 1,
    paddingTop: Spacing.xxl,
  },
  transcriptCard: {
    marginBottom: Spacing.lg,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  transcriptText: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.medium,
    color: Colors.text,
    lineHeight: Typography.cardTitleLineHeight + 4,
    fontStyle: 'italic',
  },
  extractedCard: {
    marginBottom: Spacing.xxl,
  },
  extractedTitle: {
    fontSize: 14,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  extractedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  extractedItem: {
    flex: 1,
    alignItems: 'center',
  },
  extractedLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  extractedAmount: {
    fontSize: 28,
    fontWeight: Typography.extraBold,
    color: Colors.success,
  },
  extractedDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.divider,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    fontWeight: Typography.medium,
  },
  buttonRow: {
    gap: Spacing.md,
  },
  saveButton: {
    flex: 0,
  },
  retryButton: {
    flex: 0,
  },

  // Saved
  savedContainer: {
    alignItems: 'center',
  },
  successCircle: {
    marginBottom: Spacing.xl,
  },
  savedTitle: {
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  savedSubtext: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
});
