import Purchases, { 
  PurchasesOfferings, 
  PurchasesPackage,
  CustomerInfo,
  PurchasesEntitlementInfo,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

export const ENTITLEMENT_ID = 'Odalea Pro';

export const PRODUCT_IDS = {
  monthly: 'monthly',
  yearly: 'yearly',
  lifetime: 'lifetime',
} as const;

export class RevenueCatService {
  private static instance: RevenueCatService;
  private isConfigured = false;
  private attributeQueue: Promise<void> = Promise.resolve();
  private isSettingAttributes = false;

  private constructor() {}

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  async configure(apiKey: string, userId?: string): Promise<void> {
    if (this.isConfigured) {
      console.log('💰 RevenueCat already configured');
      return;
    }

    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      Purchases.configure({
        apiKey,
        appUserID: userId,
      });

      this.isConfigured = true;
      console.log('💰 RevenueCat configured successfully');
      console.log('📱 Platform:', Platform.OS);
      console.log('👤 User ID:', userId || 'anonymous');
    } catch (error) {
      console.error('❌ RevenueCat configuration error:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      const offerings = await Purchases.getOfferings();
      console.log('📦 Fetched offerings:', offerings.current?.identifier);
      return offerings;
    } catch (error) {
      console.error('❌ Error fetching offerings:', error);
      return null;
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      console.log('💳 Initiating purchase:', pkg.identifier);
      const purchaseResult = await Purchases.purchasePackage(pkg);
      
      console.log('✅ Purchase successful');
      console.log('🎟️ Entitlements:', Object.keys(purchaseResult.customerInfo.entitlements.active));

      return {
        success: true,
        customerInfo: purchaseResult.customerInfo,
      };
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      
      if (error.userCancelled) {
        return {
          success: false,
          error: 'Purchase cancelled by user',
        };
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  async restorePurchases(): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      console.log('🔄 Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('✅ Purchases restored');
      console.log('🎟️ Active entitlements:', Object.keys(customerInfo.entitlements.active));

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('❌ Restore error:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases',
      };
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isConfigured) {
      console.warn('⚠️ RevenueCat not configured yet, skipping getCustomerInfo');
      return null;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('👤 Customer info fetched');
      console.log('🎟️ Active entitlements:', Object.keys(customerInfo.entitlements.active));
      return customerInfo;
    } catch (error: any) {
      console.error('❌ Error fetching customer info:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        name: error?.name,
      });
      return null;
    }
  }

  async syncPurchasesWithUserId(userId: string): Promise<void> {
    try {
      console.log('🔄 Syncing purchases with user ID:', userId);
      await Purchases.logIn(userId);
      console.log('✅ Purchases synced successfully');
    } catch (error) {
      console.error('❌ Error syncing purchases:', error);
      throw error;
    }
  }

  async logOut(): Promise<void> {
    try {
      console.log('👋 Logging out from RevenueCat');
      await Purchases.logOut();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Error logging out:', error);
    }
  }

  checkEntitlement(customerInfo: CustomerInfo | null, entitlementId: string = ENTITLEMENT_ID): boolean {
    if (!customerInfo) return false;

    const entitlement = customerInfo.entitlements.active[entitlementId];
    const isActive = entitlement !== undefined && entitlement !== null;

    console.log(`🎟️ Checking entitlement "${entitlementId}":`, isActive);
    
    return isActive;
  }

  getEntitlementInfo(customerInfo: CustomerInfo | null, entitlementId: string = ENTITLEMENT_ID): PurchasesEntitlementInfo | null {
    if (!customerInfo) return null;
    return customerInfo.entitlements.active[entitlementId] || null;
  }

  isSubscriptionActive(customerInfo: CustomerInfo | null): boolean {
    return this.checkEntitlement(customerInfo);
  }

  async checkTrialEligibility(productId: string): Promise<boolean> {
    try {
      const offerings = await this.getOfferings();
      if (!offerings?.current) return false;

      const pkg = offerings.current.availablePackages.find(p => 
        p.product.identifier === productId
      );

      if (!pkg) return false;

      const introPrice = pkg.product.introPrice;
      return introPrice !== null && introPrice !== undefined;
    } catch (error) {
      console.error('❌ Error checking trial eligibility:', error);
      return false;
    }
  }

  async setAttributes(attributes: Record<string, string | null>): Promise<void> {
    this.attributeQueue = this.attributeQueue.then(async () => {
      if (this.isSettingAttributes) {
        console.log('⏳ Attributes update already in progress, queuing...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      try {
        this.isSettingAttributes = true;
        await Purchases.setAttributes(attributes);
        console.log('✅ Attributes set:', Object.keys(attributes));
      } catch (error: any) {
        if (error?.code === 16 || error?.info?.statusCode === 529) {
          console.log('⏳ Concurrent request detected, retrying in 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            await Purchases.setAttributes(attributes);
            console.log('✅ Attributes set (retry):', Object.keys(attributes));
          } catch (retryError) {
            console.error('❌ Error setting attributes (retry failed):', retryError);
          }
        } else {
          console.error('❌ Error setting attributes:', error);
        }
      } finally {
        this.isSettingAttributes = false;
      }
    });
    
    return this.attributeQueue;
  }

  async setEmail(email: string): Promise<void> {
    this.attributeQueue = this.attributeQueue.then(async () => {
      try {
        await Purchases.setEmail(email);
        console.log('✅ Email set');
      } catch (error: any) {
        if (error?.code === 16 || error?.info?.statusCode === 529) {
          console.log('⏳ Concurrent email request detected, retrying in 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            await Purchases.setEmail(email);
            console.log('✅ Email set (retry)');
          } catch (retryError) {
            console.error('❌ Error setting email (retry failed):', retryError);
          }
        } else {
          console.error('❌ Error setting email:', error);
        }
      }
    });
    
    return this.attributeQueue;
  }

  async setPhoneNumber(phoneNumber: string): Promise<void> {
    this.attributeQueue = this.attributeQueue.then(async () => {
      try {
        await Purchases.setPhoneNumber(phoneNumber);
        console.log('✅ Phone number set');
      } catch (error: any) {
        if (error?.code === 16 || error?.info?.statusCode === 529) {
          console.log('⏳ Concurrent phone request detected, retrying in 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            await Purchases.setPhoneNumber(phoneNumber);
            console.log('✅ Phone number set (retry)');
          } catch (retryError) {
            console.error('❌ Error setting phone number (retry failed):', retryError);
          }
        } else {
          console.error('❌ Error setting phone number:', error);
        }
      }
    });
    
    return this.attributeQueue;
  }

  async presentCodeRedemptionSheet(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Purchases.presentCodeRedemptionSheet();
      } else {
        console.warn('⚠️ Code redemption is only available on iOS');
      }
    } catch (error) {
      console.error('❌ Error presenting code redemption sheet:', error);
    }
  }
}

export const revenueCatService = RevenueCatService.getInstance();
