import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useMessaging } from '@/hooks/messaging-store';
import { useChallenges } from '@/hooks/challenges-store';
import { useAuth } from '@/hooks/auth-store';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Map,
  MessageCircle,
  ShoppingBag,
  Trophy,
  User,
  Search,
  Menu,
  X,
  Users,
  BarChart,
  HelpCircle,
  Wrench,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const MENU_WIDTH = Math.min(width * 0.85, 320);

// Pre-calculate animation values for better performance
const ANIMATION_CONFIG = {
  duration: 250,
  closeDuration: 220,
  springConfig: {
    tension: 50,
    friction: 8,
    useNativeDriver: false,
  },
  timingConfig: {
    useNativeDriver: false,
  },
};

interface MenuItem {
  id: string;
  titleKey: string;
  iconName: string;
  route: string;
  isSpecial?: boolean;
}

// Memoize menu items to prevent re-creation
const getMenuItems = (isProfessional: boolean): MenuItem[] => {
  if (isProfessional) {
    // Professional users only see shop and dashboard
    return [
      {
        id: 'dashboard',
        titleKey: 'pro.dashboard',
        iconName: 'BarChart',
        route: '/(pro)/dashboard',
      },
      {
        id: 'shop',
        titleKey: 'navigation.shop',
        iconName: 'ShoppingBag',
        route: '/(pro)/shop',
      },
      {
        id: 'profile',
        titleKey: 'navigation.profile',
        iconName: 'User',
        route: '/(pro)/profile',
      },
      {
        id: 'admin-tools',
        titleKey: 'Admin Tools',
        iconName: 'Wrench',
        route: '/admin-tools',
        isSpecial: true,
      },
      {
        id: 'support',
        titleKey: 'Support & infos',
        iconName: 'HelpCircle',
        route: '/settings/support',
      },
    ];
  }

  // Regular users see all features
  return [
    {
      id: 'map',
      titleKey: 'navigation.map',
      iconName: 'Map',
      route: '/(tabs)/map',
    },
    {
      id: 'community',
      titleKey: 'navigation.community',
      iconName: 'Users',
      route: '/(tabs)/community',
    },
    {
      id: 'messages',
      titleKey: 'Messages',
      iconName: 'MessageCircle',
      route: '/(tabs)/messages',
      isSpecial: true,
    },
    {
      id: 'cat-sitter',
      titleKey: 'sitters.book_cat_sitter',
      iconName: 'Search',
      route: '/cat-sitter',
    },
    {
      id: 'shop',
      titleKey: 'navigation.shop',
      iconName: 'ShoppingBag',
      route: '/(tabs)/shop',
    },
    {
      id: 'challenges',
      titleKey: 'navigation.challenges',
      iconName: 'Trophy',
      route: '/(tabs)/challenges',
    },
    {
      id: 'admin-tools',
      titleKey: 'Admin Tools',
      iconName: 'Wrench',
      route: '/admin-tools',
      isSpecial: true,
    },
    {
      id: 'profile',
      titleKey: 'navigation.profile',
      iconName: 'User',
      route: '/(tabs)/profile',
    },
    {
      id: 'lost-found',
      titleKey: 'navigation.lostFound',
      iconName: 'Search',
      route: '/(tabs)/lost-found',
    },
    {
      id: 'help',
      titleKey: 'settings.help',
      iconName: 'HelpCircle',
      route: '/settings/help',
    },
  ];
};

interface FloatingMenuProps {
  isProfessional?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

const FloatingMenu = React.memo(({ isProfessional, isOpen: externalIsOpen, onToggle }: FloatingMenuProps = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const { conversations } = useMessaging();
  const { getUserPendingChallenges, communityFeed } = useChallenges();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const slideAnim = useRef(new Animated.Value(MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Initialize animation values to closed state
  useEffect(() => {
    if (!isOpen) {
      slideAnim.setValue(MENU_WIDTH);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, []);

  const menuItems = useMemo(() => {
    return getMenuItems(isProfessional || user?.isProfessional || false);
  }, [isProfessional, user?.isProfessional]);

  const openMenu = useCallback(() => {
    if (externalIsOpen === undefined) {
      setInternalIsOpen(true);
    }
    if (Platform.OS === 'web') {
      // Web fallback without animations
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_CONFIG.duration,
          ...ANIMATION_CONFIG.timingConfig,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_CONFIG.duration,
          ...ANIMATION_CONFIG.timingConfig,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...ANIMATION_CONFIG.springConfig,
        }),
      ]).start();
    }
  }, [externalIsOpen, slideAnim, fadeAnim, scaleAnim]);

  const closeMenu = useCallback(() => {
    console.log('FloatingMenu: closeMenu called', { externalIsOpen, onToggle: !!onToggle });
    
    if (Platform.OS === 'web') {
      slideAnim.setValue(MENU_WIDTH);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      if (onToggle) {
        onToggle();
      } else {
        setInternalIsOpen(false);
      }
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MENU_WIDTH,
          duration: ANIMATION_CONFIG.closeDuration,
          ...ANIMATION_CONFIG.timingConfig,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_CONFIG.closeDuration,
          ...ANIMATION_CONFIG.timingConfig,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: ANIMATION_CONFIG.closeDuration,
          ...ANIMATION_CONFIG.timingConfig,
        }),
      ]).start(() => {
        if (onToggle) {
          onToggle();
        } else {
          setInternalIsOpen(false);
        }
      });
    }
  }, [onToggle, slideAnim, fadeAnim, scaleAnim]);

  // Memoize calculations to prevent unnecessary re-computations
  const totalUnreadMessages = useMemo(() => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  }, [conversations]);
  
  const pendingChallengesCount = useMemo(() => {
    const pendingChallenges = user ? getUserPendingChallenges(user.id) : [];
    return pendingChallenges.length;
  }, [user, getUserPendingChallenges]);
  
  const newCommunityActivity = useMemo(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return communityFeed.filter(item => 
      new Date(item.timestamp) > oneDayAgo
    ).length;
  }, [communityFeed]);

  const handleMenuItemPress = useCallback((route: string) => {
    console.log('FloatingMenu: handleMenuItemPress called', { route });
    closeMenu();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  }, [closeMenu, router]);

  const isActiveRoute = useCallback((route: string) => {
    return pathname === route || pathname.startsWith(route);
  }, [pathname]);

  const getIconColor = useCallback((iconName: string, item: MenuItem) => {
    if (isActiveRoute(item.route)) {
      return COLORS.primary;
    }
    
    // All icons use dark gray for consistency
    return COLORS.darkGray;
  }, [isActiveRoute]);

  const renderIcon = useCallback((iconName: string, item: MenuItem) => {
    const iconColor = getIconColor(iconName, item);
    const iconProps = { size: DIMENSIONS.COMPONENT_SIZES.ICON_MEDIUM, color: iconColor };

    switch (iconName) {
      case 'Map':
        return <Map {...iconProps} />;
      case 'Users':
        return <Users {...iconProps} />;
      case 'MessageCircle':
        return <MessageCircle {...iconProps} />;
      case 'ShoppingBag':
        return <ShoppingBag {...iconProps} />;
      case 'Trophy':
        return <Trophy {...iconProps} />;
      case 'User':
        return <User {...iconProps} />;
      case 'Search':
        return <Search {...iconProps} />;
      case 'BarChart':
        return <BarChart {...iconProps} />;
      case 'HelpCircle':
        return <HelpCircle {...iconProps} />;
      case 'Wrench':
        return <Wrench {...iconProps} />;
      default:
        return <Menu {...iconProps} />;
    }
  }, [getIconColor]);

  // Handle external isOpen changes
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      if (externalIsOpen) {
        openMenu();
      } else {
        // When externally controlled and should close, just animate without calling onToggle
        if (Platform.OS === 'web') {
          slideAnim.setValue(MENU_WIDTH);
          fadeAnim.setValue(0);
          scaleAnim.setValue(0.8);
        } else {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: MENU_WIDTH,
              duration: ANIMATION_CONFIG.closeDuration,
              ...ANIMATION_CONFIG.timingConfig,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: ANIMATION_CONFIG.closeDuration,
              ...ANIMATION_CONFIG.timingConfig,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: ANIMATION_CONFIG.closeDuration,
              ...ANIMATION_CONFIG.timingConfig,
            }),
          ]).start();
        }
      }
    }
  }, [externalIsOpen, openMenu, slideAnim, fadeAnim, scaleAnim]);

  // Prevent rendering during navigation transitions or when user is not authenticated
  if (!pathname) {
    return null;
  }

  // Don't render anything if menu is not open
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={closeMenu}
          activeOpacity={1}
          accessible={false}
        />
      </Animated.View>

      {/* Menu */}
      <Animated.View
        style={[
          styles.menu,
          {
            top: insets.top + 70,
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Coppet</Text>
          <TouchableOpacity 
            onPress={closeMenu} 
            style={styles.closeButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isActiveRoute(item.route) && styles.menuItemActive,
              ]}
              onPress={() => handleMenuItemPress(item.route)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#a3e5fa", "#f7b6d6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.menuItemIconGradient,
                  isActiveRoute(item.route) && styles.menuItemIconGradientActive,
                ]}
              >
                <View
                  style={[
                    styles.menuItemIcon,
                    isActiveRoute(item.route) && styles.menuItemIconActive,
                  ]}
                >
                  {renderIcon(item.iconName, item)}
                  {item.id === 'messages' && totalUnreadMessages > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationText}>
                        {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                      </Text>
                    </View>
                  )}
                  {item.id === 'challenges' && pendingChallengesCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationText}>
                        {pendingChallengesCount > 99 ? '99+' : pendingChallengesCount}
                      </Text>
                    </View>
                  )}
                  {item.id === 'community' && newCommunityActivity > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationText}>
                        {newCommunityActivity > 99 ? '99+' : newCommunityActivity}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
              <Text
                style={[
                  styles.menuItemText,
                  isActiveRoute(item.route) && styles.menuItemTextActive,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.isSpecial ? item.titleKey : t(item.titleKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.menuFooter}>
          <Text style={styles.menuFooterText}>
            {t('common.version')} 1.0.0
          </Text>
        </View>
      </Animated.View>
    </>
  );
});

FloatingMenu.displayName = 'FloatingMenu';

export default FloatingMenu;

const styles = StyleSheet.create({

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    zIndex: 999,
  },
  overlayTouchable: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    right: DIMENSIONS.SPACING.md,
    left: DIMENSIONS.SPACING.md,
    maxHeight: '80%',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.SPACING.lg,
    zIndex: 1001,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 0,
      },
      android: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING.lg,
    paddingVertical: DIMENSIONS.SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    padding: DIMENSIONS.SPACING.xs,
    borderRadius: DIMENSIONS.SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.xl,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  menuItems: {
    flex: 1,
    paddingVertical: DIMENSIONS.SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING.md,
    paddingVertical: DIMENSIONS.SPACING.sm,
    marginHorizontal: DIMENSIONS.SPACING.sm,
    marginVertical: 1,
    borderRadius: DIMENSIONS.SPACING.md,
    minHeight: DIMENSIONS.COMPONENT_SIZES.BUTTON_HEIGHT,
    backgroundColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: 'rgba(125, 212, 238, 0.1)',
  },
  menuItemIconGradient: {
    width: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM,
    height: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM,
    borderRadius: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM / 2,
    padding: 2,
    marginRight: DIMENSIONS.SPACING.sm,
  },
  menuItemIconGradientActive: {
    opacity: 1,
  },
  menuItemIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.COMPONENT_SIZES.AVATAR_MEDIUM / 2,
    position: 'relative',
  },
  menuItemIconActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  menuItemText: {
    flex: 1,
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  menuItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600' as const,
  },

  menuFooter: {
    paddingHorizontal: DIMENSIONS.SPACING.lg,
    paddingVertical: DIMENSIONS.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  menuFooterText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
  notificationBadge: {
    position: 'absolute',
    top: -DIMENSIONS.SPACING.xs,
    right: -DIMENSIONS.SPACING.xs,
    backgroundColor: COLORS.error,
    borderRadius: DIMENSIONS.SPACING.sm + 2,
    minWidth: DIMENSIONS.SPACING.lg,
    height: DIMENSIONS.SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notificationText: {
    color: COLORS.white,
    fontSize: DIMENSIONS.FONT_SIZES.xs - 2,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
});