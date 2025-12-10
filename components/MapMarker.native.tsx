import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Pet } from '@/types';
import { Marker } from 'react-native-maps';
import { getBlurredPetLocation } from '@/services/location-privacy';
import { Stethoscope } from 'lucide-react-native';

interface MapMarkerProps {
  pet: Pet & { owner?: any };
  onPress?: () => void;
  isVet?: boolean;
}

const MapMarker: React.FC<MapMarkerProps> = ({ pet, onPress, isVet = false }) => {
  const blurredLocation = useMemo(() => {
    if (!pet.location) return null;
    return getBlurredPetLocation(pet.id, pet.location);
  }, [pet.id, pet.location]);

  if (!pet.location || !blurredLocation) return null;

  const markerColor = isVet ? '#10b981' : (pet.gender === 'male' ? COLORS.male : COLORS.female);
  const isVetProfessional = pet.owner?.isProfessional && pet.owner?.professionalData?.activityType === 'vet';

  return (
    <Marker
      coordinate={{
        latitude: blurredLocation.latitude,
        longitude: blurredLocation.longitude,
      }}
      onPress={onPress}
    >
      <View style={[
        styles.markerContainer,
        { backgroundColor: markerColor },
        SHADOWS.medium,
      ]}>
        {isVet ? (
          <Text style={styles.vetEmoji}>🏥</Text>
        ) : pet.mainPhoto ? (
          <Image
            source={{ uri: pet.mainPhoto }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.placeholderText}>🐱</Text>
        )}
      </View>
      <View style={[styles.triangle, { borderTopColor: markerColor }]} />
      {isVetProfessional && !isVet && (
        <View style={styles.vetBadge}>
          <Stethoscope size={12} color="#fff" />
        </View>
      )}
    </Marker>
  );
};

const styles = StyleSheet.create({
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
  vetEmoji: {
    fontSize: 24,
  },
  placeholderText: {
    fontSize: 24,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -2,
  },
  vetBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});

export default MapMarker;
