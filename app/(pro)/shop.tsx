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
    router.push(`/shop/product/${productId}`);
  };

  const handleVendorPress = (sellerId: string) => {
    router.push(`/profile/${sellerId}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Stack.Screen
        options={{
          title: 'Boutique Pro',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/shop/cart')} style={styles.cartButton}>
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
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.darkGray} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('shop.search_products')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.darkGray}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category === 'all' ? t('shop.all') : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Professional Vendors Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('shop.professional_vendors')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('shop.discover_verified_partners')}
          </Text>
        </View>

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.productContainer}>
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
            </View>
          ))}
        </View>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <ShoppingCart size={48} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>{t('shop.no_products_found')}</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? t('shop.modify_search')
                : t('shop.no_professional_products')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  filterButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  categoriesContainer: {
    paddingVertical: 8,
    gap: 12,
    marginBottom: 24,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
    textTransform: 'capitalize',
  },
  categoryTextActive: {
    color: COLORS.white,
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.small,
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginTop: 20,
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
});