import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, ButtonSizes } from '../constants/theme';

interface VoiceButtonProps {
  onPress: () => void;
  size?: number;
}

export default function VoiceButton({ onPress, size = 64 }: VoiceButtonProps) {
  const dimension = Math.max(size, ButtonSizes.minTouchTarget);
  return (
    <TouchableOpacity
      style={[styles.button, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.ring,
          {
            width: dimension + 16,
            height: dimension + 16,
            borderRadius: (dimension + 16) / 2,
          },
        ]}
      />
      <Ionicons name="mic" size={dimension * 0.45} color={Colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.cardLifted,
    shadowColor: Colors.accent,
    zIndex: 10,
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: Colors.accentLight,
  },
});
