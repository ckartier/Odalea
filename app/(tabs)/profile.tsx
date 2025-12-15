import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import GlassCard from '@/components/GlassCard';
import AppBackground from '@/components/AppBackground';
import PetCard from '@/components/PetCard';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import PhotoUploader from '@/components/PhotoUploader';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { StorageService } from '@/services/storage';
import { useBadges } from '@/hooks/badges-store';
import { useChallenges } from '@/hooks/challenges-store';
import { usePremium } from '@/hooks/premium-store';
import { useCatSitter } from '@/hooks/cat-sitter-store';
import { useFriends } from '@/hooks/friends-store';
import { 
  LogOut, 
  MapPin, 
  Phone, 
  Plus, 
  Settings, 
  Shield, 
  Star, 
  User as UserIcon,
  Users,
  Trophy,
  Heart,
  Euro,
  Calendar,
  MessageCircle,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowRight,
  Lock,
  X,
  Edit3,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const toHref = (path: string): Href => path as Href;
  const { user, signOut, updateUser } = useFirebaseUser();
  const { friends } = useFriends();
  const { getUnlockedBadges } = useBadges();
  const { getUserActiveChallenges, getUserCompletedChallenges } = useChallenges();
  const { isPremium } = usePremium();
  const {
    profile: catSitterProfile,
    bookingRequests,
    messages: catSitterMessages,
    createProfile,
    toggleAvailability,
    respondToBooking,
    getUnreadMessagesCount,
    getPendingBookingsCount,
    updateProfile,
  } = useCatSitter();
  
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(user?.photo);
  const [selectedCatSitterTab, setSelectedCatSitterTab] = useState<'overview' | 'bookings' | 'messages'>('overview');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  
  // Update profile photo when user changes
  useEffect(() => {
    setProfilePhoto(user?.photo);
  }, [user?.photo]);
  
  // Create cat-sitter profile if needed
  useEffect(() => {
    if (user && user.isCatSitter && !catSitterProfile) {
      createProfile(user.id, {
        hourlyRate: 15,
        description: 'Passionné(e) par les animaux, je propose mes services de garde avec amour et attention.',
        services: ['Pet Sitting', 'Feeding', 'Playing'],
        petTypes: ['Cats', 'Dogs'],
        languages: ['French'],
      });
    }
  }, [user, catSitterProfile, createProfile]);
  
  const unlockedBadges = getUnlockedBadges();
  const activeChallenges = user ? getUserActiveChallenges(user.id) : [];
  const completedChallenges = user ? getUserCompletedChallenges(user.id) : [];
  

  
  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };
  
  const handleAddPet = () => {
    router.push(toHref('/pet/add'));
  };
  
  const handleEditProfile = () => {
    router.push(toHref('/profile/edit'));
  };
  
  const handlePhotoChange = async (uri: string | null) => {
    if (!user) return;
    
    try {
      setUploadingPhoto(true);
      console.log('📤 Uploading profile photo:', uri);
      
      let photoUrl: string | undefined = undefined;
      
      if (uri) {
        photoUrl = await StorageService.uploadProfilePicture(user.id, uri, {
          onProgress: (progress) => {
            console.log(`📊 Upload progress: ${progress.progress.toFixed(1)}%`);
          },
        });
        console.log('✅ Photo uploaded to Firebase Storage:', photoUrl);
      }
      
      setProfilePhoto(photoUrl);
      
      const result = await updateUser({ ...user, photo: photoUrl });
      if (result.success) {
        console.log('✅ Profile photo updated successfully');
        Alert.alert('Succès', 'Photo de profil mise à jour avec succès.');
      } else {
        console.error('❌ Failed to update profile photo:', result.error);
        Alert.alert('Erreur', 'Impossible de mettre à jour la photo de profil.');
      }
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader la photo. Veuillez réessayer.');
      setProfilePhoto(user.photo);
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace(toHref('/splash'));
          },
        },
      ]
    );
  };
  
  const handleToggleAvailability = async () => {
    const result = await toggleAvailability();
    if (result.success) {
      Alert.alert(
        'Statut mis à jour',
        `Vous êtes maintenant ${catSitterProfile?.isActive ? 'indisponible' : 'disponible'}`
      );
    }
  };
  
  const handleAddService = async () => {
    if (!catSitterProfile || !newServiceName.trim()) return;

    const updatedServices = editingService
      ? catSitterProfile.services.map(s => s === editingService ? newServiceName.trim() : s)
      : [...catSitterProfile.services, newServiceName.trim()];

    const result = await updateProfile({ services: updatedServices });
    if (result.success) {
      setNewServiceName('');
      setEditingService(null);
      setShowServicesModal(false);
      Alert.alert('Succès', editingService ? 'Service modifié avec succès' : 'Service ajouté avec succès');
    }
  };

  const handleDeleteService = async (service: string) => {
    if (!catSitterProfile) return;

    Alert.alert(
      'Supprimer le service',
      `Voulez-vous vraiment supprimer "${service}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updatedServices = catSitterProfile.services.filter(s => s !== service);
            const result = await updateProfile({ services: updatedServices });
            if (result.success) {
              Alert.alert('Succès', 'Service supprimé avec succès');
            }
          },
        },
      ]
    );
  };

  const handleEditService = (service: string) => {
    setEditingService(service);
    setNewServiceName(service);
    setShowServicesModal(true);
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
  
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }
  
  const primaryPetGender = user.pets[0]?.gender;
  const tint = primaryPetGender === 'male' ? 'male' : primaryPetGender === 'female' ? 'female' : 'neutral';

  return (
    <AppBackground variant={primaryPetGender === 'male' ? 'male' : primaryPetGender === 'female' ? 'female' : 'default'}>
      <StatusBar style="dark" />
      
      {/* Fixed Header */}
      <GlassCard tint={tint as 'male' | 'female' | 'neutral'} style={styles.fixedHeader} noPadding>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerName}>@{user.pseudo}</Text>
            <Text style={styles.friendsCount}>{friends.length} {friends.length <= 1 ? 'ami' : 'amis'}</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push(toHref('/cat-sitter'))}
            >
              <Heart size={20} color={COLORS.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push(toHref('/friends'))}
            >
              <Users size={20} color={COLORS.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleEditProfile}
            >
              <Settings size={20} color={COLORS.primary} />
            </TouchableOpacity>
            
            {user.role === 'admin' && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push(toHref('/admin'))}
              >
                <Lock size={20} color={COLORS.accent} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleSignOut}
            >
              <LogOut size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profilePhotoContainer}>
            <PhotoUploader
              value={profilePhoto}
              onChange={handlePhotoChange}
              placeholder="Ajouter photo"
              style={styles.profilePhotoUploader}
            />
            {uploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <Text style={styles.uploadingText}>Upload...</Text>
              </View>
            )}
          </View>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <MapPin size={16} color={COLORS.darkGray} />
              <Text style={styles.detailText}>{user.city}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Phone size={16} color={COLORS.darkGray} />
              <Text style={styles.detailText}>+{user.countryCode} {user.phoneNumber}</Text>
            </View>
          </View>
        </View>
        
        {/* Membership Status */}
        <GlassCard 
          tint={tint as 'male' | 'female' | 'neutral'}
          style={styles.membershipCard}
          onPress={() => router.push(toHref('/premium'))}
        >
          <View style={styles.membershipInfo}>
            {isPremium ? (
              <View style={styles.premiumIconContainer}>
                <Star size={24} color={COLORS.accent} fill={COLORS.accent} />
              </View>
            ) : (
              <Shield size={24} color={COLORS.darkGray} />
            )}
            <View>
              <Text style={styles.membershipTitle}>
                {isPremium ? 'Membre Premium' : 'Compte Gratuit'}
              </Text>
              <Text style={styles.membershipSubtitle}>
                {isPremium 
                  ? 'Profitez de toutes les fonctionnalités premium' 
                  : 'Passez à Premium pour supprimer les pubs'}
              </Text>
            </View>
          </View>
          
          {!isPremium ? (
            <Button
              title="Passer à Premium"
              onPress={() => router.push(toHref('/premium'))}
              variant="primary"
              size="small"
            />
          ) : (
            <Text style={styles.managePremiumText}>Gérer</Text>
          )}
        </GlassCard>
        
        {/* Friends Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes amis</Text>
          <TouchableOpacity onPress={() => router.push(toHref('/friends'))}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        {friends.length > 0 ? (
          <FlatList
            data={friends.slice(0, 10)}
            renderItem={({ item }) => (
              <GlassCard 
                tint={tint as 'male' | 'female' | 'neutral'}
                style={styles.friendItem}
                onPress={() => router.push(toHref(`/messages/${item.id}`))}
              >
                {item.photo ? (
                  <Image 
                    source={{ uri: item.photo }} 
                    style={styles.friendAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.friendAvatar, styles.friendAvatarPlaceholder]}>
                    <UserIcon size={24} color={COLORS.mediumGray} />
                  </View>
                )}
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>@{item.pseudo || item.name}</Text>
                  <Text style={styles.friendAction}>Envoyer un message</Text>
                </View>
              </GlassCard>
            )}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsList}
          />
        ) : (
          <GlassCard tint={tint as 'male' | 'female' | 'neutral'} style={styles.emptyFriendsCard}>
            <Users size={32} color={COLORS.mediumGray} />
            <Text style={styles.emptyFriendsText}>Aucun ami pour le moment</Text>
            <TouchableOpacity onPress={() => router.push(toHref('/friends'))}>
              <Text style={styles.addFriendsText}>Ajouter des amis</Text>
            </TouchableOpacity>
          </GlassCard>
        )}
        
        {/* My Pets Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes animaux</Text>
          <TouchableOpacity onPress={handleAddPet}>
            <Plus size={20} color={COLORS.maleAccent} />
          </TouchableOpacity>
        </View>
        
        {user.pets.length > 0 ? (
          <FlatList
            data={user.pets}
            renderItem={({ item }) => <PetCard pet={item} style={styles.petCard} />}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petsContainer}
          />
        ) : (
          <TouchableOpacity
            style={[styles.addPetCard, SHADOWS.small]}
            onPress={handleAddPet}
          >
            <Plus size={32} color={COLORS.maleAccent} />
            <Text style={styles.addPetText}>Ajoutez votre premier animal</Text>
          </TouchableOpacity>
        )}
        
        {/* Challenges Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes défis</Text>
          <TouchableOpacity onPress={() => router.push(toHref('/(tabs)/challenges'))}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        <GlassCard tint={tint as 'male' | 'female' | 'neutral'} style={styles.challengesContainer}>
          <View style={styles.challengesSummary}>
            <View style={styles.challengeStatItem}>
              <Trophy size={20} color={COLORS.accent} />
              <Text style={styles.challengeStatNumber}>{completedChallenges.length}</Text>
              <Text style={styles.challengeStatLabel}>Terminés</Text>
            </View>
            <View style={styles.challengeStatItem}>
              <Trophy size={20} color={COLORS.primary} />
              <Text style={styles.challengeStatNumber}>{activeChallenges.length}</Text>
              <Text style={styles.challengeStatLabel}>En cours</Text>
            </View>
          </View>
        </GlassCard>
        
        {/* Badges Section */}
        {unlockedBadges.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vos badges</Text>
              <TouchableOpacity onPress={() => router.push(toHref('/badges'))}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={unlockedBadges}
              renderItem={({ item }) => (
                <Badge badge={item} style={styles.badge} />
              )}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesContainer}
            />
          </>
        )}
        
        {/* Cat-Sitter Dashboard */}
        {user.isCatSitter && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dashboard Cat-Sitter</Text>
            </View>
            
            {/* Cat-Sitter Tab Navigation */}
            <View style={styles.catSitterTabNavigation}>
              <TouchableOpacity
                style={[styles.catSitterTabButton, selectedCatSitterTab === 'overview' && styles.activeCatSitterTab]}
                onPress={() => setSelectedCatSitterTab('overview')}
              >
                <TrendingUp size={18} color={selectedCatSitterTab === 'overview' ? COLORS.primary : COLORS.darkGray} />
                <Text style={[styles.catSitterTabText, selectedCatSitterTab === 'overview' && styles.activeCatSitterTabText]}>
                  Vue d&apos;ensemble
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.catSitterTabButton, selectedCatSitterTab === 'bookings' && styles.activeCatSitterTab]}
                onPress={() => setSelectedCatSitterTab('bookings')}
              >
                <Calendar size={18} color={selectedCatSitterTab === 'bookings' ? COLORS.primary : COLORS.darkGray} />
                <Text style={[styles.catSitterTabText, selectedCatSitterTab === 'bookings' && styles.activeCatSitterTabText]}>
                  Demandes
                </Text>
                {getPendingBookingsCount() > 0 && (
                  <View style={styles.catSitterBadge}>
                    <Text style={styles.catSitterBadgeText}>{getPendingBookingsCount()}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.catSitterTabButton, selectedCatSitterTab === 'messages' && styles.activeCatSitterTab]}
                onPress={() => setSelectedCatSitterTab('messages')}
              >
                <MessageCircle size={18} color={selectedCatSitterTab === 'messages' ? COLORS.primary : COLORS.darkGray} />
                <Text style={[styles.catSitterTabText, selectedCatSitterTab === 'messages' && styles.activeCatSitterTabText]}>
                  Messages
                </Text>
                {getUnreadMessagesCount() > 0 && (
                  <View style={styles.catSitterBadge}>
                    <Text style={styles.catSitterBadgeText}>{getUnreadMessagesCount()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Cat-Sitter Content */}
            <View style={[styles.catSitterContent, SHADOWS.medium]}>
              {selectedCatSitterTab === 'overview' && (
                <View>
                  {/* Stats Grid */}
                  <View style={styles.catSitterStatsGrid}>
                    <View style={[styles.catSitterStatCard, SHADOWS.small]}>
                      <View style={styles.catSitterStatIcon}>
                        <Euro size={20} color={COLORS.success} />
                      </View>
                      <Text style={styles.catSitterStatValue}>{catSitterProfile?.hourlyRate || 0}€/h</Text>
                      <Text style={styles.catSitterStatLabel}>Tarif horaire</Text>
                    </View>

                    <View style={[styles.catSitterStatCard, SHADOWS.small]}>
                      <View style={styles.catSitterStatIcon}>
                        <Star size={20} color={COLORS.accent} />
                      </View>
                      <Text style={styles.catSitterStatValue}>{catSitterProfile?.rating || 0}</Text>
                      <Text style={styles.catSitterStatLabel}>Note moyenne</Text>
                    </View>

                    <View style={[styles.catSitterStatCard, SHADOWS.small]}>
                      <View style={styles.catSitterStatIcon}>
                        <Users size={20} color={COLORS.primary} />
                      </View>
                      <Text style={styles.catSitterStatValue}>{catSitterProfile?.totalBookings || 0}</Text>
                      <Text style={styles.catSitterStatLabel}>Réservations</Text>
                    </View>

                    <View style={[styles.catSitterStatCard, SHADOWS.small]}>
                      <View style={styles.catSitterStatIcon}>
                        <Award size={20} color={COLORS.catSitter} />
                      </View>
                      <Text style={styles.catSitterStatValue}>{catSitterProfile?.reviewCount || 0}</Text>
                      <Text style={styles.catSitterStatLabel}>Avis clients</Text>
                    </View>
                  </View>
                  
                  {/* Availability Toggle */}
                  <View style={styles.catSitterAvailabilityCard}>
                    <View style={styles.catSitterAvailabilityHeader}>
                      <View>
                        <Text style={styles.catSitterAvailabilityTitle}>Statut de disponibilité</Text>
                        <Text style={styles.catSitterAvailabilitySubtitle}>
                          {catSitterProfile?.isActive ? 'Vous acceptez de nouvelles demandes' : 'Vous n&apos;acceptez pas de nouvelles demandes'}
                        </Text>
                      </View>
                      <Switch
                        value={catSitterProfile?.isActive || false}
                        onValueChange={handleToggleAvailability}
                        trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
                        thumbColor={catSitterProfile?.isActive ? COLORS.white : COLORS.mediumGray}
                      />
                    </View>
                  </View>
                  
                  {/* Quick Actions */}
                  <View style={styles.catSitterQuickActions}>
                    <TouchableOpacity 
                      style={styles.catSitterActionButton}
                      onPress={() => setSelectedCatSitterTab('bookings')}
                    >
                      <View style={styles.catSitterActionIcon}>
                        <Calendar size={18} color={COLORS.primary} />
                      </View>
                      <View style={styles.catSitterActionContent}>
                        <Text style={styles.catSitterActionTitle}>Demandes en attente</Text>
                        <Text style={styles.catSitterActionSubtitle}>{getPendingBookingsCount()} nouvelles demandes</Text>
                      </View>
                      <ArrowRight size={18} color={COLORS.darkGray} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.catSitterActionButton}
                      onPress={() => setSelectedCatSitterTab('messages')}
                    >
                      <View style={styles.catSitterActionIcon}>
                        <MessageCircle size={18} color={COLORS.primary} />
                      </View>
                      <View style={styles.catSitterActionContent}>
                        <Text style={styles.catSitterActionTitle}>Messages non lus</Text>
                        <Text style={styles.catSitterActionSubtitle}>{getUnreadMessagesCount()} nouveaux messages</Text>
                      </View>
                      <ArrowRight size={18} color={COLORS.darkGray} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.catSitterActionButton}
                      onPress={() => router.push(toHref('/cat-sitter-settings'))}
                    >
                      <View style={styles.catSitterActionIcon}>
                        <Settings size={18} color={COLORS.primary} />
                      </View>
                      <View style={styles.catSitterActionContent}>
                        <Text style={styles.catSitterActionTitle}>Paramètres du profil</Text>
                        <Text style={styles.catSitterActionSubtitle}>Modifier vos informations</Text>
                      </View>
                      <ArrowRight size={18} color={COLORS.darkGray} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Services Management */}
                  <View style={styles.catSitterServicesSection}>
                    <View style={styles.catSitterServicesSectionHeader}>
                      <Text style={styles.catSitterSectionTitle}>Mes prestations</Text>
                      <TouchableOpacity
                        style={styles.addServiceButton}
                        onPress={() => {
                          setEditingService(null);
                          setNewServiceName('');
                          setShowServicesModal(true);
                        }}
                      >
                        <Plus size={16} color={COLORS.white} />
                        <Text style={styles.addServiceButtonText}>Ajouter</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.servicesGrid}>
                      {catSitterProfile?.services.map((service, index) => (
                        <View key={index} style={styles.serviceChip}>
                          <Heart size={14} color={COLORS.primary} />
                          <Text style={styles.serviceChipText}>{service}</Text>
                          <TouchableOpacity
                            onPress={() => handleEditService(service)}
                            style={styles.serviceChipAction}
                          >
                            <Edit3 size={12} color={COLORS.darkGray} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteService(service)}
                            style={styles.serviceChipAction}
                          >
                            <X size={12} color={COLORS.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {(!catSitterProfile?.services || catSitterProfile.services.length === 0) && (
                        <Text style={styles.noServicesText}>Aucune prestation configurée</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
              
              {selectedCatSitterTab === 'bookings' && (
                <View>
                  <Text style={styles.catSitterSectionTitle}>Demandes de réservation</Text>
                  
                  {bookingRequests.length === 0 ? (
                    <View style={styles.catSitterEmptyState}>
                      <Calendar size={40} color={COLORS.mediumGray} />
                      <Text style={styles.catSitterEmptyStateText}>Aucune demande pour le moment</Text>
                    </View>
                  ) : (
                    bookingRequests.slice(0, 3).map((booking) => (
                      <View key={booking.id} style={[styles.catSitterBookingCard, SHADOWS.small]}>
                        <View style={styles.catSitterBookingHeader}>
                          <Image source={{ uri: booking.clientAvatar }} style={styles.catSitterClientAvatar} />
                          <View style={styles.catSitterBookingInfo}>
                            <Text style={styles.catSitterClientName}>{booking.clientName}</Text>
                            <Text style={styles.catSitterPetInfo}>{booking.petName} • {booking.petType}</Text>
                            <Text style={styles.catSitterBookingDates}>
                              {booking.startDate} - {booking.endDate}
                            </Text>
                          </View>
                          <View style={styles.catSitterBookingPrice}>
                            <Text style={styles.catSitterPriceAmount}>{booking.totalPrice}€</Text>
                            <Text style={styles.catSitterPriceDetails}>{booking.totalHours}h</Text>
                          </View>
                        </View>

                        <Text style={styles.catSitterBookingMessage} numberOfLines={2}>{booking.message}</Text>

                        <View style={styles.catSitterBookingActions}>
                          {booking.status === 'pending' ? (
                            <>
                              <TouchableOpacity
                                style={[styles.catSitterBookingActionButton, styles.catSitterDeclineButton]}
                                onPress={() => handleBookingResponse(booking.id, 'declined')}
                              >
                                <XCircle size={14} color={COLORS.white} />
                                <Text style={styles.catSitterDeclineButtonText}>Refuser</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                style={[styles.catSitterBookingActionButton, styles.catSitterAcceptButton]}
                                onPress={() => handleBookingResponse(booking.id, 'accepted')}
                              >
                                <CheckCircle size={14} color={COLORS.white} />
                                <Text style={styles.catSitterAcceptButtonText}>Accepter</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <View style={[styles.catSitterStatusBadge, 
                              booking.status === 'accepted' ? styles.catSitterAcceptedBadge : 
                              booking.status === 'declined' ? styles.catSitterDeclinedBadge : styles.catSitterCompletedBadge
                            ]}>
                              <Text style={styles.catSitterStatusBadgeText}>
                                {booking.status === 'accepted' ? 'Acceptée' :
                                 booking.status === 'declined' ? 'Refusée' : 'Terminée'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                  
                  {bookingRequests.length > 3 && (
                    <TouchableOpacity 
                      style={styles.catSitterViewAllButton}
                      onPress={() => router.push(toHref('/cat-sitter-dashboard'))}
                    >
                      <Text style={styles.catSitterViewAllButtonText}>Voir toutes les demandes</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {selectedCatSitterTab === 'messages' && (
                <View>
                  <Text style={styles.catSitterSectionTitle}>Messages</Text>
                  
                  {catSitterMessages.length === 0 ? (
                    <View style={styles.catSitterEmptyState}>
                      <MessageCircle size={40} color={COLORS.mediumGray} />
                      <Text style={styles.catSitterEmptyStateText}>Aucun message</Text>
                    </View>
                  ) : (
                    catSitterMessages.slice(0, 3).map((message) => (
                      <TouchableOpacity
                        key={message.id}
                        style={[styles.catSitterMessageCard, SHADOWS.small, !message.isRead && styles.catSitterUnreadMessage]}
                        onPress={() => router.push(toHref(`/messages/${message.fromId}`))}
                      >
                        <Image source={{ uri: message.fromAvatar }} style={styles.catSitterMessageAvatar} />
                        <View style={styles.catSitterMessageContent}>
                          <View style={styles.catSitterMessageHeader}>
                            <Text style={styles.catSitterMessageSender}>{message.fromName}</Text>
                            <Text style={styles.catSitterMessageTime}>
                              {new Date(message.timestamp).toLocaleDateString()}
                            </Text>
                          </View>
                          <Text style={styles.catSitterMessageText} numberOfLines={2}>
                            {message.message}
                          </Text>
                          {message.bookingId && (
                            <Text style={styles.catSitterMessageBooking}>Réservation liée</Text>
                          )}
                        </View>
                        {!message.isRead && <View style={styles.catSitterUnreadDot} />}
                      </TouchableOpacity>
                    ))
                  )}
                  
                  {catSitterMessages.length > 3 && (
                    <TouchableOpacity 
                      style={styles.catSitterViewAllButton}
                      onPress={() => router.push(toHref('/cat-sitter-dashboard'))}
                    >
                      <Text style={styles.catSitterViewAllButtonText}>Voir tous les messages</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </>
        )}
        
        {/* Account Info */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations du compte</Text>
        </View>
        
        <GlassCard tint={tint as 'male' | 'female' | 'neutral'} style={styles.infoCard}>
          <View style={styles.infoItem}>
            <UserIcon size={18} color={COLORS.darkGray} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{user.email}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoItem}>
            <MapPin size={18} color={COLORS.darkGray} />
            <Text style={styles.infoLabel}>Ville</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{user.city}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoItem}>
            <Star size={18} color={COLORS.darkGray} />
            <Text style={styles.infoLabel}>Membre depuis</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
      
      {/* Services Modal */}
      <Modal
        visible={showServicesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowServicesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Modifier la prestation' : 'Nouvelle prestation'}
              </Text>
              <TouchableOpacity onPress={() => setShowServicesModal(false)}>
                <X size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Nom de la prestation</Text>
              <TextInput
                style={styles.modalInput}
                value={newServiceName}
                onChangeText={setNewServiceName}
                placeholder="Ex: Promenade longue durée"
                placeholderTextColor={COLORS.mediumGray}
                autoFocus
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowServicesModal(false);
                    setNewServiceName('');
                    setEditingService(null);
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave, !newServiceName.trim() && styles.modalButtonDisabled]}
                  onPress={handleAddService}
                  disabled={!newServiceName.trim()}
                >
                  <Text style={styles.modalButtonSaveText}>
                    {editingService ? 'Modifier' : 'Ajouter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedHeader: {
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 12 : 16,
    marginBottom: 8,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerName: {
    ...TYPOGRAPHY.h3,
  },
  friendsCount: {
    ...TYPOGRAPHY.body2,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  profileSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  profilePhotoContainer: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
  },
  profilePhotoUploader: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  uploadingText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginRight: 8,
  },
  badgeContainer: {
    backgroundColor: COLORS.maleAccent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  detailsContainer: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.darkGray,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  membershipCard: {
    marginBottom: 24,
  },
  premiumIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  membershipTitle: {
    ...TYPOGRAPHY.h5,
    marginBottom: 2,
  },
  membershipSubtitle: {
    ...TYPOGRAPHY.caption,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
  },
  seeAllText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.maleAccent,
  },
  petsContainer: {
    paddingRight: 16,
    gap: 12,
  },
  petCard: {
    marginRight: 12,
  },
  addPetCard: {
    width: 160,
    height: 220,
    borderRadius: 16,
    backgroundColor: COLORS.default,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    borderStyle: 'dashed',
  },
  addPetText: {
    ...TYPOGRAPHY.h5,
    color: COLORS.maleAccent,
    marginTop: 8,
  },
  badgesContainer: {
    paddingRight: 16,
    gap: 16,
  },
  badge: {
    marginRight: 12,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 40,
  },
  infoLabel: {
    ...TYPOGRAPHY.label,
    marginLeft: 10,
    width: 90,
  },
  infoValue: {
    ...TYPOGRAPHY.body2,
    flex: 1,
    color: COLORS.darkGray,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.mediumGray,
  },
  friendsList: {
    paddingRight: 16,
    gap: 12,
  },
  friendItem: {
    alignItems: 'center',
    width: 120,
    marginRight: 12,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
    backgroundColor: COLORS.lightGray,
  },
  friendAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInfo: {
    alignItems: 'center',
  },
  friendName: {
    ...TYPOGRAPHY.h6,
    textAlign: 'center',
    marginBottom: 4,
  },
  friendAction: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    textAlign: 'center',
  },
  emptyFriendsCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyFriendsText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.darkGray,
    marginTop: 12,
    textAlign: 'center',
  },
  addFriendsText: {
    ...TYPOGRAPHY.h6,
    color: COLORS.primary,
    marginTop: 8,
  },
  challengesContainer: {
    marginBottom: 16,
  },
  challengesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  challengeStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  challengeStatNumber: {
    ...TYPOGRAPHY.h2,
    marginTop: 8,
  },
  challengeStatLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: 4,
  },
  managePremiumText: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.primary,
  },
  // Cat-Sitter Dashboard Styles
  catSitterTabNavigation: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  catSitterTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    position: 'relative',
    gap: 6,
  },
  activeCatSitterTab: {
    backgroundColor: COLORS.primary,
  },
  catSitterTabText: {
    ...TYPOGRAPHY.tabLabel,
  },
  activeCatSitterTabText: {
    ...TYPOGRAPHY.tabLabelActive,
    color: COLORS.white,
  },
  catSitterBadge: {
    position: 'absolute',
    top: 2,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catSitterBadgeText: {
    ...TYPOGRAPHY.badge,
  },
  catSitterContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  catSitterStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catSitterStatCard: {
    backgroundColor: COLORS.screenBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '48%',
  },
  catSitterStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  catSitterStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  catSitterStatLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  catSitterAvailabilityCard: {
    backgroundColor: COLORS.screenBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  catSitterAvailabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catSitterAvailabilityTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  catSitterAvailabilitySubtitle: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  catSitterQuickActions: {
    gap: 12,
  },
  catSitterActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.screenBackground,
    borderRadius: 12,
  },
  catSitterActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catSitterActionContent: {
    flex: 1,
  },
  catSitterActionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  catSitterActionSubtitle: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  catSitterSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  catSitterEmptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  catSitterEmptyStateText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 12,
  },
  catSitterBookingCard: {
    backgroundColor: COLORS.screenBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  catSitterBookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  catSitterClientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  catSitterBookingInfo: {
    flex: 1,
  },
  catSitterClientName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  catSitterPetInfo: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  catSitterBookingDates: {
    fontSize: 12,
    color: COLORS.primary,
  },
  catSitterBookingPrice: {
    alignItems: 'flex-end',
  },
  catSitterPriceAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.success,
  },
  catSitterPriceDetails: {
    fontSize: 10,
    color: COLORS.darkGray,
  },
  catSitterBookingMessage: {
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 16,
    marginBottom: 8,
  },
  catSitterBookingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  catSitterBookingActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  catSitterAcceptButton: {
    backgroundColor: COLORS.success,
  },
  catSitterAcceptButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  catSitterDeclineButton: {
    backgroundColor: COLORS.error,
  },
  catSitterDeclineButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  catSitterStatusBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  catSitterAcceptedBadge: {
    backgroundColor: COLORS.available,
  },
  catSitterDeclinedBadge: {
    backgroundColor: COLORS.busy,
  },
  catSitterCompletedBadge: {
    backgroundColor: COLORS.mediumGray,
  },
  catSitterStatusBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  catSitterMessageCard: {
    backgroundColor: COLORS.screenBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  catSitterUnreadMessage: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  catSitterMessageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  catSitterMessageContent: {
    flex: 1,
  },
  catSitterMessageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  catSitterMessageSender: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  catSitterMessageTime: {
    fontSize: 10,
    color: COLORS.darkGray,
  },
  catSitterMessageText: {
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 16,
    marginBottom: 2,
  },
  catSitterMessageBooking: {
    fontSize: 10,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  catSitterUnreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
    marginTop: 6,
  },
  catSitterViewAllButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  catSitterViewAllButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  catSitterServicesSection: {
    marginTop: 16,
  },
  catSitterServicesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addServiceButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.screenBackground,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  serviceChipText: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: '500' as const,
  },
  serviceChipAction: {
    padding: 2,
  },
  noServicesText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.screenBackground,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.lightGray,
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
  },
  modalButtonSave: {
    backgroundColor: COLORS.primary,
  },
  modalButtonSaveText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});