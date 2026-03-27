// Web stub for react-native-maps
import React from 'react';
import { View, Text } from 'react-native';

// Mock MapView component
const MapView = ({ children, style, ...props }) => {
  return (
    <View style={[{ backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }, style]}>
      <Text style={{ color: '#666', fontSize: 16 }}>Map not available on web</Text>
      {children}
    </View>
  );
};

// Mock Marker component
const Marker = ({ children, ...props }) => {
  return <View>{children}</View>;
};

// Mock Callout component
const Callout = ({ children, ...props }) => {
  return <View>{children}</View>;
};

// Mock Circle component
const Circle = ({ ...props }) => {
  return <View />;
};

// Mock Polygon component
const Polygon = ({ ...props }) => {
  return <View />;
};

// Mock Polyline component
const Polyline = ({ ...props }) => {
  return <View />;
};

// Constants
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

// Export components
export default MapView;
export { Marker, Callout, Circle, Polygon, Polyline };