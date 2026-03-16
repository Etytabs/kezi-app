import AsyncStorage from "@react-native-async-storage/async-storage";

/* =========================
API CONFIG
========================= */

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://kezi-app-production.up.railway.app/api";

console.log("API URL:", API_BASE_URL);

const AUTH_TOKEN_KEY = "@kezi/auth_token";

/* =========================
TOKEN STORAGE
========================= */

async function getToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

/* =========================
GENERIC REQUEST
========================= */

async function request(endpoint: string, options: RequestInit = {}) {

  const token = await getToken();

  const headers: any = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  console.log("API Request:", url);

  const res = await fetch(url, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "API error");
  }

  return data;
}

/* =========================
HEALTH CHECK
========================= */

export async function checkApiHealth(): Promise<boolean> {

  try {

    const res = await fetch(`${API_BASE_URL}/health`);

    if (!res.ok) return false;

    return true;

  } catch {

    return false;

  }

}

/* =========================
AUTH API
========================= */

export const authApi = {

  async register(email: string, name: string, password: string) {

    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password })
    });

    if (data.token) {
      await setAuthToken(data.token);
    }

    return data;
  },
  async login(email: string, password: string) {

    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  
    console.log("LOGIN RESPONSE:", data);
  
    if (data.token) {
      await setAuthToken(data.token);
    }
  
    return data;
  }

};