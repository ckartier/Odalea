import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ViewStyle 
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS, RESPONSIVE_FONT_SIZES, RESPONSIVE_COMPONENT_SIZES } from '@/constants/colors';
import { User } from '@/types';
import { MessageCircle, UserCheck } from 'lucide-react-native';
import { useMessaging } from '@/hooks/messaging-store';

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
      style={[styles.container, SHADOWS.medium, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getMainPetPhoto() }}
          style={styles.image}
          contentFit="cover"
          transition={300}
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
              <MessageCircle size={20} color={'#f2bcd7'} />
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
              <UserCheck size={20} color={'#f2bcd7'} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(215, 246, 255, 0.8)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
  },
  imageContainer: {
    width: RESPONSIVE_COMPONENT_SIZES.AVATAR_LARGE,
    height: RESPONSIVE_COMPONENT_SIZES.AVATAR_LARGE,
    borderRadius: RESPONSIVE_COMPONENT_SIZES.AVATAR_LARGE / 2,
    overflow: 'hidden',
    marginRight: 8,
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
    marginBottom: 2,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(242, 188, 215, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    marginRight: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    fontWeight: '500' as const,
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
    width: RESPONSIVE_COMPONENT_SIZES.BUTTON_HEIGHT * 0.8,
    height: RESPONSIVE_COMPONENT_SIZES.BUTTON_HEIGHT * 0.8,
    borderRadius: (RESPONSIVE_COMPONENT_SIZES.BUTTON_HEIGHT * 0.8) / 2,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: COLORS.default,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.black,
  },
});

export default UserCard;