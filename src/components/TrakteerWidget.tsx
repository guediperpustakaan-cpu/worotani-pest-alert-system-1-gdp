"use client";

import { useState, useCallback } from "react";
import { Coffee, X, Download, ExternalLink, Heart } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/components/ui";

const TRAKTEER_URL = "https://trakteer.id/perpus_opera";
const NOMINALS = [6000, 12000, 18000, 24000, 30000, 50000, 100000];
const QR_API = "https://api.qrserver.com/v1/create-qr-code/";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function generateQRUrl(data: string): string {
  const params = new URLSearchParams({
    size: "200x200",
    data,
    format: "png",
    ecc: "M",
  });
  return `${QR_API}?${params.toString()}`;
}

export function TrakteerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNominal, setSelectedNominal] = useState<number | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");

  const handleNominalSelect = useCallback((nominal: number) => {
    setSelectedNominal(nominal);
    const trakteerUrl = `${TRAKTEER_URL}/tip/${nominal}`;
    setQrUrl(generateQRUrl(trakteerUrl));
  }, []);

  const handleOpenTrakteer = useCallback(() => {
    window.open(TRAKTEER_URL, "_blank", "noopener,noreferrer");
  }, []);

  const handleDownloadSource = useCallback(() => {
    window.open("https://github.com/your-repo/worotani-pest-alert-system", "_blank", "noopener,noreferrer");
  }, []);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
    setSelectedNominal(null);
    setQrUrl("");
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-[999] flex items-center gap-3 rounded-2xl border-2 border-leaf-200 bg-white px-4 py-3 shadow-xl shadow-leaf-900/10 transition-all hover:border-leaf-400 hover:shadow-leaf-900/20",
          "animate-pop"
        )}
        aria-label="Dukung pengembangan WoroTani"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf-100 text-leaf-700">
          <Coffee className="h-5 w-5" aria-hidden />
        </span>
        <span className="hidden max-w-xs text-sm font-bold text-leaf-800 sm:block">
          Web app ini gratis & bebas iklan. Kopi kecil, server tetap jalan
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm animate-fade-up lg:hidden" onClick={closeWidget} aria-hidden="true" />
      )}

      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[999] w-full max-w-sm rounded-2xl border border-mist-200 bg-white p-4 shadow-2xl shadow-leaf-900/15 animate-pop lg:bottom-24 lg:right-6"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Dukung WoroTani"
        >
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf-100 text-leaf-700">
                <Coffee className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-leaf-800">Dukung WoroTani</h3>
                <p className="text-xs text-mist-500">Web app ini gratis & bebas iklan</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeWidget}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-mist-400 transition hover:bg-mist-100 hover:text-leaf-800"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!selectedNominal ? (
            <div className="space-y-2">
              <p className="text-sm text-mist-600 text-center">
                Pilih nominal traktiran (mulai Rp6.000)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {NOMINALS.map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() => handleNominalSelect(nominal)}
                    className="relative flex flex-col items-center gap-1 rounded-xl border-2 border-mist-200 bg-white p-3 transition hover:border-leaf-300 hover:bg-leaf-50"
                  >
                    <span className="text-base font-extrabold text-leaf-800">
                      {formatRupiah(nominal)}
                    </span>
                    <span className="text-xs text-mist-500">Kopi {nominal / 6000}x</span>
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenTrakteer}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-leaf-300 bg-leaf-50 px-4 py-3 text-sm font-bold text-leaf-800 transition hover:bg-leaf-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Buka halaman Trakteer
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-mist-600 mb-2">Scan QR untuk traktir</p>
                <p className="text-lg font-extrabold text-leaf-800">
                  {formatRupiah(selectedNominal)}
                </p>
                <p className="text-xs text-mist-500">Kopi {selectedNominal / 6000}x</p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="relative rounded-xl border border-mist-200 bg-white p-4 shadow-sm">
                  {qrUrl ? (
                    <QRCodeSVG
                      value={qrUrl}
                      size={200}
                      level="M"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-mist-100">
                      <div className="animate-pulse text-mist-400">Memuat QR...</div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleOpenTrakteer}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-leaf-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-leaf-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Buka & Bayar di Trakteer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedNominal(null);
                    setQrUrl("");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-mist-200 bg-white px-4 py-2.5 text-sm font-bold text-mist-600 transition hover:border-mist-300 hover:bg-mist-50"
                >
                  <X className="h-4 w-4" />
                  Pilih nominal lain
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-mist-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-mist-500">
                <Heart className="h-3.5 w-3.5 text-red-500" aria-hidden />
                <span>Open Source oleh MZF - 2026</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadSource}
                className="flex items-center gap-1.5 rounded-xl border border-mist-200 bg-white px-3 py-2 text-xs font-bold text-mist-600 transition hover:border-mist-300 hover:bg-mist-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Source</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}