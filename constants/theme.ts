/**
 * Setu design system — colors, spacing, type, shadows.
 */

import { Platform } from 'react-native';

export const Colors = {
  primary: '#0F766E',
  primarySoft: '#CCFBF1',
  primaryDark: '#115E59',
  primaryLight: '#CCFBF1',

  accent: '#F59E0B',
  accentSoft: '#FEF3C7',
  accentLight: '#FEF3C7',

  background: '#FAF7F2',
  page: '#EFE8DC',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF8EC',
  card: '#FFFFFF',

  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  text: '#1F2937',
  textTertiary: '#6B7280',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#1F2937',

  success: '#16A34A',
  successSoft: '#DCFCE7',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  dangerLight: '#FEE2E2',
  health: '#2563EB',
  healthSoft: '#DBEAFE',
  healthLight: '#DBEAFE',

  border: '#E5E7EB',
  cardBorder: '#E5E7EB',
  divider: '#E5E7EB',
  shadow: 'rgba(15, 23, 42, 0.08)',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15, 23, 42, 0.42)',
  glass: 'rgba(255, 255, 255, 0.82)',
};

export const Layout = {
  appMaxWidth: 480,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  screenPadding: 16,
  cardPadding: 16,
  cardPaddingLarge: 20,
  cardGap: 14,
  sectionGap: 24,
};

export const BorderRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  full: 999,
};

export const FontFamily = Platform.select({
  web: '"Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", system-ui, sans-serif',
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const Typography = {
  fontFamily: FontFamily,

  caption: 12,
  secondary: 14,
  body: 16,
  bodyLarge: 18,
  cardTitle: 18,
  heading: 22,
  headingLarge: 28,
  incomeSmall: 32,
  income: 44,
  incomeLarge: 52,

  captionLineHeight: 18,
  secondaryLineHeight: 22,
  bodyLineHeight: 24,
  cardTitleLineHeight: 28,
  headingLineHeight: 34,
  incomeLineHeight: 60,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const Shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLifted: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 7,
  },
  button: {
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  clay: {
    shadowColor: '#115E59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const ButtonSizes = {
  primaryHeight: 56,
  secondaryHeight: 50,
  minTouchTarget: 48,
};

export const ColorTokenMap = {
  warning: Colors.warning,
  accent: Colors.accent,
  health: Colors.health,
  primary: Colors.primary,
  danger: Colors.danger,
  textSecondary: Colors.textSecondary,
} as const;
