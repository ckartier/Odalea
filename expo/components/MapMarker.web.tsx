import React from 'react';
import { Pet } from '@/types';

interface MapMarkerProps {
  pet: Pet;
  onPress?: () => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({ pet, onPress }) => {
  // Return null on web since we don't render markers
  return null;
};

export default MapMarker;