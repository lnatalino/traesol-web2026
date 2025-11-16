"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { MessagingFilters, MessagingRecipient } from "@/lib/mensajeriaRecipients";

export type MensajeriaOperativoOption = {
  id: string;
  titulo: string | null;
  fecha_inicio: string | null;
  lugar: string | null;
};

type Props = {
  filters: MessagingFilters;
  operativos: MensajeriaOperativoOption[];
  total: number;
  preview: MessagingRecipient[];
  successMessage: string;
  errorMessage: string;
};

type FilterState = {
  mode: MessagingFilters["mode"];
  operativoId: string;
  q: string;
};

function buildQueryString(form: FilterState): string {
  const params = new URLSearchParams();
  if (form.mode === "operativo") {
    params.set("mode", "operativo");
    if (form.operativoId) params.set("operativoId", form.operativoId);
  } else {
    params.set("mode", "all");
  }
  if (form.q.trim()) params.set("q", form.q.trim());
  return params.toString();
}

function formatOperativoLabel(op: MensajeriaOperativoOption): string {
  const titulo = op.titulo || "Operativo sin título";
  const fecha = op.fecha_inicio
    ? new Date(op.fecha_inicio).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
    : null;
  const lugar = op.lugar ? ` · ${op.lugar}` : "";
  return `${titulo}${fecha ? ` — ${fecha}` : ""}${lugar}`;
}

function displayNombre(recipient: MessagingRecipient): string {
  const parts = [recipient.nombres, recipient.apellidos].filter(Boolean);
  return parts.length ? parts.join(" ") : recipient.email;
}

export default function MessagingForm({
  filters,
  operativos,
  total,
  preview,
  successMessage,
  errorMessage,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [filterState, setFilterState] = useState<FilterState>(filters);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setFilterState(filters);
  }, [filters.mode, filters.operativoId, filters.q]);

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = buildQueryString(filterState);
    const url = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.push(url);
    });
  };

  const handleReset = () => {
    setFilterState({ mode: "all", operativoId: "", q: "" });
    startTransition(() => {
      router.push(pathname);
    });
  };

  const handleModeChange = (mode: MessagingFilters["mode"]) => {
    setFilterState((prev) => ({ ...prev, mode, operativoId: mode === "operativo" ? prev.operativoId : "" }));
  };

  const disableSend =
    total === 0 || isSending || subject.trim().length === 0 || body.trim().length === 0 ||
    (filters.mode === "operativo" && !filters.operativoId);

  const recipientSummary = useMemo(() => {
    if (isPending) return "Recalculando resultados...";
    if (total === 0) return "No hay voluntarios que coincidan con los filtros seleccionados.";
    return `Se enviará el mensaje a ${total} voluntario${total === 1 ? "" : "s"}.`;
  }, [isPending, total]);

  const remaining = Math.max(total - preview.length, 0);

  return (
    <div className="space-y-6">
      {successMessage ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <form
        onSubmit={handleFilterSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">1. Define a quién quieres escribir</h2>
            <p className="text-sm text-slate-500">Elige entre todos los voluntarios o acota por operativo.</p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
            disabled={isPending}
          >
            Limpiar filtros
          </button>
        </header>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
              <input
                type="radio"
                name="mode"
                value="all"
                checked={filterState.mode === "all"}
                onChange={() => handleModeChange("all")}
              />
              <div>
                <div className="font-medium text-slate-900">Todos los voluntarios</div>
                <p className="text-xs text-slate-500">Se enviará el mensaje a toda la base con email registrado.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
              <input
                type="radio"
                name="mode"
                value="operativo"
                checked={filterState.mode === "operativo"}
                onChange={() => handleModeChange("operativo")}
              />
              <div>
                <div className="font-medium text-slate-900">Por operativo</div>
                <p className="text-xs text-slate-500">Envía solo a quienes tienen inscripciones en un operativo.</p>
              </div>
            </label>
          </div>

          {filterState.mode === "operativo" ? (
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-slate-500">Operativo</span>
              <select
                value={filterState.operativoId}
                onChange={(event) => setFilterState((prev) => ({ ...prev, operativoId: event.target.value }))}
                className="w-full rounded-md border px-3 py-2"
                required
              >
                <option value="">Selecciona un operativo</option>
                {operativos.map((op) => (
                  <option key={op.id} value={op.id}>
                    {formatOperativoLabel(op)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-sm text-slate-500">
              Se enviará el mensaje a todos los voluntarios registrados con email válido.
            </p>
          )}

          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium text-slate-500">Buscar por nombre o email (opcional)</span>
            <input
              type="text"
              value={filterState.q}
              onChange={(event) => setFilterState((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Ej: Paula o gmail.com"
              className="w-full rounded-md border px-3 py-2"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-md border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? "Aplicando filtros..." : "Aplicar filtros"}
        </button>
      </form>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">2. Previsualización rápida</h2>
          <p className="text-sm text-slate-500">{recipientSummary}</p>
        </header>

        {preview.length ? (
          <ul className="space-y-2 text-sm text-slate-600">
            {preview.map((vol) => (
              <li key={vol.id} className="rounded-md border px-3 py-2">
                <div className="font-medium text-slate-800">{displayNombre(vol)}</div>
                <div className="text-xs text-slate-500">{vol.email}</div>
              </li>
            ))}
            {remaining > 0 ? (
              <li className="text-xs text-slate-500">… y {remaining} voluntario{remaining === 1 ? "" : "s"} más</li>
            ) : null}
          </ul>
        ) : (
          <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-slate-400">
            Usa los filtros y aplica cambios para obtener un resumen.
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">3. Escribe el mensaje</h2>
          <p className="text-sm text-slate-500">
            El contenido se enviará en texto plano dentro del layout estándar de correos Traesol.
          </p>
        </header>

        <form action="/api/admin/mensajeria/enviar" method="post" className="space-y-4" onSubmit={() => setIsSending(true)}>
          <input type="hidden" name="mode" value={filters.mode} />
          <input type="hidden" name="operativoId" value={filters.operativoId} />
          <input type="hidden" name="q" value={filters.q} />

          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium text-slate-500">Asunto *</span>
            <input
              name="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Actualización de Traesol"
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium text-slate-500">Mensaje *</span>
            <textarea
              name="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Escribe el contenido del correo."
              className="h-40 w-full rounded-md border px-3 py-2"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disableSend}
          >
            {isSending ? "Enviando..." : "Enviar mensaje"}
          </button>
        </form>
      </section>
    </div>
  );
}
