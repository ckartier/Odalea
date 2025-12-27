import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  TextInput,
  Image,
  Alert,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { COLORS, SHADOWS, DIMENSIONS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { useI18n } from '@/hooks/i18n-store';
import { useSocial } from '@/hooks/social-store';
import { usePremium } from '@/hooks/premium-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import GlassCard from '@/components/GlassCard';
import AppBackground from '@/components/AppBackground';
import { Plus, Heart, MessageCircle, Share, MapPin, AlertTriangle, Send, Award, DollarSign } from 'lucide-react-native';
import { realtimeService } from '@/services/database';

interface LocalComment {
  id: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: Date;
}

type FilterType = 'all' | 'lost' | 'found' | 'challenges' | 'pros';

export default function CommunityScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
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

  const onRefresh = async () => {
    refreshPosts();
  };

  const handleLike = async (postId: string) => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await toggleLike(postId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCreatePost = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/community/create');
  };

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isCommentsLoading, setIsCommentsLoading] = useState<boolean>(false);

  const handleToggleComments = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const load = async () => {
      if (!expandedPostId) {
        setComments([]);
        return;
      }
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
          setComments(mapped);
          setIsCommentsLoading(false);
        });
      } catch (e) {
        console.log('Load comments error', e);
        setComments([]);
        setIsCommentsLoading(false);
      }
    };
    load();
    return () => {
      try { unsubscribe?.(); } catch {}
    };
  }, [expandedPostId]);

  const handleSubmitComment = async (postId: string) => {
    if (!postId || !newComment.trim()) return;
    try {
      await addComment(postId, newComment.trim());
      setNewComment('');
    } catch (e) {
      console.log('Add comment error', e);
    }
  };

  const handleShare = async (postId: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    console.log('Sharing post:', postId);
  };

  const handleReportPost = (postId: string, authorName: string) => {
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
  };

  const handleBlockUser = (userId: string, authorName: string) => {
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
  };
  
  const handleDeletePost = (postId: string, authorName: string) => {
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
  };

  const filters: { key: FilterType; label: string; premium?: boolean }[] = [
    { key: 'all', label: t('map.show_all') },
    { key: 'lost', label: 'Perdus' },
    { key: 'found', label: 'Trouvés' },
    { key: 'challenges', label: 'Défis' },
    { key: 'pros', label: 'Pros', premium: !isPremium },
  ];

  const handleFilterPress = (filterKey: FilterType) => {
    const filter = filters.find(f => f.key === filterKey);
    if (filter?.premium) {
      showPremiumPrompt('filters');
      return;
    }
    setActiveFilter(filterKey);
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'now';
    
    const now = new Date();
    const postTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (activeFilter === 'lost') {
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
  }, [posts, activeFilter, isPremium]);

  const renderPost = (post: any) => {
    const isLiked = isPostLiked(post.id);
    const isUrgent = post.type === 'lost' || post.type === 'found';
    const isChallenge = post.type === 'challenge';
    const isPro = post.type === 'professional' || post.isProPost;
    
    const displayImages = isUrgent && post.images 
      ? [post.images[0]]
      : post.images;
    
    return (
      <GlassCard key={post.id} tint="neutral" style={[
        styles.postCard, 
        isUrgent && styles.urgentPost,
        isChallenge && styles.challengePost,
        isPro && styles.proPost,
      ]}>
        {isUrgent && (
          <View style={[styles.urgentBanner, post.type === 'found' && styles.foundBanner]}>
            <AlertTriangle size={16} color={COLORS.white} />
            <Text style={styles.urgentText}>
              {post.type === 'found' ? 'ANIMAL TROUVÉ' : 'ANIMAL PERDU'}
            </Text>
            {post.reward && post.reward > 0 && (
              <View style={styles.rewardBadge}>
                <DollarSign size={14} color={COLORS.white} />
                <Text style={styles.rewardText}>{post.reward}€</Text>
              </View>
            )}
          </View>
        )}
        
        {isChallenge && (
          <View style={styles.challengeBanner}>
            <Award size={16} color={COLORS.white} />
            <Text style={styles.challengeText}>DÉFI RELEVÉ</Text>
          </View>
        )}
        
        <View style={styles.postHeader}>
          <Image 
            source={{ 
              uri: post.authorPhoto || 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=100&h=100&fit=crop&crop=face' 
            }} 
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.authorName || 'Animal'}</Text>
            <View style={styles.postMeta}>
              <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
              {post.location?.name && (
                <>
                  <Text style={styles.metaSeparator}>•</Text>
                  <MapPin size={12} color={COLORS.darkGray} />
                  <Text style={styles.location}>{post.location.name}</Text>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => {
              const isOwner = user && (post.fromOwnerId === user.id || post.authorId === user.id);
              
              const actions: any[] = [
                { text: 'Annuler', style: 'cancel' },
              ];
              
              if (isOwner) {
                actions.push({
                  text: 'Supprimer mon post',
                  style: 'destructive',
                  onPress: () => handleDeletePost(post.id, post.authorName)
                });
              } else {
                actions.push(
                  { 
                    text: 'Signaler', 
                    onPress: () => handleReportPost(post.id, post.authorName)
                  },
                  { 
                    text: 'Bloquer l\'utilisateur', 
                    style: 'destructive',
                    onPress: () => handleBlockUser(post.authorId, post.authorName)
                  }
                );
              }
              
              Alert.alert('Actions', '', actions);
            }}
            disabled={isDeletingPost}
          >
            <Text style={styles.moreButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        {displayImages && displayImages.length > 0 && (
          <View style={styles.imagesContainer}>
            {displayImages.map((img: string, idx: number) => (
              <Image 
                key={idx}
                source={{ uri: img }} 
                style={[
                  styles.postImage,
                  displayImages.length > 1 && styles.multipleImages
                ]}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        {isUrgent && post.images && post.images.length > 1 && (
          <TouchableOpacity 
            style={styles.viewAllPhotosButton}
            onPress={() => router.push(`/lost-found/${post.id.replace('lost-', '')}`)}
          >
            <Text style={styles.viewAllPhotosText}>
              Voir toutes les photos ({post.images.length})
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
            disabled={isTogglingLike}
          >
            <Heart
              size={24}
              color={isLiked ? COLORS.error : COLORS.darkGray}
              fill={isLiked ? COLORS.error : 'none'}
            />
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {post.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleToggleComments(post.id)}
          >
            <MessageCircle size={24} color={COLORS.darkGray} />
            <Text style={styles.actionText}>{post.commentsCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(post.id)}
          >
            <Share size={24} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {expandedPostId === post.id && (
          <View style={styles.inlineCommentsContainer}>
            <View style={styles.inlineCommentsList}>
              {isCommentsLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : comments.length === 0 ? (
                <Text style={styles.emptyCommentsText}>Aucun commentaire</Text>
              ) : (
                comments.map((c) => (
                  <View key={c.id} style={styles.commentItem}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentAuthor}>{c.authorName}</Text>
                      <Text style={styles.commentText}>{c.content}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
            <View style={styles.commentInputRow}>
              <TextInput
                placeholder="Écrire un commentaire..."
                value={newComment}
                onChangeText={setNewComment}
                style={styles.commentInput}
                editable={!isAddingComment}
                placeholderTextColor={COLORS.darkGray}
              />
              <TouchableOpacity 
                onPress={() => handleSubmitComment(post.id)} 
                style={styles.commentSendBtn} 
                disabled={isAddingComment || !newComment.trim()}
              >
                {isAddingComment ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Send size={20} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <AppBackground>

      <GlassCard tint="neutral" style={styles.filterContainer} noPadding>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(filter => (
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

      <ScrollView
        style={styles.feed}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && posts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des publications...</Text>
          </View>
        ) : isError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Échec du chargement des publications</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune publication trouvée</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter !== 'all' ? 'Essayez de modifier vos filtres' : 'Soyez le premier à publier !'}
            </Text>
          </View>
        ) : (
          filteredPosts.map(renderPost)
        )}
        
        {filteredPosts.length > 0 && (
          <View style={styles.endOfFeed}>
            <Text style={styles.endOfFeedText}>Vous êtes à jour !</Text>
          </View>
        )}
      </ScrollView>

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
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  createButton: {
    padding: DIMENSIONS.SPACING.sm,
  },
  menuButton: {
    padding: DIMENSIONS.SPACING.sm,
  },
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
  feed: {
    flex: 1,
  },
  postCard: {
    marginHorizontal: DIMENSIONS.SPACING.md,
    marginVertical: DIMENSIONS.SPACING.sm,
    borderRadius: 20,
  },
  urgentPost: {
    borderWidth: 2,
    borderColor: COLORS.lost,
  },
  challengePost: {
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  proPost: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lost,
    marginHorizontal: -DIMENSIONS.SPACING.md,
    marginTop: -DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.sm + 4,
    paddingVertical: DIMENSIONS.SPACING.sm,
    paddingHorizontal: DIMENSIONS.SPACING.md,
    borderTopLeftRadius: DIMENSIONS.SPACING.md,
    borderTopRightRadius: DIMENSIONS.SPACING.md,
  },
  foundBanner: {
    backgroundColor: COLORS.primary,
  },
  challengeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    marginHorizontal: -DIMENSIONS.SPACING.md,
    marginTop: -DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.sm + 4,
    paddingVertical: DIMENSIONS.SPACING.sm,
    paddingHorizontal: DIMENSIONS.SPACING.md,
    borderTopLeftRadius: DIMENSIONS.SPACING.md,
    borderTopRightRadius: DIMENSIONS.SPACING.md,
  },
  urgentText: {
    ...TYPOGRAPHY.overline,
    color: COLORS.white,
    marginLeft: DIMENSIONS.SPACING.xs + 2,
    flex: 1,
  },
  challengeText: {
    ...TYPOGRAPHY.overline,
    color: COLORS.white,
    marginLeft: DIMENSIONS.SPACING.xs + 2,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: DIMENSIONS.SPACING.xs + 2,
    paddingVertical: DIMENSIONS.SPACING.xs / 2,
    borderRadius: 999,
    gap: 2,
  },
  rewardText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '700' as const,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING.sm + 4,
  },
  avatar: {
    width: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM,
    height: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM,
    borderRadius: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM / 2,
    marginRight: DIMENSIONS.SPACING.sm + 4,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    ...TYPOGRAPHY.subtitle1,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.xs / 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.darkGray,
  },
  metaSeparator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.darkGray,
    marginHorizontal: DIMENSIONS.SPACING.xs + 2,
  },
  location: {
    ...TYPOGRAPHY.caption,
    color: COLORS.darkGray,
    marginLeft: DIMENSIONS.SPACING.xs,
  },
  moreButton: {
    padding: DIMENSIONS.SPACING.xs,
  },
  moreButtonText: {
    fontSize: 24,
    color: COLORS.darkGray,
    fontWeight: '700' as const,
  },
  postContent: {
    ...TYPOGRAPHY.body2,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING.xs,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: DIMENSIONS.SPACING.sm + 4,
  },
  multipleImages: {
    width: '48%',
    height: 150,
  },
  viewAllPhotosButton: {
    paddingVertical: DIMENSIONS.SPACING.xs + 2,
    paddingHorizontal: DIMENSIONS.SPACING.sm,
    backgroundColor: COLORS.lightGray,
    borderRadius: DIMENSIONS.SPACING.sm,
    alignSelf: 'flex-start',
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  viewAllPhotosText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: DIMENSIONS.SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.lightGray,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING.lg,
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 6,
    borderRadius: DIMENSIONS.SPACING.sm,
  },
  actionText: {
    ...TYPOGRAPHY.body3,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
    marginLeft: DIMENSIONS.SPACING.xs + 2,
  },
  likedText: {
    color: COLORS.error,
  },
  endOfFeed: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl,
  },
  endOfFeedText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.darkGray,
  },
  inlineCommentsContainer: {
    marginTop: DIMENSIONS.SPACING.sm,
    paddingTop: DIMENSIONS.SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.lightGray,
  },
  inlineCommentsList: {
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  emptyCommentsText: {
    color: COLORS.darkGray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: DIMENSIONS.SPACING.sm,
  },
  commentItem: {
    marginBottom: DIMENSIONS.SPACING.xs,
  },
  commentBubble: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 8,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  commentAuthor: {
    ...TYPOGRAPHY.labelSmall,
    marginBottom: 2,
    color: COLORS.black,
  },
  commentText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.darkGray,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    ...TYPOGRAPHY.body2,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    color: COLORS.black,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
