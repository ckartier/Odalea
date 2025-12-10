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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/hooks/auth-store';
import { usePets } from '@/hooks/pets-store';
import {
  Home,
  Map,
  MessageCircle,
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
  const { userPets } = usePets();

  const isProfessional = Boolean(user?.isProfessional);

  useEffect(() => {
    console.log('MenuScreen mounted');
  }, []);

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
      id: 'home',
      title: 'Accueil',
      icon: <Home size={24} color={COLORS.primary} />,
      route: '/(tabs)/home',
    },
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
      id: 'cat-sitter',
      title: 'Cat Sitters',
      icon: <Cat size={24} color={COLORS.primary} />,
      route: '/cat-sitter',
    },
    {
      id: 'challenges',
      title: 'Défis',
      icon: <Trophy size={24} color={COLORS.primary} />,
      route: '/(tabs)/challenges',
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
    {
      id: 'messages',
      title: 'Messages',
      icon: <MessageCircle size={24} color={COLORS.primary} />,
      route: '/(tabs)/messages',
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

  const petPhoto = userPets?.[0]?.mainPhoto || user?.photo || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&crop=face';

  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem,
        index === 0 && { borderTopWidth: 0 } // Remove border for first item
      ]}
      onPress={() => handleMenuItemPress(item)}
      activeOpacity={0.7}
      testID={`menu-item-${item.id}`}
    >
      <View style={[styles.menuIconContainer, item.color ? { backgroundColor: `${item.color}15` } : {}]}>
        {item.icon}
      </View>
      <Text style={[styles.menuItemText, item.id === 'logout' && { color: '#FF6B6B' }]}>{item.title}</Text>
      <ChevronRight size={20} color="rgba(255, 255, 255, 0.8)" />
    </TouchableOpacity>
  );

  const renderQuickAccessItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.quickAccessItem}
      onPress={() => handleMenuItemPress(item)}
      activeOpacity={0.7}
      testID={`quick-${item.id}`}
    >
      <View style={[styles.quickAccessIcon, item.color ? { backgroundColor: `${item.color}15` } : {}]}>
        {item.icon}
      </View>
      <Text style={styles.quickAccessText} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8B4D4', '#C8A2C8', '#A8B4D8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.userInfo}>
          <Image source={{ uri: petPhoto }} style={styles.userPhoto} />
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>Bienvenue,</Text>
            <Text style={styles.appName} numberOfLines={1}>
              {user?.firstName || 'Utilisateur'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Access Grid - First 6 items */}
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.quickAccessGrid}>
          {mainMenuItems.slice(0, 6).map(renderQuickAccessItem)}
        </View>

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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
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
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
    marginTop: 8,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  quickAccessItem: {
    width: '31%',
    marginHorizontal: '1.16%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 14,
  },
  menuSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.white,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});