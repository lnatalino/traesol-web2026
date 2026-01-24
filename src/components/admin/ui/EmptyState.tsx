import type { ReactNode } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  /** Icono (default: Inbox) */
  icon?: ReactNode;
  /** Título del estado vacío */
  title?: string;
  /** Mensaje descriptivo */
  message: string;
  /** CTA opcional */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
};

/**
 * Estado vacío para listas sin datos.
 * Texto humano y CTA opcional.
 */
export function EmptyState({
  icon,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      {title ? (
        <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      ) : null}
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {action ? (
        <div className="mt-4">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {action.label}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
