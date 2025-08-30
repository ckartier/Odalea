import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

interface MapViewProps {
  children?: React.ReactNode;
  style?: any;
  [key: string]: any;
}

const MapView: React.FC<MapViewProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.webMapPlaceholder, style]}>
      <Text style={styles.webMapText}>
        Interactive map is available on mobile devices.
      </Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  webMapText: {
    fontSize: 16,
    color: COLORS.black,
    textAlign: 'center',
    padding: 20,
  },
});

export default MapView;
export const PROVIDER_GOOGLE = 'google';