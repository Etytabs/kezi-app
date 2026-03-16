import { authApi, setAuthToken, clearAuthToken } from "./api";

export const login = async (email:string,password:string)=>{

  const res = await authApi.login(email,password);

  if(res.data.token){
    await setAuthToken(res.data.token);
  }

  return res;
};

export const register = async (email:string,name:string,password:string)=>{

  const res = await authApi.register(email,name,password);

  if(res.data.token){
    await setAuthToken(res.data.token);
  }

  return res;
};

export const logout = async (): Promise<void>=>{
  await clearAuthToken();
};