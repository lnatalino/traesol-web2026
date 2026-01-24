// src/components/public/Badge.tsx

type BadgeVariant = "publicado" | "cerrado" | "finalizado" | "borrador" | "abierto" | "default";

type Props = {
  variant?: BadgeVariant;
  children: React.ReactNode;
};

const variantStyles: Record<BadgeVariant, string> = {
  publicado: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  abierto: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  cerrado: "bg-amber-100 text-amber-700 ring-amber-200",
  finalizado: "bg-slate-100 text-slate-600 ring-slate-200",
  borrador: "bg-slate-100 text-slate-500 ring-slate-200",
  default: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function Badge({ variant = "default", children }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}

export function estadoToBadgeVariant(estado: string | null): BadgeVariant {
  const normalized = (estado || "").trim().toLowerCase();
  if (normalized === "publicado") return "publicado";
  if (normalized === "cerrado") return "cerrado";
  if (normalized === "finalizado") return "finalizado";
  if (normalized === "borrador") return "borrador";
  if (normalized === "abierto") return "abierto";
  return "default";
}
