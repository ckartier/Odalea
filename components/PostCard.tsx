import React, { useState, useCallback, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, DIMENSIONS, SHADOWS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { Heart, MessageCircle, Share, MapPin, AlertTriangle, Send, Award, DollarSign } from 'lucide-react-native';

import { Post } from '@/types';

interface PostCardProps {
  post: Post;
  isLiked: boolean;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onShare: (postId: string) => void;
  onDelete: (postId: string, authorName: string) => void;
  onReport: (postId: string, authorName: string) => void;
  onBlock: (userId: string, authorName: string) => void;
  isTogglingLike: boolean;
  isAddingComment: boolean;
  isDeletingPost: boolean;
  comments: {
    id: string;
    authorName: string;
    authorPhoto?: string;
    content: string;
    createdAt: Date;
  }[];
  isCommentsLoading: boolean;
  isCommentsExpanded: boolean;
  onToggleComments: (postId: string) => void;
}

const formatTimeAgo = (timestamp: any): string => {
  if (!timestamp) return 'now';
  
  const now = new Date();
  const postTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  return `${Math.floor(diffInMinutes / 1440)}d`;
};

const PostCardComponent: React.FC<PostCardProps> = ({
  post,
  isLiked,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onDelete,
  onReport,
  onBlock,
  isTogglingLike,
  isAddingComment,
  isDeletingPost,
  comments,
  isCommentsLoading,
  isCommentsExpanded,
  onToggleComments,
}) => {
  const [newComment, setNewComment] = useState<string>('');

  const isUrgent = post.type === 'lost' || post.type === 'found';
  const isChallenge = post.type === 'challenge';
  const isPro = post.type === 'professional' || post.isProPost;
  
  const displayImages = isUrgent && post.images 
    ? [post.images[0]]
    : post.images;

  const handleLike = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onLike(post.id);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }, [post.id, onLike]);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;
    try {
      await onComment(post.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }, [post.id, newComment, onComment]);

  const handleShare = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    onShare(post.id);
  }, [post.id, onShare]);

  const handleMoreActions = useCallback(() => {
    const isOwner = currentUserId && (post.fromOwnerId === currentUserId || post.authorId === currentUserId);
    
    const actions: any[] = [
      { text: 'Annuler', style: 'cancel' },
    ];
    
    if (isOwner) {
      actions.push({
        text: 'Supprimer mon post',
        style: 'destructive',
        onPress: () => onDelete(post.id, post.authorName)
      });
    } else {
      actions.push(
        { 
          text: 'Signaler', 
          onPress: () => onReport(post.id, post.authorName)
        },
        { 
          text: 'Bloquer l\'utilisateur', 
          style: 'destructive',
          onPress: () => onBlock(post.authorId, post.authorName)
        }
      );
    }
    
    Alert.alert('Actions', '', actions);
  }, [currentUserId, post, onDelete, onReport, onBlock]);

  return (
    <View style={[
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
          onPress={handleMoreActions}
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
          onPress={handleLike}
          disabled={isTogglingLike}
        >
          <Heart
            size={24}
            color={isLiked ? COLORS.error : COLORS.black}
            fill={isLiked ? COLORS.error : 'none'}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {post.likesCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onToggleComments(post.id)}
        >
          <MessageCircle size={24} color={COLORS.black} />
          <Text style={styles.actionText}>{post.commentsCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Share size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {isCommentsExpanded && (
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
              onPress={handleSubmitComment} 
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
    </View>
  );
};

export const PostCard = memo(PostCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.post.likesCount === nextProps.post.likesCount &&
    prevProps.post.commentsCount === nextProps.post.commentsCount &&
    prevProps.isCommentsExpanded === nextProps.isCommentsExpanded &&
    prevProps.comments.length === nextProps.comments.length &&
    prevProps.isTogglingLike === nextProps.isTogglingLike &&
    prevProps.isAddingComment === nextProps.isAddingComment &&
    prevProps.isDeletingPost === nextProps.isDeletingPost
  );
});

PostCard.displayName = 'PostCard';

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: DIMENSIONS.SPACING.md,
    marginVertical: DIMENSIONS.SPACING.sm,
    borderRadius: 16,
    padding: DIMENSIONS.SPACING.md,
    ...SHADOWS.small,
  },
  urgentPost: {
    borderWidth: 1.5,
    borderColor: COLORS.lost,
  },
  challengePost: {
    borderWidth: 1.5,
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
    ...TYPOGRAPHY.h6,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.xs / 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  metaSeparator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginHorizontal: DIMENSIONS.SPACING.xs + 2,
  },
  location: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: DIMENSIONS.SPACING.xs,
  },
  moreButton: {
    padding: DIMENSIONS.SPACING.xs,
  },
  moreButtonText: {
    fontSize: 24,
    color: COLORS.textSecondary,
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
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
    marginLeft: DIMENSIONS.SPACING.xs + 2,
  },
  likedText: {
    color: COLORS.error,
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
});
