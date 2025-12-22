import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ViewStyle,
  Platform,
  Image as RNImage
} from 'react-native';
import { Image } from 'expo-image';

import { useRouter } from 'expo-router';
import { COLORS, SHADOWS, RESPONSIVE_FONT_SIZES, moderateScale } from '@/constants/colors';
import { Pet } from '@/types';
import { MapPin, Palette, Heart } from 'lucide-react-native';
import GlassView from './GlassView';

interface PetCardProps {
  pet: Pet;
  style?: ViewStyle;
  showLocation?: boolean;
  onPress?: () => void;
}

const PetCard: React.FC<PetCardProps> = ({
  pet,
  style,
  showLocation = false,
  onPress,
}) => {
  const router = useRouter();

  const rawCharacter: unknown = (pet as unknown as { character?: unknown })?.character;
  const characterList: string[] = Array.isArray(rawCharacter)
    ? (rawCharacter as string[])
    : (typeof rawCharacter === 'string' && rawCharacter.trim()
        ? (rawCharacter as string).split(/[;,]/).map((s: string) => s.trim()).filter(Boolean)
        : []);

  const mainPhotoUri: string = (pet.mainPhoto ?? '').trim().length > 0
    ? pet.mainPhoto
    : 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&q=80&auto=format&fit=crop';
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/pet/${pet.id}`);
    }
  };
  
  const getTint = () => {
    return pet.gender === 'male' ? 'male' as const : 'female' as const;
  };
  
  const getAge = () => {
    if (!pet.dateOfBirth) return '';
    const birthDate = new Date(pet.dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age === 0) {
      const monthAge = today.getMonth() - birthDate.getMonth() + 
        (today.getFullYear() - birthDate.getFullYear()) * 12;
      return `${monthAge} month${monthAge !== 1 ? 's' : ''}`;
    }
    
    return `${age} year${age !== 1 ? 's' : ''}`;
  };

  // Use RNImage for Web to ensure compatibility if expo-image has issues
  const ImageComponent = Platform.OS === 'web' ? RNImage : Image;
  
  return (
    <TouchableOpacity
      testID={`pet-card-${pet.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Open ${pet.name} details`}
      onPress={handlePress}
      activeOpacity={0.8}
      style={style}
    >
      <GlassView
        tint={getTint()}
        liquidGlass={true}
        style={[
          styles.container,
          pet.gender === 'male' ? SHADOWS.liquidGlass : SHADOWS.liquidGlassFemale,
        ]}
      >
        <ImageComponent
          source={{ uri: mainPhotoUri }}
          style={styles.image as any}
          contentFit="cover"
          resizeMode="cover"
          transition={200}
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.breed}>{pet.breed}</Text>
          <Text style={styles.age}>{getAge()}</Text>
          
          {pet.color && (
            <View style={styles.detailContainer}>
              <Palette size={12} color={COLORS.black} />
              <Text style={styles.detail}>{pet.color}</Text>
            </View>
          )}
          
          {characterList.length > 0 && (
            <View style={styles.detailContainer}>
              <Heart size={12} color={COLORS.black} />
              <Text style={styles.detail}>{characterList.slice(0, 2).join(', ')}{characterList.length > 2 ? '...' : ''}</Text>
            </View>
          )}
          
          {showLocation && pet.location && (
            <View style={styles.locationContainer}>
              <MapPin size={14} color={COLORS.black} />
              <Text style={styles.location}>Nearby</Text>
            </View>
          )}
        </View>
      </GlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    width: moderateScale(140),
  },
  image: {
    width: '100%',
    height: moderateScale(110),
  },
  infoContainer: {
    padding: moderateScale(10),
  },
  name: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: moderateScale(2),
  },
  breed: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.black,
    opacity: 0.8,
    marginBottom: moderateScale(2),
  },
  age: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.black,
    opacity: 0.7,
  },
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(2),
  },
  detail: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.black,
    opacity: 0.7,
    marginLeft: moderateScale(4),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  location: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.black,
    opacity: 0.7,
    marginLeft: moderateScale(4),
  },
});

export default PetCard;
