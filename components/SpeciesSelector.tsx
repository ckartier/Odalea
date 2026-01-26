import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList,
  Modal,
  TextInput,
  ViewStyle,
  SectionList,
} from 'react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { SPECIES_CATEGORIES, ALL_SPECIES, Species, SpeciesCategory } from '@/constants/species';
import { ChevronDown, Search, X, ChevronRight } from 'lucide-react-native';

interface SpeciesSelectorProps {
  value: string;
  onChange: (speciesId: string, speciesName: string) => void;
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({
  value,
  onChange,
  label = 'Espèce',
  error,
  containerStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  const selectedSpecies = useMemo(() => {
    return ALL_SPECIES.find(s => s.id === value || s.name === value);
  }, [value]);
  
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return SPECIES_CATEGORIES;
    }
    
    const query = searchQuery.toLowerCase();
    return SPECIES_CATEGORIES
      .map(cat => ({
        ...cat,
        species: cat.species.filter(s => 
          s.name.toLowerCase().includes(query)
        ),
      }))
      .filter(cat => cat.species.length > 0);
  }, [searchQuery]);
  
  const handleSelect = (species: Species) => {
    onChange(species.id, species.name);
    setModalVisible(false);
    setSearchQuery('');
    setExpandedCategory(null);
  };
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  };
  
  const renderCategory = ({ item }: { item: SpeciesCategory }) => {
    const isExpanded = expandedCategory === item.id || searchQuery.trim().length > 0;
    
    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryName}>{item.name}</Text>
          <View style={styles.categoryRight}>
            <Text style={styles.categoryCount}>{item.species.length}</Text>
            <ChevronRight 
              size={20} 
              color={COLORS.darkGray} 
              style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.speciesList}>
            {item.species.map((species) => (
              <TouchableOpacity
                key={species.id}
                style={[
                  styles.speciesItem,
                  selectedSpecies?.id === species.id && styles.speciesItemSelected
                ]}
                onPress={() => handleSelect(species)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.speciesName,
                  selectedSpecies?.id === species.id && styles.speciesNameSelected
                ]}>
                  {species.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label} *</Text>}
      
      <TouchableOpacity
        style={[
          styles.selectorButton,
          error ? styles.selectorError : null,
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.selectorText,
          !selectedSpecies ? styles.placeholderText : null,
        ]}>
          {selectedSpecies?.name || 'Sélectionner une espèce'}
        </Text>
        <ChevronDown size={20} color={COLORS.darkGray} />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une espèce</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                  setExpandedCategory(null);
                }}
                style={styles.closeButton}
              >
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={COLORS.darkGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                placeholderTextColor={COLORS.darkGray}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={COLORS.darkGray} />
                </TouchableOpacity>
              ) : null}
            </View>
            
            <FlatList
              data={filteredCategories}
              renderItem={renderCategory}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.categoryList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Aucune espèce trouvée</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    color: COLORS.black,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    paddingHorizontal: 16,
    height: 50,
  },
  selectorError: {
    borderColor: COLORS.error,
  },
  selectorText: {
    fontSize: 16,
    color: COLORS.black,
  },
  placeholderText: {
    color: COLORS.darkGray,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 8,
    fontSize: 16,
    color: COLORS.black,
  },
  categoryList: {
    paddingBottom: 20,
  },
  categoryContainer: {
    marginBottom: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCount: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  speciesList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  speciesItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 4,
  },
  speciesItemSelected: {
    backgroundColor: COLORS.black,
  },
  speciesName: {
    fontSize: 15,
    color: COLORS.black,
  },
  speciesNameSelected: {
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.darkGray,
    fontSize: 16,
  },
});

export default SpeciesSelector;
