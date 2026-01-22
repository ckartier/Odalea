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
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Heart, MessageCircle, Share, MapPin, AlertTriangle, Send, Award, DollarSign } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
  },
  urgentPost: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  challengePost: {
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  proPost: {
    borderWidth: 1,
    borderColor: '#000000',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  foundBanner: {
    backgroundColor: '#10B981',
  },
  challengeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  challengeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 2,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111111',
    marginBottom: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  timeAgo: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 6,
  },
  location: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6B7280',
    marginLeft: 4,
    maxWidth: SCREEN_WIDTH * 0.35,
  },
  moreButton: {
    padding: 8,
    marginLeft: 4,
  },
  moreButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '700' as const,
  },
  postContent: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#111111',
    lineHeight: 20,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  multipleImages: {
    width: '48%',
    aspectRatio: 1,
  },
  viewAllPhotosButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  viewAllPhotosText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#000000',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginLeft: 6,
  },
  likedText: {
    color: '#EF4444',
  },
  inlineCommentsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  inlineCommentsList: {
    marginBottom: 12,
  },
  emptyCommentsText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    marginVertical: 12,
  },
  commentItem: {
    marginBottom: 8,
  },
  commentBubble: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 10,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 2,
    color: '#111111',
  },
  commentText: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#374151',
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400' as const,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    color: '#111111',
  },
  commentSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
