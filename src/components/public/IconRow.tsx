// src/components/public/IconRow.tsx
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { formatDateChile } from "./DatePill";

type IconRowItem = {
  icon: "calendar" | "location" | "clock" | "users";
  label: string | null;
  fallback?: string;
};

type Props = {
  items: IconRowItem[];
};

const ICONS = {
  calendar: Calendar,
  location: MapPin,
  clock: Clock,
  users: Users,
};

export function IconRow({ items }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
      {items.map((item, i) => {
        const Icon = ICONS[item.icon];
        const label = item.label || item.fallback || "—";
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-slate-400" />
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}

type OperativoIconRowProps = {
  fecha: string | null;
  lugar: string | null;
};

export function OperativoIconRow({ fecha, lugar }: OperativoIconRowProps) {
  return (
    <IconRow
      items={[
        { icon: "calendar", label: formatDateChile(fecha, "short"), fallback: "Fecha por confirmar" },
        { icon: "location", label: lugar, fallback: "Lugar por confirmar" },
      ]}
    />
  );
}
