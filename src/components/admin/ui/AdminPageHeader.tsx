import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export type AdminPageHeaderProps = {
  /** Breadcrumb o "volver" link */
  backHref?: string;
  backLabel?: string;
  /** Etiqueta superior pequeña */
  eyebrow?: string;
  /** Título principal de la página */
  title: string;
  /** Descripción/subtítulo */
  description?: string;
  /** Acciones principales (botones) a la derecha */
  actions?: ReactNode;
  /** Mensaje de éxito (query param success) */
  successMessage?: string;
  /** Mensaje de error (query param error o fetch error) */
  errorMessage?: string;
};

/**
 * Header unificado para páginas admin.
 * Incluye breadcrumb, título, descripción, acciones y mensajes de feedback.
 */
export function AdminPageHeader({
  backHref,
  backLabel = "Volver",
  eyebrow,
  title,
  description,
  actions,
  successMessage,
  errorMessage,
}: AdminPageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb / Volver */}
      {backHref ? (
        <nav>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </nav>
      ) : null}

      {/* Header principal */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-sm text-slate-500 max-w-2xl">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </section>

      {/* Mensajes de feedback */}
      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          ✓ {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          ⚠ {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
