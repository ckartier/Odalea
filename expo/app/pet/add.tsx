import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import PhotoUploader from '@/components/PhotoUploader';
import BreedSelector from '@/components/BreedSelector';
import SpeciesSelector from '@/components/SpeciesSelector';
import GenderSelector from '@/components/GenderSelector';
import DatePicker from '@/components/DatePicker';
import { CHARACTER_TRAITS, COLOR_OPTIONS } from '@/constants/species';

import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { useQueryClient } from '@tanstack/react-query';
import { StorageService } from '@/services/storage';
import { Gender } from '@/types';
import { ArrowLeft, Plus, Trash2, Tag } from 'lucide-react-native';

export default function AddPetScreen() {
  const router = useRouter();
  const { user, addPet } = useFirebaseUser();
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [uploadingMainPhoto, setUploadingMainPhoto] = useState(false);
  const [uploadingGalleryPhoto, setUploadingGalleryPhoto] = useState<Record<number, boolean>>({});
  
  // Pet data
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [color, setColor] = useState('');
  const [character, setCharacter] = useState<string[]>([]);
  const [distinctiveSign, setDistinctiveSign] = useState('');
  const [microchipNumber, setMicrochipNumber] = useState('');
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [speciesType, setSpeciesType] = useState('');
  const [vetName, setVetName] = useState('');
  const [vetAddress, setVetAddress] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [walkTimes, setWalkTimes] = useState<string[]>(['']);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [species, setSpecies] = useState('');
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Pet name is required';
    }
    
    if (!breed) {
      newErrors.breed = 'Breed is required';
    }
    
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!color) {
      newErrors.color = 'La couleur est requise';
    }
    
    if (character.length === 0) {
      newErrors.character = 'Sélectionnez au moins un trait de caractère';
    }
    
    if (!mainPhoto) {
      newErrors.mainPhoto = 'Main photo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleMainPhotoChange = async (uri: string | null) => {
    if (!user) return;
    
    try {
      setUploadingMainPhoto(true);
      console.log('📤 Uploading main pet photo:', uri);
      
      let photoUrl: string | null = null;
      
      if (uri) {
        const tempPetId = `temp-${Date.now()}`;
        photoUrl = await StorageService.uploadPetPhoto(user.id, tempPetId, uri, {
          onProgress: (progress) => {
            console.log(`📊 Upload progress: ${progress.progress.toFixed(1)}%`);
          },
        });
        console.log('✅ Pet photo uploaded to Firebase Storage:', photoUrl);
      }
      
      setMainPhoto(photoUrl);
    } catch (error) {
      console.error('❌ Error uploading pet photo:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader la photo. Veuillez réessayer.');
    } finally {
      setUploadingMainPhoto(false);
    }
  };

  const handleAddPet = async () => {
    if (!validate() || !user) return;
    
    setLoading(true);
    
    try {
      const petData: any = {
        name,
        type: 'cat' as const,
        breed,
        gender,
        dateOfBirth,
        color,
        character,
        mainPhoto: mainPhoto || '',
        galleryPhotos: galleryPhotos.filter(Boolean),
        walkTimes: walkTimes.filter(Boolean),
        vaccinationDates: [],
        location: {
          latitude: 48.8566 + (Math.random() * 0.02 - 0.01),
          longitude: 2.3522 + (Math.random() * 0.02 - 0.01),
        },
      };
      
      if (distinctiveSign && distinctiveSign.trim()) {
        petData.distinctiveSign = distinctiveSign.trim();
      }
      
      if (microchipNumber && microchipNumber.trim()) {
        petData.microchipNumber = microchipNumber.trim();
      }
      
      if (vetName && vetName.trim()) {
        petData.vet = {
          name: vetName,
          address: vetAddress,
          phoneNumber: vetPhone,
        };
      }
      
      const result = await addPet(petData);
      
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ['allPets-firestore'] });
        
        Alert.alert(
          'Succès',
          `${name} a été ajouté à vos animaux !`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                router.replace('/(tabs)');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to add pet');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddGalleryPhoto = () => {
    setGalleryPhotos([...galleryPhotos, '']);
  };
  
  const handleUpdateGalleryPhoto = async (index: number, uri: string | null) => {
    if (!user) return;
    
    try {
      setUploadingGalleryPhoto(prev => ({ ...prev, [index]: true }));
      
      const updatedPhotos = [...galleryPhotos];
      
      if (uri) {
        console.log('📤 Uploading gallery photo:', uri);
        const tempPetId = `temp-${Date.now()}`;
        const photoUrl = await StorageService.uploadPetPhoto(user.id, tempPetId, uri);
        console.log('✅ Gallery photo uploaded:', photoUrl);
        updatedPhotos[index] = photoUrl;
      } else {
        updatedPhotos.splice(index, 1);
      }
      
      setGalleryPhotos(updatedPhotos);
    } catch (error) {
      console.error('❌ Error uploading gallery photo:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader la photo.');
    } finally {
      setUploadingGalleryPhoto(prev => ({ ...prev, [index]: false }));
    }
  };
  
  const handleAddWalkTime = () => {
    setWalkTimes([...walkTimes, '']);
  };
  
  const handleUpdateWalkTime = (index: number, time: string) => {
    const updatedWalkTimes = [...walkTimes];
    updatedWalkTimes[index] = time;
    setWalkTimes(updatedWalkTimes);
  };
  
  const handleRemoveWalkTime = (index: number) => {
    const updatedWalkTimes = [...walkTimes];
    updatedWalkTimes.splice(index, 1);
    setWalkTimes(updatedWalkTimes);
  };
  
  const toggleCharacterTrait = (traitId: string) => {
    setCharacter(prev => 
      prev.includes(traitId) 
        ? prev.filter(id => id !== traitId)
        : [...prev, traitId]
    );
  };
  
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un animal</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <Text style={styles.sectionTitle}>Informations sur votre animal</Text>
        
        <View style={styles.photoSection}>
          <View style={styles.mainPhotoContainer}>
            <PhotoUploader
              value={mainPhoto || undefined}
              onChange={handleMainPhotoChange}
              placeholder="Photo principale"
              required
            />
            {uploadingMainPhoto && (
              <View style={styles.uploadingOverlay}>
                <Text style={styles.uploadingText}>Upload...</Text>
              </View>
            )}
          </View>
          
          <View style={styles.galleryContainer}>
            {galleryPhotos.map((photo, index) => (
              <View key={index} style={styles.galleryPhotoContainer}>
                <PhotoUploader
                  value={photo}
                  onChange={uri => handleUpdateGalleryPhoto(index, uri)}
                  placeholder="Galerie"
                />
                {uploadingGalleryPhoto[index] && (
                  <View style={styles.uploadingOverlay}>
                    <Text style={styles.uploadingText}>...</Text>
                  </View>
                )}
              </View>
            ))}
            
            {galleryPhotos.length < 3 && (
              <TouchableOpacity
                style={[styles.addPhotoButton, SHADOWS.small]}
                onPress={handleAddGalleryPhoto}
              >
                <Plus size={24} color={COLORS.black} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <Input
          label="Nom de l'animal"
          placeholder="Ex: Minou, Rex, Bella..."
          value={name}
          onChangeText={setName}
          error={errors.name}
        />
        
        <SpeciesSelector
          value={speciesType}
          onChange={(id, name) => setSpeciesType(name)}
          error={errors.species}
        />
        
        <BreedSelector
          value={breed}
          onChange={setBreed}
          error={errors.breed}
        />
        
        <GenderSelector
          value={gender}
          onChange={setGender}
        />
        
        <DatePicker
          label="Date de naissance"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          maximumDate={new Date()}
          error={errors.dateOfBirth}
        />
        
        {/* Color Selection */}
        <Text style={styles.sectionTitle}>Couleur *</Text>
        <Text style={styles.sectionSubtitle}>
          Sélectionnez la couleur principale de votre animal
        </Text>
        
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((colorOption) => (
            <TouchableOpacity
              key={colorOption.id}
              style={[
                styles.colorOption,
                color === colorOption.id && styles.colorOptionActive
              ]}
              onPress={() => setColor(colorOption.id)}
            >
              <Text style={[
                styles.colorText,
                color === colorOption.id && styles.colorTextActive
              ]}>
                {colorOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
        
        {/* Character Traits */}
        <Text style={styles.sectionTitle}>Caractère *</Text>
        <Text style={styles.sectionSubtitle}>
          Sélectionnez les traits qui décrivent le mieux votre animal
        </Text>
        
        <View style={styles.characterGrid}>
          {CHARACTER_TRAITS.map((trait) => (
            <TouchableOpacity
              key={trait.id}
              style={[
                styles.characterTrait,
                character.includes(trait.id) && styles.characterTraitActive
              ]}
              onPress={() => toggleCharacterTrait(trait.id)}
            >
              <Text style={[
                styles.characterText,
                character.includes(trait.id) && styles.characterTextActive
              ]}>
                {trait.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.character && <Text style={styles.errorText}>{errors.character}</Text>}
        
        <Input
          label="Signe distinctif (optionnel)"
          placeholder="Ex: Collier bleu, tache, queue courte..."
          value={distinctiveSign}
          onChangeText={setDistinctiveSign}
          leftIcon={<Tag size={20} color={COLORS.darkGray} />}
        />
        
        <Input
          label="Numéro de puce (optionnel)"
          placeholder="Entrez le numéro de puce"
          value={microchipNumber}
          onChangeText={setMicrochipNumber}
          keyboardType="number-pad"
        />
        
        {/* Vet Information */}
        <Text style={styles.sectionTitle}>Informations vétérinaire (optionnel)</Text>
        
        <Input
          label="Nom du vétérinaire"
          placeholder="Entrez le nom du vétérinaire"
          value={vetName}
          onChangeText={setVetName}
        />
        
        <Input
          label="Adresse du vétérinaire"
          placeholder="Entrez l'adresse du vétérinaire"
          value={vetAddress}
          onChangeText={setVetAddress}
        />
        
        <Input
          label="Téléphone du vétérinaire"
          placeholder="Entrez le numéro de téléphone"
          value={vetPhone}
          onChangeText={setVetPhone}
          keyboardType="phone-pad"
        />
        
        {/* Walk Times */}
        <Text style={styles.sectionTitle}>Heures de promenade (optionnel)</Text>
        
        {walkTimes.map((time, index) => (
          <View key={index} style={styles.walkTimeContainer}>
            <Input
              label={`Heure de promenade ${index + 1}`}
              placeholder="ex: 08:00"
              value={time}
              onChangeText={text => handleUpdateWalkTime(index, text)}
              containerStyle={styles.walkTimeInput}
            />
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveWalkTime(index)}
            >
              <Trash2 size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity
          style={styles.addWalkTimeButton}
          onPress={handleAddWalkTime}
        >
          <Plus size={16} color={COLORS.black} />
          <Text style={styles.addWalkTimeText}>Ajouter une heure</Text>
        </TouchableOpacity>
        
        <Button
          title="Ajouter l'animal"
          onPress={handleAddPet}
          loading={loading}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: 24,
    marginBottom: 16,
  },
  photoSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  mainPhotoContainer: {
    position: 'relative',
  },
  galleryPhotoContainer: {
    position: 'relative',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  uploadingText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  galleryContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 16,
    gap: 8,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 14,
    color: COLORS.black,
    marginTop: 8,
  },
  walkTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  walkTimeInput: {
    flex: 1,
    marginBottom: 8,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
    marginBottom: 8,
  },
  addWalkTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  addWalkTimeText: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 8,
  },
  button: {
    marginTop: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  characterTrait: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  characterTraitActive: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  characterText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  characterTextActive: {
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    minWidth: 80,
  },
  colorOptionActive: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  colorText: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  colorTextActive: {
    color: COLORS.white,
    fontWeight: '600' as const,
  },
});