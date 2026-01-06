import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
  ListRenderItem,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

import { useSocial } from '@/hooks/social-store';
import { usePremium } from '@/hooks/premium-store';
import { usePets } from '@/hooks/pets-store';
import { useUnifiedMessaging } from '@/hooks/unified-messaging-store';
import { useActivePet } from '@/hooks/active-pet-store';
import BottomSheet from '@/components/BottomSheet';
import { ENDEL } from '@/constants/endel';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { PostCard } from '@/components/PostCard';
import ProCard from '@/components/ProCard';

import EmptyState from '@/components/EmptyState';
import { Plus, Filter, Search, Inbox, X } from 'lucide-react-native';
import { realtimeService, userService } from '@/services/database';
import { Post, User } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { calculateDistance } from '@/services/location-privacy';

interface LocalComment {
  id: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: Date;
}

type FilterType = 'all' | 'lost' | 'found' | 'challenges' | 'pros' | 'friends';

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'lost', label: 'Perdus' },
  { key: 'found', label: 'Trouvés' },
  { key: 'challenges', label: 'Défis' },
  { key: 'pros', label: 'Pros' },
  { key: 'friends', label: 'Amis' },
];

export default function CommunityScreen() {

  const insets = useSafeAreaInsets();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
  const { userPets } = usePets();
  const { getUnreadCount } = useUnifiedMessaging();
  const { activePet } = useActivePet();
  const {
    posts,
    isLoading,
    isError,
    toggleLike,
    isPostLiked,
    refreshPosts,
    isTogglingLike,
    addComment,
    isAddingComment,
    reportPost,
    blockUser,
    deletePost,
    isDeletingPost,
  } = useSocial();
  
  const { user } = useFirebaseUser();
  const { isPremium, showPremiumPrompt } = usePremium();

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, LocalComment[]>>({});
  const [isCommentsLoading, setIsCommentsLoading] = useState<boolean>(false);

  const onRefresh = useCallback(async () => {
    refreshPosts();
  }, [refreshPosts]);

  const handleCreatePost = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/community/create');
  }, []);

  const handleToggleComments = useCallback((postId: string) => {
    setExpandedPostId(prev => prev === postId ? null : postId);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const load = async () => {
      if (!expandedPostId) return;
      
      setIsCommentsLoading(true);
      try {
        unsubscribe = realtimeService.listenToComments(expandedPostId, (items) => {
          const mapped: LocalComment[] = items.map((c: any) => ({
            id: String(c.id),
            authorName: String(c.authorName ?? 'Anonyme'),
            authorPhoto: c.authorPhoto,
            content: String(c.content ?? ''),
            createdAt: (c.createdAt as any)?.toDate?.() || new Date(),
          }));
          setComments(prev => ({ ...prev, [expandedPostId]: mapped }));
          setIsCommentsLoading(false);
        });
      } catch (e) {
        console.log('Load comments error', e);
        setIsCommentsLoading(false);
      }
    };
    load();
    return () => {
      try { unsubscribe?.(); } catch {}
    };
  }, [expandedPostId]);

  const handleLike = useCallback(async (postId: string) => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await toggleLike(postId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [toggleLike]);

  const handleSubmitComment = useCallback(async (postId: string, content: string) => {
    if (!postId || !content.trim()) return;
    try {
      await addComment(postId, content.trim());
    } catch (e) {
      console.log('Add comment error', e);
    }
  }, [addComment]);

  const handleShare = useCallback(async (postId: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    console.log('Sharing post:', postId);
  }, []);

  const handleReportPost = useCallback((postId: string, authorName: string) => {
    Alert.alert(
      'Signaler ce contenu',
      `Pourquoi signalez-vous la publication de ${authorName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Spam ou publicité', 
          onPress: () => reportPost(postId, 'spam')
        },
        { 
          text: 'Contenu inapproprié', 
          onPress: () => reportPost(postId, 'inappropriate')
        },
        { 
          text: 'Harcèlement', 
          onPress: () => reportPost(postId, 'harassment')
        },
      ]
    );
  }, [reportPost]);

  const handleBlockUser = useCallback((userId: string, authorName: string) => {
    Alert.alert(
      'Bloquer cet utilisateur',
      `Êtes-vous sûr de vouloir bloquer ${authorName} ? Vous ne verrez plus ses publications.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Bloquer', 
          style: 'destructive',
          onPress: () => blockUser(userId)
        },
      ]
    );
  }, [blockUser]);
  
  const handleDeletePost = useCallback((postId: string, authorName: string) => {
    Alert.alert(
      'Supprimer la publication',
      `Êtes-vous sûr de vouloir supprimer cette publication de ${authorName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
            } catch (error) {
              console.error('Error deleting post:', error);
            }
          }
        },
      ]
    );
  }, [deletePost]);

  const handleFilterChange = useCallback((filterKey: FilterType) => {
    if (filterKey === 'pros' && !isPremium) {
      showPremiumPrompt('filters');
      return;
    }
    setActiveFilter(filterKey);
    setIsFilterSheetOpen(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  }, [isPremium, showPremiumPrompt]);

  const professionalsQuery = useQuery({
    queryKey: ['community', 'professionals'],
    enabled: activeFilter === 'all' || activeFilter === 'pros',
    queryFn: async () => {
      const users = await userService.getAllUsers(200);
      return users.filter(u => 
        u.isProfessional && 
        u.location?.latitude && 
        u.location?.longitude &&
        !u.id.includes('paris-') && 
        !u.id.includes('test')
      ) as User[];
    },
    staleTime: 60000,
  });

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (petId) {
      filtered = posts.filter(p => p.fromPetId === petId);
    } else if (activeFilter === 'lost') {
      filtered = posts.filter(p => p.type === 'lost');
    } else if (activeFilter === 'found') {
      filtered = posts.filter(p => p.type === 'found');
    } else if (activeFilter === 'challenges') {
      filtered = posts.filter(p => p.type === 'challenge');
    } else if (activeFilter === 'pros') {
      filtered = posts.filter(p => p.type === 'professional' || p.isProPost);
    } else if (activeFilter === 'friends') {
      filtered = posts.filter(p => !p.type || p.type === 'photo' || p.type === 'text' || p.type === 'video');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.content.toLowerCase().includes(query) ||
        p.authorName.toLowerCase().includes(query)
      );
    }

    if (!isPremium && activeFilter === 'pros') {
      filtered = filtered.slice(0, 3);
    }

    return filtered;
  }, [posts, activeFilter, isPremium, petId, searchQuery]);

  const itemsToRender = useMemo(() => {
    const professionals = professionalsQuery.data ?? [];
    if (activeFilter === 'pros') return filteredPosts;
    if (activeFilter !== 'all' || petId) return filteredPosts;
    if (filteredPosts.length < 10) {
      const items: (Post | { type: 'pro'; professional: User })[] = [];
      let proIndex = 0;
      filteredPosts.forEach((post, i) => {
        items.push(post);
        if ((i + 1) % 6 === 0 && proIndex < professionals.length) {
          items.push({ type: 'pro', professional: professionals[proIndex] });
          proIndex++;
        }
      });
      return items;
    }
    return filteredPosts;
  }, [filteredPosts, activeFilter, petId, professionalsQuery.data]);

  const getDistance = useCallback((proLocation?: { latitude: number; longitude: number }) => {
    if (!user?.location || !proLocation) return undefined;
    const dist = calculateDistance(user.location, proLocation);
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  }, [user?.location]);

  const renderPost: ListRenderItem<Post | { type: 'pro'; professional: User }> = useCallback(({ item }) => {
    if ('type' in item && item.type === 'pro') {
      const distance = getDistance(item.professional.location);
      return (
        <ProCard 
          key={`pro-${item.professional.id}`}
          professional={item.professional} 
          distance={distance}
        />
      );
    }
    const post = item as Post;
    const postComments = comments[post.id] || [];
    const isCommentsExpanded = expandedPostId === post.id;
    
    return (
      <PostCard
        post={post}
        isLiked={isPostLiked(post.id)}
        currentUserId={user?.id}
        onLike={handleLike}
        onComment={handleSubmitComment}
        onShare={handleShare}
        onDelete={handleDeletePost}
        onReport={handleReportPost}
        onBlock={handleBlockUser}
        isTogglingLike={isTogglingLike}
        isAddingComment={isAddingComment}
        isDeletingPost={isDeletingPost}
        comments={postComments}
        isCommentsLoading={isCommentsLoading && isCommentsExpanded}
        isCommentsExpanded={isCommentsExpanded}
        onToggleComments={handleToggleComments}
      />
    );
  }, [comments, expandedPostId, user?.id, handleLike, handleSubmitComment, handleShare, handleDeletePost, handleReportPost, handleBlockUser, isTogglingLike, isAddingComment, isDeletingPost, isCommentsLoading, isPostLiked, handleToggleComments, getDistance]);

  const urgentPosts = useMemo(() => {
    return posts.filter(p => (p.type === 'lost' || p.type === 'found') && p.location).slice(0, 5);
  }, [posts]);

  const recommendedPros = useMemo(() => {
    return (professionalsQuery.data || []).slice(0, 3);
  }, [professionalsQuery.data]);

  const unreadCount = getUnreadCount();

  const renderPetStories = useCallback(() => {
    if (userPets.length === 0) return null;

    return (
      <View style={styles.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
          {userPets.map(pet => (
            <TouchableOpacity
              key={pet.id}
              style={styles.storyItem}
              onPress={() => router.push(`/pet/${pet.id}`)}
            >
              <View style={[styles.storyRing, activePet?.id === pet.id && styles.storyRingActive]}>
                <Image source={{ uri: pet.mainPhoto }} style={styles.storyImage} />
              </View>
              <Text style={styles.storyName} numberOfLines={1}>{pet.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [userPets, activePet]);

  const renderUrgentCarousel = useCallback(() => {
    if (urgentPosts.length === 0 || activeFilter !== 'all') return null;

    return (
      <View style={styles.urgentSection}>
        <Text style={styles.sectionTitle}>🚨 Urgent près de toi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.urgentScroll}>
          {urgentPosts.map(post => (
            <TouchableOpacity
              key={post.id}
              style={styles.urgentCard}
              onPress={() => {
                if (post.type === 'lost' || post.type === 'found') {
                  router.push(`/lost-found/${post.id.replace('lost-', '')}`);
                }
              }}
            >
              {post.images && post.images[0] && (
                <Image source={{ uri: post.images[0] }} style={styles.urgentImage} />
              )}
              <View style={[styles.urgentBadge, post.type === 'found' && styles.foundBadge]}>
                <Text style={styles.urgentBadgeText}>
                  {post.type === 'found' ? 'TROUVÉ' : 'PERDU'}
                </Text>
              </View>
              <View style={styles.urgentInfo}>
                <Text style={styles.urgentName} numberOfLines={1}>{post.authorName}</Text>
                {post.location?.name && (
                  <Text style={styles.urgentLocation} numberOfLines={1}>{post.location.name}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [urgentPosts, activeFilter]);

  const renderRecommendedPros = useCallback(() => {
    if (recommendedPros.length === 0 || activeFilter !== 'all' || filteredPosts.length > 10) return null;

    return (
      <View style={styles.prosSection}>
        <Text style={styles.sectionTitle}>💼 Professionnels recommandés</Text>
        {recommendedPros.map((pro, idx) => {
          const distance = getDistance(pro.location);
          return (
            <ProCard 
              key={`rec-pro-${pro.id}-${idx}`}
              professional={pro} 
              distance={distance}
            />
          );
        })}
      </View>
    );
  }, [recommendedPros, activeFilter, filteredPosts.length, getDistance]);

  const renderHeader = useCallback(() => (
    <View>
      {renderPetStories()}
      
      <View style={styles.filtersRow}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.chipsScroll}
        >
          {FILTER_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                activeFilter === opt.key && styles.chipActive
              ]}
              onPress={() => handleFilterChange(opt.key)}
            >
              <Text style={[
                styles.chipText,
                activeFilter === opt.key && styles.chipTextActive
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setIsFilterSheetOpen(true)}
        >
          <Filter size={20} color={ENDEL.colors.text} />
        </TouchableOpacity>
      </View>

      {renderUrgentCarousel()}
      {renderRecommendedPros()}

      {!isPremium && activeFilter === 'pros' && (
        <View style={styles.premiumUpsellCard}>
          <Text style={styles.upsellTitle}>Contenu Premium 👑</Text>
          <Text style={styles.upsellText}>
            Débloquez l&apos;accès illimité aux posts des professionnels.
          </Text>
          <TouchableOpacity 
            style={styles.upsellButton}
            onPress={() => router.push('/premium')}
          >
            <Text style={styles.upsellButtonText}>Passer à Premium</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [activeFilter, isPremium, handleFilterChange, renderPetStories, renderUrgentCarousel, renderRecommendedPros]);

  const renderEmpty = useCallback(() => {
    if (isLoading && posts.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des publications...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <EmptyState
          icon={Filter}
          title="Échec du chargement"
          message="Impossible de charger les publications"
          actionLabel="Réessayer"
          onAction={onRefresh}
        />
      );
    }

    return (
      <EmptyState
        icon={Plus}
        title="Aucune publication"
        message={activeFilter !== 'all' ? 'Essayez de modifier vos filtres' : 'Soyez le premier à publier !'}
        actionLabel={activeFilter === 'all' ? 'Créer un post' : undefined}
        onAction={activeFilter === 'all' ? handleCreatePost : undefined}
      />
    );
  }, [isLoading, posts.length, isError, onRefresh, activeFilter, handleCreatePost]);

  const renderFooter = useCallback(() => {
    if (itemsToRender.length === 0) return null;
    
    return (
      <View style={styles.endOfFeed}>
        <Text style={styles.endOfFeedText}>Vous êtes à jour !</Text>
      </View>
    );
  }, [itemsToRender.length]);

  return (
    <View style={styles.screen}>
      <View style={[styles.stickyHeader, { paddingTop: insets.top + 8 }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color={ENDEL.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor={ENDEL.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={ENDEL.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => router.push('/messages')}
          >
            <Inbox size={24} color={ENDEL.colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={handleCreatePost}
          >
            <Plus size={24} color={ENDEL.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={itemsToRender}
        renderItem={renderPost}
        keyExtractor={(item) => 'type' in item && item.type === 'pro' ? `pro-${item.professional.id}` : (item as Post).id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingTop: 120 + insets.top }]}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={5}
      />

      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        size="compact"
      >
        <Text style={styles.sheetTitle}>Filtres</Text>
        <View style={styles.sheetFilters}>
          {FILTER_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.sheetFilterItem,
                activeFilter === opt.key && styles.sheetFilterItemActive
              ]}
              onPress={() => handleFilterChange(opt.key)}
            >
              <Text style={[
                styles.sheetFilterText,
                activeFilter === opt.key && styles.sheetFilterTextActive
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ENDEL.colors.border,
    paddingHorizontal: ENDEL.spacing.md,
    paddingBottom: ENDEL.spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ENDEL.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ENDEL.colors.borderSubtle,
    borderRadius: ENDEL.radii.pill,
    paddingHorizontal: ENDEL.spacing.md,
    height: 44,
    gap: ENDEL.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: ENDEL.colors.text,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ENDEL.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: COLORS.white,
  },
  storiesContainer: {
    marginBottom: ENDEL.spacing.md,
  },
  storiesScroll: {
    paddingHorizontal: ENDEL.spacing.md,
    gap: ENDEL.spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: ENDEL.colors.border,
    padding: 2,
    marginBottom: ENDEL.spacing.xs,
  },
  storyRingActive: {
    borderColor: ENDEL.colors.accent,
    borderWidth: 3,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  storyName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: ENDEL.colors.text,
    textAlign: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ENDEL.spacing.md,
  },
  chipsScroll: {
    paddingHorizontal: ENDEL.spacing.md,
    gap: ENDEL.spacing.sm,
  },
  chip: {
    paddingHorizontal: ENDEL.spacing.md,
    paddingVertical: ENDEL.spacing.sm,
    borderRadius: ENDEL.radii.pill,
    backgroundColor: ENDEL.colors.borderSubtle,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: ENDEL.colors.accent,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: ENDEL.colors.text,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ENDEL.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ENDEL.spacing.md,
  },
  urgentSection: {
    marginBottom: ENDEL.spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: ENDEL.colors.text,
    marginHorizontal: ENDEL.spacing.md,
    marginBottom: ENDEL.spacing.sm,
  },
  urgentScroll: {
    paddingHorizontal: ENDEL.spacing.md,
    gap: ENDEL.spacing.sm,
  },
  urgentCard: {
    width: 140,
    borderRadius: ENDEL.radii.card,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ENDEL.colors.border,
  },
  urgentImage: {
    width: '100%',
    height: 140,
    backgroundColor: ENDEL.colors.borderSubtle,
  },
  urgentBadge: {
    position: 'absolute',
    top: ENDEL.spacing.sm,
    left: ENDEL.spacing.sm,
    backgroundColor: COLORS.error,
    paddingHorizontal: ENDEL.spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  foundBadge: {
    backgroundColor: COLORS.success,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: COLORS.white,
  },
  urgentInfo: {
    padding: ENDEL.spacing.sm,
  },
  urgentName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: ENDEL.colors.text,
    marginBottom: 2,
  },
  urgentLocation: {
    fontSize: 12,
    color: ENDEL.colors.textSecondary,
  },
  prosSection: {
    marginBottom: ENDEL.spacing.md,
  },
  headerContainer: {
    backgroundColor: COLORS.white,
  },
  segmentedControl: {
    marginTop: DIMENSIONS.SPACING.xs,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  premiumUpsellCard: {
    marginHorizontal: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.sm,
    padding: DIMENSIONS.SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  upsellTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.white,
    marginBottom: DIMENSIONS.SPACING.xs,
  },
  upsellText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  upsellButton: {
    backgroundColor: COLORS.white,
    paddingVertical: DIMENSIONS.SPACING.sm + 2,
    paddingHorizontal: DIMENSIONS.SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  upsellButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  listContent: {
    paddingBottom: DIMENSIONS.SPACING.xl,
  },
  endOfFeed: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl,
  },
  endOfFeedText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textSecondary,
  },
  sheetTitle: {
    ...ENDEL.typography.title,
    marginBottom: ENDEL.spacing.md,
  },
  sheetFilters: {
    gap: ENDEL.spacing.sm,
  },
  sheetFilterItem: {
    paddingVertical: ENDEL.spacing.md,
    paddingHorizontal: ENDEL.spacing.lg,
    borderRadius: ENDEL.radii.card,
    backgroundColor: ENDEL.colors.borderSubtle,
    minHeight: 52,
    justifyContent: 'center',
  },
  sheetFilterItemActive: {
    backgroundColor: ENDEL.colors.accent,
  },
  sheetFilterText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: ENDEL.colors.text,
  },
  sheetFilterTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl * 2,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: DIMENSIONS.SPACING.md,
  },
});
