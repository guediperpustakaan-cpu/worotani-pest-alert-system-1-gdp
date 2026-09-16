"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  PlusCircle,
  Sprout,
  User as UserIcon,
} from "lucide-react";
import { useWoroStore, type SessionUser } from "@/store/useWoroStore";
import { cn } from "@/components/ui";

const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: Sprout },
  { href: "/peta", label: "Peta", icon: MapIcon },
  { href: "/lapor", label: "Lapor", icon: PlusCircle, primary: true },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
  { href: "/peringatan", label: "Notifikasi", icon: Bell },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const setUser = useWoroStore((state) => state.setUser);
  const showToast = useWoroStore((state) => state.showToast);
  const unread = useWoroStore((state) => state.unread);
  const setUnread = useWoroStore((state) => state.setUnread);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(user);
    setUnread(0);
  }, [user, setUser, setUnread]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data: { notifications?: { isRead: boolean }[] }) => {
        if (!active) return;
        setUnread((data.notifications ?? []).filter((item) => !item.isRead).length);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user, pathname, setUnread]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/session", { method: "POST" });
    showToast("Berhasil keluar", "Sampai jumpa di petak sawah berikutnya.", "info");
    router.push("/");
    router.refresh();
  }, [router, showToast]);

  return (
    <div className="min-h-dvh bg-mist-50 text-leaf-900">
      <header className="sticky top-0 z-[900] border-b border-mist-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-20">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf-600 text-white shadow-sm">
              <Sprout className="h-6 w-6" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-xl font-extrabold tracking-tight text-leaf-800">
                WoroTani
              </span>
              <span className="hidden text-xs font-semibold text-mist-500 sm:block">
                Sistem Peringatan Hama
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.filter((item) => !item.primary).map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-2xl px-4 py-2.5 text-base font-bold transition",
                    active
                      ? "bg-leaf-100 text-leaf-800"
                      : "text-mist-500 hover:bg-mist-100 hover:text-leaf-800",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {item.label === "Notifikasi" ? "Peringatan" : item.label}
                  {item.label === "Notifikasi" && unread > 0 ? (
                    <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                      {unread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            {user && (user.role === "OFFICER" || user.role === "ADMIN") ? (
              <Link
                href="/petugas"
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-base font-bold transition",
                  pathname.startsWith("/petugas")
                    ? "bg-leaf-100 text-leaf-800"
                    : "text-mist-500 hover:bg-mist-100 hover:text-leaf-800",
                )}
              >
                <LayoutDashboard className="h-5 w-5" aria-hidden />
                Dasbor Petugas
              </Link>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-2xl border-2 border-leaf-200 bg-white px-3 py-2 text-left transition hover:border-leaf-400"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-600 text-sm font-extrabold text-white">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden leading-tight sm:block">
                    <span className="block max-w-32 truncate text-sm font-bold text-leaf-800">
                      {user.name}
                    </span>
                    <span className="block text-xs font-semibold text-mist-500">
                      {user.role === "FARMER"
                        ? "Petani"
                        : user.role === "OFFICER"
                          ? "Petugas"
                          : "Admin"}
                    </span>
                  </span>
                </button>
                {menuOpen ? (
                  <div className="animate-pop absolute right-0 top-14 z-[950] w-56 overflow-hidden rounded-2xl border border-mist-200 bg-white p-2 shadow-xl">
                    <Link
                      href="/petani"
                      className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-leaf-800 hover:bg-leaf-50"
                    >
                      <UserIcon className="h-5 w-5" aria-hidden />
                      Laporan Saya
                    </Link>
                    <Link
                      href="/peringatan"
                      className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-leaf-800 hover:bg-leaf-50"
                    >
                      <Bell className="h-5 w-5" aria-hidden />
                      Peringatan Saya
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5" aria-hidden />
                      Keluar
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/masuk"
                className="flex items-center gap-2 rounded-2xl bg-leaf-600 px-4 py-3 text-base font-bold text-white transition hover:bg-leaf-700"
              >
                <UserIcon className="h-5 w-5" aria-hidden />
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 lg:pb-16">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-[900] border-t border-mist-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="mx-auto flex max-w-md items-end justify-between px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            if (item.primary) {
              return (
                <li key={item.href} className="-mt-8">
                  <Link
                    href={item.href}
                    className="flex flex-col items-center gap-1 rounded-full bg-leaf-600 p-4 text-white shadow-lg shadow-leaf-900/25"
                  >
                    <Icon className="h-7 w-7" aria-hidden />
                    <span className="text-xs font-extrabold">Lapor</span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-bold transition",
                    active ? "text-leaf-700" : "text-mist-400",
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                  {item.label}
                  {item.label === "Notifikasi" && unread > 0 ? (
                    <span className="absolute right-3 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

    </div>
  );
}
