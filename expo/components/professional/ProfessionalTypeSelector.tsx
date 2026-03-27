import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { ActivityConfig } from '@/constants/professionalActivities';
import { ProfessionalActivityType } from '@/types';

interface ProfessionalTypeSelectorProps {
  selectedType: ProfessionalActivityType;
  onSelect: (type: ProfessionalActivityType) => void;
  options: ActivityConfig[];
}

const ProfessionalTypeSelector: React.FC<ProfessionalTypeSelectorProps> = ({
  selectedType,
  onSelect,
  options,
}) => (
  <View style={styles.container}>
    <Text style={styles.title}>Choisissez votre activité</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {options.map(option => {
        const isActive = selectedType === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(option.id)}
            testID={`activity-chip-${option.id}`}
          >
            <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
              {option.chipLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>

    {options.map(option => {
      if (option.id !== selectedType) {
        return null;
      }
      return (
        <View key={option.id} style={[styles.card, SHADOWS.small]}>
          <Text style={styles.cardTitle}>{option.label}</Text>
          <Text style={styles.cardDescription}>{option.description}</Text>
          <View style={styles.dotRow}>
            {option.sections.map(section => (
              <View key={section.key} style={styles.dot} testID={`activity-section-${section.key}`} />
            ))}
          </View>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  chipLabelActive: {
    color: COLORS.white,
  },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceBackground,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  dotRow: {
    flexDirection: 'row' as const,
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.black,
    opacity: 0.4,
  },
});

export default React.memo(ProfessionalTypeSelector);
