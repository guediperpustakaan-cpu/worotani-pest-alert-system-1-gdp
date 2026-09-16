import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { ToastHost } from "@/components/ToastHost";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "WoroTani · Saling Jaga Lahan, Amankan Panen",
  description:
    "Sistem peringatan hama berbasis kerumunan (crowd-sourcing) untuk petani Indonesia: laporkan serangan hama, lihat peta wabah, dan dapatkan panduan penanganan.",
};

export const viewport: Viewport = {
  themeColor: "#2f7836",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="id">
      <body className="bg-mist-50 text-leaf-900 antialiased">
        <AppShell user={user}>{children}</AppShell>
        <ToastHost />
      </body>
    </html>
  );
}
