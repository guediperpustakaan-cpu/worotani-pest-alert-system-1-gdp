import { db } from "./index";
import {
  notifications,
  pests,
  regions,
  reports,
  users,
} from "./schema";
import { hashPassword } from "../lib/hash";

const PEST_PHOTOS = [
  "https://images.pexels.com/photos/39039077/pexels-photo-39039077.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/31220429/pexels-photo-31220429.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/34551231/pexels-photo-34551231.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/27501108/pexels-photo-27501108.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/35512156/pexels-photo-35512156.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/32391780/pexels-photo-32391780.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/27968373/pexels-photo-27968373.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/32893669/pexels-photo-32893669.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
];

type RegionSeed = {
  name: string;
  lat: number;
  lng: number;
};

const REGION_SEEDS: RegionSeed[] = [
  { name: "Kecamatan Ngawi Kota", lat: -7.4056, lng: 111.4453 },
  { name: "Kabupaten Bojonegoro", lat: -7.15, lng: 111.8833 },
  { name: "Kabupaten Madiun", lat: -7.63, lng: 111.52 },
  { name: "Kabupaten Jombang", lat: -7.54, lng: 112.33 },
  { name: "Kabupaten Kediri", lat: -7.848, lng: 112.017 },
  { name: "Kabupaten Lamongan", lat: -7.11, lng: 112.41 },
  { name: "Kabupaten Banyuwangi", lat: -8.22, lng: 114.37 },
  { name: "Kabupaten Malang", lat: -8.1, lng: 112.7 },
];

const PEST_SEEDS = [
  {
    pestName: "Wereng Batang Cokelat",
    scientificName: "Nilaparvata lugens",
    cropTarget: "Padi",
    severityLevel: "HIGH" as const,
    description:
      "Serangga kecil pengisap cairan batang padi yang berkembang sangat cepat dan dapat menyebabkan gejala hopper burn (batang menguning lalu mengering seperti terbakar).",
    symptoms:
      "Rumpun padi menguning dari tengah petak; batang berlubang banyak bekas isapan; terlihat koloni wereng di pangkal batang; tanaman layu mendadak.",
    treatmentGuide:
      "1) Keringkan petakan sawah 3-5 hari untuk memutus siklus wereng. 2) Gunakan perangkap lampu per 1 hektar pada malam hari. 3) Semprot insektisida bila populasi > 5 ekor/rumpun, gunakan golongan yang berbeda tiap musim agar tidak resisten. 4) Pasang tanaman perangkap seperti bunga mimba di tepi petak.",
  },
  {
    pestName: "Penggerek Batang Padi",
    scientificName: "Scirpophaga incertulas",
    cropTarget: "Padi",
    severityLevel: "MEDIUM" as const,
    description:
      "Ngengat bertelur di daun padi, larvanya masuk ke dalam batang dan memakan jaringan dalam sehingga membentuk daun bendera dan malai kosong.",
    symptoms:
      "Ada daun mengering berwarna cokelat khas 'daun bendera'; malai padi kosong dan mudah dicabut; tanduk telur berambut di ujung daun.",
    treatmentGuide:
      "1) Pangkas dan musnahkan batang berTelur. 2) Atur waktu tanam serempak dalam satu hamparan. 3) Gunakan musuh alami seperti larva parasitoid Trichogramma. 4) Semprot hanya bila ambang 5% rumpun terserang sudah terlampaui.",
  },
  {
    pestName: "Walang Sangit",
    scientificName: "Leptocorisa oratorius",
    cropTarget: "Padi",
    severityLevel: "MEDIUM" as const,
    description:
      "Hama pengisap buah muda yang menyerang saat fase berbunging hingga pengisengan malai, menyebabkan gabah hampa dan beras pecah.",
    symptoms:
      "Gabah hampa banyak; bercak bekas isapan pada malai; baunya menyengat saat disentuh; serangan berat pada pagi dan sore hari.",
    treatmentGuide:
      "1) Tanam serempak agar masa berbunging tidak terpecah. 2) Pasang perangkap lampu atau godongan bebek. 3) Semprot insektisida berbahan aktif kartop hidroklorida pada saat 50% malai berbunga.",
  },
  {
    pestName: "Ulat Grayak",
    scientificName: "Spodoptera litura",
    cropTarget: "Kedelai, Bawang, Cabai",
    severityLevel: "HIGH" as const,
    description:
      "Ulat pemakan daun yang sangat rakus, mampu menghabiskan seluruh permukaan daun dalam 2-3 hari dan menyerang banyak jenis tanaman.",
    symptoms:
      "Daun berlubang tidak beraturan, tersisa tulang daun; kumpulan telur berbulu di bawah daun; ulat hijau kehitaman aktif malam hari.",
    treatmentGuide:
      "1) Kumpulkan kelompok telur dan ulat muda secara manual. 2) Semprot Beauveria bassiana atau NPV yang aman bagi musuh alami. 3) Gunakan perangkap feromon sex lure 20 unit/ha. 4) Hindari pemupukan nitrogen berlebih.",
  },
  {
    pestName: "Tikus Sawah",
    scientificName: "Rattus argentiventer",
    cropTarget: "Padi",
    severityLevel: "MEDIUM" as const,
    description:
      "Hama vertebrata yang memotong batang padi muda dan memakan gabah masak, merusak petakan sawah dari tepi galeng.",
    symptoms:
      "Batang padi terpotong rapi tersebar; lubang aktif di galeng; bekas gigitan pada malai; serangan berbentuk bercak dari tepi petak.",
    treatmentGuide:
      "1) Gerakan pengendalian serempak (GPTS) dengan bubu paralon di seluruh hamparan. 2) Sanitasi galeng dan bersihkan sisa panen. 3) Gunakan rodentisida antikoagulan sesuai dosis pada lubang aktif. 4) Pelihara predator alami seperti ular sawah dan burung hantu.",
  },
  {
    pestName: "Kutu Daun",
    scientificName: "Aphis craccivora",
    cropTarget: "Kacang-kacangan, Cabai",
    severityLevel: "LOW" as const,
    description:
      "Serangga kecil hitam kehijauan yang mengisap cairan daun muda dan menjadi vektor virus kerdil pada tanaman kacang dan sayur.",
    symptoms:
      "Daun muda keriting dan menguning; koloni kutu di balik daun; embun madu memicu jamur jelaga; tanaman tumbuh kerdil.",
    treatmentGuide:
      "1) Semprot air sabun nabati atau minyak nimbi 2-3 kali seminggu. 2) Lepaskan musuh alami seperti kumbang koksi. 3) Singkirkan tanaman inaman liar di sekitar petak. 4) Gunakan insektisida selektif bila populasi meluas.",
  },
  {
    pestName: "Lalat Buah",
    scientificName: "Bactrocera dorsalis",
    cropTarget: "Mangga, Jeruk, Pepaya",
    severityLevel: "MEDIUM" as const,
    description:
      "Lalat yang menusukkan telur ke dalam buah muda, larvanya memakan daging buah sehingga busuk dan jatuh sebelum matang.",
    symptoms:
      "Bintik tusukan pada kulit buah; buah jatuh prematur dan membusuk; larva putih di dalam daging buah.",
    treatmentGuide:
      "1) Pasang perangkap atraktan metil eugenol 16 unit/ha. 2) Kumpulkan dan musnahkan buah jatuh dengan dikubur atau dibakar. 3) Bungkus buah saat masih muda. 4) Semprot protein bait pada daun bagian bawah.",
  },
  {
    pestName: "Penyakit Blas",
    scientificName: "Pyricularia oryzae",
    cropTarget: "Padi",
    severityLevel: "HIGH" as const,
    description:
      "Penyakit jamur yang menyerang daun dan malai padi, sangat cepat menyebar pada musim hujan dan suhu dingin.",
    symptoms:
      "Bercak berbentuk mata ikan berwarna cokelat dengan tepi gelap pada daun; malai mengering putih (blank grain); butir gabah tidak terisi.",
    treatmentGuide:
      "1) Gunakan varietas tahan seperti Inpari 32 dan 33. 2) Atur jarak tanam agar sirkulasi udara lancar. 3) Hindari pemupukan nitrogen berlebihan. 4) Semprot fungisida berbahan aktif trisiklazol saat bercak pertama muncul.",
  },
  {
    pestName: "Thrips Bawang",
    scientificName: "Thrips tabaci",
    cropTarget: "Bawang Merah",
    severityLevel: "MEDIUM" as const,
    description:
      "Serangga sangat kecil pengisap daun bawang yang menyebabkan daun berwarna keperakan dan mengering pada musim kemarau.",
    symptoms:
      "Daun berwarna keperakan mengilap lalu mengering dari ujung; bentuk daun terpelintir; pertumbuhan umbi terhambat.",
    treatmentGuide:
      "1) Rotasi tanaman dengan padi untuk memutus siklus. 2) Pasang perangkap lengket biru 400 lembar/ha. 3) Siram secara teratur agar kelembaban terjaga. 4) Semprot akarisida nabati bila populasi meningkat.",
  },
  {
    pestName: "Kumbang Tanduk Kelapa",
    scientificName: "Oryctes rhinoceros",
    cropTarget: "Kelapa Sawit, Kelapa",
    severityLevel: "MEDIUM" as const,
    description:
      "Kumbang besar yang menyerang titik tumbuh tanaman kelapa, memotong daun muda dan menyebabkan mahkota berbentuk seperti payung rusak.",
    symptoms:
      "Daun muda terpotong berbentuk V; titik tumbuh berlubang; pangkal pelepah berlubang besar dengan serbuk serat.",
    treatmentGuide:
      "1) Sanitasi lahan dan musnahkan batang melapuk sebagai tempat berkembang biak. 2) Gunakan jamur Metarhizium anisopliae pada lubang. 3) Pasang perangkap feromon agregasi. 4) Tanam tanaman penutup di sekitar pokok.",
  },
];

const USER_SEEDS = [
  {
    name: "Bayu Wicaksono",
    email: "admin@worotani.id",
    password: "Admin#123",
    phone: "0812-1111-2222",
    role: "ADMIN" as const,
    regionIndex: 0,
  },
  {
    name: "Siti Rahmawati",
    email: "petugas@worotani.id",
    password: "Petugas#123",
    phone: "0813-2222-3333",
    role: "OFFICER" as const,
    regionIndex: 0,
  },
  {
    name: "Slamet Riyadi",
    email: "petani@worotani.id",
    password: "Petani#123",
    phone: "0857-3333-4444",
    role: "FARMER" as const,
    regionIndex: 0,
  },
  { name: "Wahyu Nugroho", email: "wahyu@worotani.id", password: "Petani#123", phone: "0856-7777-1111", role: "FARMER" as const, regionIndex: 1 },
  { name: "Kholifatul Aini", email: "kholifah@worotani.id", password: "Petani#123", phone: "0856-7777-2222", role: "FARMER" as const, regionIndex: 2 },
  { name: "Tri Susanto", email: "tri@worotani.id", password: "Petani#123", phone: "0856-7777-3333", role: "FARMER" as const, regionIndex: 3 },
  { name: "Endang Saputra", email: "endang@worotani.id", password: "Petani#123", phone: "0856-7777-4444", role: "FARMER" as const, regionIndex: 4 },
  { name: "Marsudi", email: "marsudi@worotani.id", password: "Petani#123", phone: "0856-7777-5555", role: "FARMER" as const, regionIndex: 5 },
  { name: "Nur Hidayah", email: "nur@worotani.id", password: "Petani#123", phone: "0856-7777-6666", role: "FARMER" as const, regionIndex: 6 },
  { name: "Joko Purnomo", email: "joko@worotani.id", password: "Petani#123", phone: "0856-7777-7777", role: "FARMER" as const, regionIndex: 7 },
  { name: "Rina Andriyani", email: "rina@worotani.id", password: "Petani#123", phone: "0856-7777-8888", role: "FARMER" as const, regionIndex: 7 },
  { name: "Ahmad Fauzi", email: "fauzi@worotani.id", password: "Petugas#123", phone: "0813-4444-9999", role: "OFFICER" as const, regionIndex: 4 },
];

const REPORT_NOTES = [
  "Serangan mulai terlihat di petak sebelah timur, sudah 3 hari semakin luas.",
  "Ditemukan saat pemupukan pagi, mohon dicek petugas secepatnya.",
  "Luas serangan sekitar 20 rumpun pertama, masih terbatas di galeng.",
  "Tetangga sebelah juga mengeluhkan hal yang sama.",
  "Sudah disemprot nabati tapi belum banyak berubah.",
  "Muncul setelah hujan deras minggu lalu.",
  "Menyebar dari petak sebelah utara, saya panen 2 bulan lagi.",
  "Populasi terlihat sangat padat pada pagi hari.",
  "Hanya menyerang varietas yang ditanam awal musim.",
  "Saya menemukan bercak aneh di daun bawah, mohon bantuan identifikasi.",
];

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export async function seedDatabase() {
  const rand = seededRandom(20260214);

  await db.delete(notifications);
  await db.delete(reports);
  await db.delete(pests);
  await db.delete(users);
  await db.delete(regions);

  const insertedRegions = await db
    .insert(regions)
    .values(
      REGION_SEEDS.map((region) => ({
        regionName: region.name,
        latitude: region.lat,
        longitude: region.lng,
        province: "Jawa Timur",
      })),
    )
    .returning();

  const insertedPests = await db
    .insert(pests)
    .values(
      PEST_SEEDS.map((pest, index) => ({
        ...pest,
        imageGuideUrl: PEST_PHOTOS[index % PEST_PHOTOS.length],
      })),
    )
    .returning();

  const insertedUsers = await db
    .insert(users)
    .values(
      USER_SEEDS.map((user) => {
        const region = insertedRegions[user.regionIndex];
        return {
          name: user.name,
          email: user.email,
          password: hashPassword(user.password),
          phone: user.phone,
          role: user.role,
          regionId: region.id,
          latitude: region.latitude + (rand() - 0.5) * 0.04,
          longitude: region.longitude + (rand() - 0.5) * 0.04,
        };
      }),
    )
    .returning();

  const staff = insertedUsers.filter(
    (user) => user.role === "OFFICER" || user.role === "ADMIN",
  );
  const farmers = insertedUsers.filter((user) => user.role === "FARMER");

  const reportValues = [];
  for (let i = 0; i < 42; i += 1) {
    const region = insertedRegions[i % insertedRegions.length];
    const pest = insertedPests[Math.floor(rand() * insertedPests.length)];
    const reporter = farmers[Math.floor(rand() * farmers.length)];
    const daysAgo = Math.floor(rand() * 88);
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    const roll = rand();
    const status = roll > 0.32 ? "VERIFIED" : roll > 0.14 ? "PENDING" : "REJECTED";

    reportValues.push({
      userId: reporter.id,
      pestId: pest.id,
      regionId: region.id,
      latitude: region.latitude + (rand() - 0.5) * 0.09,
      longitude: region.longitude + (rand() - 0.5) * 0.09,
      photoUrl: pest.imageGuideUrl,
      additionalNote: REPORT_NOTES[i % REPORT_NOTES.length],
      status: status as "VERIFIED" | "PENDING" | "REJECTED",
      verifiedBy: status === "PENDING" ? null : staff[i % staff.length].id,
      verifiedAt:
        status === "PENDING" ? null : new Date(createdAt.getTime() + 86400000),
      createdAt,
    });
  }

  const insertedReports = await db.insert(reports).values(reportValues).returning();

  const verified = insertedReports.filter((r) => r.status === "VERIFIED");
  const notificationValues = [];
  for (const farmer of farmers) {
    for (const report of verified.slice(0, 3)) {
      const pest = insertedPests.find((p) => p.id === report.pestId);
      notificationValues.push({
        userId: farmer.id,
        reportId: report.id,
        title: "Peringatan Hama Sekitar",
        message: `${pest?.pestName ?? "Hama"} dilaporkan di sekitar wilayah Anda. Segera cek petak dan lakukan pencegahan sesuai panduan penanganan.`,
        priority: pest?.severityLevel ?? "MEDIUM",
        isRead: rand() > 0.6,
        createdAt: new Date(report.createdAt.getTime() + 3600000),
      });
    }
    notificationValues.push({
      userId: farmer.id,
      reportId: null,
      title: "Siaran Petugas",
      message:
        "Tim WoroTani mengingatkan agar petani di wilayah Anda melakukan monitoring hama minimal 2 kali seminggu pada pagi hari.",
      priority: "LOW" as const,
      isRead: false,
      createdAt: new Date(Date.now() - 3 * 86400000),
    });
  }

  await db.insert(notifications).values(notificationValues);

  return {
    regions: insertedRegions.length,
    pests: insertedPests.length,
    users: insertedUsers.length,
    reports: insertedReports.length,
    notifications: notificationValues.length,
  };
}

let seedPromise: Promise<unknown> | null = null;

/** Menjamin data contoh tersedia saat aplikasi pertama kali dijalankan. */
export async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const existing = await db.select({ id: pests.id }).from(pests).limit(1);
      if (existing.length === 0) {
        await seedDatabase();
      }
    } catch {
      seedPromise = null;
    }
  })();
  return seedPromise;
}
