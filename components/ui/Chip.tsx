import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS } from '@/constants/colors';

type ChipVariant = 'filled' | 'outlined' | 'soft';
type ChipSize = 'small' | 'medium' | 'large';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: ChipVariant;
  size?: ChipSize;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const getSizeStyles = (size: ChipSize) => {
  switch (size) {
    case 'small':
      return {
        container: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
        text: { fontSize: 12 },
      };
    case 'large':
      return {
        container: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
        text: { fontSize: 15 },
      };
    default:
      return {
        container: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 8 },
        text: { fontSize: 13 },
      };
  }
};

const getVariantStyles = (variant: ChipVariant, selected: boolean, disabled: boolean) => {
  if (disabled) {
    return {
      container: { backgroundColor: COLORS.lightGray, borderWidth: 0 },
      text: { color: COLORS.textTertiary },
    };
  }

  switch (variant) {
    case 'filled':
      return {
        container: {
          backgroundColor: selected ? COLORS.primary : COLORS.lightGray,
          borderWidth: 0,
        },
        text: { color: selected ? COLORS.white : COLORS.textSecondary },
      };
    case 'outlined':
      return {
        container: {
          backgroundColor: selected ? COLORS.primarySoft : COLORS.white,
          borderWidth: 1.5,
          borderColor: selected ? COLORS.primary : COLORS.border,
        },
        text: { color: selected ? COLORS.primary : COLORS.textSecondary },
      };
    case 'soft':
    default:
      return {
        container: {
          backgroundColor: selected ? COLORS.primarySoft : COLORS.surfaceSecondary,
          borderWidth: 0,
        },
        text: { color: selected ? COLORS.primary : COLORS.textSecondary },
      };
  }
};

export default function Chip({
  label,
  selected = false,
  onPress,
  variant = 'soft',
  size = 'medium',
  icon,
  disabled = false,
  style,
  testID,
}: ChipProps) {
  const sizeStyles = getSizeStyles(size);
  const variantStyles = getVariantStyles(variant, selected, disabled);

  const handlePress = useCallback(async () => {
    if (disabled || !onPress) return;
    
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  }, [disabled, onPress]);

  return (
    <TouchableOpacity
      testID={testID}
      onPress={handlePress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        selected && variant === 'filled' && SHADOWS.xs,
        style,
      ]}
    >
      {icon && icon}
      <Text
        style={[
          styles.label,
          sizeStyles.text,
          variantStyles.text,
          icon && styles.labelWithIcon,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function ChipGroup({
  chips,
  selectedIndex,
  onSelect,
  variant = 'soft',
  size = 'medium',
  style,
}: {
  chips: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  variant?: ChipVariant;
  size?: ChipSize;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={[styles.group, style]}
    >
      {chips.map((label, index) => (
        <Chip
          key={label}
          label={label}
          selected={selectedIndex === index}
          onPress={() => onSelect(index)}
          variant={variant}
          size={size}
          style={styles.groupChip}
        />
      ))}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  label: {
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  labelWithIcon: {
    marginLeft: 6,
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  groupChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});
