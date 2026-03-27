import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useShop } from '@/hooks/shop-store';
import { useAuth } from '@/hooks/user-store';
import { useI18n } from '@/hooks/i18n-store';
import ProductCard from '@/components/ProductCard';
import GlassCard from '@/components/GlassCard';
import AppBackground from '@/components/AppBackground';
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  MapPin,
} from 'lucide-react-native';

export default function ProShopScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const { products, isLoading: loading } = useShop();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Filter products to show only professional products
  const professionalProducts = products.filter(product => product.sellerId);

  // Filter products based on search and category
  const filteredProducts = professionalProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(professionalProducts.map(p => p.category)))];

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleProductPress = (productId: string) => {
    router.push(`/shop/product/${productId}` as any);
  };

  const handleVendorPress = (sellerId: string) => {
    router.push(`/profile/${sellerId}` as any);
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      
      <Stack.Screen
        options={{
          title: 'Boutique Pro',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/shop/cart' as any)} style={styles.cartButton}>
              <ShoppingCart size={24} color={COLORS.primary} />
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
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <GlassCard tint="neutral" style={styles.searchBar} noPadding>
            <View style={styles.searchBarInner}>
              <Search size={20} color={COLORS.darkGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher des produits"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.darkGray}
              />
            </View>
          </GlassCard>
          <GlassCard tint="male" style={styles.filterButton} onPress={() => {}} noPadding>
            <View style={styles.filterButtonInner}>
              <Filter size={20} color={COLORS.black} />
            </View>
          </GlassCard>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <GlassCard
              key={category}
              tint={selectedCategory === category ? 'male' : 'neutral'}
              style={styles.categoryButton}
              onPress={() => setSelectedCategory(category)}
              noPadding
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category === 'all' ? 'Tout' : category}
              </Text>
            </GlassCard>
          ))}
        </ScrollView>

        {/* Professional Vendors Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendeurs professionnels</Text>
          <Text style={styles.sectionSubtitle}>
            Découvrez nos partenaires vérifiés
          </Text>
        </View>

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <GlassCard key={product.id} tint="neutral" style={styles.productContainer} noPadding>
              <ProductCard
                product={product}
              />
              
              {/* Vendor Info */}
              {product.sellerId && (
                <TouchableOpacity
                  style={styles.vendorInfo}
                  onPress={() => handleVendorPress(product.sellerId!)}
                >
                  <View style={styles.vendorDetails}>
                    {product.sellerLogo && (
                      <View style={styles.vendorLogo}>
                        <Text style={styles.vendorLogoText}>
                          {product.sellerName?.charAt(0) || 'P'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.vendorTextContainer}>
                      <View style={styles.vendorNameContainer}>
                        <Text style={styles.vendorName}>
                          {product.sellerName || 'Vendeur Pro'}
                        </Text>
                        {product.isVerified && (
                          <Star size={14} color={COLORS.accent} fill={COLORS.accent} />
                        )}
                      </View>
                      <Text style={styles.vendorLocation}>
                        <MapPin size={12} color={COLORS.darkGray} /> France
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </GlassCard>
          ))}
        </View>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <GlassCard tint="neutral" style={styles.emptyState}>
            <ShoppingCart size={48} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Aucun produit professionnel disponible pour le moment'}
            </Text>
          </GlassCard>
        )}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cartButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  filterButton: {
    width: 48,
    height: 48,
  },
  filterButtonInner: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    paddingVertical: 8,
    gap: 12,
    marginBottom: 24,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
    textTransform: 'capitalize',
  },
  categoryTextActive: {
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  productsGrid: {
    gap: 16,
  },
  productContainer: {
    marginBottom: 16,
  },
  vendorInfo: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  vendorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vendorLogoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  vendorTextContainer: {
    flex: 1,
  },
  vendorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  vendorLocation: {
    fontSize: 12,
    color: COLORS.darkGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
    marginHorizontal: 16,
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
});