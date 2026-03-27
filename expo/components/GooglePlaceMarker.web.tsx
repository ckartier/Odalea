import React from 'react';
import { View } from 'react-native';
import type { GooglePlace } from '@/services/google-places';

interface GooglePlaceMarkerProps {
  place: GooglePlace;
  onPress?: () => void;
}

const GooglePlaceMarker: React.FC<GooglePlaceMarkerProps> = () => {
  return <View testID="web-google-place-marker-placeholder" />;
};

export default GooglePlaceMarker;
