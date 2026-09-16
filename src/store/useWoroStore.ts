"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "FARMER" | "OFFICER" | "ADMIN";
  regionId: number | null;
  regionName: string | null;
  phone: string;
};

type LocationStatus = "idle" | "loading" | "ready" | "denied" | "error";

type WoroState = {
  toasts: Toast[];
  user: SessionUser | null;
  coords: { lat: number; lng: number } | null;
  locationStatus: LocationStatus;
  unread: number;
  showToast: (
    title: string,
    description?: string,
    variant?: ToastVariant,
  ) => void;
  dismissToast: (id: string) => void;
  setUser: (user: SessionUser | null) => void;
  setUnread: (value: number) => void;
  setCoords: (coords: { lat: number; lng: number } | null) => void;
  requestLocation: (silent?: boolean) => Promise<{ lat: number; lng: number } | null>;
};

export const useWoroStore = create<WoroState>((set, get) => ({
  toasts: [],
  user: null,
  coords: null,
  locationStatus: "idle",
  unread: 0,
  showToast: (title, description, variant = "success") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    set((state) => ({ toasts: [...state.toasts, { id, title, description, variant }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, 4600);
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  setUser: (user) => set({ user }),
  setUnread: (unread) => set({ unread }),
  setCoords: (coords) =>
    set({ coords, locationStatus: coords ? "ready" : "idle" }),
  requestLocation: async (silent = false) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      set({ locationStatus: "error" });
      if (!silent) {
        get().showToast(
          "Lokasi tidak didukung",
          "Peramban Anda tidak mendukung deteksi GPS.",
          "error",
        );
      }
      return null;
    }
    set({ locationStatus: "loading" });
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 60000,
          });
        },
      );
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      set({ coords, locationStatus: "ready" });
      return coords;
    } catch {
      set({ locationStatus: "denied" });
      if (!silent) {
        get().showToast(
          "Izin lokasi ditolak",
          "Aktifkan izin lokasi agar peringatan hama di sekitar Anda bisa dihitung.",
          "warning",
        );
      }
      return null;
    }
  },
}));
