import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Gender } from '@/types';

interface GenderSelectorProps {
  value: Gender;
  onChange: (gender: Gender) => void;
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  style?: ViewStyle;
}

const GRADIENT_COLORS = ['#F6C1DE', '#C9D3FF'] as const;
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END = { x: 1, y: 1 } as const;

const GenderSelector: React.FC<GenderSelectorProps> = ({
  value,
  onChange,
  label = 'Gender',
  error,
  containerStyle,
  style,
}) => {
  return (
    <View style={[styles.container, containerStyle, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.selectorContainer}>
        <TouchableOpacity
          testID="gender-male"
          style={[
            styles.option,
            value === 'male' ? styles.selectedFrame : styles.unselected,
            SHADOWS.small,
          ]}
          onPress={() => {
            console.log('[GenderSelector] Male pressed');
            onChange('male');
          }}
          activeOpacity={0.9}
        >
          {value === 'male' && (
            <>
              <LinearGradient
                colors={[...GRADIENT_COLORS]}
                start={GRADIENT_START}
                end={GRADIENT_END}
                style={styles.gradientBg}
              />
              <View style={styles.innerStroke} />
              <LinearGradient
                colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glossOverlay}
              />
            </>
          )}
          <Text
            style={[
              styles.optionText,
              value === 'male' ? styles.selectedText : styles.unselectedText,
            ]}
          >
            Male
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="gender-female"
          style={[
            styles.option,
            value === 'female' ? styles.selectedFrame : styles.unselected,
            SHADOWS.small,
          ]}
          onPress={() => {
            console.log('[GenderSelector] Female pressed');
            onChange('female');
          }}
          activeOpacity={0.9}
        >
          {value === 'female' && (
            <>
              <LinearGradient
                colors={[...GRADIENT_COLORS]}
                start={GRADIENT_START}
                end={GRADIENT_END}
                style={styles.gradientBg}
              />
              <View style={styles.innerStroke} />
              <LinearGradient
                colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glossOverlay}
              />
            </>
          )}
          <Text
            style={[
              styles.optionText,
              value === 'female' ? styles.selectedText : styles.unselectedText,
            ]}
          >
            Female
          </Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
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
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  option: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  selectedFrame: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  unselected: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,
  innerStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  } as ViewStyle,
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 52,
  } as ViewStyle,
  optionText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  selectedText: {
    color: COLORS.black,
  },
  unselectedText: {
    color: COLORS.darkGray,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default GenderSelector;