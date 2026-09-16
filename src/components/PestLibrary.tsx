"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Search, SlidersHorizontal } from "lucide-react";
import { Card, EmptyState, SeverityBadge } from "@/components/ui";

export type PestCard = {
  id: number;
  pestName: string;
  scientificName: string;
  cropTarget: string;
  description: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH";
  imageGuideUrl: string;
  reportCount: number;
};

export function PestLibrary({ pests }: { pests: PestCard[] }) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return pests.filter((pest) => {
      if (severity !== "ALL" && pest.severityLevel !== severity) return false;
      if (!term) return true;
      return `${pest.pestName} ${pest.scientificName} ${pest.cropTarget} ${pest.description}`
        .toLowerCase()
        .includes(term);
    });
  }, [pests, query, severity]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-leaf-900 sm:text-3xl">
          Wiki Hama
        </h1>
        <p className="mt-1 text-sm text-mist-500">
          Cari hama berdasarkan nama, tanaman yang diserang, atau gejala yang Anda
          lihat di lahan.
        </p>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div>
            <label htmlFor="wiki-search" className="mb-2 flex items-center gap-2 text-sm font-bold text-leaf-800">
              <Search className="h-4 w-4" aria-hidden />
              Kata kunci
            </label>
            <input
              id="wiki-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Contoh: wereng, blas, bawang"
              className="w-full rounded-2xl border-2 border-mist-200 px-4 py-4 text-lg focus:border-leaf-500 focus:outline-none"
            />
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-leaf-800">
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Tingkat keparahan
            </p>
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
                  onClick={() => setSeverity(option.key)}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    severity === option.key
                      ? "bg-leaf-600 text-white"
                      : "bg-mist-100 text-mist-500 hover:bg-mist-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pest) => (
            <Link
              key={pest.id}
              href={`/wiki/${pest.id}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-mist-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-40 overflow-hidden bg-mist-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pest.imageGuideUrl}
                  alt={pest.pestName}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute right-3 top-3">
                  <SeverityBadge level={pest.severityLevel} />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-mist-400">
                  {pest.cropTarget}
                </p>
                <h2 className="mt-1 text-lg font-extrabold leading-tight text-leaf-900">
                  {pest.pestName}
                </h2>
                <p className="text-xs italic text-mist-400">{pest.scientificName}</p>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-mist-500">
                  {pest.description}
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-leaf-700">
                  <BookOpen className="h-4 w-4" aria-hidden />
                  {pest.reportCount} laporan · Baca panduan
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Hama tidak ditemukan"
          description="Coba kata kunci lain, misalnya nama tanaman yang Anda tanam."
        />
      )}
    </div>
  );
}
