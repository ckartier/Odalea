import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Pet } from '@/types';
import { Marker } from 'react-native-maps';

interface MapMarkerProps {
  pet: Pet & { owner?: any };
  onPress?: () => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({ pet, onPress }) => {
  if (!pet.location) return null;

  const markerColor = pet.gender === 'male' ? COLORS.male : COLORS.female;

  return (
    <Marker
      coordinate={{
        latitude: pet.location.latitude,
        longitude: pet.location.longitude,
      }}
      onPress={onPress}
    >
      <View style={[
        styles.markerContainer,
        { backgroundColor: markerColor },
        SHADOWS.medium,
      ]}>
        <Image
          source={{ uri: pet.mainPhoto }}
          style={styles.image}
          contentFit="cover"
        />
      </View>
      <View style={[styles.triangle, { borderTopColor: markerColor }]} />
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  image: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
});

export default MapMarker;
