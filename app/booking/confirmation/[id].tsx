import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useAuth } from '@/hooks/auth-store';
import {
  CheckCircle,
  Calendar,
  Clock,
  Euro,
  MapPin,
  User,
  MessageCircle,
  Phone,
  ArrowLeft,
  Share,
  Download,
  Bell,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

import Button from '@/components/Button';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useI18n();
  const { user } = useAuth();

  // Mock booking data - in real app, fetch based on ID
  const booking = {
    id: id as string,
    status: 'pending',
    sitter: {
      name: 'Marie Dubois',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400',
      rating: 4.9,
      location: 'Montmartre, Paris',
      phone: '+33 1 23 45 67 89',
    },
    service: {
      name: 'Pet Sitting',
      description: 'In-home pet care while you\'re away',
    },
    date: '2024-02-15',
    time: '10:00',
    duration: 4,
    totalPrice: 60,
    specialInstructions: 'Please give Luna her medication at 2 PM. She\'s very friendly but gets anxious around loud noises.',
    pets: user?.pets || [],
    createdAt: new Date().toISOString(),
    estimatedResponse: '< 2 hours',
  };

  const handleMessageSitter = () => {
    router.push(`/messages/new?userId=${booking.sitter.name}`);
  };

  const handleCallSitter = () => {
    if (Platform.OS === 'web') alert(`Appeler ${booking.sitter.phone}`); else Alert.alert('Appeler', booking.sitter.phone);
  };

  const handleShareBooking = () => {
    console.log('Partager les détails de la réservation');
  };

  const handleDownloadReceipt = () => {
    console.log('Téléchargement du reçu');
    if (Platform.OS === 'web') alert('Téléchargement du reçu (bientôt)'); else Alert.alert('Téléchargement du reçu', 'Fonctionnalité à venir');
  };

  const handleSetReminder = () => {
    console.log('Programmation d\'un rappel calendrier');
    if (Platform.OS === 'web') alert('Rappel calendrier (bientôt)'); else Alert.alert('Rappel', 'Fonctionnalité à venir');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'confirmed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.darkGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Inconnue';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Confirmation de réservation',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleShareBooking}>
              <Share size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={[styles.successHeader, SHADOWS.medium]}>
          <View style={styles.successIcon}>
            <CheckCircle size={60} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Demande envoyée !</Text>
          <Text style={styles.successSubtitle}>
            Votre demande a été transmise à {booking.sitter.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
          </View>
        </View>

        {/* Booking Details */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Détails de la réservation</Text>
          
          <View style={styles.detailRow}>
            <Calendar size={20} color={COLORS.primary} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Clock size={20} color={COLORS.primary} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Heure</Text>
              <Text style={styles.detailValue}>{booking.time} ({booking.duration} h)</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <User size={20} color={COLORS.primary} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{booking.service.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Euro size={20} color={COLORS.primary} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Prix total</Text>
              <Text style={styles.detailValue}>{booking.totalPrice}€</Text>
            </View>
          </View>
        </View>

        {/* Sitter Information */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Cat Sitter</Text>
          
          <View style={styles.sitterInfo}>
            <View style={[styles.sitterAvatar, { backgroundColor: COLORS.catSitter }]}>
              <Text style={styles.avatarText}>
                {booking.sitter.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            
            <View style={styles.sitterDetails}>
              <Text style={styles.sitterName}>{booking.sitter.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color={COLORS.darkGray} />
                <Text style={styles.location}>{booking.sitter.location}</Text>
              </View>
              <Text style={styles.responseTime}>
                Réponse estimée : {booking.estimatedResponse}
              </Text>
            </View>
          </View>

          <View style={styles.sitterActions}>
            <View style={{ flex: 1 }}>
              <Button
                title="Message"
                onPress={handleMessageSitter}
                variant="subtle"
                gradient
                icon={<MessageCircle size={16} color={COLORS.white} />}
                fullWidth
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Button
                title="Appeler"
                onPress={handleCallSitter}
                gradient
                icon={<Phone size={16} color={COLORS.white} />}
                fullWidth
              />
            </View>
          </View>
        </View>

        {/* Pets */}
        {booking.pets.length > 0 && (
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Animaux à garder</Text>
            {booking.pets.map((pet) => (
              <View key={pet.id} style={styles.petItem}>
                <View style={[
                  styles.petIndicator,
                  { backgroundColor: pet.gender === 'male' ? COLORS.male : COLORS.female }
                ]} />
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petBreed}>{pet.breed} • {pet.type}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Special Instructions */}
        {booking.specialInstructions && (
          <View style={[styles.section, SHADOWS.small]}>
            <Text style={styles.sectionTitle}>Instructions spéciales</Text>
            <Text style={styles.instructions}>{booking.specialInstructions}</Text>
          </View>
        )}

        {/* Next Steps */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Et ensuite ?</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              {booking.sitter.name} va examiner votre demande de réservation
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Vous recevrez une notification dès sa réponse (généralement sous {booking.estimatedResponse})
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Une fois confirmée, vous pourrez échanger pour organiser les détails
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <View style={{ gap: 12 }}>
            <Button
              title="Ajouter au calendrier"
              onPress={handleSetReminder}
              gradient
              icon={<Bell size={20} color={COLORS.white} />}
              fullWidth
            />
            <Button
              title="Télécharger le reçu"
              onPress={handleDownloadReceipt}
              gradient
              icon={<Download size={20} color={COLORS.white} />}
              fullWidth
            />
            <Button
              title="Voir tous les messages"
              onPress={() => router.push('/(tabs)/messages')}
              gradient
              icon={<MessageCircle size={20} color={COLORS.white} />}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, SHADOWS.large]}>
        <Button
          title="Retour à la carte"
          onPress={() => router.push('/(tabs)/map')}
          fullWidth
          gradient
          testID="back-to-map"
        />
      </View>
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
  successHeader: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.white,
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  sitterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sitterAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  sitterDetails: {
    flex: 1,
  },
  sitterName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  responseTime: {
    fontSize: 12,
    color: COLORS.success,
    fontStyle: 'italic',
  },
  sitterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  messageButton: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
  callButton: {
    backgroundColor: COLORS.success,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  petIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.darkGray,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.darkGray,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  quickActionText: {
    fontSize: 16,
    color: COLORS.black,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
});