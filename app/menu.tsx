import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useMessaging } from '@/hooks/messaging-store';
import { useChallenges } from '@/hooks/challenges-store';
import { useAuth } from '@/hooks/auth-store';
import { usePets } from '@/hooks/pets-store';
import DropdownSelector from '@/components/DropdownSelector';
import {
  Map,
  MessageCircle,
  ShoppingBag,
  Trophy,
  User,
  Search,
  Users,
  BarChart,
  HelpCircle,
  Wrench,
  UserSearch,
} from 'lucide-react-native';

interface MenuItem {
  id: string;
  titleKey: string;
  iconName: string;
  route: string;
  isSpecial?: boolean;
}

const getMenuItems = (opts: { isProfessional: boolean; isSuperAdmin: boolean; email?: string | null }): MenuItem[] => {
  const showAdmin = opts.isSuperAdmin;
  if (opts.isProfessional) {
    const proItems: MenuItem[] = [
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
        id: 'messages',
        titleKey: 'navigation.messages',
        iconName: 'MessageCircle',
        route: '/(tabs)/messages',
      },
      {
        id: 'profile',
        titleKey: 'navigation.profile',
        iconName: 'User',
        route: '/(tabs)/profile',
      },
      {
        id: 'support',
        titleKey: 'Support & infos',
        iconName: 'HelpCircle',
        route: '/settings/support',
      },
    ];
    return showAdmin ? [
      ...proItems,
      { id: 'admin-tools', titleKey: 'Admin Tools', iconName: 'Wrench', route: '/admin-tools' },
      { id: 'admin-search', titleKey: 'Recherche Utilisateurs', iconName: 'UserSearch', route: '/admin-search-users' },
    ] : proItems;
  }

  const base: MenuItem[] = [
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
      id: 'cat-sitter',
      titleKey: 'Cat Sitters',
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
      id: 'messages',
      titleKey: 'navigation.messages',
      iconName: 'MessageCircle',
      route: '/(tabs)/messages',
    },
    {
      id: 'support',
      titleKey: 'Support & infos',
      iconName: 'HelpCircle',
      route: '/settings/support',
    },
  ];
  return showAdmin ? [
    ...base,
    { id: 'admin-tools', titleKey: 'Admin Tools', iconName: 'Wrench', route: '/admin-tools' },
    { id: 'admin-search', titleKey: 'Recherche Utilisateurs', iconName: 'UserSearch', route: '/admin-search-users' },
  ] : base;
};

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { conversations } = useMessaging();
  const { getUserPendingChallenges, communityFeed } = useChallenges();
  const { user } = useAuth();
  const { userPets } = usePets();
  const [selectedMenuItem, setSelectedMenuItem] = useState('');

  const menuItems = getMenuItems({ isProfessional: Boolean(user?.isProfessional), isSuperAdmin: Boolean((user as any)?.isSuperAdmin), email: user?.email ?? null });
  
  const menuOptions = menuItems.map(item => ({
    value: item.route,
    label: item.titleKey.startsWith('Cat Sitters') || item.titleKey.startsWith('Support & infos') || item.titleKey.startsWith('Admin')
      ? item.titleKey 
      : t(item.titleKey)
  }));

  const totalUnreadMessages = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  const pendingChallenges = user ? getUserPendingChallenges(user.id) : [];
  const pendingChallengesCount = pendingChallenges.length;
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newCommunityActivity = communityFeed.filter(item => 
    new Date(item.timestamp) > oneDayAgo
  ).length;

  const renderIcon = (iconName: string) => {
    const iconProps = { size: 28, color: COLORS.primary };

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
      case 'UserSearch':
        return <UserSearch {...iconProps} />;
      default:
        return <Search {...iconProps} />;
    }
  };

  const handleMenuItemPress = (route: string) => {
    router.push(route as any);
  };
  
  const handleDropdownChange = (route: string) => {
    setSelectedMenuItem(route);
    if (route) {
      handleMenuItemPress(route);
    }
  };

  const petPhoto = userPets?.[0]?.mainPhoto || user?.photo || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&crop=face';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: petPhoto }} style={styles.userPhoto} />
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>
              {t('common.welcome')}, {user?.firstName || 'Utilisateur'}
            </Text>
            <Text style={styles.appName}>Coppet</Text>
          </View>
        </View>
      </View>

      {/* Menu Dropdown */}
      <View style={styles.menuContainer}>
        <DropdownSelector
          label={t('navigation.select_section')}
          placeholder={t('navigation.choose_section')}
          value={selectedMenuItem}
          options={menuOptions}
          onChange={handleDropdownChange}
          style={styles.menuDropdown}
        />
        
        {/* Quick Access Grid */}
        <ScrollView 
          style={styles.quickAccessContainer}
          contentContainerStyle={styles.quickAccessContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.quickAccessTitle}>{t('navigation.quick_access')}</Text>
          <View style={styles.quickAccessGrid}>
            {menuItems.slice(0, 6).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.quickAccessItem}
                onPress={() => handleMenuItemPress(item.route)}
                activeOpacity={0.7}
              >
                <View style={styles.quickAccessIcon}>
                  {renderIcon(item.iconName)}
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
                <Text style={styles.quickAccessText} numberOfLines={2}>
                  {item.titleKey.startsWith('Cat Sitters') || item.titleKey.startsWith('Support & infos') || item.titleKey.startsWith('Admin')
                    ? item.titleKey 
                    : t(item.titleKey)
                  }
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('common.version')} 1.0.0
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  header: {
    paddingHorizontal: DIMENSIONS.SPACING.lg,
    paddingVertical: DIMENSIONS.SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: DIMENSIONS.SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  appName: {
    fontSize: DIMENSIONS.FONT_SIZES.xl,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  menuContainer: {
    flex: 1,
    padding: DIMENSIONS.SPACING.lg,
  },
  menuDropdown: {
    marginBottom: DIMENSIONS.SPACING.xl,
  },
  quickAccessContainer: {
    flex: 1,
  },
  quickAccessContent: {
    paddingBottom: DIMENSIONS.SPACING.xl,
  },
  quickAccessTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.SPACING.lg,
    padding: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.md,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAccessIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(125, 212, 238, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DIMENSIONS.SPACING.sm,
    position: 'relative',
  },
  quickAccessText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    fontWeight: '600' as const,
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notificationText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: DIMENSIONS.SPACING.lg,
    paddingVertical: DIMENSIONS.SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
});