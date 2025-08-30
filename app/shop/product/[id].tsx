import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import { useShop } from '@/hooks/shop-store';
import { Product } from '@/types';
import { Minus, Plus, ShoppingBag, Star } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getProduct, addToCart } = useShop();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Load product data
  useEffect(() => {
    if (id) {
      const productData = getProduct(id as string);
      if (productData) {
        setProduct(productData);
      } else {
        Alert.alert('Error', 'Product not found');
        router.back();
      }
    }
  }, [id]);
  
  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      Alert.alert(
        'Added to Cart',
        `${quantity} ${quantity === 1 ? 'item' : 'items'} added to your cart`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { 
            text: 'View Cart', 
            onPress: () => router.push('/shop/cart'),
          },
        ]
      );
    }
  };
  
  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading product...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Stack.Screen options={{ title: product.name }} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.productImage}
          contentFit="cover"
        />
        
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.productName}>{product.name}</Text>
            
            <View style={styles.ratingContainer}>
              <Star size={16} color={COLORS.warning} fill={COLORS.warning} />
              <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
            </View>
          </View>
          
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          
          <Text style={styles.description}>{product.description}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.stockContainer}>
            <Text style={styles.stockLabel}>Availability:</Text>
            <Text
              style={[
                styles.stockValue,
                { color: product.inStock ? COLORS.success : COLORS.error },
              ]}
            >
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          {product.inStock && (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, SHADOWS.small]}
                  onPress={handleDecreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus size={16} color={quantity <= 1 ? COLORS.darkGray : COLORS.black} />
                </TouchableOpacity>
                
                <Text style={styles.quantityValue}>{quantity}</Text>
                
                <TouchableOpacity
                  style={[styles.quantityButton, SHADOWS.small]}
                  onPress={handleIncreaseQuantity}
                >
                  <Plus size={16} color={COLORS.black} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <Button
            title="Add to Cart"
            onPress={handleAddToCart}
            disabled={!product.inStock}
            icon={<ShoppingBag size={20} color={COLORS.white} />}
            style={styles.addButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.black,
    marginLeft: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.maleAccent,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.black,
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.mediumGray,
    marginVertical: 16,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
    marginRight: 8,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 8,
  },
});