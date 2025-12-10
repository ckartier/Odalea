import {
  RESPONSIVE_SPACING,
  RESPONSIVE_FONT_SIZES,
  RESPONSIVE_COMPONENT_SIZES,
  RESPONSIVE_LAYOUT,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  getSafeAreaInsets,
  scale,
} from './responsive';

export const COLORS = {
  primary: '#000000',
  primaryDark: '#1F2937',
  primaryLight: '#6B7280',
  secondary: '#EC4899',
  secondaryDark: '#DB2777',
  secondaryLight: '#F9A8D4',
  accent: '#1EAAD6',
  accentDark: '#1583A2',
  accentLight: '#7DD4EE',
  
  male: '#A3D5FF',
  female: '#FFB3D9',
  default: '#06B6D4',
  maleAccent: '#6BB6FF',
  femaleAccent: '#FF8AC9',
  
  white: '#FFFFFF',
  black: '#0F172A',
  gray: '#64748B',
  lightGray: '#F8FAFC',
  mediumGray: '#E2E8F0',
  darkGray: '#475569',
  
  darkBackground: '#0F172A',
  darkCard: '#1E293B',
  darkBorder: '#334155',
  darkText: '#F1F5F9',
  
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  emergency: '#DC2626',
  lost: '#EF4444',
  found: '#059669',
  available: '#10B981',
  busy: '#F59E0B',
  premium: '#000000',
  catSitter: '#EC4899',
  
  transparent: 'transparent',
  shadow: 'rgba(15, 23, 42, 0.08)',
  shadowMedium: 'rgba(15, 23, 42, 0.12)',
  shadowStrong: 'rgba(15, 23, 42, 0.16)',
  overlay: 'rgba(15, 23, 42, 0.6)',
  overlayLight: 'rgba(15, 23, 42, 0.4)',
  cardBackground: '#FFFFFF',
  screenBackground: '#F8FAFC',
  surfaceBackground: '#F1F5F9',
  neutral: '#E2E8F0',
  border: '#CBD5E1',
  borderLight: '#E2E8F0',
  
  mapPet: '#7DD4EE',
  mapSitter: '#F0A5C9',
  mapVet: '#28A745',
  mapShop: '#FFC107',
  mapLost: '#FF6B6B',
  mapFound: '#4ECDC4',
  
  menuBackground: 'rgba(255, 255, 255, 0.95)',
  menuShadow: 'rgba(0, 0, 0, 0.15)',
  
  alertBackground: '#F8FAFC',

  liquidGlassMale: 'rgba(163, 213, 255, 0.25)',
  liquidGlassFemale: 'rgba(255, 179, 217, 0.25)',
  liquidGlassNeutral: 'rgba(255, 255, 255, 0.25)',
  liquidGlassBorder: 'rgba(255, 255, 255, 0.4)',
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 1,
    shadowRadius: scale(2),
    elevation: 1,
  },
  small: {
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 1,
    shadowRadius: scale(8),
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.shadowStrong,
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 1,
    shadowRadius: scale(16),
    elevation: 8,
  },
  xl: {
    shadowColor: COLORS.shadowStrong,
    shadowOffset: { width: 0, height: scale(12) },
    shadowOpacity: 1,
    shadowRadius: scale(24),
    elevation: 12,
  },
  liquidGlass: {
    shadowColor: 'rgba(163, 213, 255, 0.5)',
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 6,
  },
};

export const GRADIENTS = {
  primary: ['#000000', '#1F2937'] as const,
  secondary: ['#EC4899', '#F97316'] as const,
  accent: ['#06B6D4', '#3B82F6'] as const,
  success: ['#10B981', '#059669'] as const,
  premium: ['#000000', '#374151'] as const,
  sunset: ['#F59E0B', '#EF4444'] as const,
  ocean: ['#06B6D4', '#0891B2'] as const,
  forest: ['#059669', '#047857'] as const,
  liquidMale: ['#A3D5FF', '#6BB6FF'] as const,
  liquidFemale: ['#FFB3D9', '#FF8AC9'] as const,
  liquidNeutral: ['#E0F2FE', '#BAE6FD'] as const,
  onboarding: ['#E8B4D4', '#C8A2C8', '#A8B4D8'] as const,
  appBackground: ['#E8B4D4', '#C8A2C8', '#A8B4D8'] as const,
};

export const DIMENSIONS = {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  
  ...getSafeAreaInsets(),
  
  SPACING: RESPONSIVE_SPACING,
  
  COMPONENT_SIZES: RESPONSIVE_COMPONENT_SIZES,
  
  FONT_SIZES: RESPONSIVE_FONT_SIZES,
};

export {
  RESPONSIVE_SPACING,
  RESPONSIVE_FONT_SIZES,
  RESPONSIVE_COMPONENT_SIZES,
  RESPONSIVE_LAYOUT,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  IS_SMALL_DEVICE,
  IS_TABLET,
  scale,
  moderateScale,
  getResponsiveValue,
  createResponsiveStyle,
} from './responsive';
