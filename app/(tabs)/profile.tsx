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
  Lock,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const toHref = (path: string): Href => path as Href;
  const { user, signOut, updateUser } = useFirebaseUser();
  const { friends } = useFriends();
  const { getUnlockedBadges } = useBadges();
  const { getUserActiveChallenges, getUserCompletedChallenges } = useChallenges();
  const { isPremium } = usePremium();

  
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(user?.photo);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Update profile photo when user changes
  useEffect(() => {
    setProfilePhoto(user?.photo);
  }, [user?.photo]);
  

  
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
              onPress={() => router.push(toHref(user?.isCatSitter ? '/(pro)/cat-sitter-dashboard' : '/(tabs)/cat-sitter'))}
              testID="profile-cat-sitter-button"
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
});