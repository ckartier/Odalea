import React, { useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  count?: number;
  badge?: string;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  style?: any;
}

function SegmentedControlComponent<T extends string>({
  options,
  activeKey,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const handlePress = useCallback((key: T, disabled?: boolean) => {
    if (disabled) return;
    onChange(key);
  }, [onChange]);

  return (
    <View style={[styles.container, style]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => {
          const isActive = activeKey === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.segment,
                isActive && styles.segmentActive,
                option.disabled && styles.segmentDisabled,
              ]}
              onPress={() => handlePress(option.key, option.disabled)}
              disabled={option.disabled}
              activeOpacity={0.7}
              testID={`segment-${option.key}`}
            >
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  option.disabled && styles.labelDisabled,
                ]}
              >
                {option.label}
              </Text>
              {option.count !== undefined && option.count > 0 && (
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countText, isActive && styles.countTextActive]}>
                    {option.count}
                  </Text>
                </View>
              )}
              {option.badge && (
                <Text style={styles.badgeEmoji}>{option.badge}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const SegmentedControl = React.memo(SegmentedControlComponent) as typeof SegmentedControlComponent;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.SPACING.md,
    paddingVertical: DIMENSIONS.SPACING.sm,
    gap: DIMENSIONS.SPACING.sm,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 6,
    minHeight: 44,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentDisabled: {
    opacity: 0.5,
  },
  label: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
  },
  labelActive: {
    color: COLORS.white,
  },
  labelDisabled: {
    color: COLORS.mediumGray,
  },
  countBadge: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  countText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '700' as const,
    color: COLORS.textSecondary,
  },
  countTextActive: {
    color: COLORS.white,
  },
  badgeEmoji: {
    fontSize: 14,
  },
});
