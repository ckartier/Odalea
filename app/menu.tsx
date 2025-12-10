import React from 'react';
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
  Search,
  BarChart,
  HelpCircle,
  FileText,
  Heart,
  Settings,
  Award,
  ChevronRight,
  Cat,
  AlertTriangle,
  Crown,
  Shield,
  X,
} from 'lucide-react-native';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  route: string;
  badge?: number;
  color?: string;
}

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { userPets } = usePets();

  const isProfessional = Boolean(user?.isProfessional);

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
  ];

  const handleMenuItemPress = (route: string) => {
    console.log('Navigating to:', route);
    router.push(route as any);
  };

  const handleClose = () => {
    router.back();
  };

  const petPhoto = userPets?.[0]?.mainPhoto || user?.photo || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&crop=face';

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleMenuItemPress(item.route)}
      activeOpacity={0.7}
      testID={`menu-item-${item.id}`}
    >
      <View style={[styles.menuIconContainer, item.color && { backgroundColor: `${item.color}15` }]}>
        {item.icon}
      </View>
      <Text style={styles.menuItemText}>{item.title}</Text>
      <ChevronRight size={20} color={COLORS.darkGray} />
    </TouchableOpacity>
  );

  const renderQuickAccessItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.quickAccessItem}
      onPress={() => handleMenuItemPress(item.route)}
      activeOpacity={0.7}
      testID={`quick-${item.id}`}
    >
      <View style={[styles.quickAccessIcon, item.color && { backgroundColor: `${item.color}15` }]}>
        {item.icon}
      </View>
      <Text style={styles.quickAccessText} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: petPhoto }} style={styles.userPhoto} />
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>
              Bienvenue, {user?.firstName || 'Utilisateur'}
            </Text>
            <Text style={styles.appName}>Coppet</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Access Grid */}
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.quickAccessGrid}>
          {mainMenuItems.slice(0, 6).map(renderQuickAccessItem)}
        </View>

        {/* Main Navigation */}
        <Text style={styles.sectionTitle}>Navigation principale</Text>
        <View style={styles.menuSection}>
          {mainMenuItems.map(renderMenuItem)}
        </View>

        {/* Pro Section */}
        {proMenuItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Espace Pro</Text>
            <View style={styles.menuSection}>
              {proMenuItems.map(renderMenuItem)}
            </View>
          </>
        )}

        {/* Profile & Account */}
        <Text style={styles.sectionTitle}>Profil & Compte</Text>
        <View style={styles.menuSection}>
          {profileMenuItems.map(renderMenuItem)}
        </View>

        {/* Settings & Info */}
        <Text style={styles.sectionTitle}>Paramètres & Informations</Text>
        <View style={styles.menuSection}>
          {settingsMenuItems.map(renderMenuItem)}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
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
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.primary,
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
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(125, 212, 238, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: 14,
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(125, 212, 238, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
});
