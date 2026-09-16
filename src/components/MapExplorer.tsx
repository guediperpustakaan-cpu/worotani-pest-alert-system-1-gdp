"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Flame,
  Loader2,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { MapView } from "@/components/MapView";
import { ReportCard, type ReportCardData } from "@/components/ReportCard";
import { Button, Card, EmptyState, SeverityBadge, SkeletonBlock } from "@/components/ui";
import { formatDistance, formatRelativeTime, haversineKm } from "@/lib/geo";
import type { MapPoint } from "@/lib/mapTypes";
import { useWoroStore } from "@/store/useWoroStore";

export type ApiReport = {
  id: number;
  latitude: number;
  longitude: number;
  photoUrl: string;
  additionalNote: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
  pestId: number;
  pestName: string;
  pestSeverity: "LOW" | "MEDIUM" | "HIGH";
  userId: number;
  userName: string;
  regionId: number | null;
  regionName: string | null;
};

type PestOption = { id: number; pestName: string; severityLevel: string };

const DEFAULT_CENTER: [number, number] = [-7.6, 112.3];

function toCard(report: ApiReport, distanceKm: number | null): ReportCardData {
  return {
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
    distanceLabel: distanceKm !== null ? formatDistance(distanceKm) : undefined,
  };
}

export function MapExplorer({
  initialReports,
  pests,
}: {
  initialReports: ApiReport[];
  pests: PestOption[];
}) {
  const [reports, setReports] = useState<ApiReport[]>(initialReports);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VERIFIED" | "PENDING">("ALL");
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
  const [pestFilter, setPestFilter] = useState<number | "ALL">("ALL");
  const [heatMode, setHeatMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [focusPointId, setFocusPointId] = useState<number | null>(null);

  const coords = useWoroStore((state) => state.coords);
  const locationStatus = useWoroStore((state) => state.locationStatus);
  const requestLocation = useWoroStore((state) => state.requestLocation);

  useEffect(() => {
    void requestLocation(true);
  }, [requestLocation]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports?limit=200", { cache: "no-store" });
      const data = (await res.json()) as { reports: ApiReport[] };
      setReports(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const enriched = useMemo(
    () =>
      reports
        .map((report) => ({
          report,
          distanceKm: coords
            ? haversineKm(coords, { lat: report.latitude, lng: report.longitude })
            : null,
        }))
        .sort((a, b) => {
          if (a.distanceKm !== null && b.distanceKm !== null) {
            return a.distanceKm - b.distanceKm;
          }
          return (
            new Date(b.report.createdAt).getTime() -
            new Date(a.report.createdAt).getTime()
          );
        }),
    [reports, coords],
  );

  const filtered = useMemo(
    () =>
      enriched.filter(({ report }) => {
        if (statusFilter !== "ALL" && report.status !== statusFilter) return false;
        if (severityFilter !== "ALL" && report.pestSeverity !== severityFilter)
          return false;
        if (pestFilter !== "ALL" && report.pestId !== pestFilter) return false;
        return true;
      }),
    [enriched, statusFilter, severityFilter, pestFilter],
  );

  const points: MapPoint[] = filtered.map(({ report, distanceKm }) => ({
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
    distanceLabel: distanceKm !== null ? formatDistance(distanceKm) : undefined,
  }));

  const cards = filtered.map(({ report, distanceKm }) => toCard(report, distanceKm));
  const center: [number, number] = coords ? [coords.lat, coords.lng] : DEFAULT_CENTER;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-leaf-900 sm:text-3xl">
            Peta Wabah Hama
          </h1>
          <p className="mt-1 text-sm text-mist-500">
            {filtered.length} titik ditampilkan
            {coords
              ? " · diurutkan dari lokasi Anda"
              : " · aktifkan GPS untuk urutan jarak"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void requestLocation()}>
            {locationStatus === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Target className="h-5 w-5" aria-hidden />
            )}
            Lokasi Saya
          </Button>
          <Button
            variant={heatMode ? "sun" : "secondary"}
            onClick={() => setHeatMode((mode) => !mode)}
          >
            <Flame className="h-5 w-5" aria-hidden />
            Mode Panas
          </Button>
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-5 w-5" aria-hidden />
            )}
            Muat Ulang
          </Button>
          <Button
            variant="secondary"
            className="lg:hidden"
            onClick={() => setShowFilters((open) => !open)}
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden />
            Saring
          </Button>
        </div>
      </div>

      <Card className={`${showFilters ? "block" : "hidden"} lg:block`}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-sm font-bold text-leaf-800">Status Laporan</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "ALL", label: "Semua" },
                  { key: "VERIFIED", label: "Terverifikasi" },
                  { key: "PENDING", label: "Menunggu" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setStatusFilter(option.key)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                    statusFilter === option.key
                      ? "bg-leaf-600 text-white"
                      : "bg-mist-100 text-mist-500 hover:bg-mist-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-leaf-800">Tingkat Keparahan</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "ALL", label: "Semua" },
                  { key: "HIGH", label: "Tinggi" },
                  { key: "MEDIUM", label: "Sedang" },
                  { key: "LOW", label: "Rendah" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSeverityFilter(option.key)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                    severityFilter === option.key
                      ? "bg-leaf-600 text-white"
                      : "bg-mist-100 text-mist-500 hover:bg-mist-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="pest-filter" className="mb-2 block text-sm font-bold text-leaf-800">
              Jenis Hama
            </label>
            <select
              id="pest-filter"
              value={String(pestFilter)}
              onChange={(event) =>
                setPestFilter(
                  event.target.value === "ALL" ? "ALL" : Number(event.target.value),
                )
              }
              className="w-full rounded-2xl border-2 border-mist-200 bg-white px-4 py-3 text-base font-semibold text-leaf-900 focus:border-leaf-500 focus:outline-none"
            >
              <option value="ALL">Semua hama</option>
              {pests.map((pest) => (
                <option key={pest.id} value={pest.id}>
                  {pest.pestName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <MapView
          points={points}
          center={center}
          zoom={coords ? 12 : 9}
          heatMode={heatMode}
          userLocation={coords}
          focusPointId={focusPointId}
          height="h-[60vh] lg:h-[72vh]"
        />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-leaf-600" aria-hidden />
            <h2 className="text-lg font-extrabold text-leaf-900">Laporan Sekitar</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <Card key={index}>
                  <div className="flex gap-3">
                    <SkeletonBlock className="h-24 w-24" />
                    <div className="flex-1 space-y-2">
                      <SkeletonBlock className="h-5 w-3/4" />
                      <SkeletonBlock className="h-6 w-1/2" />
                      <SkeletonBlock className="h-4 w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : cards.length ? (
            <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setFocusPointId(card.id)}
                  className="w-full text-left"
                >
                  <ReportCard report={card}>
                    <span className="text-xs font-bold text-mist-400">
                      Urutan #{index + 1}
                    </span>
                  </ReportCard>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum ada laporan"
              description="Coba ubah filter atau muat ulang data peta."
            />
          )}
          <Card>
            <p className="text-sm font-bold text-leaf-800">Keterangan warna</p>
            <ul className="mt-3 space-y-2 text-sm text-mist-500">
              <li className="flex items-center gap-2">
                <SeverityBadge level="HIGH" /> Serangan berat, segera tindak lanjuti
              </li>
              <li className="flex items-center gap-2">
                <SeverityBadge level="MEDIUM" /> Perlu pemantauan rutin
              </li>
              <li className="flex items-center gap-2">
                <SeverityBadge level="LOW" /> Masih terkendali
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
