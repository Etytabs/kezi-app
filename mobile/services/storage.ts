import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER: "@kezi/user",
  CYCLE_CONFIG: "@kezi/cycle_config",
  JOURNAL_ENTRIES: "@kezi/journal_entries",
  WISHLIST: "@kezi/wishlist",
  OFFLINE_QUEUE: "@kezi/offline_queue",
  ONBOARDING_COMPLETE: "@kezi/onboarding_complete",
  DEPENDENT_PROFILES: "@kezi/dependent_profiles",
  ACTIVE_PROFILE_ID: "@kezi/active_profile_id",
  NOTIFICATION_SETTINGS: "@kezi/notification_settings",
  BIOMETRIC_ENABLED: "@kezi/biometric_enabled",
  MARKETPLACE_FILTERS: "@kezi/marketplace_filters",
  ORDERS: "@kezi/orders",
  ADMIN_ACTIONS: "@kezi/admin_actions",
  MARKETPLACE_ONBOARDING: "@kezi/marketplace_onboarding",
  APP_PIN: "@kezi/app_pin",
  APP_LOCK_ENABLED: "@kezi/app_lock_enabled",
  DISCREET_MODE: "@kezi/discreet_mode",
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "merchant" | "admin";
  avatar?: string;
  phone?: string;
  language?: string;
  merchantId?: string;
  merchantStatus?: string;
  createdAt: string;
  isSuperAdmin?: boolean;
}

export const SUPER_ADMIN_EMAIL = "etytabs@gmail.com";

export function isSuperAdmin(email: string): boolean {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export interface CycleConfig {
  lastPeriodDate: string;
  cycleLength: number;
  periodLength: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: "happy" | "neutral" | "sad" | "anxious" | "energetic";
  symptoms: string[];
  notes: string;
  createdAt: string;
}

export interface DependentProfile {
  id: string;
  name: string;
  relation: string;
  avatar?: string;
  cycleConfig?: CycleConfig;
  createdAt: string;
}

export interface NotificationSettings {
  cycleReminders: boolean;
  periodPrediction: boolean;
  ovulationAlert: boolean;
  journalReminder: boolean;
  productDeals: boolean;
}

export interface MarketplaceFilters {
  priceRange: [number, number];
  distanceRadius: number;
  minRating: number;
  categories: string[];
  inStockOnly: boolean;
}

export type PaymentMethod = "mobile_money" | "cash_on_delivery" | "card";
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type OrderType = "delivery" | "reservation" | "pickup";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  region: string;
  landmark?: string;
  phone: string;
}

export interface Order {
  id: string;
  userId: string;
  merchantId: string;
  items: OrderItem[];
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  deliveryAddress?: DeliveryAddress;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminActionType = 
  | "promote_user"
  | "demote_user"
  | "approve_merchant"
  | "suspend_merchant"
  | "approve_review"
  | "delete_review"
  | "update_inventory"
  | "system_config";

export interface AdminAction {
  id: string;
  adminId: string;
  adminEmail: string;
  actionType: AdminActionType;
  targetId: string;
  targetType: "user" | "merchant" | "review" | "product" | "system";
  description: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  merchantId: string;
  merchantName: string;
  currentStock: number;
  threshold: number;
  severity: "critical" | "warning" | "low";
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalMerchants: number;
  activeCycles: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockItems: number;
  pendingReviews: number;
}

export const storage = {
  async getUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },

  async getCycleConfig(): Promise<CycleConfig | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CYCLE_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setCycleConfig(config: CycleConfig): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_CONFIG, JSON.stringify(config));
  },

  async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addJournalEntry(entry: JournalEntry): Promise<void> {
    const entries = await this.getJournalEntries();
    entries.unshift(entry);
    await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
  },

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<void> {
    const entries = await this.getJournalEntries();
    const index = entries.findIndex((e) => e.id === id);
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
    }
  },

  async deleteJournalEntry(id: string): Promise<void> {
    const entries = await this.getJournalEntries();
    const filtered = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(filtered));
  },

  async getWishlist(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WISHLIST);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addToWishlist(productId: string): Promise<void> {
    const wishlist = await this.getWishlist();
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      await AsyncStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    }
  },

  async removeFromWishlist(productId: string): Promise<void> {
    const wishlist = await this.getWishlist();
    const filtered = wishlist.filter((id) => id !== productId);
    await AsyncStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(filtered));
  },

  async isOnboardingComplete(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return data === "true";
    } catch {
      return false;
    }
  },

  async setOnboardingComplete(complete: boolean = true): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, complete ? "true" : "false");
  },

  async getDependentProfiles(): Promise<DependentProfile[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DEPENDENT_PROFILES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addDependentProfile(profile: DependentProfile): Promise<void> {
    const profiles = await this.getDependentProfiles();
    profiles.push(profile);
    await AsyncStorage.setItem(STORAGE_KEYS.DEPENDENT_PROFILES, JSON.stringify(profiles));
  },

  async updateDependentProfile(id: string, updates: Partial<DependentProfile>): Promise<void> {
    const profiles = await this.getDependentProfiles();
    const index = profiles.findIndex((p) => p.id === id);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.DEPENDENT_PROFILES, JSON.stringify(profiles));
    }
  },

  async removeDependentProfile(id: string): Promise<void> {
    const profiles = await this.getDependentProfiles();
    const filtered = profiles.filter((p) => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.DEPENDENT_PROFILES, JSON.stringify(filtered));
  },

  async getActiveProfileId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    } catch {
      return null;
    }
  },

  async setActiveProfileId(id: string | null): Promise<void> {
    if (id) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    }
  },

  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setNotificationSettings(settings: NotificationSettings): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
  },

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return data === "true";
    } catch {
      return false;
    }
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled ? "true" : "false");
  },

  async getMarketplaceFilters(): Promise<MarketplaceFilters | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MARKETPLACE_FILTERS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setMarketplaceFilters(filters: MarketplaceFilters): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.MARKETPLACE_FILTERS, JSON.stringify(filters));
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  },

  async getOrders(): Promise<Order[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addOrder(order: Order): Promise<boolean> {
    try {
      const orders = await this.getOrders();
      orders.unshift(order);
      await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      return true;
    } catch (error) {
      console.error("Failed to save order:", error);
      return false;
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const orders = await this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], status, updatedAt: new Date().toISOString() };
      await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  },

  async getAdminActions(): Promise<AdminAction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_ACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async logAdminAction(action: AdminAction): Promise<boolean> {
    try {
      const actions = await this.getAdminActions();
      actions.unshift(action);
      if (actions.length > 100) {
        actions.pop();
      }
      await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_ACTIONS, JSON.stringify(actions));
      return true;
    } catch (error) {
      console.error("Failed to log admin action:", error);
      return false;
    }
  },

  async isMarketplaceOnboardingSeen(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MARKETPLACE_ONBOARDING);
      return data === "true";
    } catch {
      return false;
    }
  },

  async setMarketplaceOnboardingSeen(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.MARKETPLACE_ONBOARDING, "true");
  },

  async getAppPin(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.APP_PIN);
    } catch {
      return null;
    }
  },

  async setAppPin(pin: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_PIN, pin);
  },

  async removeAppPin(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.APP_PIN);
  },

  async isAppLockEnabled(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.APP_LOCK_ENABLED);
      return data === "true";
    } catch {
      return false;
    }
  },

  async setAppLockEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCK_ENABLED, enabled ? "true" : "false");
  },

  async isDiscreetModeEnabled(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DISCREET_MODE);
      return data === "true";
    } catch {
      return false;
    }
  },

  async setDiscreetModeEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DISCREET_MODE, enabled ? "true" : "false");
  },
};
