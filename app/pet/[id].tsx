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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import { usePets } from '@/hooks/pets-store';
import { useMessaging } from '@/hooks/messaging-store';
import { useAuth } from '@/hooks/auth-store';
import { Pet } from '@/types';
import { DemoUser } from '@/mocks/demo-users';
import { 
  Calendar, 
  Clock, 
  Edit, 
  MapPin, 
  MessageSquare, 
  Phone, 
  UserCheck, 
  UserPlus,
  Palette,
  Heart,
  Tag
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = width;

export default function PetProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getPet, getPetOwner } = usePets();
  const { user } = useAuth();
  const { 
    areFriends, 
    hasPendingRequest, 
    sendFriendRequest 
  } = useMessaging();
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [petOwner, setPetOwner] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Load pet data
  useEffect(() => {
    if (id) {
      const petData = getPet(id as string);
      if (petData) {
        setPet(petData);
        // Try to get demo user owner info
        const owner = getPetOwner(id as string);
        if (owner) {
          setPetOwner(owner);
        }
      } else {
        Alert.alert('Error', 'Pet not found');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/home');
        }
      }
    }
  }, [id, getPet, getPetOwner]);
  
  const handleSendMessage = () => {
    if (pet) {
      router.push(`/messages/new?userId=${pet.ownerId}`);
    }
  };
  
  const handleAddFriend = async () => {
    if (!pet) return;
    
    setLoading(true);
    
    try {
      await sendFriendRequest.mutateAsync(pet.ownerId);
      Alert.alert('Success', 'Friend request sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditPet = () => {
    if (pet) {
      router.push(`/pet/edit/${pet.id}`);
    }
  };
  
  const handlePhotoPress = (index: number) => {
    setCurrentPhotoIndex(index);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      // Calculate months for kittens
      const monthAge = today.getMonth() - birthDate.getMonth() + 
        (today.getFullYear() - birthDate.getFullYear()) * 12;
      return `${monthAge} month${monthAge !== 1 ? 's' : ''}`;
    }
    
    return `${age} year${age !== 1 ? 's' : ''}`;
  };
  
  const isOwner = pet && user && pet.ownerId === user.id;
  
  // Get display name for pet owner (using pseudonym for privacy)
  const getOwnerDisplayName = () => {
    if (petOwner) {
      return `@${petOwner.pseudonym}`;
    }
    return 'Unknown Owner';
  };
  
  if (!pet) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading pet profile...</Text>
      </View>
    );
  }
  
  // All photos including main photo and gallery
  const allPhotos = [pet.mainPhoto, ...pet.galleryPhotos];
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Stack.Screen 
        options={{
          title: pet.name,
          headerTintColor: COLORS.white,
          headerTransparent: true,
          headerBackground: () => (
            <View style={styles.headerBackground} />
          ),
        }} 
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Photo */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: allPhotos[currentPhotoIndex] }}
            style={styles.mainPhoto}
            contentFit="cover"
          />
          
          {/* Photo Indicators */}
          {allPhotos.length > 1 && (
            <View style={styles.photoIndicators}>
              {allPhotos.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.photoIndicator,
                    currentPhotoIndex === index ? styles.activePhotoIndicator : null,
                  ]}
                  onPress={() => handlePhotoPress(index)}
                />
              ))}
            </View>
          )}
          
          {/* Gender Badge */}
          <View
            style={[
              styles.genderBadge,
              {
                backgroundColor:
                  pet.gender === 'male' ? COLORS.male : COLORS.female,
              },
            ]}
          >
            <Text style={styles.genderText}>
              {pet.gender === 'male' ? 'Male' : 'Female'}
            </Text>
          </View>
        </View>
        
        {/* Pet Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{pet.name}</Text>
            <Text style={styles.age}>{calculateAge(pet.dateOfBirth)}</Text>
          </View>
          
          <Text style={styles.breed}>{pet.breed}</Text>
          
          {/* Color and Character Info */}
          <View style={styles.characteristicsContainer}>
            {pet.color && (
              <View style={styles.characteristicItem}>
                <Palette size={16} color={COLORS.maleAccent} />
                <Text style={styles.characteristicLabel}>Couleur:</Text>
                <Text style={styles.characteristicValue}>{pet.color}</Text>
              </View>
            )}
            
            {pet.character && pet.character.length > 0 && (
              <View style={styles.characteristicItem}>
                <Heart size={16} color={COLORS.maleAccent} />
                <Text style={styles.characteristicLabel}>Caractère:</Text>
                <Text style={styles.characteristicValue}>{pet.character.join(', ')}</Text>
              </View>
            )}
            
            {pet.distinctiveSign && (
              <View style={styles.characteristicItem}>
                <Tag size={16} color={COLORS.maleAccent} />
                <Text style={styles.characteristicLabel}>Signe distinctif:</Text>
                <Text style={styles.characteristicValue}>{pet.distinctiveSign}</Text>
              </View>
            )}
          </View>
          
          {/* Owner Info for Demo Pets */}
          {petOwner && (
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerLabel}>Owner:</Text>
              <Text style={styles.ownerName}>{getOwnerDisplayName()}</Text>
              {petOwner.city && (
                <Text style={styles.ownerLocation}>
                  {petOwner.city}, {petOwner.zipCode}
                </Text>
              )}
            </View>
          )}
          
          {/* Action Buttons */}
          {isOwner ? (
            <TouchableOpacity
              style={[styles.editButton, SHADOWS.small]}
              onPress={handleEditPet}
            >
              <Edit size={20} color={COLORS.maleAccent} />
              <Text style={styles.editButtonText}>Edit Pet</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtons}>
              {areFriends(pet.ownerId) ? (
                <Button
                  title="Message"
                  onPress={handleSendMessage}
                  icon={<MessageSquare size={16} color={COLORS.white} />}
                  style={styles.actionButton}
                />
              ) : hasPendingRequest(pet.ownerId) ? (
                <Button
                  title="Request Pending"
                  onPress={() => {}}
                  disabled
                  icon={<UserCheck size={16} color={COLORS.white} />}
                  style={styles.actionButton}
                />
              ) : (
                <Button
                  title="Add Friend"
                  onPress={handleAddFriend}
                  loading={loading}
                  icon={<UserPlus size={16} color={COLORS.white} />}
                  style={styles.actionButton}
                />
              )}
            </View>
          )}
          
          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Calendar size={20} color={COLORS.darkGray} />
              <View>
                <Text style={styles.detailLabel}>Birth Date</Text>
                <Text style={styles.detailValue}>{formatDate(pet.dateOfBirth)}</Text>
              </View>
            </View>
            
            {pet.microchipNumber && (
              <View style={styles.detailItem}>
                <MapPin size={20} color={COLORS.darkGray} />
                <View>
                  <Text style={styles.detailLabel}>Microchip</Text>
                  <Text style={styles.detailValue}>{pet.microchipNumber}</Text>
                </View>
              </View>
            )}
            
            {pet.walkTimes && pet.walkTimes.length > 0 && (
              <View style={styles.detailItem}>
                <Clock size={20} color={COLORS.darkGray} />
                <View>
                  <Text style={styles.detailLabel}>Walk Times</Text>
                  <Text style={styles.detailValue}>
                    {pet.walkTimes.join(', ')}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Vet Information */}
          {pet.vet && (
            <>
              <Text style={styles.sectionTitle}>Vet Information</Text>
              
              <View style={[styles.vetCard, SHADOWS.small]}>
                <Text style={styles.vetName}>{pet.vet.name}</Text>
                <Text style={styles.vetAddress}>{pet.vet.address}</Text>
                
                <View style={styles.phoneContainer}>
                  <Phone size={16} color={COLORS.maleAccent} />
                  <Text style={styles.vetPhone}>{pet.vet.phoneNumber}</Text>
                </View>
              </View>
            </>
          )}
          
          {/* Vaccination Dates - Only visible to pet owner for privacy */}
          {isOwner && pet.vaccinationDates && pet.vaccinationDates.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Vaccinations</Text>
              
              {pet.vaccinationDates.map(vaccination => (
                <View 
                  key={vaccination.id} 
                  style={[styles.vaccinationCard, SHADOWS.small]}
                >
                  <Text style={styles.vaccinationName}>{vaccination.name}</Text>
                  
                  <View style={styles.vaccinationDates}>
                    <View style={styles.vaccinationDate}>
                      <Text style={styles.vaccinationDateLabel}>Date</Text>
                      <Text style={styles.vaccinationDateValue}>
                        {formatDate(vaccination.date)}
                      </Text>
                    </View>
                    
                    <View style={styles.vaccinationDate}>
                      <Text style={styles.vaccinationDateLabel}>Reminder</Text>
                      <Text style={styles.vaccinationDateValue}>
                        {formatDate(vaccination.reminderDate)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photoContainer: {
    position: 'relative',
  },
  mainPhoto: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    opacity: 0.5,
  },
  activePhotoIndicator: {
    opacity: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  genderBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  genderText: {
    color: COLORS.black,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  infoContainer: {
    padding: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  age: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  breed: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  characteristicsContainer: {
    marginBottom: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  characteristicLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
    marginLeft: 8,
    marginRight: 4,
  },
  characteristicValue: {
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
  },
  ownerInfo: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  ownerLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.primary,
    marginBottom: 2,
  },
  ownerLocation: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.maleAccent,
    marginBottom: 24,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.maleAccent,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  vetCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  vetName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  vetAddress: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vetPhone: {
    fontSize: 14,
    color: COLORS.maleAccent,
    marginLeft: 8,
  },
  vaccinationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  vaccinationName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  vaccinationDates: {
    flexDirection: 'row',
  },
  vaccinationDate: {
    flex: 1,
  },
  vaccinationDateLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  vaccinationDateValue: {
    fontSize: 14,
    color: COLORS.black,
  },
});