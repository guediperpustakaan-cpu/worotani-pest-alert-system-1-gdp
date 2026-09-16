"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CheckCheck,
  Loader2,
  Navigation,
  Radar,
  Target,
} from "lucide-react";
import { ReportCard, type ReportCardData } from "@/components/ReportCard";
import { Button, Card, EmptyState, SeverityBadge, SkeletonBlock } from "@/components/ui";
import { formatDistance, formatRelativeTime, haversineKm } from "@/lib/geo";
import { useWoroStore } from "@/store/useWoroStore";
import type { ApiReport } from "@/components/MapExplorer";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  isRead: boolean;
  createdAt: string;
};

const RADIUS_OPTIONS = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
  { value: 50, label: "50 km" },
  { value: 0, label: "Semua" },
];

export function AlertFeed({ initialReports }: { initialReports: ApiReport[] }) {
  const [tab, setTab] = useState<"nearby" | "inbox">("nearby");
  const [reports, setReports] = useState<ApiReport[]>(initialReports);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [radius, setRadius] = useState(25);
  const [loading, setLoading] = useState(false);

  const coords = useWoroStore((state) => state.coords);
  const locationStatus = useWoroStore((state) => state.locationStatus);
  const requestLocation = useWoroStore((state) => state.requestLocation);
  const showToast = useWoroStore((state) => state.showToast);
  const setUnread = useWoroStore((state) => state.setUnread);

  useEffect(() => {
    void requestLocation(true);
  }, [requestLocation]);

  const loadNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    const data = (await res.json()) as { notifications: NotificationItem[] };
    setNotifications(data.notifications ?? []);
    setUnread((data.notifications ?? []).filter((item) => !item.isRead).length);
  }, [setUnread]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = (await res.json()) as { notifications: NotificationItem[] };
      setNotifications(data.notifications ?? []);
      setUnread((data.notifications ?? []).filter((item) => !item.isRead).length);
    })();
  }, [setNotifications, setUnread]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports?status=VERIFIED&limit=200", {
        cache: "no-store",
      });
      const data = (await res.json()) as { reports: ApiReport[] };
      setReports(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const nearby = useMemo(() => {
    if (!coords) return [];
    return reports
      .map((report) => ({
        report,
        distanceKm: haversineKm(coords, {
          lat: report.latitude,
          lng: report.longitude,
        }),
      }))
      .filter(({ distanceKm }) => radius === 0 || distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [reports, coords, radius]);

  const cards: ReportCardData[] = nearby.map(({ report, distanceKm }) => ({
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
    distanceLabel: formatDistance(distanceKm),
  }));

  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    showToast("Semua notifikasi ditandai terbaca", undefined, "info");
    void loadNotifications();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-leaf-900 sm:text-3xl">
          Peringatan Hama
        </h1>
        <p className="mt-1 text-sm text-mist-500">
          Laporan terverifikasi terdekat dan pesan siaran dari petugas lapangan.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("nearby")}
          className={`inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 py-3 font-bold transition ${
            tab === "nearby" ? "bg-leaf-600 text-white" : "bg-white text-mist-500 ring-1 ring-mist-200"
          }`}
        >
          <Radar className="h-5 w-5" aria-hidden />
          Sekitar Saya ({cards.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={`inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 py-3 font-bold transition ${
            tab === "inbox" ? "bg-leaf-600 text-white" : "bg-white text-mist-500 ring-1 ring-mist-200"
          }`}
        >
          <BellRing className="h-5 w-5" aria-hidden />
          Notifikasi ({notifications.length})
        </button>
      </div>

      {tab === "nearby" ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-leaf-800">Radius pemantauan</p>
                <p className="text-xs text-mist-500">
                  {coords
                    ? "Jarak dihitung dari posisi GPS Anda saat ini."
                    : "Aktifkan lokasi untuk menghitung jarak."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRadius(option.value)}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                      radius === option.value
                        ? "bg-leaf-600 text-white"
                        : "bg-mist-100 text-mist-500 hover:bg-mist-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void requestLocation()}>
                {locationStatus === "loading" ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <Target className="h-5 w-5" aria-hidden />
                )}
                Perbarui Lokasi
              </Button>
              <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <Navigation className="h-5 w-5" aria-hidden />
                )}
                Muat Data
              </Button>
            </div>
          </Card>

          {!coords ? (
            <EmptyState
              title="Lokasi belum aktif"
              description="Tekan tombol Perbarui Lokasi dan izinkan akses GPS untuk melihat laporan terdekat."
              icon={<Target className="h-7 w-7" aria-hidden />}
            />
          ) : loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <Card key={index}>
                  <div className="flex gap-3">
                    <SkeletonBlock className="h-24 w-24" />
                    <div className="flex-1 space-y-2">
                      <SkeletonBlock className="h-5 w-2/3" />
                      <SkeletonBlock className="h-6 w-1/3" />
                      <SkeletonBlock className="h-4 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : cards.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {cards.map((card) => (
                <ReportCard key={card.id} report={card} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aman di radius ini"
              description="Belum ada laporan terverifikasi dalam radius yang Anda pilih."
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => void markAll()}>
              <CheckCheck className="h-5 w-5" aria-hidden />
              Tandai Semua Terbaca
            </Button>
          </div>
          {notifications.length ? (
            notifications.map((item) => (
              <article
                key={item.id}
                className={`animate-fade-up rounded-3xl border p-4 shadow-sm ${
                  item.isRead
                    ? "border-mist-200 bg-white"
                    : "border-sun-300 bg-sun-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-extrabold text-leaf-900">
                    {item.title}
                  </h2>
                  <SeverityBadge level={item.priority} />
                </div>
                <p className="mt-2 text-sm text-mist-500">{item.message}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-mist-400">
                  <span>{formatRelativeTime(item.createdAt)}</span>
                  <Link
                    href="/wiki"
                    className="font-bold text-leaf-700 hover:text-leaf-800"
                  >
                    Buka Wiki Hama →
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="Belum ada notifikasi"
              description="Masuk untuk menerima peringatan hama di sekitar lahan Anda."
              icon={<BellRing className="h-7 w-7" aria-hidden />}
            />
          )}
        </div>
      )}
    </div>
  );
}
