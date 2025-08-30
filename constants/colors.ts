// Import responsive system
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
  // 2025 Brand Colors - Modern Black System
  primary: '#000000', // Black - Modern & Professional
  primaryDark: '#1F2937',
  primaryLight: '#6B7280',
  secondary: '#EC4899', // Pink - Vibrant & Friendly
  secondaryDark: '#DB2777',
  secondaryLight: '#F9A8D4',
  accent: '#1EAAD6', // Updated accent per spec
  accentDark: '#1583A2',
  accentLight: '#7DD4EE',
  
  // Gender-based themes (updated for 2025)
  male: '#3B82F6', // Blue for males
  female: '#EC4899',
  default: '#06B6D4',
  maleAccent: '#1E40AF', // Darker blue accent
  femaleAccent: '#DB2777',
  
  // Core colors - 2025 Neutral Palette
  white: '#FFFFFF',
  black: '#0F172A', // Slate-900 - Deeper, more sophisticated
  gray: '#64748B', // Slate-500
  lightGray: '#F8FAFC', // Slate-50
  mediumGray: '#E2E8F0', // Slate-200
  darkGray: '#475569', // Slate-600
  
  // Status colors - 2025 Semantic Colors
  success: '#10B981', // Emerald-500
  successLight: '#D1FAE5', // Emerald-100
  error: '#EF4444', // Red-500
  errorLight: '#FEE2E2', // Red-100
  warning: '#F59E0B', // Amber-500
  warningLight: '#FEF3C7', // Amber-100
  info: '#3B82F6', // Blue-500
  infoLight: '#DBEAFE', // Blue-100
  
  // Special colors - 2025 Feature Colors
  emergency: '#DC2626', // Red-600
  lost: '#EF4444', // Red-500
  found: '#059669', // Emerald-600
  available: '#10B981', // Emerald-500
  busy: '#F59E0B', // Amber-500
  premium: '#000000', // Black - More premium feel
  catSitter: '#EC4899', // Pink-500
  
  // Utility colors - 2025 System Colors
  transparent: 'transparent',
  shadow: 'rgba(15, 23, 42, 0.08)', // Slate-900 with opacity
  shadowMedium: 'rgba(15, 23, 42, 0.12)',
  shadowStrong: 'rgba(15, 23, 42, 0.16)',
  overlay: 'rgba(15, 23, 42, 0.6)',
  overlayLight: 'rgba(15, 23, 42, 0.4)',
  cardBackground: '#FFFFFF',
  screenBackground: '#F8FAFC', // Slate-50
  surfaceBackground: '#F1F5F9', // Slate-100
  neutral: '#E2E8F0', // Slate-200
  border: '#CBD5E1', // Slate-300
  borderLight: '#E2E8F0', // Slate-200
  
  // Map colors
  mapPet: '#7DD4EE',
  mapSitter: '#F0A5C9',
  mapVet: '#28A745',
  mapShop: '#FFC107',
  mapLost: '#FF6B6B',
  mapFound: '#4ECDC4',
  
  // Floating menu colors
  menuBackground: 'rgba(255, 255, 255, 0.95)',
  menuShadow: 'rgba(0, 0, 0, 0.15)',
};

// 2025 Shadow System - Layered & Sophisticated
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
};

// 2025 Gradient System
export const GRADIENTS = {
  primary: ['#000000', '#1F2937'] as const, // Black to Gray
  secondary: ['#EC4899', '#F97316'] as const, // Pink to Orange
  accent: ['#06B6D4', '#3B82F6'] as const, // Cyan to Blue
  success: ['#10B981', '#059669'] as const, // Emerald gradient
  premium: ['#000000', '#374151'] as const, // Black to Dark Gray
  sunset: ['#F59E0B', '#EF4444'] as const, // Amber to Red
  ocean: ['#06B6D4', '#0891B2'] as const, // Cyan gradient
  forest: ['#059669', '#047857'] as const, // Emerald gradient
};

// Responsive dimensions that adapt to all screen sizes
export const DIMENSIONS = {
  // Current screen dimensions
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  
  // Responsive safe area insets
  ...getSafeAreaInsets(),
  
  // Responsive spacing system
  SPACING: RESPONSIVE_SPACING,
  
  // Responsive component sizes
  COMPONENT_SIZES: RESPONSIVE_COMPONENT_SIZES,
  
  // Responsive typography sizes
  FONT_SIZES: RESPONSIVE_FONT_SIZES,
};

// Export responsive utilities for easy access
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