export function websiteUrl() {
  const url = new URL(process.env.WEB_URL || process.env.FRONTEND_URL || "https://akfashionplus.com");
  if (!/^https?:$/.test(url.protocol)) throw new Error("Invalid WEB_URL");
  if (process.env.NODE_ENV === "production" && /^(localhost|127\.0\.0\.1)$/.test(url.hostname)) return "https://akfashionplus.com";
  return url.href.replace(/\/$/, "");
}

export function uploadUrl(req, folder, filename) {
  const host = req.get("host");
  const secureHost = /^(www\.)?akfashionplus\.com(?::\d+)?$/i.test(host);
  const base = process.env.PUBLIC_API_URL || (process.env.NODE_ENV === "production" ? websiteUrl() : `${secureHost ? "https" : req.protocol}://${host}`);
  return `${base.replace(/\/api\/?$/, "").replace(/\/$/, "")}/uploads/${folder}/${encodeURIComponent(filename)}`;
}
