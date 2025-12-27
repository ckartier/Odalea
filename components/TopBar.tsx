import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { Menu } from 'lucide-react-native';
import { usePets } from '@/hooks/pets-store';
import { useAuth } from '@/hooks/auth-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserAvatarUrl } from '@/lib/image-helpers';


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
  const { user: firebaseUser } = useFirebaseUser();
  const authPets = useMemo(() => user?.pets ?? [], [user?.pets]);
  const combinedPets = useMemo(() => {
    const safeUserPets = Array.isArray(userPets) ? userPets : [];
    const safeAuthPets = Array.isArray(authPets) ? authPets : [];
    return (safeUserPets.length > 0) ? safeUserPets : safeAuthPets;
  }, [userPets, authPets]);



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

  const photoUri = getUserAvatarUrl(firebaseUser || user) || 'https://via.placeholder.com/64';

  const Avatar = (
    <TouchableOpacity
      onPress={goProfile}
      style={styles.avatarButton}
      accessibilityLabel="Ouvrir le profil"
      testID="topbar-avatar"
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: photoUri || 'https://via.placeholder.com/64' }}
        style={styles.avatarImage}
        resizeMode="cover"
        defaultSource={require('@/assets/images/icon.png')}
      />
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

  const userLabel = useMemo(() => {
    const currentUser = firebaseUser || user;
    return currentUser?.pseudo || currentUser?.name || '';
  }, [firebaseUser, user]);
  
  const subtitle = useMemo(() => {
    const pets = combinedPets.filter(p => p);
    
    if (pets.length === 0) {
      return 'Ajoutez un animal';
    }
    
    if (pets.length === 1) {
      return pets[0].name;
    }
    
    if (pets.length === 2) {
      return `${pets[0].name} • ${pets[1].name}`;
    }
    
    return `${pets[0].name} • ${pets[1].name} +${pets.length - 2}`;
  }, [combinedPets]);

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
