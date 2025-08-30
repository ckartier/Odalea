import React from 'react';
import { View } from 'react-native';
import { Pet } from '@/types';

interface MapMarkerProps {
  pet: Pet;
  onPress?: () => void;
}

const MapMarker: React.FC<MapMarkerProps> = () => {
  return <View testID="map-marker-placeholder" />;
};

export default MapMarker;