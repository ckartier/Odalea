import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { useCatSitter } from '@/hooks/cat-sitter-store';
import {
  Calendar,
  Euro,
  Star,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  MessageSquare,
  Users,
} from 'lucide-react-native';
import GlassCard from '@/components/GlassCard';
import AppBackground from '@/components/AppBackground';

const { width } = Dimensions.get('window');

export default function CatSitterDashboardScreen() {
  const router = useRouter();
  const { user } = useFirebaseUser();
  const { profile, bookingRequests, loadProfile } = useCatSitter();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id && !profile) {
      loadProfile(user.id);
    }
  }, [user?.id, profile, loadProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await loadProfile(user.id);
    }
    setRefreshing(false);
  };

  if (!user || !profile) {
    return (
      <AppBackground>
        <View style={styles.container}>
          <Stack.Screen
            options={{
              title: 'Tableau de bord Cat Sitter',
              headerShown: true,
            }}
          />
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {!user ? 'Veuillez vous connecter' : 'Chargement de votre profil...'}
            </Text>
          </View>
        </View>
      </AppBackground>
    );
  }

  const totalEarnings = bookingRequests
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingBookings = bookingRequests.filter(b => b.status === 'pending').length;
  const acceptedBookings = bookingRequests.filter(b => b.status === 'accepted').length;
  const completedBookings = bookingRequests.filter(b => b.status === 'completed').length;

  const stats = [
    {
      title: 'Gains totaux',
      value: `${totalEarnings.toFixed(0)}€`,
      icon: Euro,
      color: COLORS.success,
      bgColor: COLORS.female,
    },
    {
      title: 'Note moyenne',
      value: profile.rating.toFixed(1),
      icon: Star,
      color: COLORS.accent,
      bgColor: COLORS.male,
    },
    {
      title: 'Avis',
      value: profile.reviewCount.toString(),
      icon: MessageSquare,
      color: COLORS.warning,
      bgColor: COLORS.female,
    },
    {
      title: 'Prestations',
      value: profile.totalBookings.toString(),
      icon: Users,
      color: COLORS.catSitter,
      bgColor: COLORS.male,
    },
  ];

  const recentBookings = [...bookingRequests]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle size={18} color={COLORS.warning} />;
      case 'accepted':
        return <CheckCircle size={18} color={COLORS.success} />;
      case 'declined':
        return <XCircle size={18} color={COLORS.error} />;
      case 'completed':
        return <CheckCircle size={18} color={COLORS.male} />;
      default:
        return <Clock size={18} color={COLORS.darkGray} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Acceptée';
      case 'declined':
        return 'Refusée';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const availabilityKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <AppBackground>
      <StatusBar style="dark" />
      
      <Stack.Screen
        options={{
          title: 'Tableau de bord Cat Sitter',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/settings' as any)}
              style={styles.settingsButton}
            >
              <Settings size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <GlassCard tint="neutral" style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Bonjour, {user.firstName}!</Text>
          <Text style={styles.welcomeSubtitle}>
            {profile.isActive ? 'Votre profil est actif' : 'Votre profil est désactivé'}
          </Text>
          {pendingBookings > 0 && (
            <View style={styles.alertBadge}>
              <AlertCircle size={16} color={COLORS.warning} />
              <Text style={styles.alertText}>
                {pendingBookings} demande{pendingBookings > 1 ? 's' : ''} en attente
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <GlassCard
              key={index}
              tint={index % 2 === 0 ? 'female' : 'male'}
              style={styles.statCard}
            >
              <View style={[styles.statIcon, { backgroundColor: `${stat.bgColor}20` }]}>
                <stat.icon size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Calendar Section */}
        <GlassCard tint="neutral" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={COLORS.black} />
            <Text style={styles.sectionTitle}>Calendrier de disponibilité</Text>
          </View>
          
          <View style={styles.calendarGrid}>
            {weekDays.map((day, index) => {
              const dayKey = availabilityKeys[index];
              const daySchedule = profile.availability[dayKey];
              const isAvailable = daySchedule?.available || false;
              
              return (
                <View key={day} style={styles.calendarDay}>
                  <Text style={styles.calendarDayName}>{day}</Text>
                  <View
                    style={[
                      styles.calendarDayStatus,
                      isAvailable
                        ? { backgroundColor: COLORS.available }
                        : { backgroundColor: COLORS.busy },
                    ]}
                  >
                    <Text style={styles.calendarDayTime}>
                      {isAvailable
                        ? `${daySchedule.start}-${daySchedule.end}`
                        : 'Indispo'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Recent Bookings */}
        <GlassCard tint="neutral" style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={COLORS.black} />
            <Text style={styles.sectionTitle}>Prestations récentes</Text>
          </View>

          {recentBookings.length === 0 ? (
            <View style={styles.emptyBookings}>
              <Award size={48} color={COLORS.darkGray} />
              <Text style={styles.emptyTitle}>Aucune prestation</Text>
              <Text style={styles.emptyText}>
                Vos demandes de réservation apparaîtront ici
              </Text>
            </View>
          ) : (
            recentBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingClient}>
                    <Text style={styles.bookingClientName}>{booking.clientName}</Text>
                    <Text style={styles.bookingPet}>
                      {booking.petName} • {booking.petType}
                    </Text>
                  </View>
                  <View style={styles.bookingStatus}>
                    {getStatusIcon(booking.status)}
                    <Text style={styles.bookingStatusText}>
                      {getStatusText(booking.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.bookingInfo}>
                    <Calendar size={14} color={COLORS.darkGray} />
                    <Text style={styles.bookingInfoText}>
                      {booking.startDate} - {booking.endDate}
                    </Text>
                  </View>
                  <View style={styles.bookingInfo}>
                    <Clock size={14} color={COLORS.darkGray} />
                    <Text style={styles.bookingInfoText}>
                      {booking.totalHours}h
                    </Text>
                  </View>
                  <View style={styles.bookingInfo}>
                    <Euro size={14} color={COLORS.success} />
                    <Text style={[styles.bookingInfoText, { color: COLORS.success, fontWeight: '600' }]}>
                      {booking.totalPrice}€
                    </Text>
                  </View>
                </View>

                {booking.message && (
                  <Text style={styles.bookingMessage} numberOfLines={2}>
                    {booking.message}
                  </Text>
                )}
              </View>
            ))
          )}
        </GlassCard>

        {/* Quick Stats */}
        <View style={styles.quickStatsGrid}>
          <GlassCard tint="neutral" style={styles.quickStat}>
            <AlertCircle size={20} color={COLORS.warning} />
            <Text style={styles.quickStatValue}>{pendingBookings}</Text>
            <Text style={styles.quickStatLabel}>En attente</Text>
          </GlassCard>

          <GlassCard tint="neutral" style={styles.quickStat}>
            <CheckCircle size={20} color={COLORS.success} />
            <Text style={styles.quickStatValue}>{acceptedBookings}</Text>
            <Text style={styles.quickStatLabel}>Acceptées</Text>
          </GlassCard>

          <GlassCard tint="neutral" style={styles.quickStat}>
            <Award size={20} color={COLORS.male} />
            <Text style={styles.quickStatValue}>{completedBookings}</Text>
            <Text style={styles.quickStatLabel}>Terminées</Text>
          </GlassCard>
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: DIMENSIONS.SPACING.md,
    paddingBottom: DIMENSIONS.SPACING.xxl + 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING.xl,
  },
  emptyText: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  welcomeCard: {
    marginBottom: DIMENSIONS.SPACING.md,
    padding: DIMENSIONS.SPACING.lg,
  },
  welcomeTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.xxl,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.darkGray,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}20`,
    paddingHorizontal: DIMENSIONS.SPACING.sm,
    paddingVertical: DIMENSIONS.SPACING.xs,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: DIMENSIONS.SPACING.xs,
  },
  alertText: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    fontWeight: '600' as const,
    color: COLORS.warning,
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: (width - DIMENSIONS.SPACING.md * 2 - DIMENSIONS.SPACING.sm) / 2,
    padding: DIMENSIONS.SPACING.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  statValue: {
    fontSize: DIMENSIONS.FONT_SIZES.xl,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  section: {
    marginBottom: DIMENSIONS.SPACING.md,
    padding: DIMENSIONS.SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING.md,
  },
  sectionTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginLeft: DIMENSIONS.SPACING.xs,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING.xs,
  },
  calendarDay: {
    flex: 1,
    minWidth: (width - DIMENSIONS.SPACING.md * 2 - DIMENSIONS.SPACING.xs * 6) / 7 - 2,
    alignItems: 'center',
  },
  calendarDayName: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  calendarDayStatus: {
    width: '100%',
    paddingVertical: DIMENSIONS.SPACING.xs,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarDayTime: {
    fontSize: 9,
    fontWeight: '500' as const,
    color: COLORS.white,
  },
  emptyBookings: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl,
  },
  emptyTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.xs,
  },
  bookingCard: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingVertical: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DIMENSIONS.SPACING.xs,
  },
  bookingClient: {
    flex: 1,
  },
  bookingClientName: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  bookingPet: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingStatusText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.xs,
  },
  bookingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingInfoText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
  bookingMessage: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
    fontStyle: 'italic',
    marginTop: DIMENSIONS.SPACING.xs,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  quickStat: {
    flex: 1,
    padding: DIMENSIONS.SPACING.md,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: DIMENSIONS.FONT_SIZES.xxl,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginTop: DIMENSIONS.SPACING.xs,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});