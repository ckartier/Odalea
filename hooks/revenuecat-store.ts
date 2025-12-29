import { useEffect, useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { 
  PurchasesOfferings, 
  PurchasesPackage,
  CustomerInfo,
  PurchasesEntitlementInfo
} from 'react-native-purchases';
import { revenueCatService, ENTITLEMENT_ID, PRODUCT_IDS } from '@/services/revenuecat';
import { useFirebaseUser } from './firebase-user-store';

export interface RevenueCatState {
  isReady: boolean;
  isLoading: boolean;
  offerings: PurchasesOfferings | null;
  currentOffering: PurchasesOfferings['current'] | null;
  customerInfo: CustomerInfo | null;
  isPro: boolean;
  entitlement: PurchasesEntitlementInfo | null;
  packages: {
    monthly: PurchasesPackage | null;
    yearly: PurchasesPackage | null;
    lifetime: PurchasesPackage | null;
  };
  error: string | null;
}

export const [RevenueCatContext, useRevenueCat] = createContextHook(() => {
  const { user } = useFirebaseUser();
  
  const [state, setState] = useState<RevenueCatState>({
    isReady: false,
    isLoading: true,
    offerings: null,
    currentOffering: null,
    customerInfo: null,
    isPro: false,
    entitlement: null,
    packages: {
      monthly: null,
      yearly: null,
      lifetime: null,
    },
    error: null,
  });

  const loadOfferings = useCallback(async () => {
    try {
      console.log('📦 Loading RevenueCat offerings...');
      const offerings = await revenueCatService.getOfferings();
      
      if (!offerings?.current) {
        console.warn('⚠️ No current offering found');
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'No offerings available',
        }));
        return;
      }

      const packages = {
        monthly: offerings.current.availablePackages.find(p => 
          p.identifier === PRODUCT_IDS.monthly || p.packageType === 'MONTHLY'
        ) || null,
        yearly: offerings.current.availablePackages.find(p => 
          p.identifier === PRODUCT_IDS.yearly || p.packageType === 'ANNUAL'
        ) || null,
        lifetime: offerings.current.availablePackages.find(p => 
          p.identifier === PRODUCT_IDS.lifetime || p.packageType === 'LIFETIME'
        ) || null,
      };

      console.log('✅ Offerings loaded:', {
        monthly: !!packages.monthly,
        yearly: !!packages.yearly,
        lifetime: !!packages.lifetime,
      });

      setState(prev => ({
        ...prev,
        offerings,
        currentOffering: offerings.current,
        packages,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      console.error('❌ Error loading offerings:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load offerings',
      }));
    }
  }, []);

  const loadCustomerInfo = useCallback(async () => {
    try {
      console.log('👤 Loading customer info...');
      const customerInfo = await revenueCatService.getCustomerInfo();
      
      if (!customerInfo) {
        console.warn('⚠️ No customer info found');
        return;
      }

      const isPro = revenueCatService.checkEntitlement(customerInfo);
      const entitlement = revenueCatService.getEntitlementInfo(customerInfo);

      console.log('✅ Customer info loaded:', {
        isPro,
        hasEntitlement: !!entitlement,
      });

      setState(prev => ({
        ...prev,
        customerInfo,
        isPro,
        entitlement,
      }));
    } catch (error: any) {
      console.error('❌ Error loading customer info:', error);
    }
  }, []);

  const initialize = useCallback(async () => {
    try {
      console.log('🚀 Initializing RevenueCat...');
      
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
      if (!apiKey) {
        console.error('❌ RevenueCat API key not found in environment variables');
        setState(prev => ({
          ...prev,
          isReady: false,
          isLoading: false,
          error: 'RevenueCat API key not configured',
        }));
        return;
      }

      await revenueCatService.configure(apiKey, user?.id);

      if (user?.email) {
        revenueCatService.setEmail(user.email);
      }

      if (user?.phoneNumber) {
        revenueCatService.setPhoneNumber(user.phoneNumber);
      }

      if (user?.id) {
        revenueCatService.setAttributes({
          userId: user.id,
          displayName: user.name || null,
        });
      }

      await loadOfferings();
      await loadCustomerInfo();

      setState(prev => ({
        ...prev,
        isReady: true,
      }));

      console.log('✅ RevenueCat initialization complete');
    } catch (error: any) {
      console.error('❌ RevenueCat initialization error:', error);
      setState(prev => ({
        ...prev,
        isReady: false,
        isLoading: false,
        error: error.message || 'Failed to initialize RevenueCat',
      }));
    }
  }, [user, loadOfferings, loadCustomerInfo]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      console.log('💳 Starting purchase process...');
      setState(prev => ({ ...prev, isLoading: true }));

      const result = await revenueCatService.purchasePackage(pkg);

      if (result.success && result.customerInfo) {
        const isPro = revenueCatService.checkEntitlement(result.customerInfo);
        const entitlement = revenueCatService.getEntitlementInfo(result.customerInfo);

        setState(prev => ({
          ...prev,
          customerInfo: result.customerInfo || prev.customerInfo,
          isPro,
          entitlement,
          isLoading: false,
        }));

        console.log('✅ Purchase completed successfully');
        return { success: true };
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message || 'Purchase failed' };
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      console.log('🔄 Restoring purchases...');
      setState(prev => ({ ...prev, isLoading: true }));

      const result = await revenueCatService.restorePurchases();

      if (result.success && result.customerInfo) {
        const isPro = revenueCatService.checkEntitlement(result.customerInfo);
        const entitlement = revenueCatService.getEntitlementInfo(result.customerInfo);

        setState(prev => ({
          ...prev,
          customerInfo: result.customerInfo || prev.customerInfo,
          isPro,
          entitlement,
          isLoading: false,
        }));

        console.log('✅ Purchases restored successfully');
        return { success: true };
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Restore error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message || 'Failed to restore purchases' };
    }
  }, []);

  const refresh = useCallback(async () => {
    console.log('🔄 Refreshing RevenueCat data...');
    await loadCustomerInfo();
  }, [loadCustomerInfo]);

  const checkEntitlement = useCallback((entitlementId: string = ENTITLEMENT_ID): boolean => {
    return revenueCatService.checkEntitlement(state.customerInfo, entitlementId);
  }, [state.customerInfo]);

  const syncWithUser = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Syncing purchases with user:', userId);
      await revenueCatService.syncPurchasesWithUserId(userId);
      await loadCustomerInfo();
    } catch (error) {
      console.error('❌ Error syncing with user:', error);
    }
  }, [loadCustomerInfo]);

  const logOut = useCallback(async () => {
    try {
      console.log('👋 Logging out from RevenueCat');
      await revenueCatService.logOut();
      setState({
        isReady: false,
        isLoading: false,
        offerings: null,
        currentOffering: null,
        customerInfo: null,
        isPro: false,
        entitlement: null,
        packages: {
          monthly: null,
          yearly: null,
          lifetime: null,
        },
        error: null,
      });
    } catch (error) {
      console.error('❌ Error logging out:', error);
    }
  }, []);

  return {
    ...state,
    purchasePackage,
    restorePurchases,
    refresh,
    checkEntitlement,
    syncWithUser,
    logOut,
    loadOfferings,
  };
});
