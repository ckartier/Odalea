import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { COLORS, SHADOWS, DIMENSIONS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useSocial } from '@/hooks/social-store';
import SurfaceCard from '@/components/SurfaceCard';
import { Plus, Heart, MessageCircle, Share, MapPin, AlertTriangle, X, Send } from 'lucide-react-native';

import ResponsiveModal from '@/components/ResponsiveModal';
import { realtimeService } from '@/services/database';

interface LocalComment {
  id: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: Date;
}

export default function CommunityScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const {
    posts,
    isLoading,
    isError,
    toggleLike,
    isPostLiked,
    refreshPosts,
    isTogglingLike,
    getComments,
    addComment,
    isAddingComment,
  } = useSocial();

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
      // No need to manually refresh as listener updates it
    } catch (e) {
      console.log('Add comment error', e);
    }
  };

  const handleShare = async (postId: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    console.log('Sharing post:', postId);
    // TODO: Implement native share functionality
  };

  const filters = [
    { key: 'all', label: t('map.show_all') },
    { key: 'following', label: t('community.following') },
    { key: 'nearby', label: t('community.nearby') },
    { key: 'lost_found', label: t('lost_found.lost_found') },
  ];

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
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'following') return posts; // Placeholder for following logic
    if (activeFilter === 'nearby') return posts.filter(p => p.location);
    if (activeFilter === 'lost_found') return posts.filter(p => p.type === 'lost' || p.type === 'found');
    return posts;
  }, [posts, activeFilter]);

  const renderPost = (post: any) => {
    const isLiked = isPostLiked(post.id);
    const isUrgent = post.type === 'lost' || post.type === 'found';
    
    return (
      <SurfaceCard key={post.id} style={[styles.postCard, isUrgent && styles.urgentPost]}>
        {isUrgent && (
          <View style={styles.urgentBanner}>
            <AlertTriangle size={16} color={COLORS.white} />
            <Text style={styles.urgentText}>{t('lost_found.lost_found').toUpperCase()}</Text>
          </View>
        )}
        
        <View style={styles.postHeader}>
          <Image 
            source={{ 
              uri: post.authorPhoto || 'https://images.unsplash.com/photo-1494790108755-2616b9e0e4b0?w=100&h=100&fit=crop&crop=face' 
            }} 
            style={styles.avatar} 
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.authorName || 'Anonyme'}</Text>
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
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        {post.images && post.images.length > 0 && (
          <Image source={{ uri: post.images[0] }} style={styles.postImage} />
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
      </SurfaceCard>
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeFilter === filter.key && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
            <Text style={styles.emptySubtext}>Essayez de modifier vos filtres</Text>
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

    </View>
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
    backgroundColor: COLORS.white,
    paddingVertical: DIMENSIONS.SPACING.sm,
    paddingHorizontal: DIMENSIONS.SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.mediumGray,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: DIMENSIONS.SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.lightGray,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  feed: {
    flex: 1,
  },
  postCard: {
    marginHorizontal: DIMENSIONS.SPACING.md,
    marginVertical: DIMENSIONS.SPACING.sm,
  },
  urgentPost: {
    borderWidth: 2,
    borderColor: COLORS.lost,
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
  urgentText: {
    color: COLORS.white,
    fontWeight: '700' as const,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    marginLeft: DIMENSIONS.SPACING.xs + 2,
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
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.xs / 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
  metaSeparator: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
    marginHorizontal: DIMENSIONS.SPACING.xs + 2,
  },
  location: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
    marginLeft: DIMENSIONS.SPACING.xs,
  },
  postContent: {
    fontSize: Math.max(14, DIMENSIONS.FONT_SIZES.md),
    lineHeight: Math.max(14, DIMENSIONS.FONT_SIZES.md) * 1.4,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: DIMENSIONS.SPACING.sm + 4,
    marginBottom: DIMENSIONS.SPACING.sm + 4,
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
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginLeft: DIMENSIONS.SPACING.xs + 2,
    fontWeight: '500' as const,
  },
  likedText: {
    color: COLORS.error,
  },
  endOfFeed: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl,
  },
  endOfFeedText: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
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
    fontWeight: '600' as const,
    fontSize: 12,
    marginBottom: 2,
    color: COLORS.black,
  },
  commentText: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    color: COLORS.black,
    fontSize: 14,
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
    fontSize: DIMENSIONS.FONT_SIZES.md,
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
    fontSize: DIMENSIONS.FONT_SIZES.md,
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
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl * 2,
  },
  emptyText: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  emptySubtext: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});