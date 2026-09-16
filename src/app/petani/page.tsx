import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BellRing,
  Bug,
  CheckCircle2,
  ClipboardList,
  Clock,
  Map as MapIcon,
  ShieldCheck,
} from "lucide-react";
import { ReportCard } from "@/components/ReportCard";
import { Button, Card, EmptyState, Stat, StatusBadge } from "@/components/ui";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDistance, formatRelativeTime } from "@/lib/geo";
import { getReports, getStats } from "@/lib/queries";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dasbor Petani · WoroTani",
};

export default async function PetaniPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?redirect=/petani");

  const [myReports, stats, myNotifications] = await Promise.all([
    getReports({ userId: user.id, limit: 50 }),
    getStats(),
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(6),
  ]);

  const pending = myReports.filter((report) => report.status === "PENDING").length;
  const verified = myReports.filter((report) => report.status === "VERIFIED").length;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-leaf-700 p-6 text-white sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-leaf-200">
          Dasbor Petani
        </p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          Halo, {user.name} 👋
        </h1>
        <p className="mt-2 max-w-xl text-leaf-50/90">
          {user.regionName
            ? `Wilayah Anda: ${user.regionName}. `
            : ""}
          Pantau laporan Anda dan peringatan hama terbaru di sekitar lahan.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/lapor"
            className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-sun-400 px-6 py-4 text-lg font-extrabold text-leaf-900 transition hover:bg-sun-300"
          >
            <Bug className="h-6 w-6" aria-hidden />
            Lapor Hama
          </Link>
          <Link
            href="/peta"
            className="inline-flex min-h-14 items-center gap-2 rounded-2xl border-2 border-white/70 px-6 py-4 text-lg font-bold transition hover:bg-white/10"
          >
            <MapIcon className="h-6 w-6" aria-hidden />
            Peta Wabah
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={<ClipboardList className="h-6 w-6" aria-hidden />}
          value={myReports.length}
          label="Total laporan saya"
        />
        <Stat
          icon={<Clock className="h-6 w-6" aria-hidden />}
          value={pending}
          label="Menunggu verifikasi"
          tone="sun"
        />
        <Stat
          icon={<CheckCircle2 className="h-6 w-6" aria-hidden />}
          value={verified}
          label="Terverifikasi"
        />
        <Stat
          icon={<BellRing className="h-6 w-6" aria-hidden />}
          value={stats.alertsSent}
          label="Peringatan terkirim"
          tone="grey"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-leaf-900">Riwayat Laporan Saya</h2>
          {myReports.length ? (
            myReports.map((report) => (
              <ReportCard
                key={report.id}
                report={{
                  id: report.id,
                  pestId: report.pestId,
                  pestName: report.pestName,
                  severity: report.pestSeverity,
                  status: report.status,
                  note: report.additionalNote,
                  photoUrl: report.photoUrl,
                  reporterName: report.userName,
                  regionName: report.regionName,
                  createdAtLabel: formatRelativeTime(report.createdAt),
                  distanceLabel: user.regionId ? undefined : undefined,
                }}
              />
            ))
          ) : (
            <EmptyState
              title="Belum ada laporan"
              description="Tekan tombol Lapor Hama untuk mengirim laporan pertama Anda."
            />
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-leaf-900">
            Peringatan Terbaru untuk Anda
          </h2>
          {myNotifications.length ? (
            myNotifications.map((item) => (
              <Card
                key={item.id}
                className={item.isRead ? "" : "border-sun-300 bg-sun-50"}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-extrabold text-leaf-900">
                    {item.title}
                  </p>
                  <StatusBadge status={item.isRead ? "VERIFIED" : "PENDING"} />
                </div>
                <p className="mt-2 text-sm text-mist-500">{item.message}</p>
                <p className="mt-2 text-xs font-semibold text-mist-400">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </Card>
            ))
          ) : (
            <EmptyState
              title="Belum ada peringatan"
              description="Anda akan menerima peringatan saat ada laporan terverifikasi di sekitar Anda."
              icon={<BellRing className="h-7 w-7" aria-hidden />}
            />
          )}
          <Card className="border-leaf-200 bg-leaf-50">
            <p className="flex items-center gap-2 text-base font-extrabold text-leaf-900">
              <ShieldCheck className="h-5 w-5 text-leaf-600" aria-hidden />
              Tips singkat
            </p>
            <p className="mt-2 text-sm text-mist-500">
              Periksa lahan pada pagi hari (06.00-08.00) karena sebagian besar hama
              aktif dan mudah terlihat. Catat perkembangannya minimal dua kali
              seminggu.
            </p>
            <p className="mt-3 text-xs font-semibold text-leaf-700">
              Radius peringatan otomatis: 30 km · jarak dihitung dengan formula
              haversine ({formatDistance(30)})
            </p>
          </Card>
          <Link href="/peringatan" className="block">
            <Button variant="secondary" className="w-full">
              Lihat semua peringatan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
