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
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { databaseService } from '@/services/database';
import Button from '@/components/Button';
import PhotoUploader from '@/components/PhotoUploader';
import ContinuousSlider from '@/components/ContinuousSlider';
import {
  ArrowLeft,
  Save,
  Euro,
  Clock,
  Plus,
  X,
  Edit3,
  Globe,
  Shield,
  Briefcase,
  MapPin,
  Package,
} from 'lucide-react-native';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  isActive: boolean;
}

interface ProfessionalServices {
  services: ServiceItem[];
  hourlyRate: number;
  availability: {
    [key: string]: { start: string; end: string; available: boolean };
  };
  serviceRadius: number;
  photos: string[];
  acceptsEmergencies: boolean;
  acceptsHomeVisits: boolean;
  languages: string[];
  description: string;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

const AVAILABLE_LANGUAGES = ['Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Portugais'];

export default function ServicesManagementScreen() {
  const router = useRouter();
  const { user } = useFirebaseUser();
  const [loading, setLoading] = useState(false);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [hourlyRate, setHourlyRate] = useState<string>('50');
  const [serviceRadius, setServiceRadius] = useState<number>(20);
  const [photos, setPhotos] = useState<string[]>([]);
  const [acceptsEmergencies, setAcceptsEmergencies] = useState<boolean>(false);
  const [acceptsHomeVisits, setAcceptsHomeVisits] = useState<boolean>(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Français']);
  const [description, setDescription] = useState<string>('');
  const [availability, setAvailability] = useState<{
    [key: string]: { start: string; end: string; available: boolean };
  }>({
    monday: { start: '09:00', end: '18:00', available: true },
    tuesday: { start: '09:00', end: '18:00', available: true },
    wednesday: { start: '09:00', end: '18:00', available: true },
    thursday: { start: '09:00', end: '18:00', available: true },
    friday: { start: '09:00', end: '18:00', available: true },
    saturday: { start: '10:00', end: '17:00', available: true },
    sunday: { start: '10:00', end: '16:00', available: false },
  });

  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceDescription, setNewServiceDescription] = useState<string>('');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [newServiceDuration, setNewServiceDuration] = useState<string>('');

  const [showAvailabilityModal, setShowAvailabilityModal] = useState<boolean>(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [tempStartTime, setTempStartTime] = useState<string>('09:00');
  const [tempEndTime, setTempEndTime] = useState<string>('18:00');
  const [tempAvailable, setTempAvailable] = useState<boolean>(true);

  useEffect(() => {
    loadServicesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadServicesData = async () => {
    if (!user?.id || !user.isProfessional) return;

    try {
      const servicesData = await databaseService.professional.getServices(user.id);
      if (servicesData) {
        setServices(servicesData.services || []);
        setHourlyRate(servicesData.hourlyRate?.toString() || '50');
        setAvailability(servicesData.availability || availability);
        setServiceRadius(servicesData.serviceRadius || 20);
        setPhotos(servicesData.photos || []);
        setAcceptsEmergencies(servicesData.acceptsEmergencies || false);
        setAcceptsHomeVisits(servicesData.acceptsHomeVisits || false);
        setSelectedLanguages(servicesData.languages || ['Français']);
        setDescription(servicesData.description || '');
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !user.isProfessional) return;

    if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un tarif horaire valide.');
      return;
    }

    if (services.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une prestation.');
      return;
    }

    setLoading(true);

    try {
      const servicesData: ProfessionalServices = {
        services,
        hourlyRate: parseFloat(hourlyRate),
        availability,
        serviceRadius,
        photos,
        acceptsEmergencies,
        acceptsHomeVisits,
        languages: selectedLanguages,
        description,
      };

      await databaseService.professional.saveServices(user.id, servicesData);

      Alert.alert(
        'Prestations mises à jour',
        'Vos prestations ont été sauvegardées avec succès.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving services:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les prestations.');
    } finally {
      setLoading(false);
    }
  };

  const openServiceModal = (service?: ServiceItem) => {
    if (service) {
      setEditingService(service);
      setNewServiceName(service.name);
      setNewServiceDescription(service.description);
      setNewServicePrice(service.price.toString());
      setNewServiceDuration(service.duration);
    } else {
      setEditingService(null);
      setNewServiceName('');
      setNewServiceDescription('');
      setNewServicePrice('');
      setNewServiceDuration('');
    }
    setShowServiceModal(true);
  };

  const saveService = () => {
    if (!newServiceName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de prestation.');
      return;
    }

    if (!newServicePrice || parseFloat(newServicePrice) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un prix valide.');
      return;
    }

    const serviceData: ServiceItem = {
      id: editingService?.id || `service-${Date.now()}`,
      name: newServiceName.trim(),
      description: newServiceDescription.trim(),
      price: parseFloat(newServicePrice),
      duration: newServiceDuration.trim(),
      isActive: editingService?.isActive ?? true,
    };

    if (editingService) {
      setServices(services.map((s) => (s.id === editingService.id ? serviceData : s)));
    } else {
      setServices([...services, serviceData]);
    }

    setShowServiceModal(false);
    setEditingService(null);
  };

  const deleteService = (serviceId: string) => {
    Alert.alert(
      'Supprimer la prestation',
      'Voulez-vous vraiment supprimer cette prestation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => setServices(services.filter((s) => s.id !== serviceId)),
        },
      ]
    );
  };

  const toggleServiceActive = (serviceId: string) => {
    setServices(
      services.map((s) => (s.id === serviceId ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]
    );
  };

  const addPhoto = (uri: string) => {
    if (photos.length < 8) {
      setPhotos((prev) => [...prev, uri]);
    } else {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 8 photos.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const openAvailabilityModal = (day: string) => {
    const daySchedule = availability[day];
    setEditingDay(day);
    setTempStartTime(daySchedule?.start || '09:00');
    setTempEndTime(daySchedule?.end || '18:00');
    setTempAvailable(daySchedule?.available ?? true);
    setShowAvailabilityModal(true);
  };

  const saveAvailability = () => {
    if (editingDay) {
      setAvailability((prev) => ({
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

  if (!user || !user.isProfessional) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Briefcase size={64} color={COLORS.mediumGray} />
          <Text style={styles.errorTitle}>Accès restreint</Text>
          <Text style={styles.errorText}>Cette page est réservée aux professionnels.</Text>
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
          headerTitle: 'Gestion des prestations',
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
          {/* Basic Pricing */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Tarification de base</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tarif horaire (€)</Text>
              <View style={styles.priceInputContainer}>
                <Euro size={20} color={COLORS.darkGray} />
                <TextInput
                  style={styles.priceInput}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="50"
                  keyboardType="numeric"
                />
                <Text style={styles.priceUnit}>€/h</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description générale</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez vos services professionnels..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Services List */}
          <View style={[styles.section, SHADOWS.small]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Mes prestations</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openServiceModal()}
              >
                <Plus size={16} color={COLORS.white} />
                <Text style={styles.addButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {services.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={40} color={COLORS.mediumGray} />
                <Text style={styles.emptyStateText}>Aucune prestation configurée</Text>
              </View>
            ) : (
              <View style={styles.servicesList}>
                {services.map((service) => (
                  <View key={service.id} style={styles.serviceCard}>
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        {service.description && (
                          <Text style={styles.serviceDescription} numberOfLines={2}>
                            {service.description}
                          </Text>
                        )}
                        <View style={styles.serviceDetails}>
                          <Text style={styles.servicePrice}>{service.price}€</Text>
                          {service.duration && (
                            <>
                              <Text style={styles.serviceSeparator}>•</Text>
                              <Text style={styles.serviceDuration}>{service.duration}</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <Switch
                        value={service.isActive}
                        onValueChange={() => toggleServiceActive(service.id)}
                        trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
                        thumbColor={service.isActive ? COLORS.white : COLORS.mediumGray}
                      />
                    </View>
                    <View style={styles.serviceActions}>
                      <TouchableOpacity
                        style={styles.serviceActionButton}
                        onPress={() => openServiceModal(service)}
                      >
                        <Edit3 size={16} color={COLORS.primary} />
                        <Text style={styles.serviceActionText}>Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.serviceActionButton}
                        onPress={() => deleteService(service.id)}
                      >
                        <X size={16} color={COLORS.error} />
                        <Text style={[styles.serviceActionText, { color: COLORS.error }]}>
                          Supprimer
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
            <Text style={styles.sectionTitle}>Zone d&apos;intervention</Text>
            <View style={styles.radiusRow}>
              <MapPin size={20} color={COLORS.primary} />
              <Text style={styles.radiusValue}>{serviceRadius} km</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <ContinuousSlider
                min={5}
                max={100}
                step={5}
                value={serviceRadius}
                onChange={setServiceRadius}
                onChangeEnd={(v) => setServiceRadius(Math.round(v))}
                trackHeight={10}
                thumbSize={28}
                testID="radius-slider"
                showValueLabel
                valueSuffix=" km"
              />
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
                    selectedLanguages.includes(language) && styles.selectedTag,
                  ]}
                  onPress={() => toggleLanguage(language)}
                >
                  <Globe
                    size={16}
                    color={
                      selectedLanguages.includes(language) ? COLORS.white : COLORS.darkGray
                    }
                  />
                  <Text
                    style={[
                      styles.tagText,
                      selectedLanguages.includes(language) && styles.selectedTagText,
                    ]}
                  >
                    {language}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photos */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Photos de vos services ({photos.length}/8)</Text>
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

              {photos.length < 8 && (
                <PhotoUploader
                  value=""
                  onChange={(uri) => uri && addPhoto(uri)}
                  style={styles.photoUploader}
                />
              )}
            </View>
          </View>

          {/* Additional Options */}
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Options supplémentaires</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Shield size={20} color={COLORS.primary} />
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchLabel}>Accepter les urgences</Text>
                  <Text style={styles.switchDescription}>
                    Disponible pour interventions urgentes
                  </Text>
                </View>
              </View>
              <Switch
                value={acceptsEmergencies}
                onValueChange={setAcceptsEmergencies}
                trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
                thumbColor={acceptsEmergencies ? COLORS.white : COLORS.mediumGray}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <MapPin size={20} color={COLORS.primary} />
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchLabel}>Visites à domicile</Text>
                  <Text style={styles.switchDescription}>
                    Proposer des consultations à domicile
                  </Text>
                </View>
              </View>
              <Switch
                value={acceptsHomeVisits}
                onValueChange={setAcceptsHomeVisits}
                trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
                thumbColor={acceptsHomeVisits ? COLORS.white : COLORS.mediumGray}
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

      {/* Service Modal */}
      <Modal
        visible={showServiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Modifier la prestation' : 'Nouvelle prestation'}
              </Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <X size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Nom de la prestation *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newServiceName}
                  onChangeText={setNewServiceName}
                  placeholder="Ex: Consultation standard"
                  placeholderTextColor={COLORS.mediumGray}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={newServiceDescription}
                  onChangeText={setNewServiceDescription}
                  placeholder="Décrivez la prestation..."
                  placeholderTextColor={COLORS.mediumGray}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Prix (€) *</Text>
                <View style={styles.priceInputContainer}>
                  <Euro size={20} color={COLORS.darkGray} />
                  <TextInput
                    style={styles.priceInput}
                    value={newServicePrice}
                    onChangeText={setNewServicePrice}
                    placeholder="50"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.mediumGray}
                  />
                  <Text style={styles.priceUnit}>€</Text>
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Durée</Text>
                <View style={styles.durationInputContainer}>
                  <Clock size={20} color={COLORS.darkGray} />
                  <TextInput
                    style={styles.durationInput}
                    value={newServiceDuration}
                    onChangeText={setNewServiceDuration}
                    placeholder="Ex: 30 min, 1h, 2h"
                    placeholderTextColor={COLORS.mediumGray}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowServiceModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveService}>
                <Text style={styles.modalSaveText}>
                  {editingService ? 'Modifier' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                Modifier {editingDay && DAYS_OF_WEEK.find((d) => d.key === editingDay)?.label}
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
                        placeholder="09:00"
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
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveAvailability}>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 12,
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: COLORS.screenBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.success,
  },
  serviceSeparator: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  serviceDuration: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  serviceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceActionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.primary,
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
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  radiusValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.primary,
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
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    maxHeight: '90%',
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
  modalInputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  durationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  durationInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
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
    paddingTop: 16,
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
