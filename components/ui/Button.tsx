import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS } from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  haptic?: boolean;
}

const getVariantStyles = (variant: ButtonVariant, disabled: boolean) => {
  const base = {
    container: {} as ViewStyle,
    text: {} as TextStyle,
  };

  if (disabled) {
    base.container = { backgroundColor: COLORS.lightGray, borderColor: COLORS.lightGray };
    base.text = { color: COLORS.textTertiary };
    return base;
  }

  switch (variant) {
    case 'primary':
      base.container = { backgroundColor: COLORS.primary };
      base.text = { color: COLORS.white };
      break;
    case 'secondary':
      base.container = { 
        backgroundColor: COLORS.white, 
        borderWidth: 1.5, 
        borderColor: COLORS.primary 
      };
      base.text = { color: COLORS.primary };
      break;
    case 'ghost':
      base.container = { backgroundColor: 'transparent' };
      base.text = { color: COLORS.primary };
      break;
    case 'danger':
      base.container = { backgroundColor: COLORS.error };
      base.text = { color: COLORS.white };
      break;
  }

  return base;
};

const getSizeStyles = (size: ButtonSize) => {
  switch (size) {
    case 'small':
      return {
        container: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
        text: { fontSize: 13 },
      };
    case 'large':
      return {
        container: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14 },
        text: { fontSize: 16 },
      };
    default:
      return {
        container: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
        text: { fontSize: 14 },
      };
  }
};

export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="secondary" />;
}

export function GhostButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="ghost" />;
}

export function DangerButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="danger" />;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  testID,
  haptic = true,
}: ButtonProps) {
  const variantStyles = getVariantStyles(variant, disabled || loading);
  const sizeStyles = getSizeStyles(size);

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;
    
    if (haptic && Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  }, [disabled, loading, haptic, onPress]);

  return (
    <TouchableOpacity
      testID={testID}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        variant === 'primary' && !disabled && SHADOWS.small,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'danger' ? COLORS.white : COLORS.primary} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              variantStyles.text,
              icon && iconPosition === 'left' && styles.textWithIconLeft,
              icon && iconPosition === 'right' && styles.textWithIconRight,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  textWithIconLeft: {
    marginLeft: 8,
  },
  textWithIconRight: {
    marginRight: 8,
  },
});
