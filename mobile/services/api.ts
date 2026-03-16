import AsyncStorage from "@react-native-async-storage/async-storage";

/* -------------------------------- */
/* API CONFIG */
/* -------------------------------- */

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://scenic-myth-freight-classifieds.trycloudflare.com/api";

console.log("API URL:", API_BASE_URL);

const AUTH_TOKEN_KEY = "@kezi/auth_token";

/* -------------------------------- */
/* TOKEN STORAGE */
/* -------------------------------- */

async function getToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

/* -------------------------------- */
/* GENERIC REQUEST */
/* -------------------------------- */

async function request(endpoint: string, options: RequestInit = {}) {
  try {
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

    const text = await res.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error("Invalid JSON response:", text);
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      throw new Error(data.error || "API error");
    }

    return data;

  } catch (error) {

    console.error("API request failed:", error);

    throw error;
  }
}

/* -------------------------------- */
/* HEALTH CHECK */
/* -------------------------------- */

export async function checkApiHealth(): Promise<boolean> {

  try {

    const res = await fetch(`${API_BASE_URL}/health`);

    console.log("Health check status:", res.status);

    if (!res.ok) {
      return false;
    }

    const data = await res.json();

    console.log("Health response:", data);

    return true;

  } catch (error) {

    console.error("Health check error:", error);

    return false;

  }

}

/* -------------------------------- */
/* AUTH API */
/* -------------------------------- */

export const authApi = {

  async register(email: string, name: string, password: string) {

    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password })
    });

  },

  async login(email: string, password: string) {

    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

  },

  async getMe() {

    return request("/auth/me");

  }

};