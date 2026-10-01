import { appConfig } from "../config/app";

function apiOrigin() {
  return appConfig.apiUrl.replace(/\/api\/?$/i, "");
}

export function absoluteImageUrl(url?: string | null) {
  if (!url) return "";
  const cleanUrl = url.trim().replace(/\\/g, "/");
  if (!cleanUrl) return "";

  const origin = apiOrigin();
  if (/^https?:\/\//i.test(cleanUrl)) {
    try {
      const parsed = new URL(cleanUrl);
      const api = new URL(origin, window.location.origin);
      if (parsed.hostname === api.hostname && api.protocol === "https:") parsed.protocol = "https:";
      if (["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)) {
        parsed.protocol = api.protocol;
        parsed.hostname = api.hostname;
        parsed.port = api.port;
      }
      return parsed.toString();
    } catch {
      return cleanUrl;
    }
  }

  return `${origin}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
}
