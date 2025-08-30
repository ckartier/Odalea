import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SHADOWS } from '@/constants/colors';
import { User } from '@/types';
import { Marker } from 'react-native-maps';

interface UserMarkerProps {
  user: User;
  onPress?: () => void;
}

const UserMarker: React.FC<UserMarkerProps> = ({ user, onPress }) => {
  if (!user.location) return null;

  const markerColor = COLORS.primary;

  return (
    <Marker
      coordinate={{
        latitude: user.location.latitude,
        longitude: user.location.longitude,
      }}
      onPress={onPress}
    >
      <View style={[styles.markerContainer, { backgroundColor: markerColor }, SHADOWS.medium]}>
        <Image
          source={{ uri: user.photo || 'https://images.unsplash.com/photo-1549501493-84a1420bb0f2?w=100&h=100&fit=crop&crop=faces' }}
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

export default UserMarker;
