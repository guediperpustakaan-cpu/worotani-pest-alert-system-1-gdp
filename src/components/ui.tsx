import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bug,
  CircleCheck,
  Clock,
  Leaf,
  XCircle,
} from "lucide-react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "sun";
  size?: "md" | "lg";
};

const VARIANTS: Record<string, string> = {
  primary:
    "bg-leaf-600 text-white hover:bg-leaf-700 active:bg-leaf-800 shadow-sm shadow-leaf-900/20",
  secondary:
    "bg-white text-leaf-800 border-2 border-leaf-200 hover:border-leaf-400 hover:bg-leaf-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  sun: "bg-sun-400 text-leaf-900 hover:bg-sun-300 font-bold",
  ghost: "bg-transparent text-leaf-700 hover:bg-leaf-50",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 disabled:cursor-not-allowed disabled:opacity-60",
        size === "lg" ? "px-6 py-4 text-lg min-h-14" : "px-4 py-3 text-base min-h-12",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-mist-200 bg-white p-5 shadow-sm shadow-leaf-900/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

const SEVERITY_STYLE = {
  LOW: "bg-leaf-100 text-leaf-800 border-leaf-200",
  MEDIUM: "bg-sun-100 text-sun-600 border-sun-200",
  HIGH: "bg-red-100 text-red-700 border-red-200",
} as const;

export function SeverityBadge({ level }: { level: string }) {
  const key = (level as keyof typeof SEVERITY_STYLE) in SEVERITY_STYLE
    ? (level as keyof typeof SEVERITY_STYLE)
    : "MEDIUM";
  const label = key === "LOW" ? "Rendah" : key === "MEDIUM" ? "Sedang" : "Tinggi";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold",
        SEVERITY_STYLE[key],
      )}
    >
      {key === "HIGH" ? (
        <AlertTriangle className="h-4 w-4" aria-hidden />
      ) : (
        <Bug className="h-4 w-4" aria-hidden />
      )}
      {label}
    </span>
  );
}

const STATUS_STYLE = {
  PENDING: "bg-sun-100 text-sun-600 border-sun-200",
  VERIFIED: "bg-leaf-100 text-leaf-800 border-leaf-200",
  REJECTED: "bg-mist-100 text-mist-500 border-mist-200",
} as const;

export function StatusBadge({ status }: { status: string }) {
  const key = (status as keyof typeof STATUS_STYLE) in STATUS_STYLE
    ? (status as keyof typeof STATUS_STYLE)
    : "PENDING";
  const label =
    key === "PENDING"
      ? "Menunggu Verifikasi"
      : key === "VERIFIED"
        ? "Terverifikasi"
        : "Ditolak";
  const Icon = key === "VERIFIED" ? CircleCheck : key === "PENDING" ? Clock : XCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold",
        STATUS_STYLE[key],
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </span>
  );
}

export function Stat({
  icon,
  value,
  label,
  tone = "leaf",
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  tone?: "leaf" | "sun" | "grey";
}) {
  const toneClass =
    tone === "sun"
      ? "bg-sun-100 text-sun-600"
      : tone === "grey"
        ? "bg-mist-100 text-mist-500"
        : "bg-leaf-100 text-leaf-700";
  return (
    <div className="rounded-3xl border border-mist-200 bg-white p-4 shadow-sm">
      <div className={cn("mb-3 inline-flex rounded-2xl p-2.5", toneClass)}>
        {icon}
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-leaf-900">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-mist-500">{label}</p>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-leaf-100 px-3 py-1 text-sm font-bold text-leaf-700">
          <Leaf className="h-4 w-4" aria-hidden />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-extrabold tracking-tight text-leaf-900 sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base text-mist-500">{description}</p>
      ) : null}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-2xl", className)} />;
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-mist-200 bg-mist-50 p-8 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-leaf-600 shadow-sm">
        {icon ?? <Bug className="h-7 w-7" aria-hidden />}
      </div>
      <p className="text-lg font-bold text-leaf-900">{title}</p>
      <p className="mt-1 text-sm text-mist-500">{description}</p>
    </div>
  );
}
