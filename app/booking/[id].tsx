import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useAuth } from '@/hooks/auth-store';
import { useBooking } from '@/hooks/booking-store';
import DateTimePicker from '@react-native-community/datetimepicker';
import PaymentModal from '@/components/PaymentModal';
import Input from '@/components/Input';
import Button from '@/components/Button';
import {
  Calendar,
  MapPin,
  User,
  Heart,
  Star,
  ArrowLeft,
  CheckCircle,
  CreditCard,
} from 'lucide-react-native';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in hours
  icon: string;
}

const services: Service[] = [
  {
    id: 'sitting',
    name: 'Pet Sitting',
    description: 'In-home pet care while you\'re away',
    price: 15,
    duration: 4,
    icon: 'home',
  },
  {
    id: 'walking',
    name: 'Dog Walking',
    description: '30-60 minute walks in your neighborhood',
    price: 12,
    duration: 1,
    icon: 'walk',
  },
  {
    id: 'overnight',
    name: 'Overnight Care',
    description: 'Full overnight care at your home',
    price: 45,
    duration: 12,
    icon: 'moon',
  },
  {
    id: 'grooming',
    name: 'Pet Grooming',
    description: 'Basic grooming and hygiene care',
    price: 25,
    duration: 2,
    icon: 'scissors',
  },
];

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function BookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const { createBooking, updateBookingStatus } = useBooking();

  const [selectedService, setSelectedService] = useState<Service | null>(services[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string>(timeSlots[0]);
  const [duration, setDuration] = useState<number>(services[0].duration);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState<boolean>(false);

  // Mock sitter data - in real app, fetch based on ID
  const sitter = {
    id: '1',
    name: 'Marie Dubois',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400',
    rating: 4.9,
    reviewCount: 127,
    location: 'Montmartre, Paris',
    isPremium: true,
    isVerified: true,
  };

  const calculateTotal = () => {
    if (!selectedService) return 0;
    return selectedService.price * duration;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedTime) {
      if (Platform.OS === 'web') alert('Informations manquantes. Merci de compléter tous les champs obligatoires.'); else Alert.alert('Informations manquantes', 'Merci de compléter tous les champs obligatoires.');
      return;
    }
    if (!user) {
      if (Platform.OS === 'web') alert('Veuillez vous connecter pour réserver.'); else Alert.alert('Connexion requise', 'Veuillez vous connecter pour réserver.');
      router.push('/auth/signin');
      return;
    }
    setShowPayment(true);
  };

  const finalizeBooking = async () => {
    setIsLoading(true);
    try {
      const bookingData = {
        catSitterId: id as string,
        clientId: user?.id ?? '',
        petIds: (user?.pets ?? []).map(pet => pet.id),
        date: selectedDate.toISOString().split('T')[0],
        timeSlot: 'morning' as const,
        duration,
        totalPrice: calculateTotal(),
        message: specialInstructions,
      };
      const result = await createBooking(bookingData);
      
      // Create conversation automatically
      try {
        const { messagingService } = await import('@/services/database');
        const participants = [user?.id ?? '', id as string];
        const conversationId = await messagingService.createConversation(participants);
        
        // Send initial message
        await messagingService.sendMessage({
          senderId: user?.id ?? '',
          receiverId: id as string,
          content: specialInstructions || `Nouvelle réservation pour le ${selectedDate.toLocaleDateString('fr-FR')}`,
          conversationId,
        });
        
        // Update booking with chatId
        await updateBookingStatus(result.id, 'pending', conversationId);
        
        console.log('✅ Conversation created for booking');
      } catch (err) {
        console.error('❌ Error creating conversation:', err);
      }
      
      setShowPayment(false);
      router.push(`/booking/confirmation/${result.id}`);
    } catch (error) {
      if (Platform.OS === 'web') alert('Une erreur inattendue est survenue'); else Alert.alert('Erreur', 'Une erreur inattendue est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !!selectedService && !!selectedTime && duration > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Réserver un gardien',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sitter Info */}
        <View style={[styles.sitterCard, SHADOWS.medium]}>
          <View style={styles.sitterHeader}>
            <View style={[styles.avatar, { backgroundColor: COLORS.catSitter }]}>
              <Text style={styles.avatarText}>
                {sitter.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            {sitter.isPremium && (
              <View style={styles.premiumBadge}>
                <Heart size={12} color={COLORS.premium} />
              </View>
            )}
          </View>

          <View style={styles.sitterInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.sitterName}>{sitter.name}</Text>
              {sitter.isVerified && (
                <CheckCircle size={16} color={COLORS.success} />
              )}
            </View>

            <View style={styles.ratingRow}>
              <Star size={14} color={COLORS.accent} fill={COLORS.accent} />
              <Text style={styles.rating}>{sitter.rating}</Text>
              <Text style={styles.reviewCount}>({sitter.reviewCount})</Text>
            </View>

            <View style={styles.locationRow}>
              <MapPin size={14} color={COLORS.darkGray} />
              <Text style={styles.location}>{sitter.location}</Text>
            </View>
          </View>
        </View>

        {/* Service Selection */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Sélectionner le service</Text>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceOption,
                selectedService?.id === service.id && styles.selectedService,
              ]}
              onPress={() => {
                setSelectedService(service);
                setDuration(service.duration);
              }}
            >
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>
              <View style={styles.servicePrice}>
                <Text style={styles.priceText}>{service.price}€/h</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Selection */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Sélectionner la date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={COLORS.primary} />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
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

        {/* Time Selection */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Sélectionner l'heure</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTime,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeText,
                  selectedTime === time && styles.selectedTimeText,
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Durée (heures)</Text>
          <View style={styles.durationContainer}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setDuration(Math.max(1, duration - 1))}
            >
              <Text style={styles.durationButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.durationText}>{duration}</Text>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setDuration(duration + 1)}
            >
              <Text style={styles.durationButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Special Instructions */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Instructions spéciales (optionnel)</Text>
          <Input
            placeholder="Des consignes particulières pour votre animal..."
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={4}
            inputTextStyle={{ minHeight: 100, textAlignVertical: 'top' as const }}
          />
        </View>

        {/* Your Pets */}
        {user?.pets && user.pets.length > 0 && (
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Animaux à garder</Text>
            {user.pets.map((pet) => (
              <View key={pet.id} style={styles.petItem}>
                <View style={[
                  styles.petIndicator,
                  { backgroundColor: pet.gender === 'male' ? COLORS.male : COLORS.female }
                ]} />
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petBreed}>{pet.breed} • {pet.type}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Price Summary */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Résumé du prix</Text>
          
          {selectedService && (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{selectedService.name}</Text>
                <Text style={styles.priceValue}>{selectedService.price}€/h</Text>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Durée</Text>
                <Text style={styles.priceValue}>{duration} h</Text>
              </View>
              
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{calculateTotal()}€</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={[styles.bookingContainer, SHADOWS.large]}>
        <Button
          title={isLoading ? 'Envoi de la demande...' : `Réserver pour ${calculateTotal()}€`}
          onPress={handleBooking}
          disabled={!isFormValid || isLoading}
          icon={<CreditCard size={20} color={COLORS.white} />}
          fullWidth
          testID="book-button"
        />
      </View>

      <PaymentModal
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        onPaymentSuccess={() => finalizeBooking()}
        total={calculateTotal()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sitterCard: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sitterHeader: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  sitterInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sitterName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    marginBottom: 12,
  },
  selectedService: {
    borderColor: COLORS.catSitter,
    backgroundColor: COLORS.lightGray,
  },
  serviceInfo: {
    flex: 1,
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
  },
  servicePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.catSitter,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.black,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  selectedTime: {
    backgroundColor: COLORS.catSitter,
    borderColor: COLORS.catSitter,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.black,
  },
  selectedTimeText: {
    color: COLORS.white,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  durationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  durationText: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: COLORS.black,
    minWidth: 40,
    textAlign: 'center',
  },
  textInput: {
    display: 'none',
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  petIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  petBreed: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 'auto',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  priceValue: {
    fontSize: 16,
    color: COLORS.black,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.mediumGray,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.catSitter,
  },
  bookingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bookButton: {
    display: 'none',
  },
  bookButtonText: {
    display: 'none',
  },
  disabledButton: {
    display: 'none',
  },
});