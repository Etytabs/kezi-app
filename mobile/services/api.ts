import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

const AUTH_TOKEN_KEY = "@kezi/auth_token";

async function getToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request(endpoint: string, options: RequestInit = {}) {

  const token = await getToken();

  const headers: any = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "API error");
  }

  return data;
}

/* HEALTH CHECK */

export async function checkApiHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  const data = await res.json();
  return data.status === "ok";
}

/* AUTH */

export const authApi = {

  register(email:string,name:string,password:string) {
    return request("/auth/register",{
      method:"POST",
      body:JSON.stringify({email,name,password})
    });
  },

  login(email:string,password:string){
    return request("/auth/login",{
      method:"POST",
      body:JSON.stringify({email,password})
    });
  },

  getMe(){
    return request("/auth/me");
  }

};