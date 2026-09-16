import { AlertFeed } from "@/components/AlertFeed";
import type { ApiReport } from "@/components/MapExplorer";
import { getReports } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Peringatan Hama · WoroTani",
};

export default async function PeringatanPage() {
  const reports = await getReports({ status: "VERIFIED", limit: 200 });

  const initialReports: ApiReport[] = reports.map((report) => ({
    id: report.id,
    latitude: report.latitude,
    longitude: report.longitude,
    photoUrl: report.photoUrl,
    additionalNote: report.additionalNote,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    pestId: report.pestId,
    pestName: report.pestName,
    pestSeverity: report.pestSeverity,
    userId: report.userId,
    userName: report.userName,
    regionId: report.regionId,
    regionName: report.regionName,
  }));

  return <AlertFeed initialReports={initialReports} />;
}

