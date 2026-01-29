import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ViewStyle,
  ImageBackground,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DESIGN } from '@/constants/design';

interface PremiumCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'dark' | 'image';
  imageUrl?: string;
  badge?: string;
  disabled?: boolean;
  testID?: string;
}

const PremiumCard: React.FC<PremiumCardProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  style,
  variant = 'default',
  imageUrl,
  badge,
  disabled = false,
  testID,
}) => {
  const handlePress = async () => {
    if (disabled) return;

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress?.();
  };

  const getContainerStyle = (): ViewStyle => {
    if (variant === 'dark') {
      return {
        backgroundColor: DESIGN.colors.primary,
      };
    }
    return {
      backgroundColor: DESIGN.colors.surface,
    };
  };

  const getTextColor = () => {
    if (variant === 'dark') {
      return DESIGN.colors.textInverse;
    }
    return DESIGN.colors.text;
  };

  const getSubtitleColor = () => {
    if (variant === 'dark') {
      return 'rgba(255, 255, 255, 0.7)';
    }
    return DESIGN.colors.textTertiary;
  };

  const CardContent = () => (
    <>
      {badge && (
        <View style={[styles.badge, variant === 'dark' && styles.badgeDark]}>
          <Text style={[styles.badgeText, variant === 'dark' && styles.badgeTextDark]}>
            {badge}
          </Text>
        </View>
      )}
      
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: getTextColor() }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: getSubtitleColor() }]} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </>
  );

  if (variant === 'image' && imageUrl) {
    return (
      <Pressable
        testID={testID}
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.container,
          pressed && !disabled && styles.pressed,
          style,
        ]}
      >
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
          resizeMode="cover"
        >
          <View style={styles.imageOverlay}>
            <CardContent />
          </View>
        </ImageBackground>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        getContainerStyle(),
        DESIGN.shadows.card,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <CardContent />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: DESIGN.radius.xl,
    padding: DESIGN.components.card.padding,
    minHeight: 120,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageBackground: {
    flex: 1,
    minHeight: 120,
  },
  imageStyle: {
    borderRadius: DESIGN.radius.xl,
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: DESIGN.radius.xl,
    padding: DESIGN.components.card.padding,
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: DESIGN.radius.md,
    backgroundColor: DESIGN.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    gap: 4,
  },
  title: {
    ...DESIGN.typography.h3,
  },
  subtitle: {
    ...DESIGN.typography.caption,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: DESIGN.colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DESIGN.radius.full,
  },
  badgeDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    ...DESIGN.typography.small,
    fontWeight: '600' as const,
    color: DESIGN.colors.text,
  },
  badgeTextDark: {
    color: DESIGN.colors.textInverse,
  },
});

export default PremiumCard;
