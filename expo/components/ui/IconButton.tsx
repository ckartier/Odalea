import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
  ActivityIndicator,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS } from '@/constants/colors';

type IconButtonVariant = 'default' | 'filled' | 'soft' | 'ghost';
type IconButtonSize = 'small' | 'medium' | 'large';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  loading?: boolean;
  badge?: number;
  style?: ViewStyle;
  testID?: string;
  haptic?: boolean;
  accessibilityLabel?: string;
}

const getSizeStyles = (size: IconButtonSize) => {
  switch (size) {
    case 'small':
      return { width: 32, height: 32, borderRadius: 8, iconSize: 18 };
    case 'large':
      return { width: 52, height: 52, borderRadius: 14, iconSize: 26 };
    default:
      return { width: 44, height: 44, borderRadius: 12, iconSize: 22 };
  }
};

const getVariantStyles = (variant: IconButtonVariant, disabled: boolean) => {
  if (disabled) {
    return { backgroundColor: COLORS.lightGray, borderWidth: 0 };
  }

  switch (variant) {
    case 'filled':
      return { backgroundColor: COLORS.primary, borderWidth: 0 };
    case 'soft':
      return { backgroundColor: COLORS.surfaceSecondary, borderWidth: 0 };
    case 'ghost':
      return { backgroundColor: 'transparent', borderWidth: 0 };
    default:
      return { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border };
  }
};

export default function IconButton({
  icon,
  onPress,
  variant = 'default',
  size = 'medium',
  disabled = false,
  loading = false,
  badge,
  style,
  testID,
  haptic = true,
  accessibilityLabel,
}: IconButtonProps) {
  const sizeStyles = getSizeStyles(size);
  const variantStyles = getVariantStyles(variant, disabled || loading);

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;
    
    if (haptic && Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  }, [disabled, loading, haptic, onPress]);

  const showBadge = badge !== undefined && badge > 0;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[
        styles.container,
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderRadius: sizeStyles.borderRadius,
        },
        variantStyles,
        variant === 'filled' && !disabled && SHADOWS.small,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'filled' ? COLORS.white : COLORS.primary}
        />
      ) : (
        icon
      )}
      
      {showBadge && (
        <View style={styles.badge}>
          <View style={styles.badgeInner}>
            {badge <= 9 ? null : null}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function IconButtonGroup({
  buttons,
  style,
}: {
  buttons: Omit<IconButtonProps, 'style'>[];
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.group, style]}>
      {buttons.map((props, index) => (
        <IconButton
          key={index}
          {...props}
          style={index > 0 ? styles.groupButton : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupButton: {
    marginLeft: 8,
  },
});
