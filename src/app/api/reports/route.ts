import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getReports } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const regionId = Number(url.searchParams.get("regionId"));
  const limit = Number(url.searchParams.get("limit"));

  const allowed = ["PENDING", "VERIFIED", "REJECTED"] as const;
  const parsedStatus = allowed.find((item) => item === status?.toUpperCase());

  const data = await getReports({
    status: parsedStatus,
    regionId: Number.isFinite(regionId) && regionId > 0 ? regionId : undefined,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 300) : 200,
  });

  return NextResponse.json({ reports: data });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Silakan masuk terlebih dahulu untuk mengirim laporan." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    pestId?: number;
    latitude?: number;
    longitude?: number;
    photoUrl?: string;
    additionalNote?: string;
  };

  const pestId = Number(body.pestId);
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (!Number.isFinite(pestId) || pestId <= 0) {
    return NextResponse.json(
      { error: "Jenis hama wajib dipilih." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json(
      { error: "Koordinat GPS belum terdeteksi. Aktifkan lokasi Anda." },
      { status: 400 },
    );
  }

  const photoUrl = (body.photoUrl ?? "").slice(0, 4_000_000);
  const additionalNote = (body.additionalNote ?? "").slice(0, 800);

  const [created] = await db
    .insert(reports)
    .values({
      userId: user.id,
      pestId,
      regionId: user.regionId,
      latitude,
      longitude,
      photoUrl,
      additionalNote,
      status: "PENDING",
    })
    .returning();

  await db
    .update(users)
    .set({ latitude, longitude })
    .where(eq(users.id, user.id));

  return NextResponse.json({ report: created }, { status: 201 });
}
