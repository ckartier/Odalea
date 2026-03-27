import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Marker } from 'react-native-maps';
import { GooglePlace } from '@/services/google-places';
import { Stethoscope, ShoppingBag, Trees, Home } from 'lucide-react-native';

interface GooglePlaceMarkerProps {
  place: GooglePlace;
  onPress?: () => void;
}

const getPlaceTypeInfo = (types: string[]) => {
  if (types.includes('veterinary_care')) {
    return { Icon: Stethoscope, color: '#10b981', emoji: '🏥', label: 'Vétérinaire' };
  }
  if (types.includes('pet_store')) {
    return { Icon: ShoppingBag, color: '#f59e0b', emoji: '🛒', label: 'Animalerie' };
  }
  if (types.includes('zoo')) {
    return { Icon: Trees, color: '#8b5cf6', emoji: '🦁', label: 'Zoo' };
  }
  if (types.includes('animal_shelter')) {
    return { Icon: Home, color: '#06b6d4', emoji: '🏘️', label: 'Refuge' };
  }
  return { Icon: Home, color: '#64748b', emoji: '📍', label: 'Lieu' };
};

const GooglePlaceMarker: React.FC<GooglePlaceMarkerProps> = ({ place, onPress }) => {
  const placeTypeInfo = useMemo(() => getPlaceTypeInfo(place.types), [place.types]);

  if (!place.location) return null;

  return (
    <Marker
      coordinate={{
        latitude: place.location.latitude,
        longitude: place.location.longitude,
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={[
        styles.markerContainer,
        { backgroundColor: placeTypeInfo.color },
        SHADOWS.medium,
      ]}>
        <placeTypeInfo.Icon size={20} color="#ffffff" strokeWidth={2.5} />
      </View>
      <View style={[styles.triangle, { borderTopColor: placeTypeInfo.color }]} />
      
      {place.rating && place.rating >= 4.5 && (
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐</Text>
        </View>
      )}
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -2,
  },
  ratingBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  ratingText: {
    fontSize: 12,
  },
});

export default GooglePlaceMarker;
