import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { Menu, Bell } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { usePets } from '@/hooks/pets-store';
import { getUserAvatarUrl } from '@/lib/image-helpers';
import { Pet } from '@/types';

interface AppHeaderProps {
  showMenu?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
}

export function useAppHeaderHeight() {
  const insets = useSafeAreaInsets();
  return insets.top + 72;
}

const AppHeader = React.memo(({ 
  showMenu = false, 
  showNotifications = false,
  notificationCount = 0,
  onMenuPress,
  onNotificationPress 
}: AppHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { user: firebaseUser } = useFirebaseUser();
  const { userPets: pets } = usePets();

  const shouldShow = useMemo(() => !(
    pathname?.includes('/auth/') ||
    pathname?.includes('/onboarding') ||
    pathname === '/splash' ||
    pathname === '/index'
  ), [pathname]);

  const containerStyle = useMemo(() => ([
    styles.container,
    { paddingTop: insets.top }
  ]), [insets.top]);

  const goProfile = useCallback(() => {
    router.push('/(tabs)/profile' as any);
  }, [router]);

  const photoUri = getUserAvatarUrl(firebaseUser || user);

  const userName = useMemo(() => {
    const currentUser = firebaseUser || user;
    return currentUser?.pseudo || currentUser?.name || 'Utilisateur';
  }, [firebaseUser, user]);
  
  const subtitle = useMemo(() => {
    if (!pets || pets.length === 0) {
      return 'Ajoutez un animal';
    }
    if (pets.length === 1) {
      return pets[0].name;
    }
    return pets.map((p: Pet) => p.name).join(' • ');
  }, [pets]);

  if (!shouldShow) {
    return null;
  }

  return (
    <View style={containerStyle} testID="app-header">
      <View style={styles.content}>
        <TouchableOpacity
          onPress={goProfile}
          style={styles.avatarButton}
          accessibilityLabel="Voir le profil"
          testID="header-avatar"
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: photoUri || 'https://via.placeholder.com/48' }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text numberOfLines={1} style={styles.userName} testID="header-username">
            {userName}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle} testID="header-subtitle">
            {subtitle}
          </Text>
        </View>

        <View style={styles.actions}>
          {showNotifications && (
            <TouchableOpacity
              onPress={onNotificationPress}
              style={styles.iconButton}
              accessibilityLabel="Notifications"
              testID="header-notifications"
              activeOpacity={0.7}
            >
              <Bell size={24} color={COLORS.black} />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          
          {showMenu && (
            <TouchableOpacity
              onPress={onMenuPress}
              style={styles.iconButton}
              accessibilityLabel="Menu"
              testID="header-menu"
              activeOpacity={0.7}
            >
              <Menu size={24} color={COLORS.black} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.separator} />
    </View>
  );
});

AppHeader.displayName = 'AppHeader';
export default AppHeader;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: COLORS.white,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING.md,
    paddingVertical: DIMENSIONS.SPACING.sm,
    minHeight: 72,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: DIMENSIONS.SPACING.sm,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    ...TYPOGRAPHY.h5,
    color: COLORS.black,
    marginBottom: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    ...TYPOGRAPHY.badge,
    fontSize: 10,
    fontWeight: '700' as const,
    color: COLORS.white,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
});
