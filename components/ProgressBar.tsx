import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
}

export default function ProgressBar({
  progress,
  color = Colors.success,
  trackColor = Colors.successLight,
  height = 10,
}: ProgressBarProps) {
  const width = `${Math.min(Math.max(progress, 0), 1) * 100}%` as `${number}%`;
  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: BorderRadius.full }]}>
      <View style={[styles.fill, { width, backgroundColor: color, borderRadius: BorderRadius.full }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});
