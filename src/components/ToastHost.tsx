"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useWoroStore, type ToastVariant } from "@/store/useWoroStore";

const STYLES: Record<ToastVariant, { icon: typeof Info; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-leaf-300 bg-white text-leaf-800",
  },
  error: {
    icon: XCircle,
    className: "border-red-300 bg-white text-red-700",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-sun-300 bg-white text-sun-600",
  },
  info: { icon: Info, className: "border-mist-300 bg-white text-leaf-800" },
};

export function ToastHost() {
  const toasts = useWoroStore((state) => state.toasts);
  const dismissToast = useWoroStore((state) => state.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[1200] flex flex-col items-center gap-2 px-3 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
      {toasts.map((toast) => {
        const style = STYLES[toast.variant];
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            role="status"
            className={`animate-pop pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border-2 p-4 shadow-xl shadow-leaf-900/10 ${style.className}`}
          >
            <Icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-snug">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-sm text-mist-500">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="rounded-full p-1 text-mist-400 transition hover:bg-mist-100 hover:text-mist-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
