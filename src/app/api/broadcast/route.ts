import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { getCurrentUser, isStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json(
      { error: "Hanya petugas atau admin yang dapat mengirim siaran." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    regionId?: number;
    message?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
  };

  const regionId = Number(body.regionId);
  const message = body.message?.trim();
  const priority = body.priority ?? "HIGH";

  if (!Number.isFinite(regionId) || regionId <= 0 || !message) {
    return NextResponse.json(
      { error: "Wilayah dan isi pesan siaran wajib diisi." },
      { status: 400 },
    );
  }

  const audience = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.regionId, regionId));

  if (!audience.length) {
    return NextResponse.json(
      { error: "Tidak ada pengguna pada wilayah tersebut." },
      { status: 400 },
    );
  }

  const inserted = await db
    .insert(notifications)
    .values(
      audience.map((target) => ({
        userId: target.id,
        title: "Siaran Peringatan Petugas",
        message,
        priority,
      })),
    )
    .returning({ id: notifications.id });

  return NextResponse.json({ sent: inserted.length }, { status: 201 });
}
