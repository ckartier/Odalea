import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import PaymentModal from '@/components/PaymentModal';
import { useShop } from '@/hooks/shop-store';
import { useI18n } from '@/hooks/i18n-store';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';

export default function CartScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { cart, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useShop();
  
  const [loading, setLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  
  const handleIncreaseQuantity = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    if (item) {
      updateQuantity(productId, item.quantity + 1);
    }
  };
  
  const handleDecreaseQuantity = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    if (item && item.quantity > 1) {
      updateQuantity(productId, item.quantity - 1);
    }
  };
  
  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      t('shop.remove_item'),
      t('shop.remove_item_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: () => removeFromCart(productId),
        },
      ]
    );
  };
  
  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert(t('shop.empty_cart'), t('shop.empty_cart_message'));
      return;
    }
    setPaymentModalVisible(true);
  };

  const handlePaymentSuccess = (paymentMethod: string) => {
    setPaymentModalVisible(false);
    
    // Generate order ID
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const total = (getTotalPrice() + 5.99).toFixed(2);
    
    // Clear cart
    clearCart();
    
    // Navigate to order confirmation
    router.push({
      pathname: '/shop/order-confirmation',
      params: {
        orderId,
        paymentMethod,
        total,
      },
    });
  };

  const handlePaymentClose = () => {
    setPaymentModalVisible(false);
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Stack.Screen options={{ title: t('shop.shopping_cart') }} />
      
      {cart.length > 0 ? (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {cart.map(item => (
              <View 
                key={item.product.id} 
                style={[styles.cartItem, SHADOWS.small]}
              >
                <Image
                  source={{ uri: item.product.imageUrl }}
                  style={styles.productImage}
                  contentFit="cover"
                />
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.product.name}</Text>
                  <Text style={styles.productPrice}>
                    ${item.product.price.toFixed(2)}
                  </Text>
                  
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleDecreaseQuantity(item.product.id)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus 
                        size={16} 
                        color={item.quantity <= 1 ? COLORS.darkGray : COLORS.black} 
                      />
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityValue}>{item.quantity}</Text>
                    
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleIncreaseQuantity(item.product.id)}
                    >
                      <Plus size={16} color={COLORS.black} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(item.product.id)}
                    >
                      <Trash2 size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.footer}>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('shop.subtotal')}</Text>
                <Text style={styles.summaryValue}>
                  ${getTotalPrice().toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('shop.shipping')}</Text>
                <Text style={styles.summaryValue}>$5.99</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>{t('shop.total')}</Text>
                <Text style={styles.totalValue}>
                  ${(getTotalPrice() + 5.99).toFixed(2)}
                </Text>
              </View>
            </View>
            
            <Button
              title={t('shop.proceed_to_payment')}
              onPress={handleCheckout}
              loading={loading}
              style={styles.checkoutButton}
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={64} color={COLORS.darkGray} />
          <Text style={styles.emptyTitle}>{t('shop.your_cart_is_empty')}</Text>
          <Text style={styles.emptyText}>
            {t('shop.add_products_to_cart')}
          </Text>
          <Button
            title={t('shop.continue_shopping')}
            onPress={() => router.replace('/(tabs)/shop')}
            style={styles.continueButton}
          />
        </View>
      )}
      
      <PaymentModal
        visible={paymentModalVisible}
        onClose={handlePaymentClose}
        onPaymentSuccess={handlePaymentSuccess}
        total={getTotalPrice() + 5.99}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 200,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.maleAccent,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.mediumGray,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    ...SHADOWS.large,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.black,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.mediumGray,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.maleAccent,
  },
  checkoutButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    marginBottom: 24,
  },
  continueButton: {
    width: '80%',
  },
});