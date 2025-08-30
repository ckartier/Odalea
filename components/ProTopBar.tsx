import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, DIMENSIONS, IS_TABLET, moderateScale } from '@/constants/colors';
import { useAuth } from '@/hooks/auth-store';
import { Store, Menu } from 'lucide-react-native';

interface ProTopBarProps {
  title?: string;
  showIcons?: boolean;
  onMenuPress?: () => void;
}

const ProTopBar = React.memo(({ title, showIcons = true, onMenuPress }: ProTopBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Don't show on auth screens, onboarding, or when user is not authenticated
  if (
    pathname?.includes('/auth/') ||
    pathname?.includes('/onboarding') ||
    pathname === '/splash' ||
    pathname === '/index' ||
    !user ||
    !user.isProfessional
  ) {
    return null;
  }

  const handleShopPress = () => {
    router.push('/(pro)/shop');
  };

  const handleProfilePress = () => {
    router.push('/(pro)/profile');
  };

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      router.push('/menu');
    }
  };

  // Use professional photo or default
  const profilePhoto = user?.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          height: DIMENSIONS.COMPONENT_SIZES.HEADER_HEIGHT + insets.top,
        },
      ]}
    >
      <View style={styles.content}>
        {showIcons && (
          <>
            {/* Shop Icon */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleShopPress}
              activeOpacity={0.8}
              accessibilityLabel="Boutique"
            >
              <Store size={DIMENSIONS.COMPONENT_SIZES.ICON_SMALL} color={COLORS.white} />
            </TouchableOpacity>

            {/* Professional Profile Photo - Centered */}
            <View style={styles.profilePhotoContainer}>
              <TouchableOpacity
                style={styles.profilePhotoButton}
                onPress={handleProfilePress}
                activeOpacity={0.8}
                accessibilityLabel="Profil Pro"
              >
                <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                <View style={styles.proBadge}>
                  <Text style={styles.proText}>PRO</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Menu Icon */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleMenuPress}
              activeOpacity={0.8}
              accessibilityLabel="Menu"
            >
              <Menu size={DIMENSIONS.COMPONENT_SIZES.ICON_SMALL} color={COLORS.white} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
});

ProTopBar.displayName = 'ProTopBar';

export default ProTopBar;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    zIndex: 100,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: IS_TABLET ? 'space-around' : 'space-between',
    paddingHorizontal: DIMENSIONS.SPACING.md,
    paddingBottom: DIMENSIONS.SPACING.sm,
    maxWidth: IS_TABLET ? 800 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  iconButton: {
    width: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM,
    height: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM,
    borderRadius: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM / 2,
    backgroundColor: COLORS.transparent,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profilePhotoContainer: {
    flex: IS_TABLET ? 0 : 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: IS_TABLET ? moderateScale(32) : 0,
  },
  profilePhotoButton: {
    width: Math.round(DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM * 1.38),
    height: Math.round(DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM * 1.38),
    borderRadius: Math.round(DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM * 1.38) / 2,
    borderWidth: moderateScale(4),
    borderColor: COLORS.white,
    overflow: 'visible',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: moderateScale(3) },
        shadowOpacity: 0.3,
        shadowRadius: moderateScale(6),
        elevation: 0,
      },
      android: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: moderateScale(3) },
        shadowOpacity: 0.3,
        shadowRadius: moderateScale(6),
        elevation: 6,
      },
      web: {
        boxShadow: `0 ${moderateScale(3)}px ${moderateScale(12)}px rgba(0, 0, 0, 0.25)`,
      },
    }),
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: Math.round(DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM * 1.38) / 2 - moderateScale(4),
  },
  proBadge: {
    position: 'absolute',
    bottom: -moderateScale(4),
    right: -moderateScale(4),
    backgroundColor: COLORS.accent,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(2),
    borderWidth: moderateScale(2),
    borderColor: COLORS.white,
  },
  proText: {
    color: COLORS.white,
    fontSize: Math.max(DIMENSIONS.FONT_SIZES.xs - moderateScale(2), 8),
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -DIMENSIONS.SPACING.xs,
    right: -DIMENSIONS.SPACING.xs,
    backgroundColor: COLORS.error,
    borderRadius: DIMENSIONS.SPACING.sm + moderateScale(2),
    minWidth: DIMENSIONS.SPACING.lg,
    height: DIMENSIONS.SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(2),
    borderColor: COLORS.white,
  },
  notificationText: {
    color: COLORS.white,
    fontSize: Math.max(DIMENSIONS.FONT_SIZES.xs - moderateScale(2), 10),
    fontWeight: '700' as const,
    textAlign: 'center',
  },
});