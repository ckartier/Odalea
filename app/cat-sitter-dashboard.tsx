import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useAuth } from '@/hooks/user-store';
import { useCatSitter, BookingRequest, CatSitterMessage } from '@/hooks/cat-sitter-store';
import {
  Calendar,
  Clock,
  Euro,
  MessageCircle,
  Star,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  Bell,
  TrendingUp,
  Award,
  Heart,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CatSitterDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    profile,
    bookingRequests,
    messages,
    loading,
    createProfile,
    toggleAvailability,
    respondToBooking,
    getUnreadMessagesCount,
    getPendingBookingsCount,
  } = useCatSitter();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'bookings' | 'messages' | 'calendar'>('overview');

  useEffect(() => {
    if (user && !profile) {
      // Create initial profile if user is a cat-sitter but doesn't have a profile yet
      if (user.isCatSitter) {
        createProfile(user.id, {
          hourlyRate: 15,
          description: 'Passionné(e) par les animaux, je propose mes services de garde avec amour et attention.',
          services: ['Pet Sitting', 'Feeding', 'Playing'],
          petTypes: ['Cats', 'Dogs'],
          languages: ['French'],
        });
      }
    }
  }, [user, profile, createProfile]);

  const handleToggleAvailability = async () => {
    const result = await toggleAvailability();
    if (result.success) {
      Alert.alert(
        'Statut mis à jour',
        `Vous êtes maintenant ${profile?.isActive ? 'indisponible' : 'disponible'}`
      );
    }
  };

  const handleBookingResponse = async (bookingId: string, response: 'accepted' | 'declined') => {
    const booking = bookingRequests.find(b => b.id === bookingId);
    if (!booking) return;

    const message = response === 'accepted' 
      ? `J'accepte votre demande pour garder ${booking.petName}. Merci de votre confiance !`
      : `Je ne peux malheureusement pas accepter votre demande pour ${booking.petName}. Désolé(e) !`;

    const result = await respondToBooking(bookingId, response, message);
    if (result.success) {
      Alert.alert(
        'Réponse envoyée',
        `Vous avez ${response === 'accepted' ? 'accepté' : 'refusé'} la demande.`
      );
    }
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, SHADOWS.small]}>
          <View style={styles.statIcon}>
            <Euro size={24} color={COLORS.success} />
          </View>
          <Text style={styles.statValue}>{profile?.hourlyRate || 0}€/h</Text>
          <Text style={styles.statLabel}>Tarif horaire</Text>
        </View>

        <View style={[styles.statCard, SHADOWS.small]}>
          <View style={styles.statIcon}>
            <Star size={24} color={COLORS.accent} />
          </View>
          <Text style={styles.statValue}>{profile?.rating || 0}</Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </View>

        <View style={[styles.statCard, SHADOWS.small]}>
          <View style={styles.statIcon}>
            <Users size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.statValue}>{profile?.totalBookings || 0}</Text>
          <Text style={styles.statLabel}>Réservations</Text>
        </View>

        <View style={[styles.statCard, SHADOWS.small]}>
          <View style={styles.statIcon}>
            <Award size={24} color={COLORS.catSitter} />
          </View>
          <Text style={styles.statValue}>{profile?.reviewCount || 0}</Text>
          <Text style={styles.statLabel}>Avis clients</Text>
        </View>
      </View>

      {/* Availability Toggle */}
      <View style={[styles.availabilityCard, SHADOWS.medium]}>
        <View style={styles.availabilityHeader}>
          <View>
            <Text style={styles.availabilityTitle}>Statut de disponibilité</Text>
            <Text style={styles.availabilitySubtitle}>
              {profile?.isActive ? 'Vous acceptez de nouvelles demandes' : 'Vous n\'acceptez pas de nouvelles demandes'}
            </Text>
          </View>
          <Switch
            value={profile?.isActive || false}
            onValueChange={handleToggleAvailability}
            trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
            thumbColor={profile?.isActive ? COLORS.white : COLORS.mediumGray}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.quickActions, SHADOWS.small]}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setSelectedTab('bookings')}
        >
          <View style={styles.actionIcon}>
            <Calendar size={20} color={COLORS.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Demandes en attente</Text>
            <Text style={styles.actionSubtitle}>{getPendingBookingsCount()} nouvelles demandes</Text>
          </View>
          <ArrowRight size={20} color={COLORS.darkGray} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setSelectedTab('messages')}
        >
          <View style={styles.actionIcon}>
            <MessageCircle size={20} color={COLORS.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Messages non lus</Text>
            <Text style={styles.actionSubtitle}>{getUnreadMessagesCount()} nouveaux messages</Text>
          </View>
          <ArrowRight size={20} color={COLORS.darkGray} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/cat-sitter-settings')}
        >
          <View style={styles.actionIcon}>
            <Settings size={20} color={COLORS.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Paramètres du profil</Text>
            <Text style={styles.actionSubtitle}>Modifier vos informations</Text>
          </View>
          <ArrowRight size={20} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBookings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Demandes de réservation</Text>
      
      {bookingRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color={COLORS.mediumGray} />
          <Text style={styles.emptyStateText}>Aucune demande pour le moment</Text>
        </View>
      ) : (
        bookingRequests.map((booking) => (
          <View key={booking.id} style={[styles.bookingCard, SHADOWS.small]}>
            <View style={styles.bookingHeader}>
              <Image source={{ uri: booking.clientAvatar }} style={styles.clientAvatar} />
              <View style={styles.bookingInfo}>
                <Text style={styles.clientName}>{booking.clientName}</Text>
                <Text style={styles.petInfo}>{booking.petName} • {booking.petType}</Text>
                <Text style={styles.bookingDates}>
                  {booking.startDate} - {booking.endDate}
                </Text>
              </View>
              <View style={styles.bookingPrice}>
                <Text style={styles.priceAmount}>{booking.totalPrice}€</Text>
                <Text style={styles.priceDetails}>{booking.totalHours}h</Text>
              </View>
            </View>

            <Text style={styles.bookingMessage}>{booking.message}</Text>

            <View style={styles.bookingServices}>
              {booking.services.map((service, index) => (
                <View key={index} style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{service}</Text>
                </View>
              ))}
            </View>

            <View style={styles.bookingActions}>
              {booking.status === 'pending' ? (
                <>
                  <TouchableOpacity
                    style={[styles.bookingActionButton, styles.declineButton]}
                    onPress={() => handleBookingResponse(booking.id, 'declined')}
                  >
                    <XCircle size={16} color={COLORS.white} />
                    <Text style={styles.declineButtonText}>Refuser</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.bookingActionButton, styles.acceptButton]}
                    onPress={() => handleBookingResponse(booking.id, 'accepted')}
                  >
                    <CheckCircle size={16} color={COLORS.white} />
                    <Text style={styles.acceptButtonText}>Accepter</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={[styles.statusBadge, 
                  booking.status === 'accepted' ? styles.acceptedBadge : 
                  booking.status === 'declined' ? styles.declinedBadge : styles.completedBadge
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {booking.status === 'accepted' ? 'Acceptée' :
                     booking.status === 'declined' ? 'Refusée' : 'Terminée'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderMessages = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Messages</Text>
      
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageCircle size={48} color={COLORS.mediumGray} />
          <Text style={styles.emptyStateText}>Aucun message</Text>
        </View>
      ) : (
        messages.map((message) => (
          <TouchableOpacity
            key={message.id}
            style={[styles.messageCard, SHADOWS.small, !message.isRead && styles.unreadMessage]}
            onPress={() => router.push(`/messages/${message.fromId}`)}
          >
            <Image source={{ uri: message.fromAvatar }} style={styles.messageAvatar} />
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageSender}>{message.fromName}</Text>
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.messageText} numberOfLines={2}>
                {message.message}
              </Text>
              {message.bookingId && (
                <Text style={styles.messageBooking}>Réservation liée</Text>
              )}
            </View>
            {!message.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderCalendar = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Mon calendrier</Text>
      
      <View style={[styles.calendarCard, SHADOWS.small]}>
        <Text style={styles.calendarTitle}>Disponibilités de la semaine</Text>
        
        {profile?.availability && Object.entries(profile.availability).map(([day, schedule]) => (
          <View key={day} style={styles.availabilityRow}>
            <Text style={styles.dayName}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Text>
            {schedule.available ? (
              <Text style={styles.availableTime}>
                {schedule.start} - {schedule.end}
              </Text>
            ) : (
              <Text style={styles.unavailableText}>Indisponible</Text>
            )}
          </View>
        ))}
        
        <TouchableOpacity 
          style={styles.editCalendarButton}
          onPress={() => router.push('/cat-sitter-settings')}
        >
          <Text style={styles.editCalendarButtonText}>Modifier mes disponibilités</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!user?.isCatSitter) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.notCatSitterContainer}>
          <Heart size={64} color={COLORS.mediumGray} />
          <Text style={styles.notCatSitterTitle}>Accès restreint</Text>
          <Text style={styles.notCatSitterText}>
            {"Cette page est réservée aux cat-sitters. Activez l'option \"Je suis cat-sitter\" dans votre profil."}
          </Text>
          <TouchableOpacity
            style={styles.goToProfileButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.goToProfileButtonText}>Modifier mon profil</Text>
          </TouchableOpacity>
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
          headerTitle: 'Dashboard Cat-Sitter',
          headerStyle: { backgroundColor: COLORS.white },
          headerTitleStyle: { color: COLORS.black, fontWeight: '700' },
        }}
      />

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <TrendingUp size={20} color={selectedTab === 'overview' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            {"Vue d'ensemble"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'bookings' && styles.activeTab]}
          onPress={() => setSelectedTab('bookings')}
        >
          <Calendar size={20} color={selectedTab === 'bookings' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, selectedTab === 'bookings' && styles.activeTabText]}>
            Demandes
          </Text>
          {getPendingBookingsCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getPendingBookingsCount()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'messages' && styles.activeTab]}
          onPress={() => setSelectedTab('messages')}
        >
          <MessageCircle size={20} color={selectedTab === 'messages' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, selectedTab === 'messages' && styles.activeTabText]}>
            Messages
          </Text>
          {getUnreadMessagesCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getUnreadMessagesCount()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'calendar' && styles.activeTab]}
          onPress={() => setSelectedTab('calendar')}
        >
          <Clock size={20} color={selectedTab === 'calendar' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, selectedTab === 'calendar' && styles.activeTabText]}>
            Calendrier
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'bookings' && renderBookings()}
        {selectedTab === 'messages' && renderMessages()}
        {selectedTab === 'calendar' && renderCalendar()}
      </ScrollView>
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
    lineHeight: 24,
    marginBottom: 24,
  },
  goToProfileButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goToProfileButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 4,
    paddingVertical: 8,
    ...SHADOWS.small,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: COLORS.lightGray,
  },
  tabText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: (width - 44) / 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  availabilityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  availabilitySubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  quickActions: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginTop: 16,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  petInfo: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  bookingDates: {
    fontSize: 14,
    color: COLORS.primary,
  },
  bookingPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.success,
  },
  priceDetails: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  bookingMessage: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  bookingServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceTag: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  serviceTagText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bookingActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
  declineButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statusBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  acceptedBadge: {
    backgroundColor: COLORS.available,
  },
  declinedBadge: {
    backgroundColor: COLORS.busy,
  },
  completedBadge: {
    backgroundColor: COLORS.mediumGray,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  messageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageBooking: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    marginTop: 8,
  },
  calendarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
    textTransform: 'capitalize',
  },
  availableTime: {
    fontSize: 14,
    color: COLORS.success,
  },
  unavailableText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  editCalendarButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  editCalendarButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});