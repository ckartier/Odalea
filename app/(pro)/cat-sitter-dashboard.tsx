import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { useCatSitter, CustomService } from '@/hooks/cat-sitter-store';
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
  Power,
  Save,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Briefcase,
} from 'lucide-react-native';
import GlassCard from '@/components/GlassCard';
import AppBackground from '@/components/AppBackground';

const { width } = Dimensions.get('window');

type DaySchedule = { start: string; end: string; available: boolean };

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const availabilityKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function isHHMM(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(n => Number(n));
  return h * 60 + m;
}
function clampHHMM(v: string) {
  // garde "08:00" si invalide
  if (!isHHMM(v)) return '08:00';
  const [h, m] = v.split(':').map(n => Number(n));
  const hh = Math.min(23, Math.max(0, h));
  const mm = Math.min(59, Math.max(0, m));
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export default function CatSitterDashboardScreen() {
  const router = useRouter();
  const { user } = useFirebaseUser();
  const {
    profile,
    bookingRequests,
    loadProfile,
    updateAvailability,
    toggleAvailability,
    respondToBooking,
    updateProfile,
    addCustomService,
    updateCustomService,
    deleteCustomService,
    toggleCustomServiceActive,
    loading,
  } = useCatSitter();

  const [refreshing, setRefreshing] = useState(false);

  // Modal édition planning
  const [editOpen, setEditOpen] = useState(false);
  const [editDayIndex, setEditDayIndex] = useState<number | null>(null);
  const [editAvailable, setEditAvailable] = useState(false);
  const [editStart, setEditStart] = useState('08:00');
  const [editEnd, setEditEnd] = useState('18:00');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingDay, setSavingDay] = useState(false);

  // Actions booking
  const [bookingActionId, setBookingActionId] = useState<string | null>(null);

  // Service CRUD
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<CustomService | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [serviceIcon, setServiceIcon] = useState('service');
  const [savingService, setSavingService] = useState(false);

  // Insurance
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [savingInsurance, setSavingInsurance] = useState(false);

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

  const totalEarnings = useMemo(() => {
    if (!bookingRequests?.length) return 0;
    return bookingRequests
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  }, [bookingRequests]);

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
      value: profile?.rating?.toFixed?.(1) ?? '0.0',
      icon: Star,
      color: COLORS.accent,
      bgColor: COLORS.male,
    },
    {
      title: 'Avis',
      value: (profile?.reviewCount ?? 0).toString(),
      icon: MessageSquare,
      color: COLORS.warning,
      bgColor: COLORS.female,
    },
    {
      title: 'Prestations',
      value: (profile?.totalBookings ?? 0).toString(),
      icon: Users,
      color: COLORS.catSitter,
      bgColor: COLORS.male,
    },
  ];

  const recentBookings = [...bookingRequests]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
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

  const openEditDay = (index: number) => {
    if (!profile) return;
    const dayKey = availabilityKeys[index];
    const s = profile.availability?.[dayKey] as DaySchedule | undefined;

    setEditDayIndex(index);
    setEditAvailable(!!s?.available);
    setEditStart(clampHHMM(s?.start ?? '08:00'));
    setEditEnd(clampHHMM(s?.end ?? '18:00'));
    setEditError(null);
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (savingDay) return;
    setEditOpen(false);
    setEditDayIndex(null);
    setEditError(null);
  };

  const saveDay = async () => {
    if (!profile) return;
    if (editDayIndex === null) return;

    setEditError(null);

    const start = clampHHMM(editStart.trim());
    const end = clampHHMM(editEnd.trim());

    if (editAvailable) {
      if (!isHHMM(start) || !isHHMM(end)) {
        setEditError("Format attendu : HH:MM (ex: 08:00)");
        return;
      }
      if (toMinutes(start) >= toMinutes(end)) {
        setEditError("L'heure de début doit être avant l'heure de fin.");
        return;
      }
    }

    const dayKey = availabilityKeys[editDayIndex];

    setSavingDay(true);
    const res = await updateAvailability(dayKey, {
      start,
      end,
      available: editAvailable,
    });
    setSavingDay(false);

    if (!res?.success) {
      setEditError(res?.error ?? 'Impossible de sauvegarder.');
      return;
    }

    setEditOpen(false);
    setEditDayIndex(null);
  };

  const handleToggleActive = async () => {
    if (!profile) return;
    const next = !profile.isActive;
    Alert.alert(
      next ? 'Activer le profil ?' : 'Désactiver le profil ?',
      next
        ? 'Ton profil devient visible et réservable.'
        : 'Ton profil devient non réservable.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: next ? 'Activer' : 'Désactiver',
          style: next ? 'default' : 'destructive',
          onPress: async () => {
            await toggleAvailability();
          },
        },
      ]
    );
  };

  const handleBookingResponse = async (bookingId: string, response: 'accepted' | 'declined') => {
    setBookingActionId(bookingId);
    const res = await respondToBooking(bookingId, response);
    setBookingActionId(null);

    if (!res?.success) {
      Alert.alert('Erreur', res?.error ?? "Impossible d'envoyer la réponse.");
    }
  };

  const openServiceModal = (service?: CustomService) => {
    if (service) {
      setEditingService(service);
      setServiceName(service.name);
      setServiceDesc(service.description);
      setServicePrice(String(service.price));
      setServiceDuration(String(service.duration));
      setServiceIcon(service.icon || 'service');
    } else {
      setEditingService(null);
      setServiceName('');
      setServiceDesc('');
      setServicePrice('');
      setServiceDuration('60');
      setServiceIcon('service');
    }
    setServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    if (savingService) return;
    setServiceModalOpen(false);
    setEditingService(null);
  };

  const saveService = async () => {
    const price = parseFloat(servicePrice);
    const duration = parseInt(serviceDuration, 10);

    if (!serviceName.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }
    if (isNaN(price) || price < 0) {
      Alert.alert('Erreur', 'Prix invalide');
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Erreur', 'Durée invalide');
      return;
    }

    setSavingService(true);
    let res;

    if (editingService) {
      res = await updateCustomService(editingService.id, {
        name: serviceName.trim(),
        description: serviceDesc.trim(),
        price,
        duration,
        icon: serviceIcon,
      });
    } else {
      res = await addCustomService({
        name: serviceName.trim(),
        description: serviceDesc.trim(),
        price,
        duration,
        icon: serviceIcon,
        isActive: true,
      });
    }

    setSavingService(false);

    if (!res?.success) {
      Alert.alert('Erreur', res?.error ?? 'Impossible de sauvegarder');
      return;
    }

    setServiceModalOpen(false);
    setEditingService(null);
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      'Supprimer cette prestation ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomService(serviceId);
          },
        },
      ]
    );
  };

  const handleToggleServiceActive = async (serviceId: string) => {
    await toggleCustomServiceActive(serviceId);
  };

  const openInsuranceModal = () => {
    setInsuranceEnabled(profile?.insurance ?? false);
    setInsuranceCompany(profile?.insuranceCompany ?? '');
    setInsuranceNumber(profile?.insuranceNumber ?? '');
    setInsuranceExpiry(profile?.insuranceExpiryDate ?? '');
    setInsuranceModalOpen(true);
  };

  const closeInsuranceModal = () => {
    if (savingInsurance) return;
    setInsuranceModalOpen(false);
  };

  const saveInsurance = async () => {
    setSavingInsurance(true);
    const res = await updateProfile({
      insurance: insuranceEnabled,
      insuranceCompany: insuranceCompany.trim(),
      insuranceNumber: insuranceNumber.trim(),
      insuranceExpiryDate: insuranceExpiry.trim(),
    });
    setSavingInsurance(false);

    if (!res?.success) {
      Alert.alert('Erreur', res?.error ?? 'Impossible de sauvegarder');
      return;
    }

    setInsuranceModalOpen(false);
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

  return (
    <AppBackground>
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: 'Tableau de bord Cat Sitter',
          headerShown: true,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={handleToggleActive}
                style={styles.headerIconButton}
              >
                <Power size={22} color={profile.isActive ? COLORS.success : COLORS.darkGray} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/settings' as any)}
                style={styles.headerIconButton}
              >
                <Settings size={22} color={COLORS.black} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <GlassCard tint="neutral" style={styles.welcomeCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeTitle}>Bonjour, {user.firstName}!</Text>
              <Text style={styles.welcomeSubtitle}>
                {profile.isActive ? 'Votre profil est actif' : 'Votre profil est désactivé'}
              </Text>
            </View>

            {loading ? <ActivityIndicator /> : null}
          </View>

          {pendingBookings > 0 && (
            <View style={styles.alertBadge}>
              <AlertCircle size={16} color={COLORS.warning} />
              <Text style={styles.alertText}>
                {pendingBookings} demande{pendingBookings > 1 ? 's' : ''} en attente
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Stats */}
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

        {/* Services / Prestations */}
        <GlassCard tint="neutral" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Briefcase size={20} color={COLORS.black} />
            <Text style={styles.sectionTitle}>Mes prestations</Text>
            <TouchableOpacity
              onPress={() => openServiceModal()}
              style={styles.addButton}
            >
              <Plus size={18} color={COLORS.white} />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {!profile?.customServices || profile.customServices.length === 0 ? (
            <Text style={styles.emptyText}>Aucune prestation définie</Text>
          ) : (
            profile.customServices.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.description ? (
                      <Text style={styles.serviceDesc} numberOfLines={2}>
                        {service.description}
                      </Text>
                    ) : null}
                    <View style={styles.serviceInfo}>
                      <Text style={styles.servicePrice}>{service.price}€</Text>
                      <Text style={styles.serviceDuration}> • {service.duration} min</Text>
                    </View>
                  </View>

                  <View style={styles.serviceActions}>
                    <Switch
                      value={service.isActive}
                      onValueChange={() => handleToggleServiceActive(service.id)}
                      trackColor={{ false: COLORS.darkGray, true: COLORS.success }}
                      thumbColor={COLORS.white}
                    />
                    <TouchableOpacity
                      onPress={() => openServiceModal(service)}
                      style={styles.iconButton}
                    >
                      <Edit2 size={18} color={COLORS.black} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteService(service.id)}
                      style={styles.iconButton}
                    >
                      <Trash2 size={18} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </GlassCard>

        {/* Insurance / Assurance */}
        <GlassCard tint="neutral" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={COLORS.black} />
            <Text style={styles.sectionTitle}>Assurance & Infos Pro</Text>
            <TouchableOpacity
              onPress={openInsuranceModal}
              style={styles.editIconButton}
            >
              <Edit2 size={18} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.insuranceInfo}>
            <View style={styles.insuranceRow}>
              <Text style={styles.insuranceLabel}>Assurance :</Text>
              <Text style={[styles.insuranceValue, { color: profile?.insurance ? COLORS.success : COLORS.darkGray }]}>
                {profile?.insurance ? 'Oui' : 'Non'}
              </Text>
            </View>

            {profile?.insurance ? (
              <>
                {profile.insuranceCompany ? (
                  <View style={styles.insuranceRow}>
                    <Text style={styles.insuranceLabel}>Compagnie :</Text>
                    <Text style={styles.insuranceValue}>{profile.insuranceCompany}</Text>
                  </View>
                ) : null}

                {profile.insuranceNumber ? (
                  <View style={styles.insuranceRow}>
                    <Text style={styles.insuranceLabel}>Numéro :</Text>
                    <Text style={styles.insuranceValue}>{profile.insuranceNumber}</Text>
                  </View>
                ) : null}

                {profile.insuranceExpiryDate ? (
                  <View style={styles.insuranceRow}>
                    <Text style={styles.insuranceLabel}>Expire le :</Text>
                    <Text style={styles.insuranceValue}>{profile.insuranceExpiryDate}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </GlassCard>

        {/* Calendar editable */}
        <GlassCard tint="neutral" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={COLORS.black} />
            <Text style={styles.sectionTitle}>Calendrier de disponibilité</Text>
            <Text style={styles.sectionHint}>• touche un jour pour modifier</Text>
          </View>

          <View style={styles.calendarGrid}>
            {weekDays.map((day, index) => {
              const dayKey = availabilityKeys[index];
              const daySchedule = profile.availability?.[dayKey] as DaySchedule | undefined;
              const isAvailable = !!daySchedule?.available;

              return (
                <TouchableOpacity
                  key={day}
                  style={styles.calendarDay}
                  onPress={() => openEditDay(index)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.calendarDayName}>{day}</Text>
                  <View
                    style={[
                      styles.calendarDayStatus,
                      isAvailable ? { backgroundColor: COLORS.available } : { backgroundColor: COLORS.busy },
                    ]}
                  >
                    <Text style={styles.calendarDayTime}>
                      {isAvailable ? `${daySchedule?.start}-${daySchedule?.end}` : 'Indispo'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Recent bookings + actions */}
        <GlassCard tint="neutral" style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={COLORS.black} />
            <Text style={styles.sectionTitle}>Prestations récentes</Text>
          </View>

          {recentBookings.length === 0 ? (
            <View style={styles.emptyBookings}>
              <Award size={48} color={COLORS.darkGray} />
              <Text style={styles.emptyTitle}>Aucune prestation</Text>
              <Text style={styles.emptyText}>Vos demandes de réservation apparaîtront ici</Text>
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
                    <Text style={styles.bookingStatusText}>{getStatusText(booking.status)}</Text>
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
                    <Text style={styles.bookingInfoText}>{booking.totalHours}h</Text>
                  </View>
                  <View style={styles.bookingInfo}>
                    <Euro size={14} color={COLORS.success} />
                    <Text style={[styles.bookingInfoText, { color: COLORS.success, fontWeight: '600' }]}>
                      {booking.totalPrice}€
                    </Text>
                  </View>
                </View>

                {booking.message ? (
                  <Text style={styles.bookingMessage} numberOfLines={2}>
                    {booking.message}
                  </Text>
                ) : null}

                {booking.status === 'pending' ? (
                  <View style={styles.bookingActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.declineBtn]}
                      onPress={() => handleBookingResponse(booking.id, 'declined')}
                      disabled={bookingActionId === booking.id}
                    >
                      {bookingActionId === booking.id ? (
                        <ActivityIndicator />
                      ) : (
                        <>
                          <XCircle size={16} color={COLORS.white} />
                          <Text style={styles.actionBtnText}>Refuser</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => handleBookingResponse(booking.id, 'accepted')}
                      disabled={bookingActionId === booking.id}
                    >
                      {bookingActionId === booking.id ? (
                        <ActivityIndicator />
                      ) : (
                        <>
                          <CheckCircle size={16} color={COLORS.white} />
                          <Text style={styles.actionBtnText}>Accepter</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </GlassCard>

        {/* Quick stats */}
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

      {/* Modal édition planning */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={closeEdit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Modifier {editDayIndex !== null ? weekDays[editDayIndex] : ''}
            </Text>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Disponible</Text>
              <TouchableOpacity
                onPress={() => setEditAvailable(v => !v)}
                style={[
                  styles.togglePill,
                  editAvailable ? { backgroundColor: `${COLORS.success}20` } : { backgroundColor: `${COLORS.darkGray}15` },
                ]}
              >
                <Text style={[styles.toggleText, { color: editAvailable ? COLORS.success : COLORS.darkGray }]}>
                  {editAvailable ? 'Oui' : 'Non'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Début</Text>
              <TextInput
                value={editStart}
                onChangeText={setEditStart}
                placeholder="08:00"
                keyboardType="numbers-and-punctuation"
                style={[styles.timeInput, !editAvailable ? styles.timeInputDisabled : null]}
                editable={editAvailable}
              />
            </View>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Fin</Text>
              <TextInput
                value={editEnd}
                onChangeText={setEditEnd}
                placeholder="18:00"
                keyboardType="numbers-and-punctuation"
                style={[styles.timeInput, !editAvailable ? styles.timeInputDisabled : null]}
                editable={editAvailable}
              />
            </View>

            {editError ? <Text style={styles.modalError}>{editError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGhost]} onPress={closeEdit} disabled={savingDay}>
                <Text style={styles.modalBtnGhostText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={saveDay} disabled={savingDay}>
                {savingDay ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Save size={16} color={COLORS.white} />
                    <Text style={styles.modalBtnPrimaryText}>Enregistrer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Service Add/Edit */}
      <Modal visible={serviceModalOpen} transparent animationType="fade" onRequestClose={closeServiceModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingService ? 'Modifier prestation' : 'Ajouter prestation'}
            </Text>

            <TextInput
              value={serviceName}
              onChangeText={setServiceName}
              placeholder="Nom (ex: Visite 30 min)"
              style={styles.modalInput}
            />

            <TextInput
              value={serviceDesc}
              onChangeText={setServiceDesc}
              placeholder="Description (optionnel)"
              multiline
              numberOfLines={2}
              style={[styles.modalInput, { height: 60 }]}
            />

            <View style={styles.modalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Prix (€)</Text>
                <TextInput
                  value={servicePrice}
                  onChangeText={setServicePrice}
                  placeholder="15"
                  keyboardType="decimal-pad"
                  style={styles.timeInput}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Durée (min)</Text>
                <TextInput
                  value={serviceDuration}
                  onChangeText={setServiceDuration}
                  placeholder="60"
                  keyboardType="number-pad"
                  style={styles.timeInput}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={closeServiceModal}
                disabled={savingService}
              >
                <Text style={styles.modalBtnGhostText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={saveService}
                disabled={savingService}
              >
                {savingService ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Save size={16} color={COLORS.white} />
                    <Text style={styles.modalBtnPrimaryText}>Enregistrer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Insurance */}
      <Modal visible={insuranceModalOpen} transparent animationType="fade" onRequestClose={closeInsuranceModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assurance & Infos Pro</Text>

            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>J&apos;ai une assurance</Text>
              <Switch
                value={insuranceEnabled}
                onValueChange={setInsuranceEnabled}
                trackColor={{ false: COLORS.darkGray, true: COLORS.success }}
                thumbColor={COLORS.white}
              />
            </View>

            {insuranceEnabled ? (
              <>
                <TextInput
                  value={insuranceCompany}
                  onChangeText={setInsuranceCompany}
                  placeholder="Compagnie (ex: AXA)"
                  style={styles.modalInput}
                />

                <TextInput
                  value={insuranceNumber}
                  onChangeText={setInsuranceNumber}
                  placeholder="Numéro de contrat"
                  style={styles.modalInput}
                />

                <TextInput
                  value={insuranceExpiry}
                  onChangeText={setInsuranceExpiry}
                  placeholder="Date d'expiration (ex: 2025-12-31)"
                  style={styles.modalInput}
                />
              </>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={closeInsuranceModal}
                disabled={savingInsurance}
              >
                <Text style={styles.modalBtnGhostText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={saveInsurance}
                disabled={savingInsurance}
              >
                {savingInsurance ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Save size={16} color={COLORS.white} />
                    <Text style={styles.modalBtnPrimaryText}>Enregistrer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

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

  headerIconButton: { padding: 8 },

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
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginLeft: DIMENSIONS.SPACING.xs,
  },
  sectionHint: {
    marginLeft: 8,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
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
  bookingClient: { flex: 1 },
  bookingClientName: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  bookingPet: { fontSize: DIMENSIONS.FONT_SIZES.sm, color: COLORS.darkGray },
  bookingStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
  bookingInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookingInfoText: { fontSize: DIMENSIONS.FONT_SIZES.xs, color: COLORS.darkGray },
  bookingMessage: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
    fontStyle: 'italic',
    marginTop: DIMENSIONS.SPACING.xs,
  },

  bookingActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: DIMENSIONS.SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: { backgroundColor: COLORS.success },
  declineBtn: { backgroundColor: COLORS.error },
  actionBtnText: { color: COLORS.white, fontWeight: '700' as const, fontSize: 13 },

  quickStatsGrid: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  quickStat: { flex: 1, padding: DIMENSIONS.SPACING.md, alignItems: 'center' },
  quickStatValue: {
    fontSize: DIMENSIONS.FONT_SIZES.xxl,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginTop: DIMENSIONS.SPACING.xs,
    marginBottom: 4,
  },
  quickStatLabel: { fontSize: DIMENSIONS.FONT_SIZES.xs, color: COLORS.darkGray, textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  timeInput: {
    width: 90,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    textAlign: 'center',
    fontWeight: '700' as const,
  },
  timeInputDisabled: {
    opacity: 0.5,
  },
  modalError: {
    marginTop: 6,
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalBtnGhost: {
    backgroundColor: `${COLORS.darkGray}12`,
  },
  modalBtnGhostText: {
    color: COLORS.black,
    fontWeight: '800' as const,
  },
  modalBtnPrimary: {
    backgroundColor: COLORS.black,
  },
  modalBtnPrimaryText: {
    color: COLORS.white,
    fontWeight: '800' as const,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.black,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginLeft: 'auto',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },

  serviceCard: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingVertical: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.xs,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceName: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '700' as const,
    color: COLORS.success,
  },
  serviceDuration: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  editIconButton: {
    padding: 6,
    marginLeft: 'auto',
  },

  modalInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    marginBottom: 12,
    fontSize: 14,
  },

  insuranceInfo: {
    gap: 10,
  },
  insuranceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insuranceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  insuranceValue: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
});