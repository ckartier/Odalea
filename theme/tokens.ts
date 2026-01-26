// Odalea 2026 Design System
// Noir & Blanc premium design tokens

export const COLORS = {
  // Core
  primary: '#000000',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#FAFAFA',
  
  // Text hierarchy
  textPrimary: '#0B0B0B',
  textSecondary: '#5C5C5C',
  textTertiary: '#8A8A8A',
  textInverse: '#FFFFFF',
  
  // UI Elements
  divider: '#EAEAEA',
  border: '#EAEAEA',
  cardBorder: '#EAEAEA',
  
  // Badge & Notifications
  badge: '#FF3B30',
  badgeText: '#FFFFFF',
  
  // Semantic (minimal use)
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.25)',
  overlayDark: 'rgba(0, 0, 0, 0.5)',
  
  // States
  pressed: 'rgba(0, 0, 0, 0.05)',
  disabled: '#C7C7C7',
  disabledText: '#A0A0A0',
  
  // Legacy support
  primaryDark: '#000000',
  primaryLight: '#333333',
  primarySoft: 'rgba(0, 0, 0, 0.08)',
  onboardingBlue: '#63B3FF',
} as const;

export const TYPOGRAPHY = {
  // Title XL - 34 / semibold
  titleXL: {
    fontSize: 34,
    fontWeight: '600' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  // Title L - 28 / semibold
  titleL: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  // Title M - 22 / semibold
  titleM: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  // Body - 17 / regular
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  // Body Semibold - 17 / semibold
  bodySemibold: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  // Caption - 13 / regular
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  // Caption Semibold - 13 / semibold
  captionSemibold: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  // Button text
  button: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  // Small - 15 / regular
  small: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  // Small Semibold - 15 / semibold
  smallSemibold: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  // Legacy aliases
  hero: {
    fontSize: 34,
    fontWeight: '600' as const,
    lineHeight: 41,
  },
  title: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  bodyLarge: {
    fontSize: 19,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
} as const;

// 4pt spacing system
export const SPACING = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  // Legacy aliases
  sm: 8,
  md: 16,
  lg: 24,
  xxl: 48,
} as const;

export const RADIUS = {
  // Standard radii
  small: 16,
  card: 24,
  button: 24,
  modal: 28,
  floatingBar: 32,
  pill: 999,
  // Legacy aliases
  input: 16,
} as const;

export const SHADOWS = {
  // Card shadow - soft
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  // Modal shadow - medium
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  // Floating bar shadow
  floatingBar: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  // Soft shadow for subtle elevation
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  // None
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export const COMPONENT_SIZES = {
  // Buttons
  buttonHeight: 52,
  buttonHeightSmall: 44,
  
  // Cards
  petCardWidth: 220,
  petCardImageRatio: 1.2,
  actionCardHeight: 80,
  
  // Tab bar
  tabBarHeight: 76,
  tabBarWidth: '90%' as const,
  tabBarIconSize: 24,
  
  // Icons
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
  iconXL: 28,
  
  // Avatar
  avatarSmall: 32,
  avatarMedium: 44,
  avatarLarge: 56,
  avatarXL: 72,
  
  // Touch targets
  touchTarget: 44,
  
  // Modal
  modalWidth: '90%' as const,
} as const;

export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 220,
    slow: 280,
    modal: 250,
  },
  easing: {
    default: 'ease-out',
    spring: 'ease-in-out',
  },
} as const;

export const TOUCH_TARGET = 44;

// Type exports
export type Colors = typeof COLORS;
export type Typography = typeof TYPOGRAPHY;
export type Spacing = typeof SPACING;
export type Radius = typeof RADIUS;
export type Shadows = typeof SHADOWS;
