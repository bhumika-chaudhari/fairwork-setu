import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, Typography } from '../constants/theme';

export default function StabilityGauge({ score }: { score: number }) {
  const { t } = useTranslation();
  const size = 86;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score / 100, 0), 1);

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Colors.accentSoft} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.accent}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={circ * (1 - progress)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.of}>{t('dhan.of100')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: Spacing.lg,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: 22,
    fontWeight: Typography.extraBold,
    fontFamily: Typography.fontFamily,
    color: Colors.textPrimary,
  },
  of: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily,
  },
});
