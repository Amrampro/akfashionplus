const allowed = new Set(["fr", "en", "pt"]);

export function languageMiddleware(req, _res, next) {
  const raw =
    req.headers["accept-language"] ||
    req.headers["x-language"] ||
    req.query.lang;
  const lang = String(raw || "fr")
    .slice(0, 2)
    .toLowerCase();
  req.lang = allowed.has(lang) ? lang : "fr";
  next();
}
