import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Pet } from '@/types';
import { Marker } from 'react-native-maps';
import { getBlurredPetLocation } from '@/services/location-privacy';
import { Stethoscope, Home, GraduationCap } from 'lucide-react-native';

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

  const markerColor = isVet ? '#10b981' : (pet.gender === 'male' ? COLORS.male : COLORS.female);
  
  const professionalBadge = useMemo(() => {
    if (!pet.owner?.isProfessional) return null;
    const activityType = pet.owner.professionalData?.activityType;
    
    if (activityType === 'vet') {
      return { Icon: Stethoscope, color: '#10b981' };
    }
    if (pet.owner.isCatSitter || activityType === 'catSitter') {
      return { Icon: Home, color: '#6366f1' };
    }
    if (activityType === 'breeder') {
      return { Icon: Home, color: '#f59e0b' };
    }
    if (activityType === 'shelter') {
      return { Icon: Home, color: '#8b5cf6' };
    }
    if (activityType === 'educator') {
      return { Icon: GraduationCap, color: '#06b6d4' };
    }
    return null;
  }, [pet.owner]);

  if (!pet.location || !blurredLocation) return null;

  return (
    <Marker
      coordinate={{
        latitude: blurredLocation.latitude,
        longitude: blurredLocation.longitude,
      }}
      onPress={onPress}
      tracksViewChanges={false} // Performance optimization
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
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <Text style={styles.placeholderText}>🐱</Text>
        )}
      </View>
      <View style={[styles.triangle, { borderTopColor: markerColor }]} />
      {professionalBadge && !isVet && (
        <View style={[styles.proBadge, { backgroundColor: professionalBadge.color }]}>
          <professionalBadge.Icon size={12} color="#fff" strokeWidth={2.5} />
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
  proBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});

export default MapMarker;
