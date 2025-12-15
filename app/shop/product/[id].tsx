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
import GlassCard from '@/components/GlassCard';
import AppBackground from '@/components/AppBackground';
import { useShop } from '@/hooks/shop-store';
import { useAuth } from '@/hooks/auth-store';
import { useI18n } from '@/hooks/i18n-store';
import { databaseService } from '@/services/database';
import { Product } from '@/types';
import { Minus, Plus, ShoppingBag, Star, MessageCircle } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getProduct, addToCart } = useShop();
  const { user } = useAuth();
  const { t } = useI18n();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Load product data
  useEffect(() => {
    if (id) {
      const productData = getProduct(id as string);
      if (productData) {
        setProduct(productData);
      } else {
        Alert.alert(t('common.error'), t('shop.product_not_found'));
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
        t('shop.added_to_cart'),
        `${quantity} ${quantity === 1 ? t('shop.item') : t('shop.items')} ${t('shop.added_to_your_cart')}`,
        [
          { text: t('shop.continue_shopping'), style: 'cancel' },
          { 
            text: t('shop.view_cart'), 
            onPress: () => router.push('/shop/cart'),
          },
        ]
      );
    }
  };
  
  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }
  
  return (
    <AppBackground>
      <StatusBar style="dark" />
      
      <Stack.Screen options={{ title: product.name }} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard tint="neutral" style={styles.imageContainer} noPadding>
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            contentFit="cover"
          />
        </GlassCard>
        
        <GlassCard tint="neutral" style={styles.contentContainer}>
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
            <Text style={styles.stockLabel}>{t('shop.availability')}:</Text>
            <Text
              style={[
                styles.stockValue,
                { color: product.inStock ? COLORS.success : COLORS.error },
              ]}
            >
              {product.inStock ? t('shop.in_stock') : t('shop.out_of_stock')}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          {product.inStock && (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>{t('shop.quantity')}:</Text>
              
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
            title={t('shop.add_to_cart')}
            onPress={handleAddToCart}
            disabled={!product.inStock}
            icon={<ShoppingBag size={20} color={COLORS.white} />}
            style={styles.addButton}
          />
          
          {product.sellerId && product.sellerId !== user?.id && (
            <GlassCard
              tint="male"
              style={styles.contactButton}
              onPress={async () => {
                try {
                  if (!user) {
                    Alert.alert(t('auth.sign_in'), t('shop.login_to_contact_seller'));
                    return;
                  }
                  
                  const existingConversations = await databaseService.messaging.getConversations(user.id);
                  let conversationId = existingConversations.find(conv => 
                    conv.participants.includes(product.sellerId!) && conv.participants.includes(user.id)
                  )?.id;
                  
                  if (!conversationId) {
                    conversationId = await databaseService.messaging.createConversation([user.id, product.sellerId!]);
                  }
                  
                  router.push(`/messages/${conversationId}`);
                } catch (error) {
                  console.error('Error creating conversation:', error);
                  Alert.alert(t('common.error'), t('shop.unable_to_contact_seller'));
                }
              }}
              noPadding
            >
              <View style={styles.contactButtonInner}>
                <MessageCircle size={20} color={COLORS.black} />
                <Text style={styles.contactButtonText}>{t('shop.contact_seller')}</Text>
              </View>
            </GlassCard>
          )}
        </GlassCard>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageContainer: {
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  contentContainer: {
    marginBottom: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
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
  contactButton: {
    marginTop: 12,
  },
  contactButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginLeft: 8,
  },
});