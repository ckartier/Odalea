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
import { COLORS, SHADOWS, DIMENSIONS, moderateScale } from '@/constants/colors';
import { Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import GlassView from './GlassView';

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
  tint?: 'light' | 'dark' | 'default' | 'male' | 'female' | 'neutral';
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
  tint = 'neutral',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());
  
  const handleConfirm = () => {
    onChange(tempDate.toISOString().split('T')[0]);
    setModalVisible(false);
  };
  
  const handleCancel = () => {
    setModalVisible(false);
    setTempDate(value ? new Date(value) : new Date());
  };
  
  const handleChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
      
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
        onPress={() => setModalVisible(true)}
      >
        <GlassView
          tint={tint}
          liquidGlass={true}
          style={[
            styles.pickerButton,
            error ? styles.pickerError : null,
            SHADOWS.small,
          ]}
        >
          <Text style={[
            styles.pickerText,
            !value ? styles.placeholderText : null,
          ]}>
            {value ? formatDate(value) : placeholder}
          </Text>
          <Calendar size={20} color={COLORS.darkGray} />
        </GlassView>
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
            <GlassView
              tint={tint}
              liquidGlass={true}
              style={[styles.modalContainer, SHADOWS.xl]}
            >
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
            </GlassView>
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
    marginBottom: moderateScale(12),
    width: '100%',
  },
  label: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    fontWeight: '600' as const,
    marginBottom: moderateScale(6),
    color: COLORS.black,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: moderateScale(16),
    minHeight: 50,
  },
  pickerError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  pickerText: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.black,
  },
  placeholderText: {
    color: COLORS.darkGray,
  },
  errorText: {
    color: COLORS.error,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    marginTop: moderateScale(4),
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(30),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  modalTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  cancelText: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.darkGray,
  },
  confirmText: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.maleAccent,
    fontWeight: '600' as const,
  },
});

export default DatePicker;
