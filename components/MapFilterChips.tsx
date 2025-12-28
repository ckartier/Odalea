import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Heart, Users, AlertCircle, Stethoscope, ShoppingBag, Home, GraduationCap } from 'lucide-react-native';

export type MapFilterType = 'pets' | 'friends' | 'lost' | 'catSitters' | 'vets' | 'stores' | 'shelters' | 'educators';

interface MapFilterChipsProps {
  activeFilters: Set<MapFilterType>;
  onFilterToggle: (filter: MapFilterType) => void;
}

const FILTERS: {
  key: MapFilterType;
  label: string;
  Icon: typeof Heart;
  color: string;
}[] = [
  { key: 'pets', label: 'Animaux', Icon: Heart, color: '#f472b6' },
  { key: 'friends', label: 'Amis', Icon: Users, color: '#fb923c' },
  { key: 'lost', label: 'Perdus', Icon: AlertCircle, color: '#f43f5e' },
  { key: 'catSitters', label: 'Cat Sitters', Icon: Home, color: '#6366f1' },
  { key: 'vets', label: 'Vétérinaires', Icon: Stethoscope, color: '#10b981' },
  { key: 'stores', label: 'Boutiques', Icon: ShoppingBag, color: '#f59e0b' },
  { key: 'shelters', label: 'Refuges', Icon: Home, color: '#8b5cf6' },
  { key: 'educators', label: 'Éducateurs', Icon: GraduationCap, color: '#06b6d4' },
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
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  chipTextActive: {
    color: '#ffffff',
  },
});
