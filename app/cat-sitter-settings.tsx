import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useAuth } from '@/hooks/user-store';
import { useCatSitter } from '@/hooks/cat-sitter-store';
import Button from '@/components/Button';
import PhotoUploader from '@/components/PhotoUploader';
import {
  ArrowLeft,
  Save,
  Euro,
  Clock,
  Camera,
  Plus,
  X,
  Check,
  Edit3,
  Calendar,
  Globe,
  Shield,
  Heart,
} from 'lucide-react-native';
import ContinuousSlider from '@/components/ContinuousSlider';

const AVAILABLE_SERVICES = [
  'Pet Sitting',
  'Dog Walking',
  'Feeding',
  'Playing',
  'Overnight Care',
  'Pet Grooming',
  'Pet Training',
  'Medication Administration',
  'House Sitting',
];

const AVAILABLE_PET_TYPES = [
  'Cats',
  'Dogs',
  'Small Animals',
  'Birds',
  'Fish',
  'Reptiles',
];

const AVAILABLE_LANGUAGES = [
  'French',
  'English',
  'Spanish',
  'German',
  'Italian',
  'Portuguese',
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export default function CatSitterSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useCatSitter();

  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [insurance, setInsurance] = useState<boolean>(false);
  const [emergencyContact, setEmergencyContact] = useState<boolean>(false);
  const [availability, setAvailability] = useState<{[key: string]: { start: string; end: string; available: boolean }}>({});
  const [radiusKm, setRadiusKm] = useState<number>(5);
  
  const [showAvailabilityModal, setShowAvailabilityModal] = useState<boolean>(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [tempStartTime, setTempStartTime] = useState<string>('08:00');
  const [tempEndTime, setTempEndTime] = useState<string>('18:00');
  const [tempAvailable, setTempAvailable] = useState<boolean>(true);

  useEffect(() => {
    if (profile) {
      setHourlyRate(profile.hourlyRate.toString());
      setDescription(profile.description);
      setSelectedServices(profile.services);
      setSelectedPetTypes(profile.petTypes);
      setSelectedLanguages(profile.languages);
      setPhotos(profile.photos);
      setInsurance(profile.insurance);
      setEmergencyContact(profile.emergencyContact);
      setAvailability(profile.availability);
      if (typeof profile.radiusKm === 'number') setRadiusKm(profile.radiusKm);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;

    if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un tarif horaire valide.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une description.');
      return;
    }

    if (selectedServices.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un service.');
      return;
    }

    const result = await updateProfile({
      hourlyRate: parseFloat(hourlyRate),
      description: description.trim(),
      services: selectedServices,
      petTypes: selectedPetTypes,
      languages: selectedLanguages,
      photos,
      insurance,
      emergencyContact,
      availability,
      radiusKm,
    });

    if (result.success) {
      Alert.alert(
        'Profil mis à jour',
        'Vos paramètres ont été sauvegardés avec succès.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const togglePetType = (petType: string) => {
    setSelectedPetTypes(prev => 
      prev.includes(petType) 
        ? prev.filter(p => p !== petType)
        : [...prev, petType]
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const addPhoto = (uri: string) => {
    if (photos.length < 6) {
      setPhotos(prev => [...prev, uri]);
    } else {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 6 photos.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const openAvailabilityModal = (day: string) => {
    const daySchedule = availability[day];
    setEditingDay(day);
    setTempStartTime(daySchedule?.start || '08:00');
    setTempEndTime(daySchedule?.end || '18:00');
    setTempAvailable(daySchedule?.available || true);
    setShowAvailabilityModal(true);
  };

  const saveAvailability = () => {
    if (editingDay) {
      setAvailability(prev => ({
        ...prev,
        [editingDay]: {
          start: tempStartTime,
          end: tempEndTime,
          available: tempAvailable,
        },
      }));
    }
    setShowAvailabilityModal(false);
    setEditingDay(null);
  };

  if (!user?.isCatSitter) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.notCatSitterContainer}>
          <Heart size={64} color={COLORS.mediumGray} />
          <Text style={styles.notCatSitterTitle}>Accès restreint</Text>
          <Text style={styles.notCatSitterText}>
            Cette page est réservée aux cat-sitters.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Paramètres Cat-Sitter',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              <Save size={24} color={loading ? COLORS.mediumGray : COLORS.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Basic Info */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Informations de base</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tarif horaire (€)</Text>
              <View style={styles.priceInputContainer}>
                <Euro size={20} color={COLORS.darkGray} />
                <TextInput
                  style={styles.priceInput}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="15"
                  keyboardType="numeric"
                />
                <Text style={styles.priceUnit}>€/h</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez votre expérience et votre approche avec les animaux..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Services */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Services proposés</Text>
            <View style={styles.tagsContainer}>
              {AVAILABLE_SERVICES.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[
                    styles.tag,
                    selectedServices.includes(service) && styles.selectedTag
                  ]}
                  onPress={() => toggleService(service)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedServices.includes(service) && styles.selectedTagText
                  ]}>
                    {service}
                  </Text>
                  {selectedServices.includes(service) && (
                    <Check size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pet Types */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Types d&apos;animaux</Text>
            <View style={styles.tagsContainer}>
              {AVAILABLE_PET_TYPES.map((petType) => (
                <TouchableOpacity
                  key={petType}
                  style={[
                    styles.tag,
                    selectedPetTypes.includes(petType) && styles.selectedTag
                  ]}
                  onPress={() => togglePetType(petType)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedPetTypes.includes(petType) && styles.selectedTagText
                  ]}>
                    {petType}
                  </Text>
                  {selectedPetTypes.includes(petType) && (
                    <Check size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Langues parlées</Text>
            <View style={styles.tagsContainer}>
              {AVAILABLE_LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.tag,
                    selectedLanguages.includes(language) && styles.selectedTag
                  ]}
                  onPress={() => toggleLanguage(language)}
                >
                  <Globe size={16} color={selectedLanguages.includes(language) ? COLORS.white : COLORS.darkGray} />
                  <Text style={[
                    styles.tagText,
                    selectedLanguages.includes(language) && styles.selectedTagText
                  ]}>
                    {language}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photos */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Photos ({photos.length}/6)</Text>
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <PhotoUploader
                    value={photo}
                    onChange={(uri) => {
                      if (uri) {
                        const newPhotos = [...photos];
                        newPhotos[index] = uri;
                        setPhotos(newPhotos);
                      }
                    }}
                    style={styles.photoUploader}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <X size={16} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {photos.length < 6 && (
                <PhotoUploader
                  value=""
                  onChange={(uri) => uri && addPhoto(uri)}
                  style={styles.photoUploader}
                />
              )}
            </View>
          </View>

          {/* Availability */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Disponibilités</Text>
            {DAYS_OF_WEEK.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={styles.availabilityRow}
                onPress={() => openAvailabilityModal(key)}
              >
                <Text style={styles.dayLabel}>{label}</Text>
                <View style={styles.availabilityInfo}>
                  {availability[key]?.available ? (
                    <Text style={styles.availableTime}>
                      {availability[key].start} - {availability[key].end}
                    </Text>
                  ) : (
                    <Text style={styles.unavailableText}>Indisponible</Text>
                  )}
                  <Edit3 size={16} color={COLORS.darkGray} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Service Radius */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Rayon d&apos;intervention</Text>
            <View style={styles.radiusRow}>
              <Text style={styles.radiusValue}>{radiusKm} km</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <ContinuousSlider
                min={1}
                max={50}
                step={1}
                value={radiusKm}
                onChange={setRadiusKm}
                onChangeEnd={(v) => setRadiusKm(Math.round(v))}
                trackHeight={10}
                thumbSize={28}
                testID="radius-slider"
                showValueLabel
                valueSuffix=" km"
              />
            </View>
          </View>

          {/* Additional Options */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Options supplémentaires</Text>
            
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Shield size={20} color={COLORS.primary} />
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchLabel}>Assurance responsabilité civile</Text>
                  <Text style={styles.switchDescription}>
                    Je possède une assurance couvrant la garde d&apos;animaux
                  </Text>
                </View>
              </View>
              <Switch
                value={insurance}
                onValueChange={setInsurance}
                trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
                thumbColor={insurance ? COLORS.white : COLORS.mediumGray}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Heart size={20} color={COLORS.primary} />
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchLabel}>Contact d&apos;urgence</Text>
                  <Text style={styles.switchDescription}>
                    Je fournis un contact d&apos;urgence aux propriétaires
                  </Text>
                </View>
              </View>
              <Switch
                value={emergencyContact}
                onValueChange={setEmergencyContact}
                trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
                thumbColor={emergencyContact ? COLORS.white : COLORS.mediumGray}
              />
            </View>
          </View>

          <Button
            title="Sauvegarder les modifications"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>

      {/* Availability Modal */}
      <Modal
        visible={showAvailabilityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvailabilityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Modifier {editingDay && DAYS_OF_WEEK.find(d => d.key === editingDay)?.label}
              </Text>
              <TouchableOpacity onPress={() => setShowAvailabilityModal(false)}>
                <X size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Disponible</Text>
                <Switch
                  value={tempAvailable}
                  onValueChange={setTempAvailable}
                  trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
                  thumbColor={tempAvailable ? COLORS.white : COLORS.mediumGray}
                />
              </View>

              {tempAvailable && (
                <>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.inputLabel}>Heure de début</Text>
                    <View style={styles.timeInputContainer}>
                      <Clock size={20} color={COLORS.darkGray} />
                      <TextInput
                        style={styles.timeInput}
                        value={tempStartTime}
                        onChangeText={setTempStartTime}
                        placeholder="08:00"
                      />
                    </View>
                  </View>

                  <View style={styles.timeInputGroup}>
                    <Text style={styles.inputLabel}>Heure de fin</Text>
                    <View style={styles.timeInputContainer}>
                      <Clock size={20} color={COLORS.darkGray} />
                      <TextInput
                        style={styles.timeInput}
                        value={tempEndTime}
                        onChangeText={setTempEndTime}
                        placeholder="18:00"
                      />
                    </View>
                  </View>
                </>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAvailabilityModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveAvailability}
              >
                <Text style={styles.modalSaveText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  notCatSitterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notCatSitterTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  notCatSitterText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
  },
  priceUnit: {
    fontSize: 16,
    color: COLORS.darkGray,
    fontWeight: '500' as const,
  },
  textArea: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.black,
    minHeight: 100,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  selectedTag: {
    backgroundColor: COLORS.primary,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectedTagText: {
    color: COLORS.white,
  },
  radiusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radiusValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  radiusControls: {
    flexDirection: 'row',
    gap: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photoUploader: {
    width: 100,
    height: 100,
    borderRadius: 12,
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
  addPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availableTime: {
    fontSize: 14,
    color: COLORS.success,
  },
  unavailableText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  saveButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  modalBody: {
    padding: 20,
  },
  timeInputGroup: {
    marginBottom: 16,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.darkGray,
    fontWeight: '500' as const,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
});