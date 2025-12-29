import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { Heart, Briefcase, Home, ChevronDown } from 'lucide-react-native';

export type MapFilterType = 'pets' | 'pros' | 'catSitters' | 'users' | 'vet' | 'shelter' | 'breeder' | 'boutique' | 'educator';

interface MapFilterChipsProps {
  activeFilters: Set<MapFilterType>;
  onFilterToggle: (filter: MapFilterType) => void;
}

const FILTERS: {
  key: MapFilterType;
  label: string;
  Icon: typeof Heart;
  color: string;
  children?: MapFilterType[];
}[] = [
  { key: 'pets', label: 'Animaux', Icon: Heart, color: '#7C3AED' },
  { 
    key: 'pros', 
    label: 'Pros', 
    Icon: Briefcase, 
    color: '#10b981',
    children: ['vet', 'shelter', 'breeder', 'boutique', 'educator']
  },
  { key: 'catSitters', label: 'Cat Sitters', Icon: Home, color: '#6366f1' },
];

const PRO_SUB_FILTERS: Record<string, { label: string; emoji: string }> = {
  vet: { label: 'Vétérinaires', emoji: '🩺' },
  boutique: { label: 'Boutiques', emoji: '🛍️' },
  educator: { label: 'Éducateurs', emoji: '🎓' },
  shelter: { label: 'Refuges', emoji: '🏠' },
  breeder: { label: 'Éleveurs', emoji: '🐱' },
};

export default function MapFilterChips({ activeFilters, onFilterToggle }: MapFilterChipsProps) {
  const [showProSubFilters, setShowProSubFilters] = useState(false);

  const isProsActive = activeFilters.has('pros');
  const hasAnyProSubFilter = ['vet', 'shelter', 'breeder', 'boutique', 'educator'].some(f => activeFilters.has(f as MapFilterType));

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.container}
      >
        {FILTERS.map(({ key, label, Icon, color, children }) => {
          const isActive = activeFilters.has(key);
          const hasChildren = children && children.length > 0;
          
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                isActive && { backgroundColor: color, borderColor: color },
              ]}
              onPress={() => {
                if (hasChildren && key === 'pros') {
                  setShowProSubFilters(!showProSubFilters);
                }
                onFilterToggle(key);
              }}
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
              {hasChildren && (
                <ChevronDown
                  size={14}
                  color={isActive ? '#ffffff' : color}
                  style={{ transform: [{ rotate: showProSubFilters ? '180deg' : '0deg' }] }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {(showProSubFilters || hasAnyProSubFilter) && (isProsActive || hasAnyProSubFilter) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, styles.subScrollContent]}
          style={styles.subContainer}
        >
          {Object.entries(PRO_SUB_FILTERS).map(([key, { label, emoji }]) => {
            const isActive = activeFilters.has(key as MapFilterType);
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.subChip,
                  isActive && styles.subChipActive,
                ]}
                onPress={() => onFilterToggle(key as MapFilterType)}
                activeOpacity={0.7}
              >
                <Text style={styles.subChipEmoji}>{emoji}</Text>
                <Text
                  style={[
                    styles.subChipText,
                    isActive && styles.subChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
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
  subContainer: {
    flexGrow: 0,
    marginTop: 8,
  },
  subScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  subChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  subChipEmoji: {
    fontSize: 14,
  },
  subChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  subChipTextActive: {
    color: '#ffffff',
  },
});
