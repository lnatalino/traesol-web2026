import type { ReactNode } from "react";

type StatTileProps = {
  /** Icono del tile */
  icon?: ReactNode;
  /** Etiqueta superior */
  label: string;
  /** Valor numérico o texto */
  value: string | number;
  /** Subtexto opcional */
  subtext?: string;
  /** Resaltar el tile (ej: pendientes > 0) */
  highlight?: boolean;
  /** Variante de color para highlight */
  highlightVariant?: "amber" | "emerald" | "rose" | "blue";
};

/**
 * Mini tarjeta para números clave (conteos, stats).
 */
export function StatTile({
  icon,
  label,
  value,
  subtext,
  highlight = false,
  highlightVariant = "amber",
}: StatTileProps) {
  const highlightStyles: Record<string, { bg: string; text: string; iconBg: string }> = {
    amber: { bg: "border-amber-200 bg-amber-50", text: "text-amber-700", iconBg: "bg-amber-100 text-amber-600" },
    emerald: { bg: "border-emerald-200 bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-100 text-emerald-600" },
    rose: { bg: "border-rose-200 bg-rose-50", text: "text-rose-700", iconBg: "bg-rose-100 text-rose-600" },
    blue: { bg: "border-blue-200 bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100 text-blue-600" },
  };

  const styles = highlight ? highlightStyles[highlightVariant] : null;
  const containerClass = styles
    ? `${styles.bg}`
    : "border-slate-100 bg-slate-50/50";
  const valueClass = styles ? styles.text : "text-slate-900";
  const iconClass = styles ? styles.iconBg : "bg-white text-slate-500";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${containerClass}`}
    >
      {icon ? (
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
        {subtext ? (
          <p className="text-[11px] text-slate-400">{subtext}</p>
        ) : null}
      </div>
    </div>
  );
}

type StatTileGridProps = {
  children: ReactNode;
  /** Número de columnas en desktop */
  cols?: 2 | 3 | 4;
};

/**
 * Grid contenedor para StatTiles.
 */
export function StatTileGrid({ children, cols = 4 }: StatTileGridProps) {
  const colClasses: Record<number, string> = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid gap-3 ${colClasses[cols]}`}>
      {children}
    </div>
  );
}
