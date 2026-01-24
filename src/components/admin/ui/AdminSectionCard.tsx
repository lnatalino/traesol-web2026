import type { ReactNode } from "react";

type AdminSectionCardProps = {
  /** Título de la sección */
  title: string;
  /** Breve explicación de qué es esta sección (1 línea) */
  hint?: string;
  /** Contenido secundario (acciones) al lado del título */
  actions?: ReactNode;
  /** Contenido principal */
  children: ReactNode;
  /** Icono opcional antes del título */
  icon?: ReactNode;
  /** Clase CSS adicional */
  className?: string;
  /** Padding del contenido (default: true) */
  padded?: boolean;
};

/**
 * Tarjeta envolvente para secciones dentro de páginas admin.
 * Unifica estilos y agrega contexto explicativo para usuarios no técnicos.
 */
export function AdminSectionCard({
  title,
  hint,
  actions,
  children,
  icon,
  className = "",
  padded = true,
}: AdminSectionCardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {icon ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                {icon}
              </span>
            ) : null}
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          </div>
          {hint ? (
            <p className="mt-1 text-sm text-slate-500">{hint}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}
