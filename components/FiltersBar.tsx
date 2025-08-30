import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useFiltersBarHeight() {
  return 44;
}

interface FiltersBarProps {
  filters?: string[];
}

const DEFAULT_FILTERS = ['Tous', 'Abonnements', 'À proximité', 'Perdus & Trouvés'];

const FiltersBar: React.FC<FiltersBarProps> = ({ filters = DEFAULT_FILTERS }) => {
  const insets = useSafeAreaInsets();
  const items = useMemo(() => filters, [filters]);
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
        {items.map((label) => (
          <View key={label} style={styles.chip} testID={`filter-${label}`}>
            <Text style={styles.chipText}>{label}</Text>
          </View>
        ))}
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(15,23,42,0.06)',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.12)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15,23,42,0.08)',
  },
});