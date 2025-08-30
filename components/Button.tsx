import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, DIMENSIONS, IS_SMALL_DEVICE, moderateScale } from '@/constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'subtle' | 'ghost' | 'outline';
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  gradient?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  gradient = true,
  fullWidth = false,
  ...props
}) => {
  const getBorderRadius = () => {
    switch (size) {
      case 'xs':
        return moderateScale(8);
      case 'small':
        return moderateScale(10);
      case 'large':
        return moderateScale(16);
      case 'xl':
        return moderateScale(20);
      default:
        return moderateScale(12);
    }
  };

  const getShadow = () => {
    if (variant === 'ghost') return SHADOWS.none;
    if (disabled) return SHADOWS.none;
    switch (size) {
      case 'xs':
      case 'small':
        return SHADOWS.xs;
      case 'large':
      case 'xl':
        return SHADOWS.medium;
      default:
        return SHADOWS.small;
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return COLORS.mediumGray;
    if (gradient) return COLORS.transparent;
    switch (variant) {
      case 'primary':
        return 'rgba(255,255,255,0.08)';
      case 'subtle':
        return 'rgba(255,255,255,0.08)';
      case 'ghost':
        return 'transparent';
      case 'outline':
        return 'transparent';
      default:
        return '#1EAAD6';
    }
  };

  const getBorderColor = () => {
    if (disabled) return COLORS.mediumGray;
    switch (variant) {
      case 'subtle':
        return 'rgba(255,255,255,0.12)';
      case 'ghost':
        return 'rgba(255,255,255,0.22)';
      case 'outline':
        return 'rgba(255,255,255,0.45)';
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.gray;
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'subtle':
        return COLORS.white;
      case 'ghost':
        return COLORS.white;
      default:
        return '#FFFFFF';
    }
  };

  const getPadding = () => {
    const basePadding = {
      xs: { vertical: 3, horizontal: 6 },
      small: { vertical: 4, horizontal: 8 },
      medium: { vertical: 6, horizontal: 12 },
      large: { vertical: 8, horizontal: 16 },
      xl: { vertical: 10, horizontal: 20 },
    } as const;
    const padding = basePadding[size] || basePadding.medium;
    return {
      paddingVertical: moderateScale(padding.vertical),
      paddingHorizontal: moderateScale(padding.horizontal),
    };
  };

  const getFontSize = () => {
    switch (size) {
      case 'xs':
        return DIMENSIONS.FONT_SIZES.xs;
      case 'small':
        return DIMENSIONS.FONT_SIZES.sm;
      case 'large':
        return DIMENSIONS.FONT_SIZES.lg;
      case 'xl':
        return DIMENSIONS.FONT_SIZES.xl;
      default:
        return DIMENSIONS.FONT_SIZES.md;
    }
  };

  const innerButtonStyles = [
    styles.button,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      borderWidth: 1,
      borderRadius: getBorderRadius(),
      ...getPadding(),
      width: fullWidth ? '100%' : undefined,
      minHeight: 44,
    },
    getShadow(),
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: getTextColor(),
      fontSize: getFontSize(),
    },
    textStyle,
  ];

  const ButtonContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconContainer}>{icon as React.ReactNode}</View>}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconContainer}>{icon as React.ReactNode}</View>}
        </>
      )}
    </>
  );

  const content = (
    <TouchableOpacity
      testID="button"
      accessibilityRole="button"
      style={innerButtonStyles}
      onPress={onPress || (() => {})}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <ButtonContent />
    </TouchableOpacity>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={["#a3e5fa", "#f7b6d6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: getBorderRadius() }}
      >
        <View style={[styles.borderPad, { borderRadius: getBorderRadius() }]}>{content}</View>
      </LinearGradient>
    );
  }

  return <View style={[styles.borderPad, { borderRadius: getBorderRadius() }]}>{content}</View>;
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(6),
    minHeight: IS_SMALL_DEVICE
      ? DIMENSIONS.COMPONENT_SIZES.BUTTON_HEIGHT * 0.85
      : DIMENSIONS.COMPONENT_SIZES.BUTTON_HEIGHT,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  borderPad: {
    padding: 2,
  },
  text: {
    fontWeight: '600' as const,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Button;