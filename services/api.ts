import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl && configuredUrl !== "http://localhost:3001/api") {
    return configuredUrl;
  }
  
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const origin = window.location.origin;
    if (!origin.includes("localhost")) {
      // In Replit dev environment, the API runs on a different external port
      // Port 3001 is mapped to external port 3002
      const url = new URL(origin);
      if (url.port === "" || url.port === "80" || url.port === "443") {
        // External access - API is on port 3002
        return `${url.protocol}//${url.hostname}:3002/api`;
      }
      return `${origin}/api`;
    }
  }
  
  return "http://localhost:3001/api";
}

const API_BASE_URL = getApiBaseUrl();
const AUTH_TOKEN_KEY = "@kezi/auth_token";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken();
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || "Request failed" };
    }
    
    return { data };
  } catch (error: any) {
    console.error("API request error:", error);
    return { error: error.message || "Network error" };
  }
}

export const authApi = {
  register: (email: string, name: string, password: string, language?: string) =>
    apiRequest<{ user: any; token: string; verificationCode?: string; verificationExpiresAt?: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password, language }),
    }),
  
  login: (email: string, password: string) =>
    apiRequest<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  
  verify: (code: string) =>
    apiRequest<{ message: string; verified: boolean }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  
  resendCode: () =>
    apiRequest<{ message: string; verificationCode?: string; verificationExpiresAt?: string }>("/auth/resend-code", {
      method: "POST",
    }),
  
  getMe: () => apiRequest<{ user: any }>("/auth/me"),
  
  updateProfile: (data: {
    name?: string;
    phone?: string;
    language?: string;
    cycleConfig?: { lastPeriodDate?: string; cycleLength?: number; periodLength?: number };
    address?: { addressLine1?: string; city?: string; district?: string; latitude?: number; longitude?: number };
  }) =>
    apiRequest<{ message: string }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  deleteAccount: () =>
    apiRequest<{ message: string }>("/auth/account", {
      method: "DELETE",
    }),
};

export const productsApi = {
  getCategories: () =>
    apiRequest<{ categories: any[] }>("/products/categories"),
  
  getProducts: (params?: {
    category?: string;
    cyclePhase?: string;
    search?: string;
    merchantId?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiRequest<{ products: any[]; total: number; page: number; limit: number }>(
      `/products?${queryParams}`
    );
  },
  
  getProduct: (productId: string) =>
    apiRequest<{ product: any; inventory: any[]; reviews: any[] }>(`/products/${productId}`),
  
  createProduct: (data: any) =>
    apiRequest<{ product: any }>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  updateProduct: (productId: string, data: any) =>
    apiRequest<{ product: any }>(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  updateInventory: (productId: string, storeId: string, quantity: number, lowStockThreshold?: number) =>
    apiRequest<{ inventory: any }>(`/products/${productId}/inventory`, {
      method: "PUT",
      body: JSON.stringify({ storeId, quantity, lowStockThreshold }),
    }),
};

export const storesApi = {
  getNearby: (params: {
    latitude: number;
    longitude: number;
    radius?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    return apiRequest<{ stores: any[]; page: number; limit: number }>(`/stores/nearby?${queryParams}`);
  },
  
  getStore: (storeId: string) =>
    apiRequest<{ store: any; products: any[] }>(`/stores/${storeId}`),
  
  getMyStores: () =>
    apiRequest<{ stores: any[] }>("/stores/merchant/my-stores"),
  
  createStore: (data: any) =>
    apiRequest<{ store: any }>("/stores", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  updateStore: (storeId: string, data: any) =>
    apiRequest<{ store: any }>(`/stores/${storeId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const ordersApi = {
  createOrder: (data: {
    merchantId: string;
    storeId?: string;
    items: { productId: string; quantity: number; notes?: string }[];
    paymentMethod?: string;
    deliveryAddress?: any;
    deliveryNotes?: string;
  }) =>
    apiRequest<{ order: any }>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  getMyOrders: (params?: { status?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiRequest<{ orders: any[]; total: number; page: number; limit: number }>(
      `/orders/my-orders?${queryParams}`
    );
  },
  
  getMerchantOrders: (params?: { status?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiRequest<{ orders: any[]; total: number; page: number; limit: number }>(
      `/orders/merchant-orders?${queryParams}`
    );
  },
  
  updateOrderStatus: (orderId: string, status: string, notes?: string) =>
    apiRequest<{ order: any }>(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, notes }),
    }),
};

export const journalApi = {
  getEntries: (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiRequest<{ entries: any[]; total: number; page: number; limit: number }>(
      `/journal?${queryParams}`
    );
  },
  
  getEntry: (date: string) =>
    apiRequest<{ entry: any | null }>(`/journal/${date}`),
  
  saveEntry: (data: {
    date: string;
    mood?: string;
    symptoms?: string[];
    notes?: string;
    flowIntensity?: string;
    temperature?: number;
    weight?: number;
    sleepHours?: number;
    exerciseMinutes?: number;
    waterIntake?: number;
  }) =>
    apiRequest<{ entry: any }>("/journal", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  deleteEntry: (date: string) =>
    apiRequest<{ message: string }>(`/journal/${date}`, {
      method: "DELETE",
    }),
  
  getAnalytics: (months?: number) =>
    apiRequest<{ summary: any; moodDistribution: any[]; symptomFrequency: any[] }>(
      `/journal/analytics/summary?months=${months || 3}`
    ),
};

export const merchantsApi = {
  getDashboard: () =>
    apiRequest<{ merchant: any; stats: any; recentOrders: any[]; lowStockProducts: any[] }>(
      "/merchants/dashboard"
    ),
  
  inviteMerchant: (email: string, businessName: string, businessType?: string) =>
    apiRequest<{ message: string; tempCredentials: any; magicLink: string }>("/merchants/invite", {
      method: "POST",
      body: JSON.stringify({ email, businessName, businessType }),
    }),
  
  getPendingMerchants: () =>
    apiRequest<{ merchants: any[] }>("/merchants/pending"),
  
  verifyMerchant: (merchantId: string, approved: boolean, rejectionReason?: string) =>
    apiRequest<{ message: string }>(`/merchants/${merchantId}/verify`, {
      method: "PUT",
      body: JSON.stringify({ approved, rejectionReason }),
    }),
  
  getAllMerchants: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiRequest<{ merchants: any[]; total: number; page: number; limit: number }>(
      `/merchants/all?${queryParams}`
    );
  },
};

export const adminApi = {
  getDashboard: () =>
    apiRequest<{ stats: any; recentOrders: any[]; pendingMerchants: any[]; lowStockAlerts: any[] }>(
      "/admin/dashboard"
    ),
  
  getUsers: (params?: { role?: string; search?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiRequest<{ users: any[]; total: number; page: number; limit: number }>(
      `/admin/users?${queryParams}`
    );
  },
  
  updateUserStatus: (userId: string, isActive: boolean) =>
    apiRequest<{ message: string }>(`/admin/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ isActive }),
    }),
  
  getAuditLogs: (params?: { action?: string; entityType?: string; userId?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiRequest<{ logs: any[]; total: number; page: number; limit: number }>(
      `/admin/audit-logs?${queryParams}`
    );
  },
  
  getAnalytics: (days?: number) =>
    apiRequest<{ dailyStats: any[]; userGrowth: any[]; topProducts: any[]; topMerchants: any[] }>(
      `/admin/analytics/overview?days=${days || 30}`
    ),
  
  createExport: (exportType: string, parameters?: any) =>
    apiRequest<{ export: any; message: string }>("/admin/exports", {
      method: "POST",
      body: JSON.stringify({ exportType, parameters }),
    }),
  
  getExports: () =>
    apiRequest<{ exports: any[] }>("/admin/exports"),
};

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === "ok" && data.database === "connected";
  } catch {
    return false;
  }
}
