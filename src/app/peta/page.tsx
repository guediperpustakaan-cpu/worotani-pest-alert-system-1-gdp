import { MapExplorer, type ApiReport } from "@/components/MapExplorer";
import { getPests, getReports } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Peta Wabah Hama · WoroTani",
};

export default async function PetaPage() {
  const [reports, pests] = await Promise.all([
    getReports({ limit: 200 }),
    getPests(),
  ]);

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

  return (
    <MapExplorer
      initialReports={initialReports}
      pests={pests.map((pest) => ({
        id: pest.id,
        pestName: pest.pestName,
        severityLevel: pest.severityLevel,
      }))}
    />
  );
}
