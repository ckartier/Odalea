import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Heart, Briefcase, Home, Stethoscope, ShoppingBag, Trees, Building2 } from 'lucide-react-native';

export type MapFilterType = 'users' | 'catSitters' | 'pros' | 'googleVet' | 'googleShop' | 'googleZoo' | 'googleShelter';

interface MapFilterChipsProps {
  activeFilters: Set<MapFilterType>;
  onFilterToggle: (filter: MapFilterType) => void;
}

const FILTERS: {
  key: MapFilterType;
  label: string;
  Icon: any;
  color: string;
}[] = [
  { key: 'users', label: 'Utilisateurs', Icon: Heart, color: '#7C3AED' },
  { key: 'catSitters', label: 'Cat Sitters', Icon: Home, color: '#6366f1' },
  { key: 'pros', label: 'Professionnels', Icon: Briefcase, color: '#10b981' },
  { key: 'googleVet', label: 'Vétérinaires', Icon: Stethoscope, color: '#10b981' },
  { key: 'googleShop', label: 'Animaleries', Icon: ShoppingBag, color: '#f59e0b' },
  { key: 'googleZoo', label: 'Zoos', Icon: Trees, color: '#8b5cf6' },
  { key: 'googleShelter', label: 'Refuges', Icon: Building2, color: '#06b6d4' },
];

export default function MapFilterChips({ activeFilters, onFilterToggle }: MapFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {FILTERS.map(({ key, label, Icon, color }) => {
        const isActive = activeFilters.has(key);
        
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.chip,
              isActive && { backgroundColor: color, borderColor: color },
            ]}
            onPress={() => onFilterToggle(key)}
            activeOpacity={0.7}
          >
            <Icon
              size={16}
              color={isActive ? '#ffffff' : color}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.chipText,
                isActive && styles.chipTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  chipTextActive: {
    color: '#ffffff',
  },
});
