import crypto from "node:crypto";

const algorithm = "aes-256-gcm";

function key() {
  const configuredKey = process.env.BANK_DATA_ENCRYPTION_KEY;
  if (!configuredKey && process.env.NODE_ENV === "production") {
    throw new Error("BANK_DATA_ENCRYPTION_KEY is required in production");
  }
  return crypto
    .createHash("sha256")
    .update(configuredKey || "ak-fashion-plus-local-bank-data-key")
    .digest();
}

export function encryptBankValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(raw, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptBankValue(value) {
  if (!value) return "";
  try {
    const [iv, tag, encrypted] = String(value).split(":");
    if (!iv || !tag || !encrypted) return "";
    const decipher = crypto.createDecipheriv(
      algorithm,
      key(),
      Buffer.from(iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}

export function maskBankValue(value) {
  const raw = String(value || "").replace(/\s+/g, "");
  if (!raw) return "";
  const last = raw.slice(-4);
  return `**** **** **** ${last}`;
}
