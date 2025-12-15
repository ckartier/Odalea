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
import { COLORS, SHADOWS, moderateScale, DIMENSIONS } from '@/constants/colors';
import { Product } from '@/types';
import { Star, ShoppingCart } from 'lucide-react-native';
import { useShop } from '@/hooks/shop-store';
import GlassView from './GlassView';

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
  
  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    addToCart(product, 1);
  };
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={style}
    >
      <GlassView
        tint="neutral"
        liquidGlass={true}
        style={[styles.container, SHADOWS.liquidGlassNeutral]}
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
      </GlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    width: moderateScale(170),
    marginBottom: moderateScale(16),
  },
  image: {
    width: '100%',
    height: moderateScale(130),
  },
  infoContainer: {
    padding: moderateScale(12),
  },
  name: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: moderateScale(4),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  rating: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.black,
    marginLeft: moderateScale(4),
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  addButton: {
    backgroundColor: COLORS.maleAccent,
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockContainer: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  outOfStockText: {
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
});

export default ProductCard;
