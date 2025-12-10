import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { COLORS, DIMENSIONS, SHADOWS } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFirebaseUser } from '@/hooks/firebase-user-store';

export function useFiltersBarHeight() {
  return 60;
}

interface FiltersBarProps {
  filters?: string[];
  activeFilters?: Set<string>;
  onFilterPress?: (filter: string) => void;
}

const DEFAULT_FILTERS = ['Tous', 'Abonnements', 'À proximité', 'Perdus & Trouvés'];

const FiltersBar: React.FC<FiltersBarProps> = ({ 
  filters = DEFAULT_FILTERS, 
  activeFilters = new Set(['Tous']),
  onFilterPress 
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useFirebaseUser();
  const items = useMemo(() => filters, [filters]);
  
  const primaryPet = user?.pets?.find((p) => p.isPrimary) || user?.pets?.[0];
  const appGradient = primaryPet?.gender === 'female' 
    ? ['#E8B4D4', '#C8A2C8'] as const
    : ['#A8D5E8', '#B8C5D8'] as const;
  
  return (
    <View
      style={[
        styles.wrapper,
        { top: insets.top + 56 },
      ]}
      pointerEvents="box-none"
      testID="filters-bar"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroller}
      >
        {items.map((label) => {
          const isActive = activeFilters.has(label);
          return (
            <TouchableOpacity 
              key={label} 
              onPress={() => onFilterPress?.(label)}
              activeOpacity={0.7}
              testID={`filter-${label}`}
            >
              {isActive ? (
                <LinearGradient
                  colors={appGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.chip, styles.chipActive, SHADOWS.small]}
                >
                  <Text style={[styles.chipText, styles.chipTextActive]}>{label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.hairline} />
    </View>
  );
};

export default FiltersBar;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'transparent',
  },
  scroller: {
    width: '100%',
  },
  content: {
    paddingHorizontal: DIMENSIONS.SPACING.md,
    paddingVertical: DIMENSIONS.SPACING.xs,
    gap: DIMENSIONS.SPACING.xs,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.12)',
  },
  chipActive: {
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15,23,42,0.08)',
  },
});