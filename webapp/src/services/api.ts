import { appConfig } from "../config/app";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return (await requestWithMeta<T>(path, options)).data;
}

async function requestWithMeta<T, M = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta?: M }> {
  const token =
    localStorage.getItem("ak_auth_token") || localStorage.getItem("ak_token");
  const language = localStorage.getItem("ak_language") || "pt";
  const response = await fetch(appConfig.apiUrl + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Language": language,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed");
  }
  return { data: payload.data as T, meta: payload.meta as M | undefined };
}

export const get = <T>(path: string) => apiRequest<T>(path);
export const getWithMeta = <T, M>(path: string) => requestWithMeta<T, M>(path);
export const post = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "POST", body: JSON.stringify(body || {}) });
export const put = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body || {}) });
export const del = <T>(path: string) =>
  apiRequest<T>(path, { method: "DELETE" });

export async function postForm<T>(path: string, body: FormData): Promise<T> {
  return formRequest<T>(path, "POST", body);
}

export async function putForm<T>(path: string, body: FormData): Promise<T> {
  return formRequest<T>(path, "PUT", body);
}

async function formRequest<T>(
  path: string,
  method: "POST" | "PUT",
  body: FormData,
): Promise<T> {
  const token =
    localStorage.getItem("ak_auth_token") || localStorage.getItem("ak_token");
  const language = localStorage.getItem("ak_language") || "pt";
  const response = await fetch(appConfig.apiUrl + path, {
    method,
    headers: {
      "X-Language": language,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed");
  }
  return payload.data as T;
}
