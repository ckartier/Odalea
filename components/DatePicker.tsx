import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal,
  Platform,
  ViewStyle,
} from 'react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Calendar, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onDateChange?: (date: Date) => void;
  onCancel?: () => void;
  date?: Date;
  label?: string;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
  maximumDate?: Date;
  minimumDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label = 'Date',
  placeholder = 'Select a date',
  error,
  containerStyle,
  maximumDate,
  minimumDate,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());
  
  const handleConfirm = () => {
    onChange(tempDate.toISOString().split('T')[0]);
    setModalVisible(false);
  };
  
  const handleCancel = () => {
    setModalVisible(false);
    // Reset temp date to current value
    setTempDate(value ? new Date(value) : new Date());
  };
  
  const handleChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
      
      // On iOS, we'll keep the modal open until user confirms
      // On Android, we'll close the modal and update the value immediately
      if (Platform.OS === 'android') {
        onChange(selectedDate.toISOString().split('T')[0]);
        setModalVisible(false);
      }
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.pickerButton,
          error ? styles.pickerError : null,
          SHADOWS.small,
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.pickerText,
          !value ? styles.placeholderText : null,
        ]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Calendar size={20} color={COLORS.darkGray} />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {Platform.OS === 'ios' ? (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, SHADOWS.large]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.confirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
              />
            </View>
          </View>
        </Modal>
      ) : (
        modalVisible && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleChange}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
          />
        )
      )}
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
  pickerButton: {
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
  pickerError: {
    borderColor: COLORS.error,
  },
  pickerText: {
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
    paddingTop: 16,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  confirmText: {
    fontSize: 16,
    color: COLORS.maleAccent,
    fontWeight: '600' as const,
  },
});

export default DatePicker;