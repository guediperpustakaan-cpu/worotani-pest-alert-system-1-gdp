"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Inbox,
  Loader2,
  Radio,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { MapView } from "@/components/MapView";
import {
  Button,
  Card,
  EmptyState,
  SeverityBadge,
  StatusBadge,
} from "@/components/ui";
import { formatRelativeTime, MONTHS_ID } from "@/lib/geo";
import { SEVERITY_COLOR, type MapPoint } from "@/lib/mapTypes";
import { useWoroStore } from "@/store/useWoroStore";
import type { ApiReport } from "@/components/MapExplorer";

type RegionOption = { id: number; regionName: string };

type Analytics = {
  monthly: { month: string; total: number }[];
  topPests: { pestName: string; total: number; severity: string }[];
  perRegion: { regionName: string; total: number }[];
};

type Stats = {
  verifiedReports: number;
  pendingReports: number;
  activeUsers: number;
  farmers: number;
  pestTypes: number;
  regions: number;
  recentReports: number;
  alertsSent: number;
};

type Tab = "verifikasi" | "siaran" | "analitik";

const SEVERITY_FILL = { LOW: "#3f9445", MEDIUM: "#f5a300", HIGH: "#dc2626" };

function monthLabel(value: string) {
  const [, month] = value.split("-");
  return `${MONTHS_ID[Number(month) - 1] ?? month}`;
}

export function OfficerDashboard({
  pendingReports,
  regions,
  analytics,
  stats,
  staffName,
}: {
  pendingReports: ApiReport[];
  regions: RegionOption[];
  analytics: Analytics;
  stats: Stats;
  staffName: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("verifikasi");
  const [queue, setQueue] = useState<ApiReport[]>(pendingReports);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [broadcast, setBroadcast] = useState({
    regionId: String(regions[0]?.id ?? ""),
    priority: "HIGH" as "LOW" | "MEDIUM" | "HIGH",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const showToast = useWoroStore((state) => state.showToast);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports?status=PENDING&limit=100", {
        cache: "no-store",
      });
      const data = (await res.json()) as { reports: ApiReport[] };
      setQueue(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "verifikasi" && queue.length === 0) void loadQueue();
  }, [tab, queue.length, loadQueue]);

  const review = async (id: number, status: "VERIFIED" | "REJECTED") => {
    setActingId(id);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { error?: string; alerted?: number };
      if (!res.ok) {
        showToast("Gagal memproses", data.error ?? "Coba lagi nanti.", "error");
        return;
      }
      setQueue((current) => current.filter((report) => report.id !== id));
      showToast(
        status === "VERIFIED" ? "Laporan diverifikasi" : "Laporan ditolak",
        status === "VERIFIED"
          ? `${data.alerted ?? 0} petani sekitar menerima peringatan otomatis.`
          : "Laporan dihapus dari peta wabah.",
        status === "VERIFIED" ? "success" : "info",
      );
      router.refresh();
    } finally {
      setActingId(null);
    }
  };

  const sendBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionId: Number(broadcast.regionId),
          priority: broadcast.priority,
          message: broadcast.message,
        }),
      });
      const data = (await res.json()) as { error?: string; sent?: number };
      if (!res.ok) {
        showToast("Siaran gagal", data.error ?? "Coba lagi nanti.", "error");
        return;
      }
      showToast(
        "Siaran terkirim",
        `${data.sent ?? 0} pengguna di wilayah tersebut menerima pesan.`,
        "success",
      );
      setBroadcast((current) => ({ ...current, message: "" }));
      router.refresh();
    } finally {
      setSending(false);
    }
  };

  const heatPoints: MapPoint[] = useMemo(
    () =>
      queue.map((report) => ({
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
      })),
    [queue],
  );

  const monthly = analytics.monthly.map((point) => ({
    ...point,
    label: monthLabel(point.month),
  }));

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] bg-leaf-800 p-6 text-white sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-leaf-200">
          Dasbor Petugas
        </p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          Selamat bertugas, {staffName.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-2xl text-leaf-50/90">
          Verifikasi laporan petani, kirim siaran peringatan, dan pantau tren serangan
          hama di seluruh wilayah kerja Anda.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Menunggu verifikasi", value: stats.pendingReports },
            { label: "Laporan terverifikasi", value: stats.verifiedReports },
            { label: "Pengguna aktif", value: stats.activeUsers },
            { label: "Peringatan terkirim", value: stats.alertsSent },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-xs font-semibold text-leaf-100/80">{item.label}</p>
              <p className="text-2xl font-extrabold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "verifikasi", label: "Antrean Verifikasi", icon: Inbox },
            { key: "siaran", label: "Siaran Peringatan", icon: Radio },
            { key: "analitik", label: "Analitik", icon: BarChart3 },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 py-3 font-bold transition ${
                tab === item.key
                  ? "bg-leaf-600 text-white"
                  : "bg-white text-mist-500 ring-1 ring-mist-200"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
              {item.key === "verifikasi" && queue.length ? (
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-sun-400 px-1.5 text-xs font-extrabold text-leaf-900">
                  {queue.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "verifikasi" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-mist-500">
              {queue.length} laporan menunggu pemeriksaan Anda.
            </p>
            <Button variant="secondary" onClick={() => void loadQueue()} disabled={loading}>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              )}
              Muat Ulang Antrean
            </Button>
          </div>

          <MapView
            points={heatPoints}
            center={[-7.6, 112.3]}
            zoom={9}
            heatMode
            height="h-[300px]"
          />

          {queue.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {queue.map((report) => (
                <Card key={report.id} className="space-y-3">
                  <div className="flex gap-4">
                    <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-mist-100">
                      {report.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={report.photoUrl}
                          alt={`Foto ${report.pestName}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-4xl">🐛</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-extrabold text-leaf-900">
                        {report.pestName}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <SeverityBadge level={report.pestSeverity} />
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="mt-2 text-sm text-mist-500">
                        {report.additionalNote || "Tanpa catatan tambahan"}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-mist-400">
                        {report.userName} · {report.regionName ?? "Tanpa wilayah"} ·{" "}
                        {formatRelativeTime(report.createdAt)}
                      </p>
                      <p className="text-xs font-semibold text-mist-400">
                        Koordinat: {report.latitude.toFixed(4)},{" "}
                        {report.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex-1"
                      onClick={() => void review(report.id, "VERIFIED")}
                      disabled={actingId === report.id}
                    >
                      {actingId === report.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      ) : (
                        <BadgeCheck className="h-5 w-5" aria-hidden />
                      )}
                      Verifikasi
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => void review(report.id, "REJECTED")}
                      disabled={actingId === report.id}
                    >
                      <XCircle className="h-5 w-5" aria-hidden />
                      Tolak
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Antrean kosong"
              description="Semua laporan sudah diperiksa. Kerja bagus, Petugas!"
              icon={<BadgeCheck className="h-7 w-7" aria-hidden />}
            />
          )}
        </div>
      ) : null}

      {tab === "siaran" ? (
        <Card className="max-w-2xl">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-leaf-900">
            <Radio className="h-6 w-6 text-leaf-600" aria-hidden />
            Kirim Siaran Peringatan
          </h2>
          <p className="mt-1 text-sm text-mist-500">
            Pesan akan dikirim ke seluruh pengguna (petani & petugas) pada wilayah
            yang dipilih.
          </p>
          <form onSubmit={sendBroadcast} className="mt-5 space-y-4">
            <div>
              <label htmlFor="bc-region" className="mb-2 block text-sm font-bold text-leaf-800">
                Wilayah tujuan
              </label>
              <select
                id="bc-region"
                required
                value={broadcast.regionId}
                onChange={(event) =>
                  setBroadcast((current) => ({ ...current, regionId: event.target.value }))
                }
                className="w-full rounded-2xl border-2 border-mist-200 px-4 py-4 text-lg focus:border-leaf-500 focus:outline-none"
              >
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.regionName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-leaf-800">Prioritas pesan</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "HIGH", label: "Tinggi" },
                    { key: "MEDIUM", label: "Sedang" },
                    { key: "LOW", label: "Rendah" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() =>
                      setBroadcast((current) => ({ ...current, priority: option.key }))
                    }
                    className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
                      broadcast.priority === option.key
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
              <label htmlFor="bc-message" className="mb-2 block text-sm font-bold text-leaf-800">
                Isi pesan
              </label>
              <textarea
                id="bc-message"
                required
                rows={5}
                value={broadcast.message}
                onChange={(event) =>
                  setBroadcast((current) => ({ ...current, message: event.target.value }))
                }
                placeholder="Contoh: Waspadai serangan wereng batang cokelat. Lakukan pengeringan sawah dan pantau 2 kali seminggu."
                className="w-full rounded-2xl border-2 border-mist-200 px-4 py-3 text-base focus:border-leaf-500 focus:outline-none"
              />
            </div>
            <Button type="submit" size="lg" disabled={sending}>
              {sending ? (
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              ) : (
                <Send className="h-6 w-6" aria-hidden />
              )}
              Kirim Siaran
            </Button>
          </form>
        </Card>
      ) : null}

      {tab === "analitik" ? (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="text-lg font-extrabold text-leaf-900">
                Tren laporan per bulan
              </h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dde4dd" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#748075" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#748075" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #dde4dd",
                        fontSize: 13,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Jumlah laporan"
                      stroke="#2f7836"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-extrabold text-leaf-900">
                Hama paling sering dilaporkan
              </h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topPests} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#dde4dd" />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#748075" />
                    <YAxis
                      type="category"
                      dataKey="pestName"
                      width={130}
                      tick={{ fontSize: 11 }}
                      stroke="#748075"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #dde4dd",
                        fontSize: 13,
                      }}
                    />
                    <Bar dataKey="total" name="Jumlah laporan" radius={[0, 8, 8, 0]}>
                      {analytics.topPests.map((entry) => (
                        <Cell
                          key={entry.pestName}
                          fill={SEVERITY_FILL[entry.severity as keyof typeof SEVERITY_FILL] ?? "#3f9445"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <Card>
              <h3 className="text-lg font-extrabold text-leaf-900">
                Komposisi tingkat keparahan
              </h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.topPests.map((item) => ({
                        name: item.pestName,
                        value: item.total,
                        severity: item.severity,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={85}
                    >
                      {analytics.topPests.map((entry) => (
                        <Cell
                          key={entry.pestName}
                          fill={
                            SEVERITY_FILL[entry.severity as keyof typeof SEVERITY_FILL] ??
                            "#3f9445"
                          }
                        />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #dde4dd",
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-extrabold text-leaf-900">
                Sebaran laporan per wilayah
              </h3>
              <ul className="mt-4 space-y-3">
                {analytics.perRegion.map((region) => {
                  const max = analytics.perRegion[0]?.total || 1;
                  return (
                    <li key={region.regionName}>
                      <div className="flex items-center justify-between text-sm font-bold text-leaf-800">
                        <span className="truncate">{region.regionName}</span>
                        <span>{region.total}</span>
                      </div>
                      <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-mist-100">
                        <div
                          className="h-full rounded-full bg-leaf-500"
                          style={{ width: `${(region.total / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          <Card className="border-leaf-200 bg-leaf-50">
            <h3 className="text-lg font-extrabold text-leaf-900">
              Ringkasan wilayah & mitra
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Wilayah terjangkau", value: stats.regions },
                { label: "Jenis hama dipantau", value: stats.pestTypes },
                { label: "Petani terdaftar", value: stats.farmers },
                { label: "Laporan 6 bulan terakhir", value: stats.recentReports },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white p-4">
                  <p className="text-2xl font-extrabold text-leaf-900">{item.value}</p>
                  <p className="text-xs font-semibold text-mist-500">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-mist-500">
              Warna grafik mengikuti tingkat keparahan:{" "}
              <span className="font-bold text-[#dc2626]">merah = tinggi</span>,{" "}
              <span className="font-bold text-[#f5a300]">kuning = sedang</span>,{" "}
              <span className="font-bold text-[#3f9445]">hijau = rendah</span>.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
