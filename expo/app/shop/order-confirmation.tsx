import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import { CheckCircle, Package, CreditCard, Truck } from 'lucide-react-native';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { orderId, paymentMethod, total } = useLocalSearchParams<{
    orderId: string;
    paymentMethod: string;
    total: string;
  }>();

  const handleContinueShopping = () => {
    router.replace('/(tabs)/shop');
  };

  const handleViewOrders = () => {
    // Navigate to orders screen (would need to be implemented)
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Stack.Screen 
        options={{ 
          title: 'Order Confirmation',
          headerBackVisible: false,
        }} 
      />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successContainer}>
          <CheckCircle size={80} color={COLORS.success} />
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for your purchase. Your order has been confirmed.
          </Text>
        </View>

        <View style={[styles.orderCard, SHADOWS.medium]}>
          <Text style={styles.cardTitle}>Order Details</Text>
          
          <View style={styles.orderRow}>
            <Package size={20} color={COLORS.darkGray} />
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>Order ID</Text>
              <Text style={styles.orderValue}>#{orderId || 'ORD-12345'}</Text>
            </View>
          </View>

          <View style={styles.orderRow}>
            <CreditCard size={20} color={COLORS.darkGray} />
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>Payment Method</Text>
              <Text style={styles.orderValue}>{paymentMethod || 'Credit Card'}</Text>
            </View>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>${total || '0.00'}</Text>
          </View>
        </View>

        <View style={[styles.shippingCard, SHADOWS.medium]}>
          <View style={styles.shippingHeader}>
            <Truck size={24} color={COLORS.maleAccent} />
            <Text style={styles.cardTitle}>Shipping Information</Text>
          </View>
          
          <Text style={styles.shippingText}>
            Your order will be processed within 1-2 business days and shipped to your default address.
          </Text>
          
          <Text style={styles.trackingText}>
            You will receive a tracking number via email once your order ships.
          </Text>
        </View>

        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>{"What's Next?"}</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              {"You'll receive an order confirmation email shortly"}
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Your order will be prepared and packaged
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              {"You'll get a tracking number when it ships"}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Continue Shopping"
            onPress={handleContinueShopping}
            style={styles.continueButton}
          />
          
          <Button
            title="View Orders"
            onPress={handleViewOrders}
            variant="outline"
            style={styles.ordersButton}
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  orderLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  orderValue: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.maleAccent,
  },
  shippingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  shippingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shippingText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 8,
  },
  trackingText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  nextStepsCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.maleAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  stepText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  continueButton: {
    marginBottom: 8,
  },
  ordersButton: {
    marginBottom: 8,
  },
});