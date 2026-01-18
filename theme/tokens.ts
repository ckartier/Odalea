export const COLORS = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceSecondary: '#F7F7F4',
  primary: '#0B2A3C',
  primarySoft: 'rgba(11, 42, 60, 0.08)',
  onboardingBlue: '#63B3FF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  danger: '#DC2626',
  success: '#10B981',
  warning: '#F59E0B',
  overlay: 'rgba(15, 23, 42, 0.5)',
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
  title: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  button: {
    fontSize: 16,
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

export const TOUCH_TARGET = 44;

export const ANIMATION = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 450,
  },
} as const;
