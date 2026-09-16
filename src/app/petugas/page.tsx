import { redirect } from "next/navigation";
import { OfficerDashboard } from "@/components/OfficerDashboard";
import type { ApiReport } from "@/components/MapExplorer";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getAnalytics, getRegions, getReports, getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dasbor Petugas · WoroTani",
};

export default async function PetugasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?redirect=/petugas");
  if (!isStaff(user.role)) redirect("/petani");

  const [pending, regions, analytics, stats] = await Promise.all([
    getReports({ status: "PENDING", limit: 100 }),
    getRegions(),
    getAnalytics(),
    getStats(),
  ]);

  const pendingReports: ApiReport[] = pending.map((report) => ({
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
    <OfficerDashboard
      pendingReports={pendingReports}
      regions={regions.map((region) => ({
        id: region.id,
        regionName: region.regionName,
      }))}
      analytics={analytics}
      stats={stats}
      staffName={user.name}
    />
  );
}
