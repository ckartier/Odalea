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
  Dimensions,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

import { useSocial } from '@/hooks/social-store';
import { usePremium } from '@/hooks/premium-store';
import { useLostFound } from '@/hooks/lost-found-store';
import { usePets } from '@/hooks/pets-store';
import { useUnifiedMessaging } from '@/hooks/unified-messaging-store';
import { useActivePetWithData } from '@/hooks/active-pet-store';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 60;

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
  const { activePet } = useActivePetWithData();
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

  const { lostPets } = useLostFound();

  const urgentPosts = useMemo(() => {
    return lostPets.filter(p => p.status === 'lost' || p.status === 'found').slice(0, 5);
  }, [lostPets]);

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
          {urgentPosts.map(pet => (
            <TouchableOpacity
              key={pet.id}
              style={styles.urgentCard}
              onPress={() => router.push(`/lost-found/${pet.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.urgentImageContainer}>
                {pet.photos && pet.photos.length > 0 && pet.photos[0] ? (
                  <Image 
                    source={{ uri: pet.photos[0] }} 
                    style={styles.urgentImage}
                    resizeMode="cover"
                    onError={() => console.log('[UrgentCarousel] Image load error:', pet.photos[0])}
                  />
                ) : (
                  <View style={[styles.urgentImage, styles.urgentImagePlaceholder]}>
                    <Text style={styles.placeholderEmoji}>{pet.species === 'Chien' ? '🐶' : '🐱'}</Text>
                  </View>
                )}
              </View>
              <View style={[styles.urgentBadge, pet.status === 'found' && styles.foundBadge]}>
                <Text style={styles.urgentBadgeText}>
                  {pet.status === 'found' ? 'TROUVÉ' : 'PERDU'}
                </Text>
              </View>
              <View style={styles.urgentInfo}>
                <Text style={styles.urgentName} numberOfLines={1}>{pet.petName || 'Animal'}</Text>
                <Text style={styles.urgentLocation} numberOfLines={1}>
                  {pet.lastSeenLocation?.address || 'Localisation inconnue'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [urgentPosts, activeFilter, router]);

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

  const headerTotalHeight = HEADER_HEIGHT + insets.top + 16;

  return (
    <View style={styles.screen}>
      <View style={[styles.stickyHeader, { paddingTop: insets.top + 12, height: headerTotalHeight }]}>
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
            <Inbox size={22} color={ENDEL.colors.text} />
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
            <Plus size={22} color={ENDEL.colors.text} />
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
        contentContainerStyle={[styles.listContent, { paddingTop: headerTotalHeight + 8 }]}
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
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111111',
    paddingVertical: 0,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
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
    marginBottom: 16,
  },
  storiesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 2,
    marginBottom: 6,
  },
  storyRingActive: {
    borderColor: '#000000',
    borderWidth: 2.5,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  storyName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#111111',
    textAlign: 'center' as const,
    maxWidth: 70,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexGrow: 1,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#000000',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#111111',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  urgentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111111',
    marginHorizontal: 16,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  urgentScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  urgentCard: {
    width: Math.min(140, (SCREEN_WIDTH - 48) / 2.5),
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urgentImageContainer: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  urgentImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  urgentImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  urgentBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  foundBadge: {
    backgroundColor: '#10B981',
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  urgentInfo: {
    padding: 10,
  },
  urgentName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#111111',
    marginBottom: 2,
  },
  urgentLocation: {
    fontSize: 11,
    color: '#6B7280',
  },
  prosSection: {
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111111',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sheetFilters: {
    gap: 10,
  },
  sheetFilterItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    minHeight: 50,
    justifyContent: 'center',
  },
  sheetFilterItemActive: {
    backgroundColor: '#000000',
  },
  sheetFilterText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111111',
  },
  sheetFilterTextActive: {
    color: '#FFFFFF',
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
