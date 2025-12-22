import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ViewStyle,
  Image
} from 'react-native';

import { useRouter } from 'expo-router';
import { COLORS, SHADOWS, RESPONSIVE_FONT_SIZES, RESPONSIVE_COMPONENT_SIZES, moderateScale } from '@/constants/colors';
import { User } from '@/types';
import { MessageCircle, UserCheck } from 'lucide-react-native';
import { useMessaging } from '@/hooks/messaging-store';
import GlassView from './GlassView';

interface UserCardProps {
  user: User;
  style?: ViewStyle;
  showActions?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  style,
  showActions = false,
}) => {
  const router = useRouter();
  const { areFriends, hasPendingRequest, sendFriendRequest } = useMessaging();
  
  const handlePress = () => {
    router.push(`/profile/${user.id}`);
  };
  
  const handleMessage = () => {
    router.push(`/messages/new?userId=${user.id}`);
  };
  
  const handleAddFriend = async () => {
    try {
      await sendFriendRequest.mutateAsync(user.id);
    } catch (error) {
      console.error('Failed to send friend request', error);
    }
  };
  
  const getMainPetPhoto = () => {
    if (user.pets.length > 0) {
      return user.pets[0].mainPhoto;
    }
    return 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500';
  };
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={style}
    >
      <GlassView
        tint="neutral"
        liquidGlass={true}
        style={[styles.container, SHADOWS.liquidGlassNeutral]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getMainPetPhoto() }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.name}>@{user.pseudo}</Text>
          
          <View style={styles.detailsContainer}>
            {user.isCatSitter && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>Cat Sitter</Text>
              </View>
            )}
            
            <Text style={styles.petCount}>
              {user.pets.length} pet{user.pets.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        
        {showActions && (
          <View style={styles.actionsContainer}>
            {areFriends(user.id) ? (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleMessage}
              >
                <MessageCircle size={20} color={COLORS.femaleAccent} />
              </TouchableOpacity>
            ) : hasPendingRequest(user.id) ? (
              <View style={styles.pendingContainer}>
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleAddFriend}
              >
                <UserCheck size={20} color={COLORS.femaleAccent} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </GlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  imageContainer: {
    width: RESPONSIVE_COMPONENT_SIZES.AVATAR_LARGE,
    height: RESPONSIVE_COMPONENT_SIZES.AVATAR_LARGE,
    borderRadius: RESPONSIVE_COMPONENT_SIZES.AVATAR_LARGE / 2,
    overflow: 'hidden',
    marginRight: moderateScale(12),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: moderateScale(4),
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: COLORS.femaleAccent,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(6),
  },
  badgeText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    fontWeight: '600' as const,
  },
  petCount: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  actionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContainer: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    backgroundColor: COLORS.default,
    borderRadius: moderateScale(8),
  },
  pendingText: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
});

export default UserCard;
