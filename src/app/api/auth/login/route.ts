import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, setSessionCookie, verifyPassword } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan kata sandi wajib diisi." },
      { status: 400 },
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !verifyPassword(password, user.password)) {
    return NextResponse.json(
      { error: "Email atau kata sandi tidak sesuai." },
      { status: 401 },
    );
  }

  await setSessionCookie(user.id);
  const session = await getCurrentUser();
  return NextResponse.json({ user: session });
}
