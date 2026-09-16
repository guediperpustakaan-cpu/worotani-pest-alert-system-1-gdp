import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  Bug,
  CalendarClock,
  ListChecks,
  Stethoscope,
} from "lucide-react";
import { MapView } from "@/components/MapView";
import { ReportCard } from "@/components/ReportCard";
import { Card, SeverityBadge } from "@/components/ui";
import { db } from "@/db";
import { pests } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { formatRelativeTime } from "@/lib/geo";
import type { MapPoint } from "@/lib/mapTypes";
import { getReports } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureSeeded();
  const { id } = await params;
  const pestId = Number(id);
  if (!Number.isFinite(pestId)) notFound();

  const [pest] = await db
    .select()
    .from(pests)
    .where(eq(pests.id, pestId))
    .limit(1);

  if (!pest) notFound();

  const relatedReports = await getReports({ limit: 200 });
  const filtered = relatedReports.filter((report) => report.pestId === pest.id);
  const verified = filtered.filter((report) => report.status === "VERIFIED");

  const points: MapPoint[] = filtered.slice(0, 60).map((report) => ({
    id: report.id,
    lat: report.latitude,
    lng: report.longitude,
    pestId: report.pestId,
    pestName: report.pestName,
    severity: report.pestSeverity,
    status: report.status,
    note: report.additionalNote,
    photoUrl: report.photoUrl,
    reporterName: report.userName,
    regionName: report.regionName,
    createdAtLabel: formatRelativeTime(report.createdAt),
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/wiki"
        className="inline-flex items-center gap-2 text-sm font-bold text-leaf-700 hover:text-leaf-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Kembali ke Wiki Hama
      </Link>

      <div className="overflow-hidden rounded-[2rem] border border-mist-200 bg-white shadow-sm">
        <div className="relative h-56 sm:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pest.imageGuideUrl}
            alt={pest.pestName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-leaf-900/85 to-transparent" />
          <div className="absolute bottom-0 p-5 text-white sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wide text-leaf-100">
              {pest.cropTarget}
            </p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              {pest.pestName}
            </h1>
            <p className="text-sm italic text-leaf-100">{pest.scientificName}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 p-5">
          <SeverityBadge level={pest.severityLevel} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mist-100 px-3 py-1 text-sm font-bold text-mist-500">
            <Bug className="h-4 w-4" aria-hidden />
            {filtered.length} laporan petani
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1 text-sm font-bold text-leaf-800">
            <ListChecks className="h-4 w-4" aria-hidden />
            {verified.length} terverifikasi
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-leaf-900">
            <Bug className="h-5 w-5 text-leaf-600" aria-hidden />
            Deskripsi
          </h2>
          <p className="mt-2 text-base leading-relaxed text-mist-500">
            {pest.description}
          </p>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-leaf-900">
            <Stethoscope className="h-5 w-5 text-leaf-600" aria-hidden />
            Gejala Serangan
          </h2>
          <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-mist-500">
            {pest.symptoms}
          </p>
        </Card>
      </div>

      <Card className="border-leaf-200 bg-leaf-50">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-leaf-900">
          <ListChecks className="h-6 w-6 text-leaf-600" aria-hidden />
          Panduan Penanganan
        </h2>
        <ol className="mt-3 space-y-3">
          {pest.treatmentGuide
            .split(/\d\)/)
            .map((step) => step.trim())
            .filter(Boolean)
            .map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-leaf-600 text-sm font-extrabold text-white">
                  {index + 1}
                </span>
                <p className="text-base leading-relaxed text-leaf-900">{step}</p>
              </li>
            ))}
        </ol>
      </Card>

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-leaf-900">
          <CalendarClock className="h-5 w-5 text-leaf-600" aria-hidden />
          Sebaran laporan {pest.pestName}
        </h2>
        <MapView
          points={points}
          center={points[0] ? [points[0].lat, points[0].lng] : [-7.6, 112.3]}
          zoom={10}
          height="h-[380px]"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-extrabold text-leaf-900">
          Laporan terbaru hama ini
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.slice(0, 6).map((report) => (
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
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
