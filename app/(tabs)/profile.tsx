import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/theme/tokens';

import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { StorageService } from '@/services/storage';
import { usePremium } from '@/hooks/premium-store';
import { useActivePet } from '@/hooks/active-pet-store';
import { useUserPets } from '@/hooks/useUserPets';
import { getPetImageUrl, getUserAvatarUrl, DEFAULT_USER_PLACEHOLDER, DEFAULT_PET_PLACEHOLDER } from '@/lib/image-helpers';

export default function ProfileScreen() {
  const router = useRouter();
  const toHref = (path: string): Href => path as Href;
  const { user, signOut, updateUser } = useFirebaseUser();
  const { friends } = useFriends();
  const { isPremium } = usePremium();
  const { activePetId, setActivePet } = useActivePet();
  const { pets: userPets, deletePet: deletePetHook } = useUserPets();
  const queryClient = useQueryClient();
  
  // const userPets = user?.pets || []; // OLD: relying on user object

  const { 
    getUserPosts, 
    deletePost, 
    toggleLike, 
    isPostLiked, 
    getComments, 
    addComment,
    reportPost,
    blockUser,
    isTogglingLike,
    isAddingComment,
    isDeletingPost,
  } = useSocial();

  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(user?.photo);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    setProfilePhoto(user?.photo);
  }, [user?.photo]);

  const handleEditPet = (petId: string) => {
    router.push(toHref(`/pet/edit/${petId}`));
  };

  const handlePetLongPress = (petId: string, petName: string) => {
    Alert.alert(
      petName,
      'Que souhaitez-vous faire ?',
      [
        {
          text: 'Modifier',
          onPress: () => handleEditPet(petId),
        },
        {
          text: 'Définir comme actif',
          onPress: () => setActivePet(petId),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Supprimer',
              `Êtes-vous sûr de vouloir supprimer ${petName} ?`,
              [
                { text: 'Annuler', style: 'cancel' },
                { 
                  text: 'Supprimer', 
                  style: 'destructive', 
                  onPress: async () => {
                    await deletePetHook(petId);
                  }
                },
              ]
            );
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };
  
  const loadUserPosts = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingPosts(true);
      const posts = await getUserPosts(user.id);
      setUserPosts(posts);
    } catch (error) {
      console.error('❌ Error loading user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  }, [user, getUserPosts]);

  useEffect(() => {
    loadUserPosts();
  }, [loadUserPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserPosts();
    setRefreshing(false);
  };
  
  const handleAddPet = () => {
    router.push(toHref('/pet/add'));
  };
  
  const handlePhotoChange = async (uri: string | null) => {
    if (!user) return;
    
    try {
      setUploadingPhoto(true);
      
      let photoUrl: string | undefined = undefined;
      
      if (uri) {
        photoUrl = await StorageService.uploadProfilePicture(user.id, uri, {
          onProgress: (progress) => {
            console.log(`📊 Upload progress: ${progress.progress.toFixed(1)}%`);
          },
        });
      }
      
      setProfilePhoto(photoUrl);
      
      const result = await updateUser({ ...user, photo: photoUrl });
      if (result.success) {
        Alert.alert('Succès', 'Photo de profil mise à jour.');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour la photo.');
      }
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader la photo.');
      setProfilePhoto(user.photo);
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace(toHref('/splash'));
          },
        },
      ]
    );
  };

  const handleToggleComments = useCallback(async (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        if (!commentsMap[postId]) {
          setLoadingComments(prev => ({ ...prev, [postId]: true }));
          getComments(postId).then(comments => {
            setCommentsMap(prev => ({ ...prev, [postId]: comments }));
            setLoadingComments(prev => ({ ...prev, [postId]: false }));
          });
        }
      }
      return newSet;
    });
  }, [commentsMap, getComments]);

  const handleDeletePost = useCallback((postId: string, authorName: string) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cette publication ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
              setUserPosts(prev => prev.filter(p => p.id !== postId));
            } catch (error) {
              console.error('❌ Error deleting post:', error);
            }
          },
        },
      ]
    );
  }, [deletePost]);

  const handleShare = useCallback((postId: string) => {
    Alert.alert('Partager', 'Fonctionnalité de partage à venir!');
  }, []);
  
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <TouchableOpacity
            style={styles.profilePhotoContainer}
            onPress={() => handlePhotoChange(null)}
          >
            <Image
              source={{ uri: getUserAvatarUrl(user) || DEFAULT_USER_PLACEHOLDER }}
              style={styles.profilePhoto}
              contentFit="cover"
            />
            {uploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color={COLORS.surface} />
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.userName}>@{user.pseudo}</Text>
          <Text style={styles.userCity}>{user.city}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{friends.length}</Text>
              <Text style={styles.statLabel}>Amis</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userPets.length}</Text>
              <Text style={styles.statLabel}>Animaux</Text>
            </View>
          </View>
        </View>

        {/* My Animals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes animaux</Text>
            <TouchableOpacity
              style={styles.fabButton}
              onPress={handleAddPet}
              activeOpacity={0.8}
            >
              <Plus size={20} color={COLORS.surface} />
            </TouchableOpacity>
          </View>

          {userPets.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petsScroll}
            >
              {userPets.map((pet) => {
                const isActive = activePetId === pet.id;
                return (
                  <TouchableOpacity
                    key={pet.id}
                    style={[styles.petCard, isActive && styles.petCardActive]}
                    onPress={() => setActivePet(pet.id)}
                    onLongPress={() => handlePetLongPress(pet.id, pet.name)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: getPetImageUrl(pet) || DEFAULT_PET_PLACEHOLDER }}
                      style={styles.petImage}
                      contentFit="cover"
                    />
                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>{pet.name}</Text>
                      <Text style={styles.petBreed}>{pet.breed}</Text>
                    </View>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>✓</Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.editPetBadge}
                      onPress={() => handleEditPet(pet.id)}
                    >
                      <Settings size={12} color={COLORS.surface} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={handleAddPet}
              activeOpacity={0.8}
            >
              <Plus size={32} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>Ajouter un animal</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raccourcis</Text>
          
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push(toHref('/settings/index'))}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: COLORS.primarySoft }]}>
                  <Settings size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.actionText}>Paramètres</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push(toHref('/premium'))}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: COLORS.primarySoft }]}>
                  <Star size={20} color={COLORS.primary} fill={isPremium ? COLORS.primary : "none"} />
                </View>
                <Text style={styles.actionText}>
                  {isPremium ? 'Premium actif' : 'Passer à Premium'}
                </Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push(toHref('/settings/privacy'))}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: COLORS.primarySoft }]}>
                  <Shield size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.actionText}>Sécurité</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}>
                  <LogOut size={20} color={COLORS.danger} />
                </View>
                <Text style={[styles.actionText, { color: COLORS.danger }]}>Déconnexion</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* My Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes posts</Text>
          
          {loadingPosts ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : userPosts.length > 0 ? (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isLiked={isPostLiked(post.id)}
                currentUserId={user?.id}
                onLike={toggleLike}
                onComment={addComment}
                onShare={handleShare}
                onDelete={handleDeletePost}
                onReport={reportPost}
                onBlock={blockUser}
                isTogglingLike={isTogglingLike}
                isAddingComment={isAddingComment}
                isDeletingPost={isDeletingPost}
                comments={commentsMap[post.id] || []}
                isCommentsLoading={loadingComments[post.id] || false}
                isCommentsExpanded={expandedComments.has(post.id)}
                onToggleComments={handleToggleComments}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <MessageCircle size={32} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>Aucune publication</Text>
              <Text style={styles.emptySubtext}>Partagez vos moments dans la communauté</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profilePhotoContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceSecondary,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    ...TYPOGRAPHY.title,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userCity: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  fabButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  petsScroll: {
    gap: SPACING.md,
  },
  petCard: {
    width: 140,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.card,
  },
  petCardActive: {
    borderColor: COLORS.primary,
  },
  petImage: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.surfaceSecondary,
  },
  petInfo: {
    padding: SPACING.md,
  },
  petName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  petBreed: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  activeBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadgeText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  editPetBadge: {
    position: 'absolute',
    bottom: SPACING.sm + 40, 
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    ...SHADOWS.card,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  actionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.md + 40 + SPACING.md,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },

});
