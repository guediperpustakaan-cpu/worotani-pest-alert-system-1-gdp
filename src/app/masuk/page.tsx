import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Masuk · WoroTani",
};

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "FARMER" ? "/petani" : "/petugas");
  }
  const params = await searchParams;

  return (
    <div className="py-4">
      <LoginForm next={params.redirect} />
    </div>
  );
}
