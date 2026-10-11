import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography } from '../constants/theme';

interface ProgressRingProps {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}

export default function ProgressRing({
  progress,
  size = 88,
  stroke = 9,
  color = Colors.accent,
  label,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.accentSoft}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - clamped)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{label ?? `${Math.round(clamped * 100)}%`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: Typography.cardTitle,
    fontWeight: Typography.bold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
  },
});
