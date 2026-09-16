import Link from "next/link";
import { Bug, Clock, MapPin, Navigation, User } from "lucide-react";
import { SeverityBadge, StatusBadge } from "@/components/ui";

export type ReportCardData = {
  id: number;
  pestId: number;
  pestName: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "VERIFIED" | "REJECTED";
  note: string;
  photoUrl: string;
  reporterName: string;
  regionName: string | null;
  createdAtLabel: string;
  distanceLabel?: string;
};

export function ReportCard({
  report,
  children,
}: {
  report: ReportCardData;
  children?: React.ReactNode;
}) {
  return (
    <article className="animate-fade-up overflow-hidden rounded-3xl border border-mist-200 bg-white shadow-sm">
      <div className="flex gap-4 p-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-mist-100 sm:h-28 sm:w-28">
          {report.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={report.photoUrl}
              alt={`Foto laporan ${report.pestName}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-3xl">🐛</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-extrabold leading-tight text-leaf-900">
              {report.pestName}
            </h3>
            {report.distanceLabel ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-leaf-600 px-2.5 py-1 text-xs font-bold text-white">
                <Navigation className="h-3.5 w-3.5" aria-hidden />
                {report.distanceLabel}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <SeverityBadge level={report.severity} />
            <StatusBadge status={report.status} />
          </div>
          {report.note ? (
            <p className="mt-2 line-clamp-2 text-sm text-mist-500">{report.note}</p>
          ) : null}
          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-mist-400">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" aria-hidden />
              {report.reporterName}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {report.regionName ?? "Tidak diketahui"}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {report.createdAtLabel}
            </div>
          </dl>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mist-200 bg-mist-50 px-4 py-3">
        <Link
          href={`/wiki/${report.pestId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-leaf-700 ring-1 ring-leaf-200 transition hover:bg-leaf-50"
        >
          <Bug className="h-4 w-4" aria-hidden />
          Panduan Penanganan
        </Link>
        {children}
      </div>
    </article>
  );
}
