import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
} from 'react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { User, Camera } from 'lucide-react-native';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarType = 'user' | 'pet';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  type?: AvatarType;
  onPress?: () => void;
  showEditBadge?: boolean;
  online?: boolean;
  verified?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const getSizeConfig = (size: AvatarSize) => {
  switch (size) {
    case 'xs':
      return { dimension: 28, fontSize: 10, iconSize: 14, badgeSize: 10 };
    case 'sm':
      return { dimension: 36, fontSize: 12, iconSize: 18, badgeSize: 12 };
    case 'md':
      return { dimension: 48, fontSize: 16, iconSize: 24, badgeSize: 16 };
    case 'lg':
      return { dimension: 64, fontSize: 20, iconSize: 32, badgeSize: 20 };
    case 'xl':
      return { dimension: 96, fontSize: 28, iconSize: 48, badgeSize: 28 };
    default:
      return { dimension: 48, fontSize: 16, iconSize: 24, badgeSize: 16 };
  }
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getBackgroundColor = (name: string): string => {
  if (!name) return COLORS.lightGray;
  const colors = [
    COLORS.primary,
    COLORS.info,
    COLORS.success,
    COLORS.warning,
    '#EC4899',
    '#8B5CF6',
    '#06B6D4',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function Avatar({
  source,
  name,
  size = 'md',
  type = 'user',
  onPress,
  showEditBadge = false,
  online,
  verified,
  style,
  testID,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const config = getSizeConfig(size);
  
  const showPlaceholder = !source || imageError;
  const backgroundColor = showPlaceholder ? getBackgroundColor(name || '') : COLORS.lightGray;

  const containerStyle: ViewStyle = {
    width: config.dimension,
    height: config.dimension,
    borderRadius: config.dimension / 2,
    backgroundColor,
  };

  const content = (
    <View
      testID={testID}
      style={[styles.container, containerStyle, SHADOWS.xs, style]}
    >
      {showPlaceholder ? (
        name ? (
          <Text style={[styles.initials, { fontSize: config.fontSize }]}>
            {getInitials(name)}
          </Text>
        ) : (
          <User size={config.iconSize} color={COLORS.white} />
        )
      ) : (
        <Image
          source={{ uri: source }}
          style={[styles.image, { borderRadius: config.dimension / 2 }]}
          onError={() => setImageError(true)}
        />
      )}

      {online !== undefined && (
        <View
          style={[
            styles.statusBadge,
            {
              width: config.badgeSize,
              height: config.badgeSize,
              borderRadius: config.badgeSize / 2,
              backgroundColor: online ? COLORS.success : COLORS.textTertiary,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}

      {verified && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: config.badgeSize,
              height: config.badgeSize,
              borderRadius: config.badgeSize / 2,
              right: -2,
              bottom: -2,
            },
          ]}
        >
          <Text style={{ fontSize: config.badgeSize * 0.7 }}>✓</Text>
        </View>
      )}

      {showEditBadge && (
        <View
          style={[
            styles.editBadge,
            {
              width: config.badgeSize + 4,
              height: config.badgeSize + 4,
              borderRadius: (config.badgeSize + 4) / 2,
              right: -2,
              bottom: -2,
            },
          ]}
        >
          <Camera size={config.badgeSize * 0.6} color={COLORS.white} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  statusBadge: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  verifiedBadge: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  editBadge: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
