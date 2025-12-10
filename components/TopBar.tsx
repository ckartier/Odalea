import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { Menu, ArrowLeft } from 'lucide-react-native';
import { usePets } from '@/hooks/pets-store';
import { useAuth } from '@/hooks/auth-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

interface TopBarProps {
  title?: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  onMenuPress?: () => void;
}

export function useTopBarHeight() {
  const insets = useSafeAreaInsets();
  const base = 84;
  return insets.top + base;
}

const TopBar = React.memo(({ rightAction, onMenuPress, onBackPress }: TopBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { userPets } = usePets();
  const { user } = useAuth();
  const authPets = useMemo(() => user?.pets ?? [], [user?.pets]);
  const combinedPets = useMemo(() => {
    const safeUserPets = Array.isArray(userPets) ? userPets : [];
    const safeAuthPets = Array.isArray(authPets) ? authPets : [];
    return (safeUserPets.length > 0) ? safeUserPets : safeAuthPets;
  }, [userPets, authPets]);

  const primaryPet = useMemo(() => {
    if (!Array.isArray(combinedPets)) return undefined;
    return combinedPets.find((p) => p.isPrimary) ?? combinedPets[0];
  }, [combinedPets]);

  const shouldShow = useMemo(() => !(
    pathname?.includes('/auth/') ||
    pathname?.includes('/onboarding') ||
    pathname === '/splash' ||
    pathname === '/index'
  ), [pathname]);

  const containerStyle = useMemo(() => ([
    styles.container,
    {
      paddingTop: insets.top,
      height: insets.top + 84,
    },
  ]), [insets.top]);

  const goProfile = useCallback(() => {
    router.push('/(tabs)/profile' as any);
  }, [router]);

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  }, [router, onBackPress]);

  const photoUri = primaryPet?.mainPhoto || user?.photo || user?.animalPhoto;
  const displayName = primaryPet?.name || user?.animalName || user?.pseudo || user?.name || '';
  const canGoBack = router.canGoBack();

  const Avatar = (
    <TouchableOpacity
      onPress={goProfile}
      style={styles.avatarButton}
      accessibilityLabel="Ouvrir le profil"
      testID="topbar-avatar"
      activeOpacity={0.85}
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.avatarImage}
          contentFit="cover"
          transition={250}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>
            {displayName ? displayName.charAt(0).toUpperCase() : '🐾'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const MenuButton = (
    <TouchableOpacity
      onPress={onMenuPress}
      style={styles.menuButton}
      accessibilityLabel="Ouvrir le menu"
      testID="topbar-menu"
      activeOpacity={0.85}
    >
      <Menu size={22} color={COLORS.black} />
    </TouchableOpacity>
  );

  const userLabel = useMemo(() => user?.pseudo || user?.name || '', [user?.pseudo, user?.name]);
  const subtitle = useMemo(() => {
    if (primaryPet?.breed) {
      return `${primaryPet.name ?? 'Animal'} • ${primaryPet.breed}`;
    }
    if (user?.city) {
      return `${user.city}${user.zipCode ? `, ${user.zipCode}` : ''}`;
    }
    return 'Prenez soin de vos animaux';
  }, [primaryPet?.breed, primaryPet?.name, user?.city, user?.zipCode]);

  if (!shouldShow) {
    return null;
  }

  return (
    <View style={[containerStyle, styles.transparentBg]} testID="topbar">
      <LinearGradient
        colors={['rgba(248,250,252,0.9)', 'rgba(255,255,255,0.75)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerWrap}>
        <View style={styles.content}>
          <View style={styles.leftSlot}>
            {canGoBack && (
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
                accessibilityLabel="Retour"
                testID="topbar-back"
                activeOpacity={0.85}
              >
                <ArrowLeft size={22} color={COLORS.black} />
              </TouchableOpacity>
            )}
            {Avatar}
          </View>

          <View style={styles.userInfo}>
            <Text numberOfLines={1} style={styles.username} testID="topbar-username">{userLabel}</Text>
            <Text numberOfLines={1} style={styles.subtitle} testID="topbar-subtitle">{subtitle}</Text>
          </View>

          <View style={styles.rightSlot} testID="topbar-right">
            {rightAction ?? MenuButton}
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
    height: 84,
    gap: 12,
  },
  leftSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },
  userInfo: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.SPACING.sm,
    justifyContent: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  rightSlot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.06)',
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
