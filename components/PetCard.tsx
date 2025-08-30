import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ViewStyle 
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS, RESPONSIVE_FONT_SIZES } from '@/constants/colors';
import { Pet } from '@/types';
import { MapPin, Palette, Heart } from 'lucide-react-native';

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

  console.log('[PetCard] render', { petId: pet?.id });

  const rawCharacter: unknown = (pet as unknown as { character?: unknown })?.character;
  const characterList: string[] = Array.isArray(rawCharacter)
    ? (rawCharacter as string[])
    : (typeof rawCharacter === 'string' && rawCharacter.trim()
        ? (rawCharacter as string).split(/[;,]/).map((s: string) => s.trim()).filter(Boolean)
        : []);

  if (!Array.isArray(rawCharacter) && rawCharacter) {
    console.log('[PetCard] normalized character to array', characterList);
  }

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
  
  const getBackgroundColor = () => {
    if (pet.gender === 'male') {
      return 'rgba(177, 230, 246, 0.8)';
    }
    return 'rgba(242, 188, 215, 0.8)';
  };
  
  const getAge = () => {
    const birthDate = new Date(pet.dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age === 0) {
      // Calculate months for kittens
      const monthAge = today.getMonth() - birthDate.getMonth() + 
        (today.getFullYear() - birthDate.getFullYear()) * 12;
      return `${monthAge} month${monthAge !== 1 ? 's' : ''}`;
    }
    
    return `${age} year${age !== 1 ? 's' : ''}`;
  };
  
  return (
    <TouchableOpacity
      testID={`pet-card-${pet.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Open ${pet.name} details`}
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        SHADOWS.medium,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: mainPhotoUri }}
        style={styles.image}
        contentFit="cover"
        transition={300}
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 130,
    height: 170,
  },
  image: {
    width: '100%',
    height: 100,
  },
  infoContainer: {
    padding: 6,
  },
  name: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  breed: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.black,
    opacity: 0.8,
    marginBottom: 2,
  },
  age: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.black,
    opacity: 0.7,
  },
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detail: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.black,
    opacity: 0.7,
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.black,
    opacity: 0.7,
    marginLeft: 4,
  },
});

export default PetCard;