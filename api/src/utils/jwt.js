import crypto from "node:crypto";

const secret = process.env.JWT_SECRET || "change-this-local-development-secret";

function b64url(input) {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

function signPart(value) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function signToken(payload, expiresInSeconds = 60 * 60 * 24 * 7) {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const unsigned = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(body)}`;
  return `${unsigned}.${signPart(unsigned)}`;
}

export function verifyToken(token = "") {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;
    const unsigned = `${header}.${payload}`;
    if (!safeEqual(signature, signPart(unsigned))) return null;
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}
