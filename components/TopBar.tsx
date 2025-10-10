import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image as RNImage } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { Menu } from 'lucide-react-native';
import { usePets } from '@/hooks/pets-store';
import { useAuth } from '@/hooks/auth-store';
import { LinearGradient } from 'expo-linear-gradient';

interface TopBarProps {
  title?: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  onMenuPress?: () => void;
}

export function useTopBarHeight() {
  const insets = useSafeAreaInsets();
  const base = 96;
  return insets.top + base;
}

const TopBar = React.memo(({ rightAction, onMenuPress }: TopBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { userPets } = usePets();
  const { user } = useAuth();
  const authPets = user?.pets ?? [];
  const combinedPets = useMemo(() => {
    return (userPets && userPets.length > 0) ? userPets : authPets;
  }, [userPets, authPets]);
  const primaryPet = useMemo(() => combinedPets.find(p => p.isPrimary) ?? combinedPets[0], [combinedPets]);

  const shouldShow = useMemo(() => {
    return !(
      pathname?.includes('/auth/') ||
      pathname?.includes('/onboarding') ||
      pathname === '/splash' ||
      pathname === '/index'
    );
  }, [pathname]);

  const containerStyle = useMemo(() => ([
    styles.container,
    {
      paddingTop: insets.top,
      height: insets.top + 96,
    },
  ]), [insets.top]);

  const goProfile = useCallback(() => {
    router.push('/(tabs)/profile' as any);
  }, [router]);

  const renderAvatar = () => (
    <TouchableOpacity
      onPress={goProfile}
      style={styles.avatarButton}
      accessibilityLabel="Ouvrir le profil"
      testID="topbar-avatar"
      activeOpacity={0.85}
    >
      {primaryPet?.mainPhoto || user?.photo ? (
        <RNImage
          source={{ uri: (primaryPet?.mainPhoto ?? user?.photo) as string }}
          style={styles.avatarImage}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>{primaryPet?.name ? primaryPet.name.charAt(0).toUpperCase() : '🐾'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const Right = (
    <TouchableOpacity
      onPress={onMenuPress}
      style={styles.menuButton}
      accessibilityLabel="Open menu"
      testID="topbar-menu"
      activeOpacity={0.8}
    >
      <Menu size={24} color={COLORS.black} />
    </TouchableOpacity>
  );

  const userLabel = useMemo(() => user?.pseudo || user?.name || '', [user?.pseudo, user?.name]);

  if (!shouldShow) {
    return null;
  }

  return (
    <View style={[containerStyle, styles.transparentBg]} testID="topbar">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.7)' }]} />
      <View style={styles.headerWrap}>
        <View style={styles.content}>
          {renderAvatar()}
          <View style={styles.userInfo}>
            <Text numberOfLines={1} style={styles.username} testID="topbar-username">{userLabel}</Text>
          </View>
          <View style={styles.rightSlot} testID="topbar-right">
            {rightAction ?? Right}
          </View>
        </View>
      </View>
      <View style={styles.hairline} />
    </View>
  );
});

TopBar.displayName = 'TopBar';
export default TopBar;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  transparentBg: {
    backgroundColor: 'transparent',
  },
  headerWrap: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING.md,
    height: 96,
  },
  avatarButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  userInfo: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.SPACING.sm,
    justifyContent: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  rightSlot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15,23,42,0.08)',
  },
});