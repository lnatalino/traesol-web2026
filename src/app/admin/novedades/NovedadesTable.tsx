"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CircleAlert,
  Eye,
  ExternalLink,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

type NovedadRow = {
  id: string;
  titulo: string;
  slug: string | null;
  bajada: string | null;
  imagen_portada_url: string | null;
  link_externo: string | null;
  fecha_publicacion: string | null;
  publicado: boolean | null;
  en_carrusel: boolean | null;
  en_novedades: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type Props = {
  items: NovedadRow[];
  initialMessage?: string;
};

type ToggleField = "publicado" | "en_carrusel" | "en_novedades";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function StatusBadge({ active }: { active: boolean }) {
  const classes = active
    ? "bg-emerald-100 text-emerald-700 ring-emerald-500/30"
    : "bg-slate-200 text-slate-600 ring-slate-400/40";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${classes}`}>
      {active ? "Sí" : "No"}
    </span>
  );
}

export default function NovedadesTable({ items, initialMessage = "" }: Props) {
  const router = useRouter();
  const [data, setData] = useState(() => items);
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionKey, setActionKey] = useState<string | null>(null);

  const hasRows = useMemo(() => data.length > 0, [data.length]);

  const setNotice = (success: string, failure = "") => {
    setMessage(success);
    setError(failure);
    if (success) setError("");
    if (failure) setMessage("");
  };

  async function postJson(endpoint: string, payload: Record<string, unknown>) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    let json: any = null;
    try {
      json = await response.json();
    } catch {
      // ignore — some responses may not return JSON
    }

    if (!response.ok || json?.ok === false) {
      const message = json?.error || "Ocurrió un error inesperado.";
      throw new Error(message);
    }

    return json;
  }

  const handleToggle = async (row: NovedadRow, field: ToggleField) => {
    const currentValue = field === "publicado" 
      ? row.publicado 
      : field === "en_carrusel" 
        ? row.en_carrusel 
        : row.en_novedades;
    const nextValue = !currentValue;
    const endpoint = field === "publicado"
      ? "/api/admin/novedades/toggle-publish"
      : field === "en_carrusel"
        ? "/api/admin/novedades/toggle-carrusel"
        : "/api/admin/novedades/toggle-novedades";

    const key = `${field}:${row.id}`;
    setActionKey(key);
    setNotice("");

    try {
      const payload = await postJson(endpoint, { id: row.id, nextValue });
      const resolvedValue = typeof payload?.value === "boolean" ? payload.value : nextValue;

      setData((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? { ...item, [field]: resolvedValue }
            : item,
        ),
      );

      setNotice("Actualizado con éxito");
      startTransition(() => router.refresh());
    } catch (err: any) {
      setNotice("", err?.message ?? "No se pudo actualizar.");
    } finally {
      setActionKey(null);
    }
  };

  const handleDelete = async (row: NovedadRow) => {
    const confirmed = typeof window !== "undefined"
      ? window.confirm(`¿Seguro que quieres eliminar "${row.titulo}"?`)
      : true;
    if (!confirmed) return;

    const key = `delete:${row.id}`;
    setActionKey(key);
    setNotice("");

    try {
      await postJson("/api/admin/novedades/delete", { id: row.id });
      setData((prev) => prev.filter((item) => item.id !== row.id));
      setNotice("Novedad eliminada con éxito");
      startTransition(() => router.refresh());
    } catch (err: any) {
      setNotice("", err?.message ?? "No se pudo eliminar la novedad.");
    } finally {
      setActionKey(null);
    }
  };

  const isBusy = (rowId: string, action: string) => actionKey === `${action}:${rowId}`;

  return (
    <div className="space-y-4">
      {message ? (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-700 shadow">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow">
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[30px] border border-slate-100 bg-white/95 shadow-xl shadow-blue-900/5">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/80 text-slate-600">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Título</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Fecha</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Publicado</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Carrusel</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Novedades</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hasRows ? (
              data.map((row) => {
                const viewHref = row.link_externo || (row.slug ? `/novedades/${row.slug}` : null);
                const viewIsExternal = Boolean(row.link_externo);

                return (
                  <tr key={row.id} className="align-top hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{row.titulo}</div>
                      {row.bajada ? (
                        <p className="text-xs text-slate-500 line-clamp-2">{row.bajada}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-400">Slug: {row.slug || "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{formatDate(row.fecha_publicacion)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge active={Boolean(row.publicado)} />
                        <button
                          type="button"
                          onClick={() => handleToggle(row, "publicado")}
                          disabled={isPending || isBusy(row.id, "publicado")}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy(row.id, "publicado") ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {Boolean(row.publicado) ? "Marcar como borrador" : "Publicar"}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge active={Boolean(row.en_carrusel)} />
                        <button
                          type="button"
                          onClick={() => handleToggle(row, "en_carrusel")}
                          disabled={isPending || isBusy(row.id, "en_carrusel")}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy(row.id, "en_carrusel") ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {Boolean(row.en_carrusel) ? "Quitar" : "Agregar"}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge active={Boolean(row.en_novedades)} />
                        <button
                          type="button"
                          onClick={() => handleToggle(row, "en_novedades")}
                          disabled={isPending || isBusy(row.id, "en_novedades")}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy(row.id, "en_novedades") ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {Boolean(row.en_novedades) ? "Quitar" : "Agregar"}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/novedades/${row.id}/editar`}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Editar
                        </Link>
                        {viewHref ? (
                          viewIsExternal ? (
                            <a
                              href={viewHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                              Ver enlace
                            </a>
                          ) : (
                            <Link
                              href={viewHref}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              Ver público
                            </Link>
                          )
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          disabled={isPending || isBusy(row.id, "delete")}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy(row.id, "delete") ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                  Aún no hay novedades cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
