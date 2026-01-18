import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { getPetImageUrl, DEFAULT_PET_PLACEHOLDER } from '@/lib/image-helpers';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme/tokens';
import { usePets } from '@/hooks/pets-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { Pet, User } from '@/types';
import { 
  Edit2, 
  Heart,
  Syringe,
  Stethoscope,
  ShieldCheck,
  User as UserIcon,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function PetProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getPet, getPetOwner } = usePets();
  const { user } = useFirebaseUser();
  const insets = useSafeAreaInsets();
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [petOwner, setPetOwner] = useState<User | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  useEffect(() => {
    if (id) {
      const petData = getPet(id as string);
      if (petData) {
        setPet(petData);
        const owner = getPetOwner(id as string);
        if (owner) {
          setPetOwner(owner);
        } else if (petData.ownerId && user && petData.ownerId === user.id) {
          setPetOwner(user);
        }
      } else {
        Alert.alert('Erreur', 'Animal non trouvé');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/home');
        }
      }
    }
  }, [id, getPet, getPetOwner, user, router]);
  
  const handlePhotoPress = (index: number) => {
    setCurrentPhotoIndex(index);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  const calculateAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age === 0) {
      const monthAge = today.getMonth() - birthDate.getMonth() + 
        (today.getFullYear() - birthDate.getFullYear()) * 12;
      return `${monthAge} mois`;
    }
    
    return `${age} an${age !== 1 ? 's' : ''}`;
  };
  
  const getSpeciesLabel = () => {
    if (pet?.type === 'dog') return 'Chien';
    if (pet?.type === 'cat') return 'Chat';
    return pet?.type || 'Autre';
  };
  
  const isOwner = pet && user && pet.ownerId === user.id;
  
  if (!pet) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }
  
  const mainPhotoUrl = getPetImageUrl(pet);
  const allPhotos = [
    mainPhotoUrl || DEFAULT_PET_PLACEHOLDER,
    ...(pet.galleryPhotos?.filter(url => url && url.startsWith('https://')) || [])
  ].filter(Boolean);
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View style={styles.headerImageContainer}>
          <Image
            source={{ uri: allPhotos[currentPhotoIndex] || DEFAULT_PET_PLACEHOLDER }}
            style={styles.headerImage}
            contentFit="cover"
          />
          
          {/* Header Overlay */}
          <View style={[styles.headerOverlay, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            {isOwner && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push(`/pet/edit/${pet.id}`)}
              >
                <Edit2 size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Photo Indicators */}
          {allPhotos.length > 1 && (
            <View style={styles.photoIndicators}>
              {allPhotos.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.photoIndicator,
                    currentPhotoIndex === index && styles.activePhotoIndicator,
                  ]}
                  onPress={() => handlePhotoPress(index)}
                />
              ))}
            </View>
          )}
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Identity Section */}
          <View style={styles.identitySection}>
            <Text style={styles.petName}>{pet.name}</Text>
            <View style={styles.identityRow}>
              <Text style={styles.identityText}>
                {pet.gender === 'male' ? '♂' : '♀'} • {calculateAge(pet.dateOfBirth)} • {pet.breed}
              </Text>
            </View>
          </View>
          
          {/* Basic Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <UserIcon size={20} color={COLORS.textSecondary} />
              <Text style={styles.cardTitle}>Informations</Text>
            </View>
            
            <InfoRow label="Nom" value={pet.name} />
            <InfoRow label="Espèce" value={getSpeciesLabel()} />
            <InfoRow label="Race" value={pet.breed} />
            <InfoRow label="Sexe" value={pet.gender === 'male' ? 'Mâle' : 'Femelle'} />
            <InfoRow label="Date de naissance" value={formatDate(pet.dateOfBirth)} isLast />
          </View>
          
          {/* Character Card */}
          {pet.character && pet.character.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Heart size={20} color={COLORS.textSecondary} />
                <Text style={styles.cardTitle}>Caractère</Text>
              </View>
              <View style={styles.tagsContainer}>
                {pet.character.map((trait, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Medical Info - Only for owner */}
          {isOwner && (
            <>
              {/* Microchip */}
              {pet.microchipNumber && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <ShieldCheck size={20} color={COLORS.textSecondary} />
                    <Text style={styles.cardTitle}>Identification</Text>
                  </View>
                  <InfoRow label="N° de puce" value={pet.microchipNumber} isLast />
                </View>
              )}
              
              {/* Veterinarian */}
              {pet.vet && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Stethoscope size={20} color={COLORS.textSecondary} />
                    <Text style={styles.cardTitle}>Vétérinaire</Text>
                  </View>
                  <InfoRow label="Nom" value={pet.vet.name} />
                  <InfoRow label="Adresse" value={pet.vet.address} />
                  <InfoRow label="Téléphone" value={pet.vet.phoneNumber} isLast />
                </View>
              )}
              
              {/* Vaccinations */}
              {pet.vaccinationDates && pet.vaccinationDates.length > 0 && (
                <TouchableOpacity style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Syringe size={20} color={COLORS.textSecondary} />
                    <Text style={styles.cardTitle}>Vaccins</Text>
                    <View style={styles.cardHeaderRight}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{pet.vaccinationDates.length}</Text>
                      </View>
                      <ChevronRight size={20} color={COLORS.textTertiary} />
                    </View>
                  </View>
                  {pet.vaccinationDates.slice(0, 2).map((vaccination, index) => (
                    <View key={vaccination.id} style={[styles.infoRow, index === 1 && styles.infoRowLast]}>
                      <Text style={styles.infoLabel}>{vaccination.name}</Text>
                      <Text style={styles.infoValue}>{formatDate(vaccination.date)}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              )}
            </>
          )}
          
          {/* Owner Info (if not owner) */}
          {!isOwner && petOwner && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <UserIcon size={20} color={COLORS.textSecondary} />
                <Text style={styles.cardTitle}>Propriétaire</Text>
              </View>
              <InfoRow label="Pseudo" value={`@${petOwner.pseudo}`} />
              {petOwner.city && (
                <InfoRow 
                  label="Localisation" 
                  value={`${petOwner.city}, ${petOwner.zipCode}`} 
                  isLast 
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function InfoRow({ label, value, isLast }: InfoRowProps) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerImageContainer: {
    position: 'relative',
    width: width,
    height: width * 0.75,
    backgroundColor: COLORS.surface,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  photoIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activePhotoIndicator: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  identitySection: {
    marginBottom: 8,
  },
  petName: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  identityText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginLeft: 10,
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: COLORS.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.primary,
  },
});
