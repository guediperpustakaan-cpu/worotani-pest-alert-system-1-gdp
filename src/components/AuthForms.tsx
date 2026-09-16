"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, Sprout, UserPlus } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useWoroStore } from "@/store/useWoroStore";

type RegionOption = { id: number; regionName: string };

const inputClass =
  "w-full rounded-2xl border-2 border-mist-200 px-4 py-4 text-lg focus:border-leaf-500 focus:outline-none";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const showToast = useWoroStore((state) => state.showToast);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: { name: string; role: string };
      };
      if (!res.ok || !data.user) {
        setError(data.error ?? "Gagal masuk.");
        return;
      }
      showToast(
        `Selamat datang, ${data.user.name.split(" ")[0]}!`,
        "Anda berhasil masuk ke WoroTani.",
        "success",
      );
      const target =
        next ?? (data.user.role === "FARMER" ? "/petani" : "/petugas");
      router.push(target);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <div className="mb-5 text-center">
        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-leaf-600 text-white">
          <Sprout className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-extrabold text-leaf-900">Masuk WoroTani</h1>
        <p className="mt-1 text-sm text-mist-500">
          Masuk untuk melapor dan menerima peringatan hama.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-bold text-leaf-800">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="petani@worotani.id"
            className={inputClass}
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold text-leaf-800">
            Kata Sandi
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className={inputClass}
            autoComplete="current-password"
          />
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          ) : (
            <LogIn className="h-6 w-6" aria-hidden />
          )}
          Masuk
        </Button>
      </form>

      <div className="mt-5 space-y-3 text-center text-sm">
        <p className="text-mist-500">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-bold text-leaf-700">
            Daftar sekarang
          </Link>
        </p>
        <div className="rounded-2xl bg-mist-50 p-3 text-xs font-semibold text-mist-500">
          Akun demo: petani@worotani.id / Petani#123 · petugas@worotani.id /
          Petugas#123
        </div>
      </div>
    </Card>
  );
}

export function RegisterForm({ regions }: { regions: RegionOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    regionId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const showToast = useWoroStore((state) => state.showToast);

  const update = (key: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, regionId: Number(form.regionId) }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Pendaftaran gagal.");
        return;
      }
      showToast(
        "Pendaftaran berhasil",
        "Selamat bergabung di WoroTani! Silakan lapor hama pertama Anda.",
        "success",
      );
      router.push("/lapor");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <div className="mb-5 text-center">
        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-leaf-600 text-white">
          <UserPlus className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-extrabold text-leaf-900">Daftar Petani</h1>
        <p className="mt-1 text-sm text-mist-500">
          Gratis, cukup 1 menit untuk mulai menjaga lahan Anda.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-bold text-leaf-800">
            Nama Lengkap
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={update("name")}
            placeholder="Nama Anda"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="mb-2 block text-sm font-bold text-leaf-800">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            placeholder="nama@email.com"
            className={inputClass}
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-bold text-leaf-800">
            Nomor Telepon
          </label>
          <input
            id="phone"
            value={form.phone}
            onChange={update("phone")}
            placeholder="0857-xxxx-xxxx"
            className={inputClass}
            inputMode="tel"
          />
        </div>
        <div>
          <label htmlFor="region" className="mb-2 block text-sm font-bold text-leaf-800">
            Wilayah (Kecamatan/Kabupaten)
          </label>
          <select
            id="region"
            required
            value={form.regionId}
            onChange={update("regionId")}
            className={inputClass}
          >
            <option value="">-- Pilih wilayah --</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.regionName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="reg-password" className="mb-2 block text-sm font-bold text-leaf-800">
            Kata Sandi (min. 6 karakter)
          </label>
          <input
            id="reg-password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={update("password")}
            placeholder="••••••••"
            className={inputClass}
            autoComplete="new-password"
          />
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          ) : (
            <UserPlus className="h-6 w-6" aria-hidden />
          )}
          Daftar
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-mist-500">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-bold text-leaf-700">
          Masuk di sini
        </Link>
      </p>
    </Card>
  );
}
