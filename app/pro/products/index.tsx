import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useUser } from '@/hooks/user-store';
import { useI18n } from '@/hooks/i18n-store';
import {
  Plus,
  MoreVertical,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react-native';

export default function ProProductsScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');

  // Redirect if not professional
  if (!user?.isProfessional || !user.professionalData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Accès non autorisé</Text>
      </View>
    );
  }

  const products = user.professionalData.products;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    router.push('/pro/products/add');
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/pro/products/edit/${productId}`);
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/pro/products/${productId}`);
  };

  const filteredProducts = products.filter(product => {
    switch (filter) {
      case 'active':
        return product.isActive && product.status === 'approved';
      case 'pending':
        return product.status === 'pending';
      case 'rejected':
        return product.status === 'rejected';
      default:
        return true;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color={COLORS.success} />;
      case 'pending':
        return <Clock size={16} color={COLORS.warning} />;
      case 'rejected':
        return <X size={16} color={COLORS.error} />;
      default:
        return <AlertCircle size={16} color={COLORS.darkGray} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approuvé';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  };

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.productCard, SHADOWS.small]}
      onPress={() => handleViewProduct(item.id)}
    >
      <Image
        source={{ uri: item.photos[0] || 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?q=80&w=500' }}
        style={styles.productImage}
        contentFit="cover"
      />
      
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                'Actions',
                'Que souhaitez-vous faire ?',
                [
                  { text: 'Voir', onPress: () => handleViewProduct(item.id) },
                  { text: 'Modifier', onPress: () => handleEditProduct(item.id) },
                  { text: 'Annuler', style: 'cancel' },
                ]
              );
            }}
          >
            <MoreVertical size={16} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.productMeta}>
          <Text style={styles.productPrice}>{item.price.toFixed(2)}€</Text>
          <Text style={styles.productStock}>Stock: {item.stock}</Text>
        </View>
        
        <View style={styles.productFooter}>
          <View style={styles.statusContainer}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
          
          <View style={[styles.activeIndicator, { backgroundColor: item.isActive ? COLORS.success : COLORS.darkGray }]} />
        </View>
        
        {item.status === 'rejected' && item.rejectionReason && (
          <View style={styles.rejectionReason}>
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const filters = [
    { key: 'all', label: 'Tous', count: products.length },
    { key: 'active', label: 'Actifs', count: products.filter(p => p.isActive && p.status === 'approved').length },
    { key: 'pending', label: 'En attente', count: products.filter(p => p.status === 'pending').length },
    { key: 'rejected', label: 'Rejetés', count: products.filter(p => p.status === 'rejected').length },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Stack.Screen
        options={{
          title: 'Mes produits',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleAddProduct} style={styles.addButton}>
              <Plus size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === item.key && styles.activeFilterButton,
              ]}
              onPress={() => setFilter(item.key as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item.key && styles.activeFilterText,
                ]}
              >
                {item.label} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Package size={64} color={COLORS.darkGray} />
          <Text style={styles.emptyTitle}>
            {filter === 'all' ? 'Aucun produit' : `Aucun produit ${getFilterLabel(filter)}`}
          </Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? 'Commencez par ajouter votre premier produit à vendre.'
              : `Vous n'avez aucun produit ${getFilterLabel(filter)} pour le moment.`
            }
          </Text>
          {filter === 'all' && (
            <TouchableOpacity
              style={[styles.addProductButton, SHADOWS.small]}
              onPress={handleAddProduct}
            >
              <Plus size={20} color={COLORS.white} />
              <Text style={styles.addProductText}>Ajouter un produit</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'approved':
      return COLORS.success;
    case 'pending':
      return COLORS.warning;
    case 'rejected':
      return COLORS.error;
    default:
      return COLORS.darkGray;
  }
}

function getFilterLabel(filter: string) {
  switch (filter) {
    case 'active':
      return 'actif';
    case 'pending':
      return 'en attente';
    case 'rejected':
      return 'rejeté';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  addButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    flex: 1,
  },
  moreButton: {
    padding: 4,
  },
  productDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 12,
    lineHeight: 20,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  productStock: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginLeft: 6,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rejectionReason: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  rejectionText: {
    fontSize: 12,
    color: COLORS.error,
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addProductText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.white,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
  },
});