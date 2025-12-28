import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
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
import { useI18n } from '@/hooks/i18n-store';
import { useSocial } from '@/hooks/social-store';
import { usePremium } from '@/hooks/premium-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import GlassCard from '@/components/GlassCard';
import AppBackground from '@/components/AppBackground';
import { PostCard } from '@/components/PostCard';
import { Plus } from 'lucide-react-native';
import { realtimeService } from '@/services/database';
import { Post } from '@/types';

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

export default function CommunityScreen() {
  const { t } = useI18n();
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

  const handleCreatePost = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/community/create');
  };

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

  const filters = useMemo<{ key: FilterType; label: string; premium?: boolean; count: number }[]>(() => [
    { key: 'all', label: t('map.show_all'), count: filterCounts.all },
    { key: 'lost', label: 'Perdus', count: filterCounts.lost },
    { key: 'found', label: 'Trouvés', count: filterCounts.found },
    { key: 'challenges', label: 'Défis', count: filterCounts.challenges },
    { key: 'pros', label: 'Pros', premium: !isPremium, count: filterCounts.pros },
  ], [t, filterCounts, isPremium]);

  const handleFilterPress = useCallback((filterKey: FilterType) => {
    const filter = filters.find(f => f.key === filterKey);
    if (filter?.premium) {
      showPremiumPrompt('filters');
      return;
    }
    setActiveFilter(filterKey);
  }, [filters, showPremiumPrompt]);

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

  const renderPost: ListRenderItem<Post> = useCallback(({ item: post }) => {
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
  }, [comments, expandedPostId, user?.id, handleLike, handleSubmitComment, handleShare, handleDeletePost, handleReportPost, handleBlockUser, isTogglingLike, isAddingComment, isDeletingPost, isCommentsLoading, isPostLiked, handleToggleComments]);

  const renderHeader = useCallback(() => (
    <>
      <GlassCard tint="neutral" style={styles.filterContainer} noPadding>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {petId && (
            <TouchableOpacity
              style={[
                styles.filterButton,
                styles.activeFilterButton,
              ]}
              onPress={() => router.replace('/community')}
            >
              <Text style={styles.activeFilterText}>Tout</Text>
            </TouchableOpacity>
          )}
          {!petId && filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeFilter === filter.key && styles.activeFilterButton,
                filter.premium && styles.premiumFilterButton,
              ]}
              onPress={() => handleFilterPress(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View style={styles.countBadge}>
                  <Text style={[styles.countText, activeFilter === filter.key && styles.countTextActive]}>
                    {filter.count}
                  </Text>
                </View>
              )}
              {filter.premium && <Text style={styles.premiumBadge}>👑</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </GlassCard>

      {!isPremium && activeFilter === 'pros' && (
        <GlassCard tint="neutral" style={styles.premiumUpsellCard}>
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
        </GlassCard>
      )}
    </>
  ), [petId, filters, activeFilter, isPremium, handleFilterPress]);

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
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Échec du chargement des publications</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune publication trouvée</Text>
        <Text style={styles.emptySubtext}>
          {activeFilter !== 'all' ? 'Essayez de modifier vos filtres' : 'Soyez le premier à publier !'}
        </Text>
      </View>
    );
  }, [isLoading, posts.length, isError, onRefresh, activeFilter]);

  const renderFooter = useCallback(() => {
    if (filteredPosts.length === 0) return null;
    
    return (
      <View style={styles.endOfFeed}>
        <Text style={styles.endOfFeedText}>Vous êtes à jour !</Text>
      </View>
    );
  }, [filteredPosts.length]);

  return (
    <AppBackground>
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
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

    </AppBackground>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    marginHorizontal: DIMENSIONS.SPACING.md,
    marginTop: DIMENSIONS.SPACING.sm,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  filterScroll: {
    paddingVertical: DIMENSIONS.SPACING.sm,
    paddingHorizontal: DIMENSIONS.SPACING.md,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: DIMENSIONS.SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  premiumFilterButton: {
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  filterText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.darkGray,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  premiumBadge: {
    fontSize: 12,
  },
  countBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  countText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '700' as const,
    color: COLORS.darkGray,
  },
  countTextActive: {
    color: COLORS.primary,
  },
  premiumUpsellCard: {
    marginHorizontal: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.sm,
    padding: DIMENSIONS.SPACING.md,
  },
  upsellTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.white,
    marginBottom: DIMENSIONS.SPACING.xs,
  },
  upsellText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  upsellButton: {
    backgroundColor: COLORS.white,
    paddingVertical: DIMENSIONS.SPACING.sm,
    paddingHorizontal: DIMENSIONS.SPACING.lg,
    borderRadius: DIMENSIONS.SPACING.sm,
    alignItems: 'center',
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
    color: COLORS.darkGray,
  },
  fab: {
    position: 'absolute',
    right: DIMENSIONS.SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xl,
    elevation: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl * 2,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.darkGray,
    marginTop: DIMENSIONS.SPACING.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl * 2,
  },
  errorText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.error,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: DIMENSIONS.SPACING.lg,
    paddingVertical: DIMENSIONS.SPACING.sm,
    borderRadius: DIMENSIONS.SPACING.sm,
  },
  retryText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl * 2,
  },
  emptyText: {
    ...TYPOGRAPHY.h5,
    color: COLORS.darkGray,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body2,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});
