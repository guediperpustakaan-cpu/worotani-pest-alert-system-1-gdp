import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { regions, users } from "@/db/schema";
import { createToken, verifyPassword } from "@/lib/hash";

const COOKIE_NAME = "worotani_session";

export type Role = "FARMER" | "OFFICER" | "ADMIN";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  regionId: number | null;
  regionName: string | null;
  phone: string;
};

function readToken(token: string | undefined): number | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmacSig(payload);
  if (expected !== signature) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      uid?: number;
    };
    return typeof parsed.uid === "number" ? parsed.uid : null;
  } catch {
    return null;
  }
}

function createHmacSig(payload: string) {
  const secret =
    process.env.SESSION_SECRET ?? "worotani-saling-jaga-lahan-amankan-panen";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export { verifyPassword };

export async function setSessionCookie(userId: number) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, createToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const userId = readToken(jar.get(COOKIE_NAME)?.value);
  if (!userId) return null;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      regionId: users.regionId,
      regionName: regions.regionName,
    })
    .from(users)
    .leftJoin(regions, eq(users.regionId, regions.id))
    .where(eq(users.id, userId))
    .limit(1);

  return rows[0] ?? null;
}

export function isStaff(role: Role | undefined | null) {
  return role === "OFFICER" || role === "ADMIN";
}
