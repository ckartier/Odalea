import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { COLORS, SHADOWS, DIMENSIONS, IS_TABLET, RESPONSIVE_LAYOUT, moderateScale, GRADIENTS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { Plus, Heart, MessageCircle, Share, MapPin, AlertTriangle, Sparkles } from 'lucide-react-native';
import ResponsiveCard from '@/components/ResponsiveCard';
// import FirebaseTest from '@/components/FirebaseTest';

// Mock data for community posts
const mockPosts = [
  {
    id: '1',
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9e0e4b0?w=100&h=100&fit=crop&crop=face',
    },
    type: 'photo',
    content: 'Beautiful day at the park with Luna! 🌞',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
      },
    ],
    location: 'Central Park, New York',
    likes: 24,
    comments: 8,
    timeAgo: '2h',
    isLiked: false,
  },
  {
    id: '2',
    author: {
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    },
    type: 'lost',
    content: '🚨 LOST PET ALERT: Missing golden retriever named Max. Last seen near Oak Street. Please help us find him!',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
      },
    ],
    location: 'Oak Street, Downtown',
    likes: 45,
    comments: 12,
    timeAgo: '4h',
    isLiked: true,
    isUrgent: true,
  },
  {
    id: '3',
    author: {
      name: 'Emma Wilson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    },
    type: 'playdate',
    content: 'Looking for playmates for my energetic Border Collie! Anyone interested in a playdate this weekend?',
    media: [],
    location: 'Riverside Park',
    likes: 12,
    comments: 6,
    timeAgo: '6h',
    isLiked: false,
  },
];

function HomeScreen() {
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState(mockPosts);
  const [activeFilter, setActiveFilter] = useState('all');

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleCreatePost = () => {
    router.push('/community/create');
  };

  const handleComment = (postId: string) => {
    console.log('Opening comments for post:', postId);
    // TODO: Navigate to comments screen or open comments modal
  };

  const handleShare = (postId: string) => {
    console.log('Sharing post:', postId);
    // TODO: Implement native share functionality
  };
  
  const filters = [
    { key: 'all', label: t('map.show_all') },
    { key: 'following', label: t('community.following') },
    { key: 'nearby', label: t('community.nearby') },
    { key: 'lost_found', label: t('lost_found.lost_found') },
  ];

  const filteredPosts = React.useMemo(() => {
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'lost_found') return posts.filter(p => p.type === 'lost');
    // For mock purposes, return all for other filters
    return posts;
  }, [posts, activeFilter]);

  const renderPost = (post: any) => (
    <ResponsiveCard
      key={post.id}
      variant={post.isUrgent ? 'outlined' : 'default'}
      borderRadius="large"
      shadow="medium"
      interactive
      style={post.isUrgent ? { borderColor: COLORS.error, borderWidth: 2 } : {}}
    >
      {post.isUrgent && (
        <LinearGradient
          colors={[COLORS.error, '#FF6B6B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.urgentBanner}
        >
          <AlertTriangle size={16} color={COLORS.white} />
          <Text style={styles.urgentText}>{t('lost_found.lost_found').toUpperCase()}</Text>
          <Sparkles size={14} color={COLORS.white} />
        </LinearGradient>
      )}
      
      <View style={styles.postHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          <View style={styles.onlineIndicator} />
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <View style={styles.postMeta}>
            <Text style={styles.timeAgo}>{post.timeAgo}</Text>
            {post.location && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <MapPin size={12} color={COLORS.gray} />
                <Text style={styles.location}>{post.location}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      {post.media.length > 0 && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: post.media[0].url }} style={styles.postImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.1)']}
            style={styles.imageOverlay}
          />
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity
          style={[styles.actionButton, post.isLiked && styles.likedButton]}
          onPress={() => handleLike(post.id)}
        >
          <Heart
            size={20}
            color={post.isLiked ? COLORS.white : COLORS.gray}
            fill={post.isLiked ? COLORS.white : 'none'}
          />
          <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
            {post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleComment(post.id)}
        >
          <MessageCircle size={20} color={COLORS.gray} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare(post.id)}
        >
          <Share size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
    </ResponsiveCard>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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

      <View
        style={styles.feed}
      >
        {/* <FirebaseTest testId="firebase-test" /> */}
        {filteredPosts.map(renderPost)}
        
        <View style={styles.endOfFeed}>
          <Text style={styles.endOfFeedText}>{t('common.view_all')}</Text>
        </View>
      </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCreatePost}>
        <LinearGradient
          colors={GRADIENTS.secondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus size={DIMENSIONS.COMPONENT_SIZES.ICON_MEDIUM} color={COLORS.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  createButton: {
    padding: DIMENSIONS.SPACING.sm,
  },
  menuButton: {
    padding: DIMENSIONS.SPACING.sm,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: DIMENSIONS.SPACING.md,
    paddingHorizontal: DIMENSIONS.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.xs,
    zIndex: 5,
  },
  filterButton: {
    paddingHorizontal: DIMENSIONS.SPACING.lg,
    paddingVertical: DIMENSIONS.SPACING.sm + moderateScale(2),
    marginRight: DIMENSIONS.SPACING.md,
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.surfaceBackground,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  filterText: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    fontWeight: '600' as const,
    color: COLORS.gray,
    letterSpacing: 0.3,
  },
  activeFilterText: {
    color: COLORS.white,
    fontWeight: '700' as const,
  },
  feed: {
    flex: 1,
    maxWidth: IS_TABLET ? RESPONSIVE_LAYOUT.contentMaxWidth : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -DIMENSIONS.SPACING.md,
    marginTop: -DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.md,
    paddingVertical: DIMENSIONS.SPACING.sm + moderateScale(2),
    paddingHorizontal: DIMENSIONS.SPACING.md,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    gap: moderateScale(6),
  },
  urgentText: {
    color: COLORS.white,
    fontWeight: '700' as const,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    marginLeft: DIMENSIONS.SPACING.xs + moderateScale(2),
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING.sm + moderateScale(4),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: DIMENSIONS.SPACING.md,
  },
  avatar: {
    width: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM,
    height: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM,
    borderRadius: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM / 2,
    borderWidth: moderateScale(2),
    borderColor: COLORS.white,
    ...SHADOWS.small,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: moderateScale(2),
    right: moderateScale(2),
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: COLORS.success,
    borderWidth: moderateScale(2),
    borderColor: COLORS.white,
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
    marginHorizontal: DIMENSIONS.SPACING.xs + moderateScale(2),
  },
  location: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
    marginLeft: DIMENSIONS.SPACING.xs,
  },
  postContent: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    lineHeight: DIMENSIONS.FONT_SIZES.md * 1.5,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.md,
    letterSpacing: 0.2,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: DIMENSIONS.SPACING.md,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: IS_TABLET ? moderateScale(320) : moderateScale(220),
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: moderateScale(40),
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: DIMENSIONS.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: DIMENSIONS.SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING.sm,
    paddingHorizontal: DIMENSIONS.SPACING.md,
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.surfaceBackground,
    gap: moderateScale(6),
    minWidth: moderateScale(60),
    justifyContent: 'center',
  },
  likedButton: {
    backgroundColor: COLORS.error,
    ...SHADOWS.small,
  },
  actionText: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '600' as const,
  },
  likedText: {
    color: COLORS.white,
  },
  endOfFeed: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING.xl,
  },
  endOfFeedText: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  fab: {
    position: 'absolute',
    bottom: IS_TABLET ? moderateScale(120) : moderateScale(100),
    right: RESPONSIVE_LAYOUT.containerPadding,
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    ...SHADOWS.large,
    elevation: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;