const allowed = new Set(["fr", "en", "pt"]);

export function languageMiddleware(req, _res, next) {
  const raw =
    req.headers["x-language"] ||
    req.query.lang ||
    req.headers["accept-language"];
  const lang = String(raw || "pt")
    .slice(0, 2)
    .toLowerCase();
  req.lang = allowed.has(lang) ? lang : "pt";
  next();
}
