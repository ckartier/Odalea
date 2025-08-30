import React, { useState } from 'react';
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
import { ChevronDown, Search, X } from 'lucide-react-native';

// Sample country codes
const countryCodes = [
  { code: 'FR', dial: '+33', name: 'France' },
  { code: 'US', dial: '+1', name: 'United States' },
  { code: 'GB', dial: '+44', name: 'United Kingdom' },
  { code: 'DE', dial: '+49', name: 'Germany' },
  { code: 'IT', dial: '+39', name: 'Italy' },
  { code: 'ES', dial: '+34', name: 'Spain' },
  { code: 'CA', dial: '+1', name: 'Canada' },
  { code: 'AU', dial: '+61', name: 'Australia' },
  { code: 'JP', dial: '+81', name: 'Japan' },
  { code: 'CN', dial: '+86', name: 'China' },
  { code: 'IN', dial: '+91', name: 'India' },
  { code: 'BR', dial: '+55', name: 'Brazil' },
  { code: 'RU', dial: '+7', name: 'Russia' },
  { code: 'MX', dial: '+52', name: 'Mexico' },
  { code: 'KR', dial: '+82', name: 'South Korea' },
];

interface CountryCodePickerProps {
  value: string;
  onChange: (code: string) => void;
  style?: ViewStyle;
}

const CountryCodePicker: React.FC<CountryCodePickerProps> = ({
  value,
  onChange,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const selectedCountry = countryCodes.find(country => country.code === value) || countryCodes[0];
  
  const filteredCountries = searchQuery
    ? countryCodes.filter(country => 
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dial.includes(searchQuery) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : countryCodes;
  
  const handleSelect = (code: string) => {
    onChange(code);
    setModalVisible(false);
    setSearchQuery('');
  };
  
  const renderCountryItem = ({ item }: { item: typeof countryCodes[0] }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleSelect(item.code)}
    >
      <Text style={styles.countryCode}>{item.code}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryDial}>{item.dial}</Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.button, SHADOWS.small]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>{selectedCountry.dial}</Text>
        <ChevronDown size={16} color={COLORS.darkGray} />
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, SHADOWS.large]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
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
                placeholder="Search countries..."
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
              data={filteredCountries}
              renderItem={renderCountryItem}
              keyExtractor={item => item.code}
              contentContainerStyle={styles.countryList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No countries found</Text>
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
    minWidth: 80,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    paddingHorizontal: 10,
    height: 56,
  },
  buttonText: {
    fontSize: 16,
    color: COLORS.black,
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
  countryList: {
    paddingBottom: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  countryCode: {
    width: 40,
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  countryDial: {
    fontSize: 16,
    color: COLORS.maleAccent,
    fontWeight: '500' as const,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.darkGray,
  },
});

export default CountryCodePicker;