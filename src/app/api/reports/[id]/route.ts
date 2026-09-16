import { NextResponse } from "next/server";
import { and, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { notifications, pests, reports, users } from "@/db/schema";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { haversineKm } from "@/lib/geo";

export const dynamic = "force-dynamic";

const ALERT_RADIUS_KM = 30;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json(
      { error: "Hanya petugas atau admin yang dapat memverifikasi laporan." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const reportId = Number(id);
  if (!Number.isFinite(reportId)) {
    return NextResponse.json({ error: "Laporan tidak valid." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    status?: "VERIFIED" | "REJECTED";
  };
  const status = body.status;
  if (status !== "VERIFIED" && status !== "REJECTED") {
    return NextResponse.json(
      { error: "Status harus VERIFIED atau REJECTED." },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(reports)
    .set({
      status,
      verifiedBy: user.id,
      verifiedAt: new Date(),
    })
    .where(eq(reports.id, reportId))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Laporan tidak ditemukan." },
      { status: 404 },
    );
  }

  let alerted = 0;
  if (status === "VERIFIED") {
    const [pest] = await db
      .select()
      .from(pests)
      .where(eq(pests.id, updated.pestId))
      .limit(1);

    const neighbours = await db
      .select({
        id: users.id,
        latitude: users.latitude,
        longitude: users.longitude,
      })
      .from(users)
      .where(and(isNotNull(users.latitude), ne(users.id, updated.userId)));

    const targets = neighbours.filter((neighbour) => {
      const distance = haversineKm(
        { lat: updated.latitude, lng: updated.longitude },
        { lat: neighbour.latitude as number, lng: neighbour.longitude as number },
      );
      return distance <= ALERT_RADIUS_KM;
    });

    if (targets.length) {
      const inserted = await db
        .insert(notifications)
        .values(
          targets.map((target) => ({
            userId: target.id,
            reportId: updated.id,
            title: "Peringatan Hama Sekitar",
            message: `${pest?.pestName ?? "Hama"} terkonfirmasi dalam radius ${
              Math.round(ALERT_RADIUS_KM)
            } km dari lokasi Anda. Segera lakukan pencegahan sesuai panduan penanganan.`,
            priority: pest?.severityLevel ?? "MEDIUM",
          })),
        )
        .returning({ id: notifications.id });
      alerted = inserted.length;
    }
  }

  return NextResponse.json({ report: updated, alerted });
}
