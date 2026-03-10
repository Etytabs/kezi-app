import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage, User, CycleConfig, isSuperAdmin } from "@/services/storage";
import { authApi, setAuthToken, clearAuthToken, checkApiHealth } from "@/services/api";

const TOKEN_KEY = "@kezi/auth_token";
const TOKEN_EXPIRY_KEY = "@kezi/auth_token_expiry";

async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return AsyncStorage.getItem(key);
  }
}

async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

export type UserRole = "user" | "merchant" | "admin";

interface RegistrationResult {
  success: boolean;
  error?: string;
  verificationCode?: string;
  verificationExpiresAt?: string;
  requiresVerification?: boolean;
}

interface AuthContextType {
  user: User | null;
  cycleConfig: CycleConfig | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isOnline: boolean;
  isEmailVerified: boolean;
  lastActivity: number;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  loginAnonymous: () => Promise<void>;
  register: (email: string, name: string, password: string, language?: string) => Promise<RegistrationResult>;
  logout: () => Promise<void>;
  updateCycleConfig: (config: CycleConfig) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateProfile: (data: {
    name?: string;
    phone?: string;
    language?: string;
    cycleConfig?: { lastPeriodDate?: string; cycleLength?: number; periodLength?: number };
    address?: { addressLine1?: string; city?: string; district?: string; latitude?: number; longitude?: number };
  }) => Promise<{ success: boolean; error?: string }>;
  updateAvatar: (uri: string) => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  recordActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ANONYMOUS_KEY = "@kezi/anonymous_mode";
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cycleConfig, setCycleConfig] = useState<CycleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const recordActivity = () => {
    setLastActivity(Date.now());
  };

  useEffect(() => {
    loadUser();
    checkOnlineStatus();
  }, []);

  useEffect(() => {
    if (!user || isAnonymous) return;

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
        logout();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user, isAnonymous, lastActivity]);

  const checkOnlineStatus = async () => {
    const online = await checkApiHealth();
    setIsOnline(online);
  };

  const loadUser = async () => {
    try {
      const savedToken = await getSecureItem(TOKEN_KEY);
      const savedUser = await storage.getUser();
      const savedConfig = await storage.getCycleConfig();

      if (savedToken && savedUser) {
        await setAuthToken(savedToken);

        setUser(savedUser as User);
        setCycleConfig(savedConfig);
        setIsOnline(true);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /*
  =========================
  LOGIN (FIXED VERSION)
  =========================
  */

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
    try {
      const { data, error } = await authApi.login(email, password);

      if (error) {
        return { success: false, error };
      }

      if (data) {
        await setSecureItem(TOKEN_KEY, data.token);
        await setAuthToken(data.token);

        const loggedInUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role.toLowerCase() as UserRole,
          language: data.user.language,
          createdAt: new Date().toISOString(),
          isSuperAdmin: isSuperAdmin(data.user.email),
        };

        await storage.setUser(loggedInUser);

        setUser(loggedInUser);
        setIsEmailVerified(data.user.emailVerified || false);
        setIsOnline(true);

        const existingConfig = await storage.getCycleConfig();

        if (!existingConfig) {
          const defaultConfig: CycleConfig = {
            lastPeriodDate: new Date().toISOString(),
            cycleLength: 28,
            periodLength: 5,
          };

          await storage.setCycleConfig(defaultConfig);
          setCycleConfig(defaultConfig);
        } else {
          setCycleConfig(existingConfig);
        }

        return {
          success: true,
          requiresVerification: !data.user.emailVerified,
        };
      }

      return { success: false, error: "Unknown error" };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  };

  const register = async (
    email: string,
    name: string,
    password: string,
    language?: string
  ): Promise<RegistrationResult> => {
    try {
      const { data, error } = await authApi.register(email, name, password, language);

      if (error) {
        return { success: false, error };
      }

      if (data) {
        await setSecureItem(TOKEN_KEY, data.token);
        await setAuthToken(data.token);

        const newUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role.toLowerCase() as UserRole,
          language: data.user.language,
          createdAt: new Date().toISOString(),
          isSuperAdmin: isSuperAdmin(data.user.email),
        };

        await storage.setUser(newUser);

        setUser(newUser);
        setIsEmailVerified(data.user.emailVerified || false);

        return { success: true };
      }

      return { success: false, error: "Unknown error" };
    } catch (error: any) {
      return { success: false, error: error.message || "Registration failed" };
    }
  };

  const loginAnonymous = async () => {
    const anonUser: User = {
      id: "anonymous",
      email: "",
      name: "Private User",
      role: "user",
      createdAt: new Date().toISOString(),
    };

    setUser(anonUser);
    setIsAnonymous(true);
  };

  const logout = async () => {
    await deleteSecureItem(TOKEN_KEY);
    await clearAuthToken();
    await storage.removeUser();

    setUser(null);
    setIsAnonymous(false);
  };

  const updateCycleConfig = async (config: CycleConfig) => {
    await storage.setCycleConfig(config);
    setCycleConfig(config);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };

      await storage.setUser(updatedUser);
      setUser(updatedUser);
    }
  };

  const updateProfile = async () => {
    return { success: true };
  };

  const updateAvatar = async (uri: string) => {
    if (user) {
      const updatedUser = { ...user, avatar: uri };

      await storage.setUser(updatedUser);
      setUser(updatedUser);
    }
  };

  const deleteAccount = async () => {
    await logout();
    return { success: true };
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        cycleConfig,
        isLoading,
        isAuthenticated: !!user,
        isAnonymous,
        isOnline,
        isEmailVerified,
        lastActivity,
        login,
        loginAnonymous,
        register,
        logout,
        updateCycleConfig,
        updateUser,
        updateProfile,
        updateAvatar,
        deleteAccount,
        refreshUser,
        recordActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}