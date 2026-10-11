import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Rect } from 'react-native-svg';
import { Colors, Spacing, Typography } from '../constants/theme';
import type { DailyIncome } from '../data/mockData';
import { formatInr } from '../src/localization';

interface IncomeChartProps {
  days: DailyIncome[];
}

export default function IncomeChart({ days }: IncomeChartProps) {
  const { t } = useTranslation();
  const max = Math.max(...days.map((d) => d.amount), 1);

  return (
    <View style={styles.row}>
      {days.map((day, i) => {
        const h = day.amount > 0 ? Math.max((day.amount / max) * 110, 8) : 6;
        const active = i === days.length - 2;
        return (
          <View key={day.date} style={styles.col}>
            <Text style={styles.amt}>{day.amount > 0 ? formatInr(day.amount) : t('dhan.dash')}</Text>
            <Svg width={22} height={118}>
              <Rect x={4} y={118 - h} width={14} height={h} rx={7} fill={active ? Colors.accent : day.amount ? Colors.primary : Colors.border} />
            </Svg>
            <Text style={[styles.day, active && styles.dayActive]}>{t(day.dayKey)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  amt: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.xs,
  },
  day: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    fontWeight: Typography.medium,
    marginTop: Spacing.sm,
    lineHeight: Typography.captionLineHeight,
  },
  dayActive: {
    color: Colors.accent,
    fontWeight: Typography.bold,
  },
});
