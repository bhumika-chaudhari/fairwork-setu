/**
 * Setu Design System
 * All colors, spacing, typography, and shadow tokens.
 */

export const Colors = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  primaryLight: '#CCFBF1',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',

  background: '#FAF7F2',
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',

  text: '#1F2937',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#1F2937',

  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  health: '#2563EB',
  healthLight: '#DBEAFE',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  divider: '#E5E7EB',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const Typography = {
  // Font sizes
  caption: 12,
  body: 16,
  bodyLarge: 17,
  cardTitle: 18,
  heading: 22,
  headingLarge: 26,
  incomeSmall: 28,
  income: 36,
  incomeLarge: 48,

  // Line heights
  captionLineHeight: 18,
  bodyLineHeight: 24,
  cardTitleLineHeight: 26,
  headingLineHeight: 32,
  incomeLineHeight: 56,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLifted: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const ButtonSizes = {
  primaryHeight: 54,
  minTouchTarget: 48,
};
