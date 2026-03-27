import { Dimensions, Platform } from 'react-native';
import React from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints for different screen sizes
export const BREAKPOINTS = {
  xs: 320,   // Small phones
  sm: 375,   // iPhone SE, iPhone 12 mini
  md: 414,   // iPhone 11, iPhone 12/13/14
  lg: 428,   // iPhone 12/13/14/15/16 Pro Max
  xl: 768,   // iPad mini, small tablets
  xxl: 1024, // iPad, large tablets
  xxxl: 1366, // iPad Pro, desktop
} as const;

// Device type detection
export const getDeviceType = () => {
  if (SCREEN_WIDTH < BREAKPOINTS.sm) return 'xs';
  if (SCREEN_WIDTH < BREAKPOINTS.md) return 'sm';
  if (SCREEN_WIDTH < BREAKPOINTS.lg) return 'md';
  if (SCREEN_WIDTH < BREAKPOINTS.xl) return 'lg';
  if (SCREEN_WIDTH < BREAKPOINTS.xxl) return 'xl';
  if (SCREEN_WIDTH < BREAKPOINTS.xxxl) return 'xxl';
  return 'xxxl';
};

export const DEVICE_TYPE = getDeviceType();
export const IS_SMALL_DEVICE = DEVICE_TYPE === 'xs' || DEVICE_TYPE === 'sm';
export const IS_LARGE_DEVICE = DEVICE_TYPE === 'xl' || DEVICE_TYPE === 'xxl' || DEVICE_TYPE === 'xxxl';
export const IS_TABLET = DEVICE_TYPE === 'xl' || DEVICE_TYPE === 'xxl' || DEVICE_TYPE === 'xxxl';

// Responsive scaling functions
export const scale = (size: number): number => {
  const baseWidth = 375; // iPhone SE width as base
  return Math.round((SCREEN_WIDTH / baseWidth) * size);
};

export const verticalScale = (size: number): number => {
  const baseHeight = 667; // iPhone SE height as base
  return Math.round((SCREEN_HEIGHT / baseHeight) * size);
};

export const moderateScale = (size: number, factor: number = 0.5): number => {
  return Math.round(size + (scale(size) - size) * factor);
};

// Optimized responsive spacing system - Pre-calculated for better performance
const createResponsiveSpacing = () => {
  const baseSpacing = {
    xs: 3,
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
    xxl: 36,
  };

  const multiplier = IS_SMALL_DEVICE ? 0.75 : IS_TABLET ? 1.2 : 1;
  
  return {
    xs: scale(baseSpacing.xs * multiplier),
    sm: scale(baseSpacing.sm * multiplier),
    md: scale(baseSpacing.md * multiplier),
    lg: scale(baseSpacing.lg * multiplier),
    xl: scale(baseSpacing.xl * multiplier),
    xxl: scale(baseSpacing.xxl * multiplier),
  };
};

export const getResponsiveSpacing = createResponsiveSpacing;

// Optimized responsive font sizes - Pre-calculated for better performance
const createResponsiveFontSizes = () => {
  const baseFontSizes = {
    xs: 8,
    sm: 10,
    md: 12,
    lg: 14,
    xl: 16,
    xxl: 18,
    xxxl: 20,
    title: 22,
  };

  const multiplier = IS_SMALL_DEVICE ? 0.8 : IS_TABLET ? 1.1 : 1;
  
  return {
    xs: moderateScale(baseFontSizes.xs * multiplier),
    sm: moderateScale(baseFontSizes.sm * multiplier),
    md: moderateScale(baseFontSizes.md * multiplier),
    lg: moderateScale(baseFontSizes.lg * multiplier),
    xl: moderateScale(baseFontSizes.xl * multiplier),
    xxl: moderateScale(baseFontSizes.xxl * multiplier),
    xxxl: moderateScale(baseFontSizes.xxxl * multiplier),
    title: moderateScale(baseFontSizes.title * multiplier),
  };
};

export const getResponsiveFontSizes = createResponsiveFontSizes;

// Optimized responsive component sizes - Pre-calculated for better performance
const createResponsiveComponentSizes = () => {
  const baseComponentSizes = {
    HEADER_HEIGHT: 70,
    TAB_BAR_HEIGHT: 65,
    FLOATING_MENU_WIDTH: 280,
    CARD_MIN_HEIGHT: 90,
    BUTTON_HEIGHT: 38,
    INPUT_HEIGHT: 38,
    AVATAR_SMALL: 24,
    AVATAR_MEDIUM: 36,
    AVATAR_LARGE: 56,
    ICON_SMALL: 14,
    ICON_MEDIUM: 18,
    ICON_LARGE: 22,
  };

  if (IS_SMALL_DEVICE) {
    const multiplier = 0.8;
    return {
      HEADER_HEIGHT: scale(baseComponentSizes.HEADER_HEIGHT * multiplier),
      TAB_BAR_HEIGHT: scale(baseComponentSizes.TAB_BAR_HEIGHT * multiplier),
      FLOATING_MENU_WIDTH: Math.min(scale(baseComponentSizes.FLOATING_MENU_WIDTH), SCREEN_WIDTH * 0.9),
      CARD_MIN_HEIGHT: scale(baseComponentSizes.CARD_MIN_HEIGHT * multiplier),
      BUTTON_HEIGHT: scale(baseComponentSizes.BUTTON_HEIGHT * multiplier),
      INPUT_HEIGHT: scale(baseComponentSizes.INPUT_HEIGHT * multiplier),
      AVATAR_SMALL: scale(baseComponentSizes.AVATAR_SMALL * multiplier),
      AVATAR_MEDIUM: scale(baseComponentSizes.AVATAR_MEDIUM * multiplier),
      AVATAR_LARGE: scale(baseComponentSizes.AVATAR_LARGE * multiplier),
      ICON_SMALL: scale(baseComponentSizes.ICON_SMALL * multiplier),
      ICON_MEDIUM: scale(baseComponentSizes.ICON_MEDIUM * multiplier),
      ICON_LARGE: scale(baseComponentSizes.ICON_LARGE * multiplier),
    };
  }

  if (IS_TABLET) {
    const multiplier = 1.2;
    const buttonMultiplier = 1.1; // Slightly smaller multiplier for buttons on tablets
    return {
      HEADER_HEIGHT: scale(baseComponentSizes.HEADER_HEIGHT * multiplier),
      TAB_BAR_HEIGHT: scale(baseComponentSizes.TAB_BAR_HEIGHT * multiplier),
      FLOATING_MENU_WIDTH: Math.min(scale(baseComponentSizes.FLOATING_MENU_WIDTH * multiplier), SCREEN_WIDTH * 0.4),
      CARD_MIN_HEIGHT: scale(baseComponentSizes.CARD_MIN_HEIGHT * multiplier),
      BUTTON_HEIGHT: scale(baseComponentSizes.BUTTON_HEIGHT * buttonMultiplier),
      INPUT_HEIGHT: scale(baseComponentSizes.INPUT_HEIGHT * buttonMultiplier),
      AVATAR_SMALL: scale(baseComponentSizes.AVATAR_SMALL * multiplier),
      AVATAR_MEDIUM: scale(baseComponentSizes.AVATAR_MEDIUM * multiplier),
      AVATAR_LARGE: scale(baseComponentSizes.AVATAR_LARGE * multiplier),
      ICON_SMALL: scale(baseComponentSizes.ICON_SMALL * multiplier),
      ICON_MEDIUM: scale(baseComponentSizes.ICON_MEDIUM * multiplier),
      ICON_LARGE: scale(baseComponentSizes.ICON_LARGE * multiplier),
    };
  }

  return {
    HEADER_HEIGHT: scale(baseComponentSizes.HEADER_HEIGHT),
    TAB_BAR_HEIGHT: scale(baseComponentSizes.TAB_BAR_HEIGHT),
    FLOATING_MENU_WIDTH: Math.min(scale(baseComponentSizes.FLOATING_MENU_WIDTH), SCREEN_WIDTH * 0.8),
    CARD_MIN_HEIGHT: scale(baseComponentSizes.CARD_MIN_HEIGHT),
    BUTTON_HEIGHT: scale(baseComponentSizes.BUTTON_HEIGHT),
    INPUT_HEIGHT: scale(baseComponentSizes.INPUT_HEIGHT),
    AVATAR_SMALL: scale(baseComponentSizes.AVATAR_SMALL),
    AVATAR_MEDIUM: scale(baseComponentSizes.AVATAR_MEDIUM),
    AVATAR_LARGE: scale(baseComponentSizes.AVATAR_LARGE),
    ICON_SMALL: scale(baseComponentSizes.ICON_SMALL),
    ICON_MEDIUM: scale(baseComponentSizes.ICON_MEDIUM),
    ICON_LARGE: scale(baseComponentSizes.ICON_LARGE),
  };
};

export const getResponsiveComponentSizes = createResponsiveComponentSizes;

// Layout helpers
export const getResponsiveLayout = () => {
  return {
    // Container padding based on screen size
    containerPadding: IS_SMALL_DEVICE ? scale(8) : IS_TABLET ? scale(20) : scale(12),
    
    // Card layout
    cardColumns: IS_TABLET ? 2 : 1,
    cardSpacing: IS_SMALL_DEVICE ? scale(8) : IS_TABLET ? scale(16) : scale(12),
    
    // Grid layout
    gridColumns: IS_SMALL_DEVICE ? 2 : IS_TABLET ? 4 : 3,
    
    // Modal sizing
    modalWidth: IS_TABLET ? SCREEN_WIDTH * 0.6 : SCREEN_WIDTH * 0.9,
    modalMaxWidth: IS_TABLET ? 600 : 400,
    
    // Content max width for readability
    contentMaxWidth: IS_TABLET ? 800 : SCREEN_WIDTH,
  };
};

// Pre-calculate and cache responsive values for better performance
export const RESPONSIVE_SPACING = createResponsiveSpacing();
export const RESPONSIVE_FONT_SIZES = createResponsiveFontSizes();
export const RESPONSIVE_COMPONENT_SIZES = createResponsiveComponentSizes();
export const RESPONSIVE_LAYOUT = getResponsiveLayout();

// Screen dimensions
export { SCREEN_WIDTH, SCREEN_HEIGHT };

// Platform-specific helpers
export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Safe area helpers for different devices
export const getSafeAreaInsets = () => {
  if (IS_SMALL_DEVICE) {
    return {
      top: isIOS ? 44 : 24,
      bottom: isIOS ? 20 : 0,
    };
  }
  
  if (IS_TABLET) {
    return {
      top: isIOS ? 24 : 24,
      bottom: isIOS ? 20 : 0,
    };
  }
  
  return {
    top: isIOS ? 59 : 24,
    bottom: isIOS ? 34 : 0,
  };
};

// Responsive hook for dynamic updates
export const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = React.useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
};

// Utility function to get responsive value based on screen size
export const getResponsiveValue = <T>(
  values: {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    xxl?: T;
    xxxl?: T;
  },
  fallback: T
): T => {
  const deviceType = getDeviceType();
  return values[deviceType] ?? fallback;
};

// Responsive style helper
export const createResponsiveStyle = <T extends Record<string, any>>(
  baseStyle: T,
  responsiveOverrides?: {
    xs?: Partial<T>;
    sm?: Partial<T>;
    md?: Partial<T>;
    lg?: Partial<T>;
    xl?: Partial<T>;
    xxl?: Partial<T>;
    xxxl?: Partial<T>;
  }
): T => {
  const deviceType = getDeviceType();
  const overrides = responsiveOverrides?.[deviceType] || {};
  return { ...baseStyle, ...overrides };
};