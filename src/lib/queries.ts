import { and, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  notifications,
  pests,
  regions,
  reports,
  users,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";

export type ReportRow = {
  id: number;
  latitude: number;
  longitude: number;
  photoUrl: string;
  additionalNote: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: Date;
  verifiedAt: Date | null;
  pestId: number;
  pestName: string;
  pestSeverity: "LOW" | "MEDIUM" | "HIGH";
  pestTreatment: string;
  userId: number;
  userName: string;
  userPhone: string;
  regionId: number | null;
  regionName: string | null;
};

export async function getReports(options?: {
  status?: "PENDING" | "VERIFIED" | "REJECTED";
  regionId?: number;
  userId?: number;
  limit?: number;
}): Promise<ReportRow[]> {
  await ensureSeeded();
  const filters = [];
  if (options?.status) filters.push(eq(reports.status, options.status));
  if (options?.regionId) filters.push(eq(reports.regionId, options.regionId));
  if (options?.userId) filters.push(eq(reports.userId, options.userId));

  return db
    .select({
      id: reports.id,
      latitude: reports.latitude,
      longitude: reports.longitude,
      photoUrl: reports.photoUrl,
      additionalNote: reports.additionalNote,
      status: reports.status,
      createdAt: reports.createdAt,
      verifiedAt: reports.verifiedAt,
      pestId: pests.id,
      pestName: pests.pestName,
      pestSeverity: pests.severityLevel,
      pestTreatment: pests.treatmentGuide,
      userId: users.id,
      userName: users.name,
      userPhone: users.phone,
      regionId: reports.regionId,
      regionName: regions.regionName,
    })
    .from(reports)
    .innerJoin(pests, eq(reports.pestId, pests.id))
    .innerJoin(users, eq(reports.userId, users.id))
    .leftJoin(regions, eq(reports.regionId, regions.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(reports.createdAt))
    .limit(options?.limit ?? 200);
}

export async function getPests(query?: string) {
  await ensureSeeded();
  const term = query?.trim();
  return db
    .select()
    .from(pests)
    .where(
      term
        ? or(
            ilike(pests.pestName, `%${term}%`),
            ilike(pests.scientificName, `%${term}%`),
            ilike(pests.cropTarget, `%${term}%`),
            ilike(pests.description, `%${term}%`),
          )
        : undefined,
    )
    .orderBy(pests.pestName);
}

export async function getRegions() {
  await ensureSeeded();
  return db.select().from(regions).orderBy(regions.regionName);
}

export async function getStats() {
  await ensureSeeded();
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000);

  const [verified] = await db
    .select({ value: count() })
    .from(reports)
    .where(eq(reports.status, "VERIFIED"));
  const [pending] = await db
    .select({ value: count() })
    .from(reports)
    .where(eq(reports.status, "PENDING"));
  const [farmers] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "FARMER"));
  const [allUsers] = await db.select({ value: count() }).from(users);
  const [allPests] = await db.select({ value: count() }).from(pests);
  const [allRegions] = await db.select({ value: count() }).from(regions);
  const [recent] = await db
    .select({ value: count() })
    .from(reports)
    .where(gte(reports.createdAt, sixMonthsAgo));
  const [alerts] = await db.select({ value: count() }).from(notifications);

  return {
    verifiedReports: Number(verified?.value ?? 0),
    pendingReports: Number(pending?.value ?? 0),
    activeUsers: Number(allUsers?.value ?? 0),
    farmers: Number(farmers?.value ?? 0),
    pestTypes: Number(allPests?.value ?? 0),
    regions: Number(allRegions?.value ?? 0),
    recentReports: Number(recent?.value ?? 0),
    alertsSent: Number(alerts?.value ?? 0),
  };
}

export type MonthlyPoint = { month: string; total: number };
export type PestFrequency = { pestName: string; total: number; severity: string };

export async function getAnalytics() {
  await ensureSeeded();
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${reports.createdAt}), 'YYYY-MM')`,
      pestName: pests.pestName,
      severity: pests.severityLevel,
      total: count(),
    })
    .from(reports)
    .innerJoin(pests, eq(reports.pestId, pests.id))
    .groupBy(
      sql`date_trunc('month', ${reports.createdAt})`,
      pests.pestName,
      pests.severityLevel,
    );

  const monthMap = new Map<string, number>();
  const pestMap = new Map<string, PestFrequency>();
  for (const row of rows) {
    monthMap.set(row.month, (monthMap.get(row.month) ?? 0) + Number(row.total));
    const current = pestMap.get(row.pestName) ?? {
      pestName: row.pestName,
      total: 0,
      severity: row.severity,
    };
    current.total += Number(row.total);
    pestMap.set(row.pestName, current);
  }

  const monthly: MonthlyPoint[] = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ month, total }));

  const topPests: PestFrequency[] = [...pestMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const regionRows = await db
    .select({
      regionName: regions.regionName,
      total: count(),
    })
    .from(reports)
    .leftJoin(regions, eq(reports.regionId, regions.id))
    .groupBy(regions.regionName)
    .orderBy(desc(count()));

  return {
    monthly,
    topPests,
    perRegion: regionRows.map((row) => ({
      regionName: row.regionName ?? "Tidak diketahui",
      total: Number(row.total),
    })),
  };
}
