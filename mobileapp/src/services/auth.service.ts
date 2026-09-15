import { endpoints } from "./apiEndpoints";
import { get, post } from "./api";
import { storage } from "../utils/storage";

type AuthResponse = {
  token?: string;
  user?: unknown;
};

export const login = async (body: unknown) => {
  const result = await post<AuthResponse>(endpoints.auth.login, body);
  if (result?.token) await storage.set("auth_token", result.token);
  return result;
};

export const register = async (body: unknown) => {
  const result = await post<AuthResponse>(endpoints.auth.register, body);
  if (result?.token) await storage.set("auth_token", result.token);
  return result;
};

export const me = () => get(endpoints.auth.me);

export const logout = () => storage.remove("auth_token");
