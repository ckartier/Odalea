export const COLORS = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceSecondary: '#F7F7F4',
  primary: '#000000',
  primaryDark: '#000000',
  primaryLight: '#333333',
  primarySoft: 'rgba(0, 0, 0, 0.08)',
  onboardingBlue: '#63B3FF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  danger: '#DC2626',
  success: '#10B981',
  warning: '#F59E0B',
  overlay: 'rgba(15, 23, 42, 0.5)',
  cardBorder: '#F1F5F9',
} as const;

export const RADIUS = {
  card: 24,
  floatingBar: 28,
  button: 16,
  input: 16,
  pill: 999,
  small: 12,
} as const;

export const TYPOGRAPHY = {
  hero: {
    fontSize: 40,
    fontWeight: '700' as const,
    lineHeight: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 30,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 19,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  button: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  floatingBar: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const TOUCH_TARGET = 48;

export const ANIMATION = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 450,
  },
} as const;
