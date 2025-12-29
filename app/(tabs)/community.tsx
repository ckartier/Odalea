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
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SHADOWS, DIMENSIONS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

import { useSocial } from '@/hooks/social-store';
import { usePremium } from '@/hooks/premium-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { PostCard } from '@/components/PostCard';
import ProCard from '@/components/ProCard';
import { SegmentedControl, SegmentOption } from '@/components/SegmentedControl';
import EmptyState from '@/components/EmptyState';
import { Plus, Filter } from 'lucide-react-native';
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

interface FilterCount {
  all: number;
  lost: number;
  found: number;
  challenges: number;
  pros: number;
}

type FilterType = 'all' | 'lost' | 'found' | 'challenges' | 'pros';

const FILTER_OPTIONS: SegmentOption<FilterType>[] = [
  { key: 'all', label: 'Tout' },
  { key: 'lost', label: 'Perdus' },
  { key: 'found', label: 'Trouvés' },
  { key: 'challenges', label: 'Défis' },
  { key: 'pros', label: 'Pros' },
];

export default function CommunityScreen() {

  const insets = useSafeAreaInsets();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
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

  const filterCounts = useMemo<FilterCount>(() => {
    const counts: FilterCount = {
      all: posts.length,
      lost: 0,
      found: 0,
      challenges: 0,
      pros: 0,
    };
    
    posts.forEach(post => {
      if (post.type === 'lost') counts.lost++;
      if (post.type === 'found') counts.found++;
      if (post.type === 'challenge') counts.challenges++;
      if (post.type === 'professional' || post.isProPost) counts.pros++;
    });
    
    return counts;
  }, [posts]);

  const segmentOptions = useMemo<SegmentOption<FilterType>[]>(() => 
    FILTER_OPTIONS.map(opt => ({
      ...opt,
      count: filterCounts[opt.key],
      badge: opt.key === 'pros' && !isPremium ? '👑' : undefined,
      disabled: opt.key === 'pros' && !isPremium,
    })),
  [filterCounts, isPremium]);

  const handleFilterChange = useCallback((filterKey: FilterType) => {
    if (filterKey === 'pros' && !isPremium) {
      showPremiumPrompt('filters');
      return;
    }
    setActiveFilter(filterKey);
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
    }

    if (!isPremium && activeFilter === 'pros') {
      filtered = filtered.slice(0, 3);
    }

    return filtered;
  }, [posts, activeFilter, isPremium, petId]);

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

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <SegmentedControl<FilterType>
        options={segmentOptions}
        activeKey={activeFilter}
        onChange={handleFilterChange}
        style={styles.segmentedControl}
      />
      
      {!isPremium && activeFilter === 'pros' && (
        <View style={styles.premiumUpsellCard}>
          <Text style={styles.upsellTitle}>Contenu Premium 👑</Text>
          <Text style={styles.upsellText}>
            Débloquez l&apos;accès illimité aux posts des professionnels et découvrez leurs offres exclusives.
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
  ), [segmentOptions, activeFilter, isPremium, handleFilterChange]);

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
      <FlatList
        data={itemsToRender}
        renderItem={renderPost}
        keyExtractor={(item) => 'type' in item && item.type === 'pro' ? `pro-${item.professional.id}` : (item as Post).id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={5}
      />

      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: insets.bottom + 24 },
        ]}
        onPress={handleCreatePost}
        activeOpacity={0.9}
        testID="fab-create-post"
        accessibilityLabel="Create post"
        accessibilityRole="button"
      >
        <Plus size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  fab: {
    position: 'absolute',
    right: DIMENSIONS.SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
    elevation: 8,
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
