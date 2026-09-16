# WoroTani 🌱🐛

**Saling Jaga Lahan, Amankan Panen**

Sistem Peringatan Hama berbasis *crowd-sourcing* untuk petani Indonesia. Petani
melaporkan serangan hama secara real-time, petugas lapangan memverifikasi, lalu
petani lain di sekitar otomatis menerima peringatan beserta panduan penanganan.

## Alur Pengguna

1. Petani mendeteksi hama → mengisi formulir laporan bertahap (foto, jenis hama, GPS otomatis).
2. Laporan masuk ke **Antrean Verifikasi** petugas lapangan.
3. Laporan terverifikasi → titik muncul di **Peta Wabah** (hijau = rendah, kuning = sedang, merah = tinggi).
4. Petani dalam radius **30 km** otomatis menerima notifikasi.
5. Petani membaca **Panduan Penanganan** di Wiki Hama.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| UI | Next.js 16 (App Router) + React 19 + Tailwind CSS 4 |
| Ikon | lucide-react |
| Peta | Leaflet + React-Leaflet (OpenStreetMap) |
| Grafik | Recharts |
| State | Zustand (toast, sesi, lokasi GPS) |
| Database | PostgreSQL (Neon-compatible) + Drizzle ORM |
| Auth | Cookie sesi httpOnly + scrypt password hashing |

## Struktur Proyek

```
src/
├─ app/
│  ├─ page.tsx                 # Landing page (hero, statistik, peta, alur)
│  ├─ peta/                    # Peta wabah interaktif + filter + mode panas
│  ├─ lapor/                   # Formulir laporan 4 langkah
│  ├─ peringatan/              # Feed laporan terdekat + notifikasi
│  ├─ wiki/                    # Wiki hama (daftar + detail + panduan)
│  ├─ petani/                  # Dasbor petani (riwayat + notifikasi)
│  ├─ petugas/                 # Dasbor petugas (verifikasi, siaran, analitik)
│  ├─ masuk/, daftar/          # Autentikasi
│  └─ api/                     # REST API (auth, reports, pests, broadcast, ...)
├─ components/                 # MapCanvas, MapExplorer, ReportWizard, dst.
├─ db/                         # schema.ts (Drizzle), index.ts, seed.ts
├─ lib/                        # auth, geo (haversine), queries, mapTypes
└─ store/                      # Zustand store
scripts/seed.ts                # CLI seed
```

## Skema Database (Drizzle ORM)

- `regions` — wilayah (Kecamatan/Kabupaten) + titik tengah koordinat.
- `users` — nama, email, password (scrypt), phone, `role` (FARMER | OFFICER | ADMIN), `region_id`.
- `pests` — nama hama, deskripsi, gejala, panduan penanganan, foto, `severity_level` (LOW | MEDIUM | HIGH).
- `reports` — `user_id`, `pest_id`, `region_id`, latitude, longitude, `photo_url`, catatan, `status` (PENDING | VERIFIED | REJECTED), `verified_by`, `created_at`.
- `notifications` — `user_id`, `report_id`, judul, pesan, `priority`, `is_read`, `created_at`.

## Setup

```bash
# 1. Terapkan skema ke PostgreSQL (Neon atau lokal)
npx drizzle-kit push

# 2. Isi data contoh (wilayah, hama, pengguna, laporan, notifikasi)
npx tsx scripts/seed.ts

# 3. Jalankan
npm run dev      # pengembangan
npm run build && npm run start   # produksi
```

Aplikasi juga menjalankan *auto-seed* aman (`ensureSeeded()`) bila tabel `pests`
masih kosong, sehingga pratinjau selalu memiliki data.

## Akun Demo

| Peran | Email | Kata Sandi |
| --- | --- | --- |
| Petani | petani@worotani.id | Petani#123 |
| Petugas Lapangan | petugas@worotani.id | Petugas#123 |
| Administrator | admin@worotani.id | Admin#123 |

## API

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| POST | `/api/auth/login` | Masuk |
| POST | `/api/auth/register` | Daftar petani |
| POST/GET | `/api/auth/session` | Keluar / cek sesi |
| GET | `/api/reports?status=&regionId=&limit=` | Daftar laporan |
| POST | `/api/reports` | Kirim laporan (login) |
| PATCH | `/api/reports/:id` | Verifikasi / tolak (petugas) → kirim peringatan 30 km |
| GET | `/api/pests?q=` | Wiki hama (pencarian) |
| GET | `/api/stats?include=analytics` | Statistik & analitik |
| GET/PATCH | `/api/notifications` | Notifikasi & tandai terbaca |
| POST | `/api/broadcast` | Siaran peringatan per wilayah (petugas) |
| GET | `/api/health` | Health check |
