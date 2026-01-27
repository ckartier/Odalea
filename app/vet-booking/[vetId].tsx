import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation } from '@tanstack/react-query';
import {
  MapPin,
  Star,
  Phone,
  CheckCircle,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Shield,
} from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '@/theme/tokens';
import { getVeterinarianById } from '@/mocks/veterinarians';
import { vetBookingService } from '@/services/vet-booking';
import { useAuth } from '@/hooks/user-store';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

export default function VetBookingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { vetId, petId, petName } = useLocalSearchParams<{
    vetId: string;
    petId?: string;
    petName?: string;
  }>();

  const { user } = useAuth();
  const vet = useMemo(() => getVeterinarianById(vetId), [vetId]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !vet || !petId) {
        throw new Error('Informations manquantes');
      }

      return vetBookingService.createBooking({
        userId: user.id,
        petId: petId,
        vetId: vet.id,
        vetName: vet.name,
        clinicName: vet.clinicName,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        reason,
        notes,
      });
    },
    onSuccess: (bookingId) => {
      console.log('[VetBooking] Booking created:', bookingId);
      
      if (Platform.OS === 'web') {
        alert('Votre demande de rendez-vous a été envoyée. Vous recevrez une confirmation sous peu.');
      } else {
        Alert.alert(
          'Demande envoyée',
          'Votre demande de rendez-vous a été envoyée. Vous recevrez une confirmation sous peu.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    },
    onError: (error) => {
      console.error('[VetBooking] Error creating booking:', error);
      if (Platform.OS === 'web') {
        alert('Une erreur est survenue. Veuillez réessayer.');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
      }
    },
  });

  const handleDateChange = useCallback((event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedTime) {
      if (Platform.OS === 'web') {
        alert('Veuillez sélectionner un créneau horaire.');
      } else {
        Alert.alert('Créneau requis', 'Veuillez sélectionner un créneau horaire.');
      }
      return;
    }

    if (!reason.trim()) {
      if (Platform.OS === 'web') {
        alert('Veuillez indiquer le motif de la consultation.');
      } else {
        Alert.alert('Motif requis', 'Veuillez indiquer le motif de la consultation.');
      }
      return;
    }

    if (!user?.id) {
      if (Platform.OS === 'web') {
        alert('Veuillez vous connecter pour réserver.');
      } else {
        Alert.alert('Connexion requise', 'Veuillez vous connecter pour réserver.');
      }
      router.push('/auth/signin');
      return;
    }

    createBookingMutation.mutate();
  }, [selectedTime, reason, user?.id, router, createBookingMutation.mutate]);

  if (!vet) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Vétérinaire' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Vétérinaire non trouvé</Text>
        </View>
      </View>
    );
  }

  const isFormValid = !!selectedTime && !!reason.trim();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Prendre rendez-vous',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.vetCard, SHADOWS.card]}>
          <View style={styles.vetHeader}>
            {vet.photo ? (
              <Image source={{ uri: vet.photo }} style={styles.vetPhoto} contentFit="cover" />
            ) : (
              <View style={styles.vetPhotoPlaceholder}>
                <Text style={styles.vetPhotoInitial}>{vet.name[0]}</Text>
              </View>
            )}
            <View style={styles.vetInfo}>
              <View style={styles.vetNameRow}>
                <Text style={styles.vetName}>{vet.name}</Text>
                {vet.isVerified && <CheckCircle size={16} color={COLORS.success} />}
              </View>
              <Text style={styles.clinicName}>{vet.clinicName}</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{vet.rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({vet.reviewCount} avis)</Text>
              </View>
            </View>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <MapPin size={14} color={COLORS.textSecondary} />
              <Text style={styles.contactText} numberOfLines={2}>
                {vet.address}, {vet.zipCode} {vet.city}
              </Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={14} color={COLORS.textSecondary} />
              <Text style={styles.contactText}>{vet.phone}</Text>
            </View>
          </View>

          {vet.emergencyAvailable && (
            <View style={styles.emergencyInfo}>
              <AlertTriangle size={14} color={COLORS.danger} />
              <Text style={styles.emergencyInfoText}>Urgences disponibles 24h/24</Text>
            </View>
          )}
        </View>

        {petName && (
          <View style={[styles.section, SHADOWS.card]}>
            <Text style={styles.sectionTitle}>Animal concerné</Text>
            <View style={styles.petRow}>
              <View style={styles.petIcon}>
                <Text style={styles.petIconText}>{petName[0]}</Text>
              </View>
              <Text style={styles.petName}>{petName}</Text>
            </View>
          </View>
        )}

        <View style={[styles.section, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Date du rendez-vous</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Calendar size={18} color={COLORS.primary} />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <ChevronRight size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={[styles.section, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Créneau horaire</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.timeSlot, selectedTime === time && styles.timeSlotSelected]}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.timeSlotText, selectedTime === time && styles.timeSlotTextSelected]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Motif de la consultation *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Vaccination, contrôle annuel, symptômes..."
            placeholderTextColor={COLORS.textTertiary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={[styles.section, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Notes complémentaires (optionnel)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Informations supplémentaires pour le vétérinaire..."
            placeholderTextColor={COLORS.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={[styles.section, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Tarif indicatif</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Consultation</Text>
            <Text style={styles.priceValue}>{vet.consultationPrice}€</Text>
          </View>
          <Text style={styles.priceNote}>
            Le tarif final peut varier selon les actes effectués.
          </Text>
        </View>

        <View style={styles.disclaimerContainer}>
          <Shield size={16} color={COLORS.textSecondary} />
          <Text style={styles.disclaimerText}>
            Votre demande sera transmise au cabinet. Un retour vous sera donné sous 24h pour confirmer le rendez-vous.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, SHADOWS.modal, { paddingBottom: insets.bottom + SPACING.m }]}>
        <TouchableOpacity
          style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || createBookingMutation.isPending}
          activeOpacity={0.8}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator size="small" color={COLORS.textInverse} />
          ) : (
            <Text style={styles.submitButtonText}>Demander ce rendez-vous</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.l,
    gap: SPACING.l,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  vetCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  vetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  vetPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceSecondary,
  },
  vetPhotoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vetPhotoInitial: {
    ...TYPOGRAPHY.titleL,
    color: COLORS.textInverse,
  },
  vetInfo: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  vetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  vetName: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
  },
  clinicName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  ratingText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textPrimary,
    fontWeight: '600' as const,
  },
  reviewCount: {
    ...TYPOGRAPHY.small,
    color: COLORS.textTertiary,
  },
  contactRow: {
    marginTop: SPACING.l,
    gap: SPACING.s,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
  },
  contactText: {
    flex: 1,
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
  emergencyInfoText: {
    ...TYPOGRAPHY.small,
    color: COLORS.danger,
    fontWeight: '500' as const,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodySemibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.m,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  petIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petIconText: {
    ...TYPOGRAPHY.bodySemibold,
    color: COLORS.textPrimary,
  },
  petName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.small,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    gap: SPACING.s,
  },
  dateText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  timeSlot: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  timeSlotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textPrimary,
  },
  timeSlotTextSelected: {
    color: COLORS.textInverse,
  },
  textInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.small,
    padding: SPACING.m,
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  priceLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  priceValue: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
  },
  priceNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
    paddingHorizontal: SPACING.s,
  },
  disclaimerText: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.l,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  submitButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textInverse,
  },
});
