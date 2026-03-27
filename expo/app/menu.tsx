import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { useAuth } from '@/hooks/auth-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { getUserAvatarUrl } from '@/lib/image-helpers';
import {
  Map,
  ShoppingBag,
  Trophy,
  User,
  Users,
  Settings,
  Award,
  ChevronRight,
  Cat,
  AlertTriangle,
  Crown,
  Shield,
  X,
  FileText,
  HelpCircle,
  BarChart,
  Heart,
  LogOut
} from 'lucide-react-native';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  route: string;
  badge?: number;
  color?: string;
  action?: () => void;
}

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { user: firebaseUser } = useFirebaseUser();

  const isProfessional = Boolean(user?.isProfessional);
  const isCatSitter = Boolean(user?.isCatSitter);

  useEffect(() => {
    console.log('MenuScreen mounted');
  }, []);

  const userAvatar = getUserAvatarUrl(firebaseUser || user) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face';

  const handleSignOut = async () => {
    try {
      console.log('🚪 Attempting to sign out...');
      const result = await signOut();
      console.log('🚪 Sign out result:', result);
      if (result.success) {
        console.log('✅ Sign out successful, navigating to signin');
        router.replace('/auth/signin');
      } else {
        console.error('❌ Sign out failed:', result.error);
        Alert.alert('Erreur', result.error || 'Impossible de se déconnecter');
      }
    } catch (error) {
      console.error('❌ Sign out error:', error);
      Alert.alert('Erreur', 'Impossible de se déconnecter');
    }
  };

  const mainMenuItems: MenuItem[] = [
    {
      id: 'map',
      title: 'Carte',
      icon: <Map size={24} color={COLORS.primary} />,
      route: '/(tabs)/map',
    },
    {
      id: 'community',
      title: 'Communauté',
      icon: <Users size={24} color={COLORS.primary} />,
      route: '/(tabs)/community',
    },
    {
      id: 'defis',
      title: 'Défis',
      icon: <Trophy size={24} color={COLORS.primary} />,
      route: '/defis',
    },
    {
      id: 'cat-sitter',
      title: 'Cat Sitters',
      icon: <Cat size={24} color={COLORS.primary} />,
      route: isCatSitter ? '/(pro)/cat-sitter-dashboard' : '/(tabs)/cat-sitter',
    },
    {
      id: 'shop',
      title: 'Boutique',
      icon: <ShoppingBag size={24} color={COLORS.primary} />,
      route: isProfessional ? '/(pro)/shop' : '/(tabs)/shop',
    },
    {
      id: 'lost-found',
      title: 'Perdu & Trouvé',
      icon: <AlertTriangle size={24} color="#FF6B6B" />,
      route: '/(tabs)/lost-found',
      color: '#FF6B6B',
    },
  ];

  const profileMenuItems: MenuItem[] = [
    {
      id: 'profile',
      title: 'Mon Profil',
      icon: <User size={24} color={COLORS.primary} />,
      route: isProfessional ? '/(pro)/profile' : '/(tabs)/profile',
    },
    {
      id: 'badges',
      title: 'Mes Badges',
      icon: <Award size={24} color="#FFD700" />,
      route: '/badges',
      color: '#FFD700',
    },
    {
      id: 'friends',
      title: 'Mes Amis',
      icon: <Heart size={24} color="#FF69B4" />,
      route: '/friends',
      color: '#FF69B4',
    },
    {
      id: 'premium',
      title: 'Premium',
      icon: <Crown size={24} color="#9B59B6" />,
      route: '/premium',
      color: '#9B59B6',
    },
  ];

  const proMenuItems: MenuItem[] = isProfessional ? [
    {
      id: 'dashboard',
      title: 'Tableau de bord',
      icon: <BarChart size={24} color="#2ECC71" />,
      route: '/(pro)/dashboard',
      color: '#2ECC71',
    },
    {
      id: 'products',
      title: 'Mes Produits',
      icon: <ShoppingBag size={24} color="#2ECC71" />,
      route: '/pro/products',
      color: '#2ECC71',
    },
  ] : [];

  const catSitterMenuItems: MenuItem[] = isCatSitter ? [
    {
      id: 'cat-sitter-dashboard',
      title: 'Gestion Cat-Sitter',
      icon: <Cat size={24} color="#FF6B9D" />,
      route: '/(pro)/cat-sitter-dashboard',
      color: '#FF6B9D',
    },
  ] : [];

  const settingsMenuItems: MenuItem[] = [
    {
      id: 'settings',
      title: 'Paramètres',
      icon: <Settings size={24} color={COLORS.darkGray} />,
      route: '/settings',
    },
    {
      id: 'terms',
      title: 'Conditions d\'utilisation',
      icon: <FileText size={24} color={COLORS.darkGray} />,
      route: '/legal/terms',
    },
    {
      id: 'privacy',
      title: 'Politique de confidentialité',
      icon: <Shield size={24} color={COLORS.darkGray} />,
      route: '/legal/privacy',
    },
    {
      id: 'support',
      title: 'Support & Aide',
      icon: <HelpCircle size={24} color={COLORS.darkGray} />,
      route: '/settings/support',
    },
    {
      id: 'logout',
      title: 'Se déconnecter',
      icon: <LogOut size={24} color={COLORS.error} />,
      route: '',
      action: handleSignOut,
      color: COLORS.error,
    }
  ];

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.action) {
      item.action();
      return;
    }
    console.log('Navigating to:', item.route);
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem,
        index === 0 && { borderTopWidth: 0 }
      ]}
      onPress={() => handleMenuItemPress(item)}
      activeOpacity={0.7}
      testID={`menu-item-${item.id}`}
    >
      <View style={[styles.menuIconContainer, item.color ? { backgroundColor: `${item.color}15` } : {}]}>
        {item.icon}
      </View>
      <Text style={[styles.menuItemText, item.id === 'logout' && { color: '#FF6B6B' }]}>{item.title}</Text>
      {item.badge && item.badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
        </View>
      ) : null}
      <ChevronRight size={20} color="#111" />
    </TouchableOpacity>
  );



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.userInfo}>
          <Image source={{ uri: userAvatar }} style={styles.userPhoto} />
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>Bienvenue,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.pseudo || user?.firstName || 'Utilisateur'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Navigation */}
        <Text style={styles.sectionTitle}>Navigation principale</Text>
        <View style={styles.menuSection}>
          {mainMenuItems.map((item, index) => renderMenuItem(item, index))}
        </View>

        {/* Pro Section */}
        {proMenuItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Espace Pro</Text>
            <View style={styles.menuSection}>
              {proMenuItems.map((item, index) => renderMenuItem(item, index))}
            </View>
          </>
        )}

        {/* Cat-Sitter Section */}
        {catSitterMenuItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Espace Cat-Sitter</Text>
            <View style={styles.menuSection}>
              {catSitterMenuItems.map((item, index) => renderMenuItem(item, index))}
            </View>
          </>
        )}

        {/* Profile & Account */}
        <Text style={styles.sectionTitle}>Profil & Compte</Text>
        <View style={styles.menuSection}>
          {profileMenuItems.map((item, index) => renderMenuItem(item, index))}
        </View>

        {/* Settings & Info */}
        <Text style={styles.sectionTitle}>Paramètres & Informations</Text>
        <View style={styles.menuSection}>
          {settingsMenuItems.map((item, index) => renderMenuItem(item, index))}
        </View>

        {/* Version Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: '#E2E8F0',
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    ...TYPOGRAPHY.caption,
    color: '#666',
    marginBottom: 2,
  },
  userName: {
    ...TYPOGRAPHY.h5,
    color: '#111',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    ...TYPOGRAPHY.overline,
    color: '#111',
    marginBottom: 12,
    marginTop: 16,
    letterSpacing: 1.2,
  },

  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    ...TYPOGRAPHY.body2,
    color: '#111',
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: '#666',
  },
});