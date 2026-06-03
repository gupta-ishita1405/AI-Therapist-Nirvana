import crypto from "crypto";

// Use injected environment variables or elegant fallback values for robustness
const JWT_SECRET = process.env.JWT_SECRET || "nirvana_luxury_secure_token_secret_9882";
const STRETCH_ITERATIONS = 10000;
const KEY_LEN = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, STRETCH_ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

export function comparePassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, STRETCH_ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return hash === originalHash;
}

// Custom highly robust JWT system to sign and verify payloads
export function signToken(payload: object, expireHours = 24): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expireHours * 3600;
  const fullPayload = { ...payload, exp };

  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const encodedHeader = encode(header);
  const encodedPayload = encode(fullPayload);

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signatureInput)
    .digest("base64url");

  return `${signatureInput}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const [headerB64, payloadB64, signature] = token.split(".");
    if (!headerB64 || !payloadB64 || !signature) return null;

    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(signatureInput)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
