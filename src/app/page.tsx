import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Bug,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  Map as MapIcon,
  Search,
  ShieldCheck,
  Sprout,
  Tractor,
  Users,
} from "lucide-react";
import { MapView } from "@/components/MapView";
import { ReportCard } from "@/components/ReportCard";
import { Card, SectionHeading, Stat } from "@/components/ui";
import { formatRelativeTime } from "@/lib/geo";
import type { MapPoint } from "@/lib/mapTypes";
import { getPests, getReports, getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

const HERO_IMAGE =
  "https://images.pexels.com/photos/18310739/pexels-photo-18310739.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600";

const FLOW = [
  {
    icon: Bug,
    title: "1. Deteksi Hama",
    text: "Petani menemukan gejala serangan di lahan dan mengambil foto langsung dari ponsel.",
  },
  {
    icon: ClipboardCheck,
    title: "2. Lapor & Verifikasi",
    text: "Laporan masuk ke antrean petugas lapangan untuk diperiksa kebenarannya.",
  },
  {
    icon: MapIcon,
    title: "3. Peta Wabah",
    text: "Laporan terverifikasi otomatis muncul di peta dengan warna tingkat keparahan.",
  },
  {
    icon: BellRing,
    title: "4. Peringatan & Panduan",
    text: "Petani sekitar radius 30 km menerima peringatan beserta panduan penanganan.",
  },
];

export default async function LandingPage() {
  const [stats, verifiedReports, pests] = await Promise.all([
    getStats(),
    getReports({ status: "VERIFIED", limit: 40 }),
    getPests(),
  ]);

  const points: MapPoint[] = verifiedReports.map((report) => ({
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

  const featuredPests = pests.slice(0, 3);

  return (
    <div className="space-y-14 pb-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-leaf-200 bg-leaf-800 text-white shadow-lg">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `url(${HERO_IMAGE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-leaf-900/95 via-leaf-900/80 to-leaf-700/60"
          aria-hidden
        />
        <div className="relative px-5 py-10 sm:px-10 sm:py-16 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur">
            <Sprout className="h-4 w-4" aria-hidden />
            Sistem Peringatan Hama Gotong Royong
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Saling Jaga Lahan, Amankan Panen
          </h1>
          <p className="mt-4 max-w-xl text-lg text-leaf-50/90">
            Laporkan serangan hama dari ponsel Anda, dan bantu petani lain di
            sekitar bertindak lebih cepat. Data wabah tampil langsung di peta
            interaktif WoroTani.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/lapor"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sun-400 px-7 py-4 text-lg font-extrabold text-leaf-900 transition hover:bg-sun-300"
            >
              <Bug className="h-6 w-6" aria-hidden />
              Lapor Hama Sekarang
            </Link>
            <Link
              href="/peta"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-white/70 px-7 py-4 text-lg font-bold text-white transition hover:bg-white/10"
            >
              <MapIcon className="h-6 w-6" aria-hidden />
              Lihat Peta Wabah
            </Link>
          </div>

          <dl className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Laporan Terverifikasi", value: stats.verifiedReports },
              { label: "Pengguna Aktif", value: stats.activeUsers },
              { label: "Jenis Hama", value: stats.pestTypes },
              { label: "Wilayah Terjangkau", value: stats.regions },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur"
              >
                <dt className="text-xs font-semibold text-leaf-100/80">
                  {item.label}
                </dt>
                <dd className="text-2xl font-extrabold sm:text-3xl">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Data Terkini"
          title="Kondisi wabah hama hari ini"
          description="Angka diperbarui langsung dari laporan petani yang telah diverifikasi petugas lapangan."
        />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat
            icon={<CheckCircle2 className="h-6 w-6" aria-hidden />}
            value={stats.verifiedReports}
            label="Laporan terverifikasi"
          />
          <Stat
            icon={<Users className="h-6 w-6" aria-hidden />}
            value={stats.activeUsers}
            label="Pengguna aktif"
            tone="grey"
          />
          <Stat
            icon={<BellRing className="h-6 w-6" aria-hidden />}
            value={stats.alertsSent}
            label="Peringatan terkirim"
            tone="sun"
          />
          <Stat
            icon={<Tractor className="h-6 w-6" aria-hidden />}
            value={stats.farmers}
            label="Petani terdaftar"
          />
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Peta Wabah"
            title="Sebaran serangan hama terbaru"
            description="Titik hijau berarti keparahan rendah, kuning sedang, dan merah tinggi. Ketuk titik untuk melihat detail dan panduan penanganan."
          />
          <Link
            href="/peta"
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-leaf-200 bg-white px-4 py-3 font-bold text-leaf-700 transition hover:border-leaf-400"
          >
            Buka peta penuh
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
        <div className="mt-6">
          <MapView
            points={points}
            center={[-7.6, 112.3]}
            zoom={9}
            height="h-[420px] sm:h-[520px]"
          />
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Cara Kerja"
          title="Empat langkah dari deteksi sampai panen aman"
          align="center"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="h-full">
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="text-lg font-extrabold text-leaf-900">{step.title}</h3>
                <p className="mt-2 text-sm text-mist-500">{step.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Kabar Terbaru"
            title="Laporan terverifikasi terbaru"
          />
          <Link
            href="/peringatan"
            className="inline-flex items-center gap-2 font-bold text-leaf-700 hover:text-leaf-800"
          >
            Lihat semua
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {verifiedReports.slice(0, 4).map((report) => (
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
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Wiki Hama"
            title="Kenali hama sebelum menyebar"
            description="Perpustakaan hama lengkap dengan gejala dan panduan penanganan yang mudah diikuti."
          />
          <Link
            href="/wiki"
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-leaf-200 bg-white px-4 py-3 font-bold text-leaf-700 transition hover:border-leaf-400"
          >
            <Search className="h-5 w-5" aria-hidden />
            Buka Wiki Hama
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {featuredPests.map((pest) => (
            <Link
              key={pest.id}
              href={`/wiki/${pest.id}`}
              className="group overflow-hidden rounded-3xl border border-mist-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-36 overflow-hidden bg-mist-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pest.imageGuideUrl}
                  alt={pest.pestName}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-mist-400">
                  {pest.cropTarget}
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-leaf-900">
                  {pest.pestName}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-mist-500">
                  {pest.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-leaf-200 bg-leaf-50 p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Coba Sekarang"
              title="Masuk dengan akun demo WoroTani"
              description="Gunakan salah satu akun berikut untuk mencoba alur pelaporan, verifikasi petugas, dan sistem siaran peringatan."
            />
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/masuk"
                className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-leaf-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-leaf-700"
              >
                Masuk
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                href="/daftar"
                className="inline-flex min-h-14 items-center gap-2 rounded-2xl border-2 border-leaf-300 bg-white px-6 py-4 text-lg font-bold text-leaf-800 transition hover:border-leaf-500"
              >
                Daftar sebagai Petani
              </Link>
            </div>
          </div>
          <ul className="space-y-3">
            {[
              {
                role: "Petani",
                email: "petani@worotani.id",
                password: "Petani#123",
                icon: Tractor,
              },
              {
                role: "Petugas Lapangan",
                email: "petugas@worotani.id",
                password: "Petugas#123",
                icon: ShieldCheck,
              },
              {
                role: "Administrator",
                email: "admin@worotani.id",
                password: "Admin#123",
                icon: Users,
              },
            ].map((account) => {
              const Icon = account.icon;
              return (
                <li
                  key={account.email}
                  className="flex items-center gap-3 rounded-2xl border border-leaf-200 bg-white p-4"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-leaf-100 text-leaf-700">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-leaf-900">
                      {account.role}
                    </p>
                    <p className="truncate text-xs font-semibold text-mist-500">
                      {account.email} · {account.password}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <footer className="flex flex-col items-center gap-2 border-t border-mist-200 pt-8 text-center text-sm text-mist-500">
        <span className="inline-flex items-center gap-2 font-extrabold text-leaf-800">
          <MapPin className="h-4 w-4" aria-hidden />
          WoroTani
        </span>
        <p>
          Saling jaga lahan, amankan panen. Dibangun untuk petani Indonesia dengan
          data gotong royong.
        </p>
      </footer>
    </div>
  );
}
