import { PestLibrary, type PestCard } from "@/components/PestLibrary";
import { db } from "@/db";
import { pests, reports } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Wiki Hama · WoroTani",
};

async function loadPestCards(): Promise<PestCard[]> {
  await ensureSeeded();
  const rows = await db
    .select({
      id: pests.id,
      pestName: pests.pestName,
      scientificName: pests.scientificName,
      cropTarget: pests.cropTarget,
      description: pests.description,
      severityLevel: pests.severityLevel,
      imageGuideUrl: pests.imageGuideUrl,
      reportCount: count(reports.id),
    })
    .from(pests)
    .leftJoin(reports, eq(reports.pestId, pests.id))
    .groupBy(
      pests.id,
      pests.pestName,
      pests.scientificName,
      pests.cropTarget,
      pests.description,
      pests.severityLevel,
      pests.imageGuideUrl,
      sql`1`,
    )
    .orderBy(pests.pestName);

  return rows.map((row) => ({ ...row, reportCount: Number(row.reportCount) }));
}

export default async function WikiPage() {
  const pestCards = await loadPestCards();
  return <PestLibrary pests={pestCards} />;
}
