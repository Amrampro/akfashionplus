import crypto from "node:crypto";

export function reference(prefix) {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `${prefix}-${stamp}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export function hashToken(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}
