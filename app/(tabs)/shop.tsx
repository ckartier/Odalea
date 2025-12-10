import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import ProductCard from '@/components/ProductCard';
import { useShop } from '@/hooks/shop-store';
import { useI18n } from '@/hooks/i18n-store';
import AdBanner from '@/components/AdBanner';
import { ShoppingBag, ShoppingCart } from 'lucide-react-native';

export default function ShopScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { products, getCategories, getProductsByCategory, cart } = useShop();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const categories = getCategories();
  const filteredProducts = selectedCategory 
    ? getProductsByCategory(selectedCategory) 
    : products;
  
  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };
  
  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };
  
  const handleCartPress = () => {
    router.push('/shop/cart');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>{t('navigation.shop')}</Text>
        
        <TouchableOpacity
          style={styles.cartButton}
          onPress={handleCartPress}
        >
          <ShoppingCart size={24} color={COLORS.black} />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartCount}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category ? styles.selectedCategory : null,
                SHADOWS.small,
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category ? styles.selectedCategoryText : null,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Featured Section */}
        {!selectedCategory && (
          <>
            <Text style={styles.sectionTitle}>{t('shop.featured_products')}</Text>
            
            <View style={styles.featuredContainer}>
              {products.slice(0, 2).map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  style={styles.featuredProduct}
                />
              ))}
            </View>
          </>
        )}
        
        {/* Ad Banner */}
        <AdBanner size="largeBanner" />
        
        {/* Products Grid */}
        <Text style={styles.sectionTitle}>
          {selectedCategory || t('shop.all_products')}
        </Text>
        
        <View style={styles.productsGrid}>
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              style={styles.productCard}
            />
          ))}
        </View>
        
        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={48} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>{t('shop.no_products_found')}</Text>
            <Text style={styles.emptyText}>
              {t('shop.no_products_in_category')}
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
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  cartButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.maleAccent,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCount: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  selectedCategory: {
    backgroundColor: COLORS.maleAccent,
    borderColor: COLORS.maleAccent,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.black,
  },
  selectedCategoryText: {
    color: COLORS.white,
    fontWeight: '500' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  featuredContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featuredProduct: {
    width: '48%',
  },
  productsGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 40,
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
  },
});