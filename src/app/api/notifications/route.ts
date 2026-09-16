import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ notifications: [] });
  }
  const data = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(60);
  return NextResponse.json({ notifications: data });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    id?: number;
    all?: boolean;
  };

  if (body.all) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, user.id));
    return NextResponse.json({ ok: true });
  }

  if (!Number.isFinite(Number(body.id))) {
    return NextResponse.json({ error: "ID notifikasi tidak valid." }, { status: 400 });
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.id, Number(body.id)), eq(notifications.userId, user.id)),
    );

  return NextResponse.json({ ok: true });
}
