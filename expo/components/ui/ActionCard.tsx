import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY, COMPONENT_SIZES } from '@/theme/tokens';

interface ActionCardProps {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function ActionCard({
  label,
  icon: Icon,
  onPress,
  style,
  disabled = false,
}: ActionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={styles.iconContainer}>
        <Icon 
          size={COMPONENT_SIZES.iconLarge} 
          color={disabled ? COLORS.disabled : COLORS.primary} 
          strokeWidth={2} 
        />
      </View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: COMPONENT_SIZES.actionCardHeight,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
    ...SHADOWS.soft,
  },
  cardDisabled: {
    backgroundColor: COLORS.surfaceSecondary,
    borderColor: COLORS.divider,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...TYPOGRAPHY.bodySemibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  labelDisabled: {
    color: COLORS.disabledText,
  },
});
