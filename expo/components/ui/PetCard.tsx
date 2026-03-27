import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { Check } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY, COMPONENT_SIZES } from '@/theme/tokens';

interface PetCardProps {
  id: string;
  name: string;
  breed?: string;
  photoUrl?: string;
  isActive?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=300';
const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export function PetCard({
  name,
  breed,
  photoUrl,
  isActive = false,
  onPress,
  onLongPress,
  disabled = false,
  style,
}: PetCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isActive && styles.cardActive,
        pressed && styles.cardPressed,
        style,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
    >
      <Image
        source={{ uri: photoUrl || PLACEHOLDER_IMAGE }}
        style={styles.image}
        contentFit="cover"
        placeholder={BLURHASH}
        transition={200}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {breed && (
          <Text style={styles.breed} numberOfLines={1}>{breed}</Text>
        )}
      </View>
      {isActive && (
        <View style={styles.activeBadge}>
          <Check size={14} color={COLORS.textInverse} strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
}

const CARD_WIDTH = COMPONENT_SIZES.petCardWidth;
const IMAGE_HEIGHT = Math.round(CARD_WIDTH / COMPONENT_SIZES.petCardImageRatio);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.card,
  },
  cardActive: {
    borderColor: COLORS.primary,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: COLORS.surfaceSecondary,
  },
  info: {
    padding: SPACING.m,
  },
  name: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  breed: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  activeBadge: {
    position: 'absolute',
    top: SPACING.s,
    right: SPACING.s,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
