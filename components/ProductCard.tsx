import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ViewStyle 
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Product } from '@/types';
import { Star, ShoppingCart } from 'lucide-react-native';
import { useShop } from '@/hooks/shop-store';

interface ProductCardProps {
  product: Product;
  style?: ViewStyle;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  style,
}) => {
  const router = useRouter();
  const { addToCart } = useShop();
  
  const handlePress = () => {
    router.push(`/shop/product/${product.id}`);
  };
  
  const handleAddToCart = () => {
    addToCart(product, 1);
  };
  
  return (
    <TouchableOpacity
      style={[styles.container, SHADOWS.medium, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        
        <View style={styles.ratingContainer}>
          <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
          <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          
          {product.inStock ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToCart}
            >
              <ShoppingCart size={16} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.outOfStockContainer}>
              <Text style={styles.outOfStockText}>Out of stock</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    width: 160,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 120,
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    color: COLORS.black,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  addButton: {
    backgroundColor: COLORS.maleAccent,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockContainer: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outOfStockText: {
    fontSize: 10,
    color: COLORS.darkGray,
  },
});

export default ProductCard;