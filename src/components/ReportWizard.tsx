"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Crosshair,
  ImageUp,
  Loader2,
  MapPin,
  Send,
  Trash2,
} from "lucide-react";
import { MapView } from "@/components/MapView";
import { Button, Card, SeverityBadge } from "@/components/ui";
import { useWoroStore } from "@/store/useWoroStore";

type PestOption = {
  id: number;
  pestName: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH";
  symptoms: string;
};

const STEPS = [
  { title: "Foto Hama", hint: "Ambil foto gejala serangan di lahan Anda" },
  { title: "Jenis Hama", hint: "Pilih hama yang paling mirip" },
  { title: "Lokasi Lahan", hint: "Gunakan GPS atau ketuk peta" },
  { title: "Kirim Laporan", hint: "Periksa kembali laporan Anda" },
];

async function fileToCompressedDataUrl(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca berkas"));
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 1024;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export function ReportWizard({
  pests,
  userName,
  regionName,
}: {
  pests: PestOption[];
  userName: string;
  regionName: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState("");
  const [pestId, setPestId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [manualCoords, setManualCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const coords = useWoroStore((state) => state.coords);
  const locationStatus = useWoroStore((state) => state.locationStatus);
  const requestLocation = useWoroStore((state) => state.requestLocation);
  const showToast = useWoroStore((state) => state.showToast);

  const activeCoords = manualCoords ?? coords;
  const selectedPest = pests.find((pest) => pest.id === pestId) ?? null;

  const filteredPests = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pests;
    return pests.filter((pest) =>
      `${pest.pestName} ${pest.symptoms}`.toLowerCase().includes(term),
    );
  }, [pests, search]);

  const submit = async () => {
    if (!pestId) {
      showToast("Jenis hama belum dipilih", "Pilih hama pada langkah 2.", "error");
      setStep(1);
      return;
    }
    if (!activeCoords) {
      showToast("Lokasi belum terdeteksi", "Aktifkan GPS atau ketuk peta.", "error");
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pestId,
          latitude: activeCoords.lat,
          longitude: activeCoords.lng,
          photoUrl: photo,
          additionalNote: note,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast("Gagal mengirim laporan", data.error ?? "Coba lagi nanti.", "error");
        return;
      }
      showToast(
        "Laporan berhasil dikirim!",
        "Laporan Anda menunggu verifikasi petugas lapangan.",
        "success",
      );
      router.push("/petani");
      router.refresh();
    } catch {
      showToast("Koneksi bermasalah", "Periksa jaringan Anda lalu coba lagi.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = step === 1 ? pestId !== null : step === 2 ? activeCoords !== null : true;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-leaf-900 sm:text-3xl">
          Lapor Hama Sekarang
        </h1>
        <p className="mt-1 text-sm text-mist-500">
          Hai {userName.split(" ")[0]}, empat langkah singkat untuk melindungi lahan
          Anda dan petani sekitar{regionName ? ` di ${regionName}` : ""}.
        </p>
      </div>

      <ol className="flex gap-2">
        {STEPS.map((item, index) => (
          <li
            key={item.title}
            className={`flex-1 rounded-2xl px-3 py-2 text-center text-xs font-bold transition ${
              index === step
                ? "bg-leaf-600 text-white"
                : index < step
                  ? "bg-leaf-100 text-leaf-800"
                  : "bg-mist-100 text-mist-400"
            }`}
          >
            <span className="block text-base">{index < step ? "✓" : index + 1}</span>
            <span className="hidden sm:block">{item.title}</span>
          </li>
        ))}
      </ol>

      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-leaf-900">
            {step + 1}. {STEPS[step].title}
          </h2>
          <p className="text-sm text-mist-500">{STEPS[step].hint}</p>
        </div>

        {step === 0 ? (
          <div className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const compressed = await fileToCompressedDataUrl(file);
                setPhoto(compressed);
                showToast("Foto ditambahkan", "Gambar dikompres otomatis agar hemat kuota.", "info");
              }}
            />
            {photo ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-mist-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt="Pratinjau foto hama"
                    className="max-h-72 w-full object-contain"
                  />
                </div>
                <Button
                  variant="danger"
                  onClick={() => {
                    setPhoto("");
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  <Trash2 className="h-5 w-5" aria-hidden />
                  Hapus Foto
                </Button>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-leaf-200 bg-leaf-50 p-6 text-center">
                <ImageUp className="mx-auto h-12 w-12 text-leaf-500" aria-hidden />
                <p className="mt-3 text-base font-bold text-leaf-800">
                  Unggah atau ambil foto langsung
                </p>
                <p className="mt-1 text-sm text-mist-500">
                  Foto membantu petugas memverifikasi serangan lebih cepat.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button size="lg" onClick={() => inputRef.current?.click()}>
                    <Camera className="h-6 w-6" aria-hidden />
                    Ambil Foto
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => inputRef.current?.click()}
                  >
                    <ImageUp className="h-6 w-6" aria-hidden />
                    Pilih dari Galeri
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <label htmlFor="pest-search" className="block text-sm font-bold text-leaf-800">
              Cari jenis hama
            </label>
            <input
              id="pest-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Contoh: wereng, ulat, tikus"
              className="w-full rounded-2xl border-2 border-mist-200 px-4 py-4 text-lg focus:border-leaf-500 focus:outline-none"
            />
            <label htmlFor="pest-select" className="block text-sm font-bold text-leaf-800">
              Pilih dari daftar
            </label>
            <select
              id="pest-select"
              value={pestId ? String(pestId) : ""}
              onChange={(event) =>
                setPestId(event.target.value ? Number(event.target.value) : null)
              }
              className="w-full rounded-2xl border-2 border-mist-200 bg-white px-4 py-4 text-lg font-semibold focus:border-leaf-500 focus:outline-none"
            >
              <option value="">-- Pilih hama --</option>
              {pests.map((pest) => (
                <option key={pest.id} value={pest.id}>
                  {pest.pestName}
                </option>
              ))}
            </select>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredPests.map((pest) => (
                <button
                  key={pest.id}
                  type="button"
                  onClick={() => setPestId(pest.id)}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                    pestId === pest.id
                      ? "border-leaf-500 bg-leaf-50"
                      : "border-mist-200 bg-white hover:border-leaf-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-extrabold text-leaf-900">
                      {pest.pestName}
                    </span>
                    <SeverityBadge level={pest.severityLevel} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-mist-500">
                    {pest.symptoms}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-4">
              <p className="flex items-center gap-2 text-base font-bold text-leaf-800">
                <Crosshair className="h-5 w-5" aria-hidden />
                {activeCoords
                  ? `Koordinat: ${activeCoords.lat.toFixed(5)}, ${activeCoords.lng.toFixed(5)}`
                  : "Koordinat belum terdeteksi"}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button size="lg" onClick={() => void requestLocation()}>
                  {locationStatus === "loading" ? (
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                  ) : (
                    <MapPin className="h-6 w-6" aria-hidden />
                  )}
                  Deteksi GPS Otomatis
                </Button>
                {manualCoords ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => setManualCoords(null)}
                  >
                    Hapus Titik Manual
                  </Button>
                ) : null}
              </div>
            </div>
            <MapView
              points={[]}
              center={
                activeCoords ? [activeCoords.lat, activeCoords.lng] : [-7.6, 112.3]
              }
              zoom={activeCoords ? 15 : 9}
              height="h-[320px]"
              userLocation={coords}
              pickMode
              onPick={(lat, lng) => setManualCoords({ lat, lng })}
            />
            <p className="text-sm text-mist-500">
              Tidak punya sinyal GPS yang baik? Ketuk langsung lokasi lahan Anda pada
              peta di atas.
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-mist-200 bg-mist-50">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="Foto laporan" className="h-44 w-full object-cover" />
                ) : (
                  <div className="grid h-44 place-items-center text-4xl">📷</div>
                )}
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-bold text-mist-400">Jenis hama</dt>
                  <dd className="text-base font-extrabold text-leaf-900">
                    {selectedPest?.pestName ?? "Belum dipilih"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-mist-400">Tingkat keparahan</dt>
                  <dd>
                    {selectedPest ? (
                      <SeverityBadge level={selectedPest.severityLevel} />
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-mist-400">Koordinat</dt>
                  <dd className="font-semibold text-leaf-800">
                    {activeCoords
                      ? `${activeCoords.lat.toFixed(5)}, ${activeCoords.lng.toFixed(5)}`
                      : "Belum terdeteksi"}
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <label htmlFor="note" className="mb-2 block text-sm font-bold text-leaf-800">
                Catatan tambahan (opsional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="Contoh: serangan mulai dari galeng timur, sudah 3 hari dan meluas."
                className="w-full rounded-2xl border-2 border-mist-200 px-4 py-3 text-base focus:border-leaf-500 focus:outline-none"
              />
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-sun-50 p-4 text-sm text-sun-600">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p>
                Laporan akan diperiksa petugas lapangan. Setelah terverifikasi, petani
                dalam radius 30 km otomatis menerima peringatan.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            Kembali
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              size="lg"
              onClick={() => setStep((current) => current + 1)}
              disabled={!canNext}
            >
              Lanjut
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          ) : (
            <Button size="lg" onClick={() => void submit()} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              ) : (
                <Send className="h-6 w-6" aria-hidden />
              )}
              Kirim Laporan
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
