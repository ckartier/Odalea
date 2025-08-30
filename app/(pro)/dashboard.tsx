import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,

} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useUser } from '@/hooks/user-store';
import { useI18n } from '@/hooks/i18n-store';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  BarChart3,
  Star,
  Euro,
  Settings,
} from 'lucide-react-native';

export default function ProDashboardScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [refreshing, setRefreshing] = useState(false);

  // Redirect if not professional
  if (!user?.isProfessional || !user.professionalData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Accès non autorisé</Text>
      </View>
    );
  }

  const professionalData = user.professionalData;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    router.push('/pro/products/add');
  };

  const handleViewProducts = () => {
    router.push('/pro/products');
  };

  const handleViewOrders = () => {
    // TODO: Create /pro/orders route
    console.log('Orders view not implemented yet');
  };

  const handleViewAnalytics = () => {
    // TODO: Create /pro/analytics route
    console.log('Analytics view not implemented yet');
  };

  const handleSettings = () => {
    // TODO: Create /pro/settings route
    console.log('Pro settings not implemented yet');
  };

  const stats = [
    {
      title: 'Produits actifs',
      value: professionalData.products.filter(p => p.isActive).length.toString(),
      icon: Package,
      color: COLORS.primary,
    },
    {
      title: 'Commandes en cours',
      value: professionalData.orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length.toString(),
      icon: ShoppingCart,
      color: COLORS.accent,
    },
    {
      title: 'Chiffre d\'affaires',
      value: `${professionalData.analytics.totalSales.toFixed(0)}€`,
      icon: Euro,
      color: COLORS.success,
    },
    {
      title: 'Commandes totales',
      value: professionalData.analytics.totalOrders.toString(),
      icon: BarChart3,
      color: COLORS.warning,
    },
  ];

  const quickActions = [
    {
      title: 'Ajouter un produit',
      subtitle: 'Créer un nouveau produit',
      icon: Plus,
      onPress: handleAddProduct,
      color: COLORS.primary,
    },
    {
      title: 'Mes produits',
      subtitle: 'Gérer mes produits',
      icon: Package,
      onPress: handleViewProducts,
      color: COLORS.accent,
    },
    {
      title: 'Commandes',
      subtitle: 'Voir les commandes',
      icon: ShoppingCart,
      onPress: handleViewOrders,
      color: COLORS.success,
    },
    {
      title: 'Statistiques',
      subtitle: 'Analyser les ventes',
      icon: TrendingUp,
      onPress: handleViewAnalytics,
      color: COLORS.warning,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Stack.Screen
        options={{
          title: 'Tableau de bord Pro',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
              <Settings size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Bonjour, {user.firstName}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {professionalData.companyName}
          </Text>
          {professionalData.isVerified && (
            <View style={styles.verifiedBadge}>
              <Star size={16} color={COLORS.accent} />
              <Text style={styles.verifiedText}>Compte vérifié</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, SHADOWS.small]}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <stat.icon size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, SHADOWS.small]}
                onPress={action.onPress}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commandes récentes</Text>
            <TouchableOpacity onPress={handleViewOrders}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {professionalData.orders.slice(0, 3).map((order) => (
            <View key={order.id} style={[styles.orderCard, SHADOWS.small]}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>#{order.id.slice(-6)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
              </View>
              <Text style={styles.orderCustomer}>{order.customerName}</Text>
              <Text style={styles.orderAmount}>{order.totalAmount.toFixed(2)}€</Text>
            </View>
          ))}
          
          {professionalData.orders.length === 0 && (
            <View style={styles.emptyState}>
              <ShoppingCart size={48} color={COLORS.darkGray} />
              <Text style={styles.emptyTitle}>Aucune commande</Text>
              <Text style={styles.emptyText}>
                Vos commandes apparaîtront ici une fois que les clients commenceront à acheter vos produits.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return COLORS.warning;
    case 'confirmed':
      return COLORS.primary;
    case 'shipped':
      return COLORS.accent;
    case 'delivered':
      return COLORS.success;
    case 'cancelled':
      return COLORS.error;
    default:
      return COLORS.darkGray;
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'confirmed':
      return 'Confirmée';
    case 'shipped':
      return 'Expédiée';
    case 'delivered':
      return 'Livrée';
    case 'cancelled':
      return 'Annulée';
    default:
      return status;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  settingsButton: {
    padding: 8,
  },
  welcomeSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.accent,
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.white,
  },
  orderCustomer: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
  },
});