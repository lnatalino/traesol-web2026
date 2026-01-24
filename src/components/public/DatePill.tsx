// src/components/public/DatePill.tsx
import { Calendar } from "lucide-react";

type Props = {
  date: string | null;
  showIcon?: boolean;
  format?: "short" | "long";
};

const SHORT_FORMAT = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  timeZone: "America/Santiago",
});

const LONG_FORMAT = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Santiago",
});

export function formatDateChile(date: string | null, format: "short" | "long" = "short"): string {
  if (!date) return "Fecha por confirmar";
  try {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Fecha por confirmar";
    return format === "long" ? LONG_FORMAT.format(parsed) : SHORT_FORMAT.format(parsed);
  } catch {
    return "Fecha por confirmar";
  }
}

export function DatePill({ date, showIcon = true, format = "short" }: Props) {
  const label = formatDateChile(date, format);
  
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
      {showIcon && <Calendar className="h-3 w-3 text-slate-400" />}
      {label}
    </span>
  );
}
