import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Product } from '@/types';
import { products } from '@/mocks/products';
import { databaseService } from '@/services/database';
import { useUser } from './user-store';

export const [ShopContext, useShop] = createContextHook(() => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  
  // Load products
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        // Try to get products from Firebase first
        const categories = ['food', 'toys', 'accessories', 'health', 'grooming'];
        const allProducts: Product[] = [];
        
        for (const category of categories) {
          try {
            const categoryProducts = await databaseService.product.getProductsByCategory(category, 50);
            allProducts.push(...categoryProducts);
          } catch (error) {
            console.log(`No products found for category ${category}:`, error);
          }
        }
        
        // If no products from Firebase, use mock data
        if (allProducts.length === 0) {
          console.log('Using mock products data');
          return products;
        }
        
        return allProducts;
      } catch (error) {
        console.error('Error fetching products from Firebase:', error);
        // Fallback to mock data
        return products;
      }
    },
  });
  
  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(currentCart => {
      // Check if product is already in cart
      const existingItem = currentCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Update quantity if product exists
        return currentCart.map(item => 
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item if product doesn't exist
        return [...currentCart, { product, quantity }];
      }
    });
  };
  
  // Remove product from cart
  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.product.id !== productId));
  };
  
  // Update product quantity in cart
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(currentCart => 
      currentCart.map(item => 
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };
  
  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };
  
  // Get product by ID
  const getProduct = (productId: string): Product | undefined => {
    return productsQuery.data?.find(p => p.id === productId);
  };
  
  // Filter products by category
  const getProductsByCategory = (category: string): Product[] => {
    return productsQuery.data?.filter(p => p.category === category) || [];
  };
  
  // Get all categories
  const getCategories = (): string[] => {
    const categories = productsQuery.data?.map(p => p.category) || [];
    return [...new Set(categories)];
  };
  
  // Clear cart
  const clearCart = () => {
    setCart([]);
  };
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: {
      items: { product: Product; quantity: number }[];
      shippingAddress: any;
      totalAmount: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const firstProduct = orderData.items[0]?.product;
      const sellerId = firstProduct?.sellerId || '';
      const sellerName = firstProduct?.sellerName || 'Vendeur';
      
      const order = {
        customerId: user.id,
        customerName: user.name || `${user.firstName} ${user.lastName}`.trim(),
        customerEmail: user.email || '',
        customerPhone: user.phoneNumber || '',
        sellerId,
        sellerName,
        shippingAddress: orderData.shippingAddress,
        items: orderData.items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          totalPrice: item.product.price * item.quantity,
          sellerId: item.product.sellerId || ''
        })),
        totalAmount: orderData.totalAmount,
        status: 'pending' as const,
        paymentStatus: 'pending' as const
      };
      
      const orderId = await databaseService.order.createOrder(order);
      
      if (sellerId && sellerId !== user.id) {
        try {
          const existingConversations = await databaseService.messaging.getConversations(user.id);
          const existingConv = existingConversations.find(conv => 
            conv.participants.includes(sellerId) && conv.participants.includes(user.id)
          );
          
          if (!existingConv) {
            const conversationId = await databaseService.messaging.createConversation([user.id, sellerId]);
            await databaseService.messaging.sendMessage({
              senderId: user.id,
              receiverId: sellerId,
              content: `Bonjour, je viens de passer une commande (#${orderId.slice(-6)}). Merci!`,
              conversationId
            });
          }
        } catch (error) {
          console.error('Error creating conversation:', error);
        }
      }
      
      return { orderId, ...order };
    },
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
  });
  
  // Get user orders
  const ordersQuery = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await databaseService.order.getOrdersByCustomer(user.id);
      } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });
  
  // Create order function
  const createOrder = (shippingAddress: any) => {
    const totalAmount = getTotalPrice();
    return createOrderMutation.mutateAsync({
      items: cart,
      shippingAddress,
      totalAmount
    });
  };
  
  return {
    products: productsQuery.data || [],
    cart,
    orders: ordersQuery.data || [],
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getProduct,
    getProductsByCategory,
    getCategories,
    clearCart,
    createOrder,
    isLoading: productsQuery.isLoading,
    isLoadingOrders: ordersQuery.isLoading,
    isCreatingOrder: createOrderMutation.isPending,
  };
});