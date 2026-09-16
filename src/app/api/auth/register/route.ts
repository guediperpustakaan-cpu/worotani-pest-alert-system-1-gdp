import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, setSessionCookie } from "@/lib/auth";
import { hashPassword } from "@/lib/hash";
import { ensureSeeded } from "@/db/seed";
import { getRegions } from "@/lib/queries";

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    regionId?: number | string;
  };

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const phone = body.phone?.trim() ?? "";
  const regionId = Number(body.regionId);

  if (!name || !email || password.length < 6 || !regionId) {
    return NextResponse.json(
      {
        error:
          "Nama, email, wilayah wajib diisi, dan kata sandi minimal 6 karakter.",
      },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Email sudah terdaftar. Silakan masuk." },
      { status: 409 },
    );
  }

  const regionList = await getRegions();
  const region = regionList.find((item) => item.id === regionId);

  if (!region) {
    return NextResponse.json(
      { error: "Wilayah tidak ditemukan." },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(users)
    .values({
      name,
      email,
      phone,
      password: hashPassword(password),
      role: "FARMER",
      regionId,
      latitude: region.latitude,
      longitude: region.longitude,
    })
    .returning();

  await setSessionCookie(created.id);
  const session = await getCurrentUser();
  return NextResponse.json({ user: session }, { status: 201 });
}
