import { appConfig } from "../config/app";
import { storage } from "../utils/storage";

type ApiPayload<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await storage.get("auth_token");
  const response = await fetch(appConfig.apiUrl + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiPayload<T>;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed");
  }

  return payload.data as T;
}

export async function postForm<T>(path: string, body: FormData): Promise<T> {
  const token = await storage.get("auth_token");
  const response = await fetch(appConfig.apiUrl + path, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as ApiPayload<T>;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed");
  }

  return payload.data as T;
}

export const get = <T>(path: string) => apiRequest<T>(path);

export const post = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(body || {}),
  });

export const put = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, {
    method: "PUT",
    body: JSON.stringify(body || {}),
  });

export const del = <T>(path: string) =>
  apiRequest<T>(path, {
    method: "DELETE",
  });
