import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SHADOWS } from '@/constants/colors';
import { User } from '@/types';
import { Marker } from 'react-native-maps';
import { getBlurredUserLocation } from '@/services/location-privacy';
import { Stethoscope } from 'lucide-react-native';

interface UserMarkerProps {
  user: User;
  onPress?: () => void;
}

const UserMarker: React.FC<UserMarkerProps> = ({ user, onPress }) => {
  const blurredLocation = useMemo(() => {
    if (!user.location) return null;
    return getBlurredUserLocation(user.id, user.location);
  }, [user.id, user.location]);

  if (!user.location || !blurredLocation) return null;

  const primaryPet = user.pets?.find((p) => p.isPrimary) || user.pets?.[0];
  const markerColor = primaryPet?.gender === 'male' ? COLORS.male : primaryPet?.gender === 'female' ? COLORS.female : COLORS.primary;
  const isVetProfessional = user.isProfessional && user.professionalData?.activityType === 'vet';

  return (
    <Marker
      coordinate={{
        latitude: blurredLocation.latitude,
        longitude: blurredLocation.longitude,
      }}
      onPress={onPress}
    >
      <View style={[styles.markerContainer, { backgroundColor: markerColor }, SHADOWS.medium]}>
        {primaryPet?.mainPhoto ? (
          <Image
            source={{ uri: primaryPet.mainPhoto }}
            style={styles.image}
            contentFit="cover"
          />
        ) : user.animalPhoto ? (
          <Image
            source={{ uri: user.animalPhoto }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.petEmoji}>🐾</Text>
        )}
      </View>
      <View style={[styles.triangle, { borderTopColor: markerColor }]} />
      {isVetProfessional && (
        <View style={styles.vetBadge}>
          <Stethoscope size={12} color="#fff" />
        </View>
      )}
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
  petEmoji: {
    fontSize: 20,
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

export default UserMarker;
