import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList,
  Modal,
  TextInput,
  ViewStyle,
} from 'react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Breed } from '@/types';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { breeds } from '@/mocks/breeds';

interface BreedSelectorProps {
  value: string;
  onChange: (breed: string) => void;
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

const BreedSelector: React.FC<BreedSelectorProps> = ({
  value,
  onChange,
  label = 'Breed',
  error,
  containerStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBreeds, setFilteredBreeds] = useState<Breed[]>(breeds);
  
  useEffect(() => {
    if (searchQuery) {
      const filtered = breeds.filter(breed => 
        breed.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBreeds(filtered);
    } else {
      setFilteredBreeds(breeds);
    }
  }, [searchQuery]);
  
  const handleSelect = (breedName: string) => {
    onChange(breedName);
    setModalVisible(false);
    setSearchQuery('');
  };
  
  const renderBreedItem = ({ item }: { item: Breed }) => (
    <TouchableOpacity
      style={styles.breedItem}
      onPress={() => handleSelect(item.name)}
    >
      <Text style={styles.breedName}>{item.name}</Text>
      <Text style={styles.breedType}>
        {item.type === 'domestic' ? 'Domestique' : 'Exotique'}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.selectorButton,
          error ? styles.selectorError : null,
          SHADOWS.small,
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.selectorText,
          !value ? styles.placeholderText : null,
        ]}>
          {value || 'Sélectionner une race'}
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
          <View style={[styles.modalContainer, SHADOWS.large]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une race</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
              >
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={COLORS.darkGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher des races..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={COLORS.darkGray} />
                </TouchableOpacity>
              ) : null}
            </View>
            
            <FlatList
              data={filteredBreeds}
              renderItem={renderBreedItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.breedList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Aucune race trouvée</Text>
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
    fontWeight: '500' as const,
    marginBottom: 6,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
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
    height: 40,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  breedList: {
    paddingBottom: 20,
  },
  breedItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  breedName: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 2,
  },
  breedType: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.darkGray,
  },
});

export default BreedSelector;