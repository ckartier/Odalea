import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  ViewStyle,
} from 'react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { ChevronDown, X } from 'lucide-react-native';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownSelectorProps {
  label: string;
  placeholder: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  error?: string;
  style?: ViewStyle;
}

const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedOption = options.find(option => option.value === value);
  
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setModalVisible(false);
  };
  
  const renderOption = ({ item }: { item: DropdownOption }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => handleSelect(item.value)}
    >
      <Text style={styles.optionText}>{item.label}</Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={[
          styles.button,
          error ? styles.buttonError : null,
          SHADOWS.small,
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.buttonText,
          !selectedOption ? styles.placeholderText : null,
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={20} color={COLORS.darkGray} />
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, SHADOWS.large]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={item => item.value}
              contentContainerStyle={styles.optionsList}
              showsVerticalScrollIndicator={false}
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
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    paddingHorizontal: 16,
    height: 56,
  },
  buttonError: {
    borderColor: COLORS.error,
  },
  buttonText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.darkGray,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
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
    maxHeight: '60%',
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
  optionsList: {
    paddingBottom: 20,
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.black,
    textTransform: 'capitalize' as const,
  },
});

export default DropdownSelector;