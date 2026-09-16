import { redirect } from "next/navigation";
import { ReportWizard } from "@/components/ReportWizard";
import { getCurrentUser } from "@/lib/auth";
import { getPests } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lapor Hama · WoroTani",
};

export default async function LaporPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/masuk?redirect=/lapor");
  }

  const pests = await getPests();

  return (
    <ReportWizard
      pests={pests.map((pest) => ({
        id: pest.id,
        pestName: pest.pestName,
        severityLevel: pest.severityLevel,
        symptoms: pest.symptoms,
      }))}
      userName={user.name}
      regionName={user.regionName}
    />
  );
}
