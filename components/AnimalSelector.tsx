import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { COLORS } from '@/constants/colors';
import { ChevronDown, Search } from 'lucide-react-native';
import Input from './Input';
import { animalDataService } from '@/services/database';
import { AnimalSpecies } from '@/types';
import animalsData from '@/data/animals.json';

interface AnimalSelectorProps {
  label?: string;
  value?: string;
  onSelect: (animalId: string) => void;
  error?: string;
  language?: 'en' | 'fr';
}

export default function AnimalSelector({
  label = 'Animal Type',
  value,
  onSelect,
  error,
  language = 'fr',
}: AnimalSelectorProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [species, setSpecies] = useState<AnimalSpecies[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        console.log('[AnimalSelector] Fetching species from Firestore');
        const items = await animalDataService.getAnimalSpecies();
        if (mounted) {
          if (Array.isArray(items) && items.length > 0) {
            setSpecies(items);
          } else {
            console.log('[AnimalSelector] Firestore returned empty, falling back to local JSON');
            const localSpecies = (animalsData as any)?.species as AnimalSpecies[];
            setSpecies(localSpecies ?? []);
          }
        }
      } catch (e) {
        console.error('[AnimalSelector] Error fetching species', e);
        if (mounted) {
          const localSpecies = (animalsData as any)?.species as AnimalSpecies[];
          setSpecies(localSpecies ?? []);
          setLoadError(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [language]);

  const animals = useMemo(() => species, [species]);

  const filteredAnimals = useMemo(
    () =>
      animals.filter((animal) =>
        (animal?.name?.[language] ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [animals, language, searchQuery]
  );

  const selectedAnimal = useMemo(
    () => animals.find((animal) => animal.id === value),
    [animals, value]
  );

  const handleSelect = (animalId: string) => {
    onSelect(animalId);
    setIsVisible(false);
    setSearchQuery('');
  };

  const getCategoryName = (category: string) => {
    const categoryNames = {
      domestic: language === 'fr' ? 'Domestique' : 'Domestic',
      exotic: language === 'fr' ? 'Exotique' : 'Exotic',
      bird: language === 'fr' ? 'Oiseau' : 'Bird',
      reptile: language === 'fr' ? 'Reptile' : 'Reptile',
      aquatic: language === 'fr' ? 'Aquatique' : 'Aquatic',
      amphibian: language === 'fr' ? 'Amphibien' : 'Amphibian',
      large_animal: language === 'fr' ? 'Grand Animal' : 'Large Animal',
      farm_animal: language === 'fr' ? 'Animal de Ferme' : 'Farm Animal',
      other: language === 'fr' ? 'Autre' : 'Other',
    } as const;
    return (categoryNames as any)[category] ?? category;
  };

  const groupedAnimals = useMemo(() => {
    return filteredAnimals.reduce((groups, animal) => {
      const category = String(animal.category ?? 'other');
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(animal);
      return groups;
    }, {} as Record<string, AnimalSpecies[]>);
  }, [filteredAnimals]);

  return (
    <View style={styles.container} testID="animal-selector">
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.selector, error ? styles.selectorError : null]}
        onPress={() => setIsVisible(true)}
        testID="animal-selector-button"
      >
        <View style={styles.selectorContent}>
          {selectedAnimal ? (
            <View style={styles.selectedAnimal}>
              <Text style={styles.emoji}>{selectedAnimal.emoji}</Text>
              <Text style={styles.selectedText}>
                {selectedAnimal.name?.[language] ?? ''}
              </Text>
            </View>
          ) : loading ? (
            <Text style={styles.placeholder}>{language === 'fr' ? 'Chargement…' : 'Loading…'}</Text>
          ) : loadError ? (
            <Text style={styles.placeholder}>{loadError}</Text>
          ) : (
            <Text style={styles.placeholder}>
              {language === 'fr' ? 'Sélectionner un animal' : 'Select an animal'}
            </Text>
          )}
        </View>
        <ChevronDown size={20} color={COLORS.darkGray} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {language === 'fr' ? 'Choisir un animal' : 'Choose an animal'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
              testID="animal-selector-close"
            >
              <Text style={styles.closeButtonText}>
                {language === 'fr' ? 'Fermer' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Input
              placeholder={language === 'fr' ? 'Rechercher un animal...' : 'Search for an animal...'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Search size={20} color={COLORS.darkGray} />}
              testID="animal-selector-search"
            />
          </View>

          <ScrollView style={styles.animalsList} testID="animal-selector-list">
            {Object.entries(groupedAnimals).map(([category, categoryAnimals]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  {getCategoryName(category)}
                </Text>
                {categoryAnimals.map((animal) => (
                  <TouchableOpacity
                    key={animal.id}
                    style={[
                      styles.animalItem,
                      value === animal.id ? styles.animalItemSelected : null,
                    ]}
                    onPress={() => handleSelect(animal.id)}
                    testID={`animal-item-${animal.id}`}
                  >
                    <Text style={styles.animalEmoji}>{animal.emoji}</Text>
                    <Text style={styles.animalName}>
                      {animal.name?.[language] ?? ''}
                    </Text>
                    {value === animal.id && (
                      <View style={styles.selectedIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectorError: {
    borderColor: COLORS.error,
  },
  selectorContent: {
    flex: 1,
  },
  selectedAnimal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  selectedText: {
    fontSize: 16,
    color: COLORS.black,
  },
  placeholder: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.maleAccent,
    fontWeight: '600' as const,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  animalsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.maleAccent,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  animalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  animalItemSelected: {
    backgroundColor: COLORS.neutral,
  },
  animalEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  animalName: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.maleAccent,
  },
});