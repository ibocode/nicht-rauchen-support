import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const API_KEYS = {
  apple: 'appl_lsgpQbieBlmSDkjIAzIhredgHfP',
};

const ENTITLEMENT_ID = 'pro';

// CRITICAL: Initialization lock to prevent race conditions
let isInitialized = false;
let initPromise = null;
let isPurchasing = false; // Prevent double-tap purchases

export const purchaseService = {
  async init() {
    if (isInitialized) {
      return true; // Already initialized
    }
    
    if (initPromise) {
      // Init already in progress, wait for it
      return await initPromise;
    }
    
    initPromise = (async () => {
      try {
        if (Platform.OS === 'ios') {
          Purchases.configure({ apiKey: API_KEYS.apple });
          isInitialized = true;
          return true;
        }
        return false;
      } catch (e) {
        console.error('RevenueCat init failed:', e);
        return false;
      } finally {
        initPromise = null;
      }
    })();
    
    return await initPromise;
  },
  
  // CRITICAL: Ensure init before any operation
  async ensureInitialized() {
    if (!isInitialized) {
      await this.init();
    }
    return isInitialized;
  },

  async getOfferings() {
    try {
      // CRITICAL: Wait for init before calling RevenueCat
      await this.ensureInitialized();
      
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return offerings.current;
      }
      return null;
    } catch (e) {
      console.error('getOfferings failed:', e);
      return null;
    }
  },

  async purchasePackage(rcPackage) {
    // CRITICAL: Prevent double-tap purchases
    if (isPurchasing) {
      console.warn('Purchase already in progress');
      return false;
    }
    
    isPurchasing = true;
    try {
      // CRITICAL: Wait for init before calling RevenueCat
      await this.ensureInitialized();
      
      const { customerInfo } = await Purchases.purchasePackage(rcPackage);
      if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        return true; 
      }
    } catch (e) {
      if (!e.userCancelled) {
        throw e;
      }
    } finally {
      isPurchasing = false;
    }
    return false;
  },

  async restorePurchases() {
    try {
      // CRITICAL: Wait for init before calling RevenueCat
      await this.ensureInitialized();
      
      const customerInfo = await Purchases.restorePurchases();
      return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    } catch (e) {
      console.error('restorePurchases failed:', e);
      return false;
    }
  },
  
  async checkProStatus() {
    try {
      // CRITICAL: Wait for init before calling RevenueCat
      const initialized = await this.ensureInitialized();
      
      if (!initialized) {
        console.warn('RevenueCat not initialized, cannot check pro status');
        return false;
      }
      
      const customerInfo = await Purchases.getCustomerInfo();
      return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    } catch (e) {
      console.error('checkProStatus failed:', e);
      // Network error or API error - return false but don't block
      return false;
    }
  }
};

