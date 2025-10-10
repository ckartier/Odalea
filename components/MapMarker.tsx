import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Pet } from '@/types';
import { getBlurredPetLocation } from '@/services/location-privacy';

interface MapMarkerProps {
  pet: Pet & { owner?: any };
  onPress?: () => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({ pet, onPress }) => {
  const blurredLocation = useMemo(() => {
    if (!pet.location) return null;
    return getBlurredPetLocation(pet.id, pet.location);
  }, [pet.id, pet.location]);

  if (!pet.location || !blurredLocation) return null;

  const markerColor = pet.gender === 'male' ? COLORS.male : COLORS.female;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
      testID={`map-marker-${pet.id}`}
    >
      <View style={[
        styles.markerContainer,
        { backgroundColor: markerColor },
        SHADOWS.medium,
      ]}>
        {pet.mainPhoto ? (
          <Image
            source={{ uri: pet.mainPhoto }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>🐱</Text>
          </View>
        )}
      </View>
      <View style={[styles.triangle, { borderTopColor: markerColor }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  markerContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  placeholderText: {
    fontSize: 24,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid' as const,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});

export default MapMarker;