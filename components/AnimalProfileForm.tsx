import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import GenderSelector from '@/components/GenderSelector';
import PhotoUploader from '@/components/PhotoUploader';
import { 
  Heart, 
  Calendar, 
  Palette, 
  Smile,
  Camera,
  Plus,
  X,
  Tag
} from 'lucide-react-native';
import animalsData from '@/data/animals.json';

interface AnimalProfileFormProps {
  onSubmit: (animalData: AnimalData) => void;
  onCancel?: () => void;
  initialData?: Partial<AnimalData>;
  loading?: boolean;
}

interface AnimalData {
  name: string;
  species: string;
  breed: string;
  gender: 'male' | 'female';
  birthDate: string;
  color: string;
  character: string[];
  distinctiveSign?: string;
  mainPhoto: string;
  galleryPhotos: string[];
  description: string;
}

const CHARACTER_TRAITS = [
  { id: 'joueur', label: 'Joueur' },
  { id: 'calme', label: 'Calme' },
  { id: 'calin', label: 'Câlin' },
  { id: 'independant', label: 'Indépendant' },
  { id: 'sociable', label: 'Sociable' },
  { id: 'peureux', label: 'Peureux' },
  { id: 'curieux', label: 'Curieux' },
  { id: 'energetique', label: 'Énergétique' },
  { id: 'gourmand', label: 'Gourmand' },
  { id: 'protecteur', label: 'Protecteur' },
  { id: 'intelligent', label: 'Intelligent' },
  { id: 'docile', label: 'Docile' },
  { id: 'tetu', label: 'Têtu' },
  { id: 'chasseur', label: 'Chasseur' },
  { id: 'affectueux', label: 'Affectueux' },
  { id: 'timide', label: 'Timide' },
  { id: 'aventurier', label: 'Aventurier' },
] as const;

const COLOR_OPTIONS = [
  { id: 'noir', label: 'Noir' },
  { id: 'blanc', label: 'Blanc' },
  { id: 'gris', label: 'Gris' },
  { id: 'marron', label: 'Marron' },
  { id: 'fauve', label: 'Fauve' },
  { id: 'roux', label: 'Roux' },
  { id: 'creme', label: 'Crème' },
  { id: 'bleu', label: 'Bleu' },
  { id: 'chocolat', label: 'Chocolat' },
  { id: 'lilas', label: 'Lilas' },
  { id: 'sable', label: 'Sable' },
  { id: 'argent', label: 'Argenté' },
  { id: 'bringé', label: 'Bringé' },
  { id: 'tigre', label: 'Tigré' },
  { id: 'ecaille', label: 'Écaille de tortue' },
  { id: 'bicolore', label: 'Bicolore' },
  { id: 'tricolore', label: 'Tricolore' },
  { id: 'multicolore', label: 'Multicolore' },
  { id: 'autre', label: 'Autre' },
] as const;

export default function AnimalProfileForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  loading = false 
}: AnimalProfileFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [selectedSpecies, setSelectedSpecies] = useState(initialData?.species || '');
  const [selectedBreed, setSelectedBreed] = useState(initialData?.breed || '');
  const [gender, setGender] = useState<'male' | 'female'>(initialData?.gender || 'male');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || '');
  const [color, setColor] = useState(initialData?.color || '');
  const [selectedCharacter, setSelectedCharacter] = useState(initialData?.character?.[0] || '');
  const [distinctiveSign, setDistinctiveSign] = useState(initialData?.distinctiveSign || '');
  const [mainPhoto, setMainPhoto] = useState(initialData?.mainPhoto || '');
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(initialData?.galleryPhotos || []);
  const [description, setDescription] = useState(initialData?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [availableBreeds, setAvailableBreeds] = useState<any[]>([]);

  useEffect(() => {
    if (selectedSpecies) {
      const species = animalsData.species.find(s => s.id === selectedSpecies);
      setAvailableBreeds(species?.breeds || []);
      if (!species?.breeds.find(b => b.id === selectedBreed)) {
        setSelectedBreed('');
      }
    } else {
      setAvailableBreeds([]);
      setSelectedBreed('');
    }
  }, [selectedSpecies]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom de l\'animal est requis';
    }

    if (!selectedSpecies) {
      newErrors.species = 'L\'espèce est requise';
    }

    if (!selectedBreed) {
      newErrors.breed = 'La race est requise';
    }

    if (!birthDate) {
      newErrors.birthDate = 'La date de naissance est requise';
    }

    if (!color.trim()) {
      newErrors.color = 'La couleur est requise';
    }

    if (!selectedCharacter) {
      newErrors.character = 'Le caractère est requis';
    }

    if (!mainPhoto) {
      newErrors.mainPhoto = 'Une photo principale est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const animalData: AnimalData = {
        name,
        species: selectedSpecies,
        breed: selectedBreed,
        gender,
        birthDate,
        color,
        character: [selectedCharacter],
        distinctiveSign,
        mainPhoto,
        galleryPhotos,
        description,
      };
      onSubmit(animalData);
    }
  };



  const addGalleryPhoto = (photoUri: string) => {
    if (galleryPhotos.length < 3) {
      setGalleryPhotos(prev => [...prev, photoUri]);
    } else {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 3 photos à la galerie');
    }
  };

  const removeGalleryPhoto = (index: number) => {
    setGalleryPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Profil de votre animal</Text>
        <Text style={styles.subtitle}>
          Créez un profil complet pour votre compagnon
        </Text>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de base</Text>
          
          <Input
            label="Nom de l'animal"
            placeholder="Ex: Minou, Rex, Bella..."
            value={name}
            onChangeText={setName}
            error={errors.name}
            leftIcon={<Heart size={20} color={COLORS.darkGray} />}
          />

          {/* Species Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Espèce</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.speciesScroll}
            >
              {animalsData.species.map((species) => (
                <TouchableOpacity
                  key={species.id}
                  style={[
                    styles.speciesOption,
                    selectedSpecies === species.id && styles.speciesOptionActive
                  ]}
                  onPress={() => setSelectedSpecies(species.id)}
                >
                  <Text style={styles.speciesEmoji}>{species.emoji}</Text>
                  <Text style={[
                    styles.speciesText,
                    selectedSpecies === species.id && styles.speciesTextActive
                  ]}>
                    {species.name.fr}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.species && <Text style={styles.errorText}>{errors.species}</Text>}
          </View>

          {/* Breed Selection */}
          {availableBreeds.length > 0 && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Race</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.breedScroll}
              >
                {availableBreeds.map((breed) => (
                  <TouchableOpacity
                    key={breed.id}
                    style={[
                      styles.breedOption,
                      selectedBreed === breed.id && styles.breedOptionActive
                    ]}
                    onPress={() => setSelectedBreed(breed.id)}
                  >
                    <Text style={[
                      styles.breedText,
                      selectedBreed === breed.id && styles.breedTextActive
                    ]}>
                      {breed.name.fr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.breed && <Text style={styles.errorText}>{errors.breed}</Text>}
            </View>
          )}

          <GenderSelector
            value={gender}
            onChange={setGender}
            style={styles.genderSelector}
          />

          <Input
            label="Date de naissance"
            placeholder="JJ/MM/AAAA"
            value={birthDate}
            onChangeText={setBirthDate}
            error={errors.birthDate}
            leftIcon={<Calendar size={20} color={COLORS.darkGray} />}
          />

          {/* Color Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Couleur *</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.colorScroll}
            >
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
            </ScrollView>
            {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
          </View>

          <Input
            label="Signe distinctif (optionnel)"
            placeholder="Ex: Collier bleu, tache, queue courte..."
            value={distinctiveSign}
            onChangeText={setDistinctiveSign}
            leftIcon={<Tag size={20} color={COLORS.darkGray} />}
          />
        </View>

        {/* Character */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caractère *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.characterScroll}
          >
            {CHARACTER_TRAITS.map((trait) => (
              <TouchableOpacity
                key={trait.id}
                style={[
                  styles.characterOption,
                  selectedCharacter === trait.id && styles.characterOptionActive
                ]}
                onPress={() => setSelectedCharacter(trait.id)}
              >
                <Text style={[
                  styles.characterText,
                  selectedCharacter === trait.id && styles.characterTextActive
                ]}>
                  {trait.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.character && <Text style={styles.errorText}>{errors.character}</Text>}
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          
          {/* Main Photo */}
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Photo principale</Text>
            <PhotoUploader
              onPhotoSelected={setMainPhoto}
              currentPhoto={mainPhoto}
              placeholder="Ajouter la photo principale"
              style={styles.mainPhotoUploader}
            />
            {errors.mainPhoto && <Text style={styles.errorText}>{errors.mainPhoto}</Text>}
          </View>

          {/* Gallery Photos */}
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>
              Galerie ({galleryPhotos.length}/3)
            </Text>
            <View style={styles.galleryContainer}>
              {galleryPhotos.map((photo, index) => (
                <View key={index} style={styles.galleryPhotoContainer}>
                  <Image source={{ uri: photo }} style={styles.galleryPhoto} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removeGalleryPhoto(index)}
                  >
                    <X size={16} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {galleryPhotos.length < 3 && (
                <PhotoUploader
                  onPhotoSelected={addGalleryPhoto}
                  placeholder=""
                  style={styles.galleryPhotoUploader}
                  showIcon={true}
                  icon={<Plus size={24} color={COLORS.darkGray} />}
                />
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Input
            label="Description (optionnel)"
            placeholder="Parlez-nous de votre animal, ses habitudes, ce qu'il aime..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            leftIcon={<Smile size={20} color={COLORS.darkGray} />}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Créer le profil"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
          
          {onCancel && (
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  speciesScroll: {
    marginBottom: 8,
  },
  speciesOption: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    minWidth: 80,
  },
  speciesOptionActive: {
    backgroundColor: COLORS.maleAccent,
    borderColor: COLORS.maleAccent,
  },
  speciesEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  speciesText: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  speciesTextActive: {
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  breedScroll: {
    marginBottom: 8,
  },
  breedOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  breedOptionActive: {
    backgroundColor: COLORS.maleAccent,
    borderColor: COLORS.maleAccent,
  },
  breedText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  breedTextActive: {
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  genderSelector: {
    marginBottom: 16,
  },
  colorScroll: {
    marginBottom: 8,
  },
  colorOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  colorOptionActive: {
    backgroundColor: COLORS.maleAccent,
    borderColor: COLORS.maleAccent,
  },
  colorText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  colorTextActive: {
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  characterScroll: {
    marginBottom: 8,
  },
  characterOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  characterOptionActive: {
    backgroundColor: COLORS.maleAccent,
    borderColor: COLORS.maleAccent,
  },
  characterText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  characterTextActive: {
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  mainPhotoUploader: {
    height: 200,
  },
  galleryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryPhotoContainer: {
    position: 'relative',
  },
  galleryPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  galleryPhotoUploader: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 40,
  },
  submitButton: {
    marginBottom: 16,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
});