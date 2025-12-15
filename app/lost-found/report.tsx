import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useLostFound } from '@/hooks/lost-found-store';
import { useTheme } from '@/hooks/theme-store';
import { useAuth } from '@/hooks/auth-store';
import { Camera, MapPin, Calendar, DollarSign, Plus, X } from 'lucide-react-native';
import Button from '@/components/Button';
import PhotoUploader from '@/components/PhotoUploader';
import DatePicker from '@/components/DatePicker';
import Input from '@/components/Input';
import GlassView from '@/components/GlassView';

export default function ReportLostPetScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { createLostPetReport, isCreating } = useLostFound();
  const { getThemedColor } = useTheme();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    petName: '',
    species: '',
    breed: '',
    description: '',
    lastSeenLocation: {
      latitude: 48.8566,
      longitude: 2.3522,
      address: 'Montmartre, Paris',
    },
    lastSeenDate: new Date().toISOString(),
    photos: [] as string[],
    reward: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoAdd = (photoUri: string) => {
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, photoUri],
    }));
  };

  const handlePhotoRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleLocationSelect = () => {
    // In a real app, this would open a map picker
    Alert.alert(
      'Sélectionner la localisation',
      'Cette fonctionnalité ouvrira une carte pour sélectionner le lieu de dernière observation.',
      [{ text: 'OK' }]
    );
  };

  const handleSubmit = async () => {
    if (!formData.petName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de l\'animal');
      return;
    }

    if (!formData.species.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer l\'espèce de l\'animal');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une description');
      return;
    }

    if (formData.photos.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une photo');
      return;
    }

    try {
      await createLostPetReport({
        petName: formData.petName,
        species: formData.species,
        breed: formData.breed,
        description: formData.description,
        lastSeenLocation: formData.lastSeenLocation,
        lastSeenDate: formData.lastSeenDate,
        photos: formData.photos,
        contactInfo: {
          userId: user?.id || '',
          userName: user?.name || '',
          userPhoto: user?.photo,
        },
        reward: formData.reward ? parseFloat(formData.reward) : undefined,
        status: 'lost',
      });

      Alert.alert(
        'Signalement créé',
        'Votre signalement a été publié. La communauté sera alertée.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le signalement. Veuillez réessayer.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getThemedColor('background') }]}>
      <Stack.Screen 
        options={{ 
          title: 'Signaler un Animal Perdu',
          headerTransparent: true,
          headerBackground: () => (
            <GlassView intensity={30} tint="light" style={{ flex: 1 }} />
          ),
          headerTintColor: COLORS.white,
        }} 
      />
      <StatusBar style="light" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Pet Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{"Informations sur l'animal"}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{"Nom de l'animal *"}</Text>
              <Input
                placeholder="Ex: Minou, Rex, Coco..."
                value={formData.petName}
                onChangeText={(value) => handleInputChange('petName', value)}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Espèce *</Text>
                <Input
                  placeholder="Chien, Chat, Lapin..."
                  value={formData.species}
                  onChangeText={(value) => handleInputChange('species', value)}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Race</Text>
                <Input
                  placeholder="Optionnel"
                  value={formData.breed}
                  onChangeText={(value) => handleInputChange('breed', value)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description détaillée *</Text>
              <Input
                placeholder="Décrivez l'apparence, le comportement, les signes distinctifs..."
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos *</Text>
            <Text style={styles.sectionDescription}>
              Ajoutez des photos récentes et claires de votre animal
            </Text>

            <View style={styles.photosContainer}>
              {formData.photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <Pressable
                    style={styles.removePhotoButton}
                    onPress={() => handlePhotoRemove(index)}
                  >
                    <X size={16} color={COLORS.white} />
                  </Pressable>
                </View>
              ))}

              {formData.photos.length < 5 && (
                <PhotoUploader
                  onPhotoSelected={handlePhotoAdd}
                  style={styles.addPhotoButton}
                />
              )}
            </View>
          </View>

          {/* Last Seen Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dernière observation</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lieu *</Text>
              <Pressable style={styles.locationButton} onPress={handleLocationSelect}>
                <MapPin size={20} color={COLORS.primary} />
                <Text style={styles.locationText}>{formData.lastSeenLocation.address}</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date et heure *</Text>
              <Pressable 
                style={styles.dateButton} 
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={COLORS.primary} />
                <Text style={styles.dateText}>
                  {new Date(formData.lastSeenDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Reward */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Récompense (optionnel)</Text>
            <Text style={styles.sectionDescription}>
              Proposer une récompense peut encourager les recherches
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Montant en euros</Text>
              <View style={styles.rewardInputContainer}>
                <DollarSign size={20} color={COLORS.darkGray} />
                <Input
                  placeholder="0"
                  value={formData.reward}
                  onChangeText={(value) => handleInputChange('reward', value)}
                  keyboardType="numeric"
                  inputStyle={{ flex: 1, backgroundColor: 'transparent' }}
                />
                <Text style={styles.currencyText}>€</Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title="Publier le signalement"
            onPress={handleSubmit}
            variant="primary"
            size="large"
            loading={isCreating}
            style={styles.submitButton}
          />

          <Text style={styles.disclaimer}>
            En publiant ce signalement, vous acceptez que vos informations de contact 
            {"soient partagées via la messagerie sécurisée de l'application avec les"} 
            personnes qui répondront à votre annonce.
          </Text>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DatePicker
          value={formData.lastSeenDate}
          onChange={(date: string) => {
            setFormData(prev => ({
              ...prev,
              lastSeenDate: date,
            }));
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.black,
    ...SHADOWS.small,
  },
  textArea: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  locationButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.small,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  dateButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.small,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  rewardInputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.small,
  },
  rewardInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  currencyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  submitButton: {
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    lineHeight: 18,
    textAlign: 'center',
  },
});