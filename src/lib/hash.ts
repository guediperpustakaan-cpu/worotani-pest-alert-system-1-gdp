import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SECRET =
  process.env.SESSION_SECRET ?? "worotani-saling-jaga-lahan-amankan-panen";

/** Versi helper hash tanpa dependensi Next.js agar bisa dipakai skrip CLI. */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

export function createToken(userId: number) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, iat: Date.now() }),
  ).toString("base64url");
  const signature = createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}
