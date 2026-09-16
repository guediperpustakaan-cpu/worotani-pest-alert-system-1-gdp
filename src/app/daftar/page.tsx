import { RegisterForm } from "@/components/AuthForms";
import { ensureSeeded } from "@/db/seed";
import { getRegions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar · WoroTani",
};

export default async function DaftarPage() {
  const regions = await getRegions();

  return (
    <div className="py-4">
      <RegisterForm
        regions={regions.map((region) => ({
          id: region.id,
          regionName: region.regionName,
        }))}
      />
    </div>
  );
}
