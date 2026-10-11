import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/theme';

interface VoiceButtonProps {
  onPress: () => void;
  size?: number;
}

export default function VoiceButton({ onPress, size = 64 }: VoiceButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.ring, { width: size + 12, height: size + 12, borderRadius: (size + 12) / 2 }]} />
      <Ionicons name="mic" size={size * 0.45} color={Colors.white} />
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
    borderColor: Colors.accent + '30',
  },
});
