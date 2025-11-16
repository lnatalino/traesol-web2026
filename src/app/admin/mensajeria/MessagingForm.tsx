"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  recipients: MessagingRecipient[];
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
  } else if (form.mode === "custom") {
    params.set("mode", "custom");
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
  recipients,
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customSearch, setCustomSearch] = useState("");
  const [customProfession, setCustomProfession] = useState<string>("all");
  const [customActivity, setCustomActivity] = useState<"any" | "1plus" | "3plus">("any");
  const [customSort, setCustomSort] = useState<{ key: "name" | "operativos"; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  });
  const bulkCheckboxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFilterState(filters);
  }, [filters.mode, filters.operativoId, filters.q]);

  useEffect(() => {
    setSelectedIds([]);
    setCustomSearch("");
    setCustomProfession("all");
    setCustomActivity("any");
    setCustomSort({ key: "name", direction: "asc" });
  }, [recipients]);

  const customModeActive = filters.mode === "custom";
  const collator = useMemo(() => new Intl.Collator("es", { sensitivity: "base" }), []);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const professionOptions = useMemo(() => {
    const values = new Set<string>();
    if (!customModeActive) return [] as string[];
    recipients.forEach((recipient) => {
      if (recipient.profesion) {
        values.add(recipient.profesion);
      }
    });
    return Array.from(values).sort((a, b) => collator.compare(a, b));
  }, [customModeActive, recipients, collator]);

  const filteredCustomRecipients = useMemo(() => {
    if (!customModeActive) return [] as MessagingRecipient[];
    const searchTerm = customSearch.trim().toLowerCase();
    const professionFilter = customProfession === "all" ? null : customProfession.toLowerCase();
    const minOperativos = customActivity === "1plus" ? 1 : customActivity === "3plus" ? 3 : 0;

    let list = recipients;

    if (searchTerm) {
      list = list.filter((vol) => {
        const nombre = displayNombre(vol).toLowerCase();
        const email = vol.email.toLowerCase();
        const rut = (vol.rut || "").toLowerCase();
        return nombre.includes(searchTerm) || email.includes(searchTerm) || rut.includes(searchTerm);
      });
    }

    if (professionFilter) {
      list = list.filter((vol) => (vol.profesion || "").toLowerCase() === professionFilter);
    }

    if (minOperativos > 0) {
      list = list.filter((vol) => vol.operativosRealizados >= minOperativos);
    }

    const sorted = [...list].sort((a, b) => {
      if (customSort.key === "operativos") {
        const diff = a.operativosRealizados - b.operativosRealizados;
        return customSort.direction === "asc" ? diff : -diff;
      }
      const compare = collator.compare(displayNombre(a), displayNombre(b));
      if (compare !== 0) {
        return customSort.direction === "asc" ? compare : -compare;
      }
      return collator.compare(a.email, b.email);
    });

    return sorted;
  }, [
    collator,
    customActivity,
    customModeActive,
    customProfession,
    customSearch,
    customSort.direction,
    customSort.key,
    recipients,
  ]);

  const visibleSelectedCount = useMemo(
    () => filteredCustomRecipients.filter((recipient) => selectedSet.has(recipient.id)).length,
    [filteredCustomRecipients, selectedSet]
  );
  const allVisibleSelected = filteredCustomRecipients.length > 0 && visibleSelectedCount === filteredCustomRecipients.length;
  const anyVisibleSelected = visibleSelectedCount > 0;

  useEffect(() => {
    if (!bulkCheckboxRef.current) return;
    bulkCheckboxRef.current.indeterminate = customModeActive && anyVisibleSelected && !allVisibleSelected;
  }, [anyVisibleSelected, allVisibleSelected, customModeActive]);

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
    total === 0 ||
    isSending ||
    subject.trim().length === 0 ||
    body.trim().length === 0 ||
    (filters.mode === "operativo" && !filters.operativoId) ||
    (filters.mode === "custom" && selectedIds.length === 0);

  const recipientSummary = useMemo(() => {
    if (isPending) return "Recalculando resultados...";
    if (total === 0) return "No hay voluntarios que coincidan con los filtros seleccionados.";
    return `Se enviará el mensaje a ${total} voluntario${total === 1 ? "" : "s"}.`;
  }, [isPending, total]);

  const selectionSummary = customModeActive
    ? selectedIds.length
      ? `Enviarás el mensaje a ${selectedIds.length} voluntario${selectedIds.length === 1 ? "" : "s"} seleccionados manualmente.`
      : "Selecciona al menos un voluntario para poder enviar el mensaje."
    : recipientSummary;

  const remaining = customModeActive ? 0 : Math.max(total - preview.length, 0);

  const handleToggleAllVisible = (checked: boolean) => {
    if (!customModeActive) return;
    setSelectedIds((prev) => {
      if (!checked) {
        const idsToRemove = new Set(filteredCustomRecipients.map((recipient) => recipient.id));
        return prev.filter((id) => !idsToRemove.has(id));
      }
      const merged = new Set(prev);
      filteredCustomRecipients.forEach((recipient) => merged.add(recipient.id));
      return Array.from(merged);
    });
  };

  const handleToggleRecipient = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((value) => value !== id);
    });
  };

  const handleSort = (key: "name" | "operativos") => {
    setCustomSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: key === "operativos" ? "desc" : "asc" };
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const sortArrow = (column: "name" | "operativos") =>
    customSort.key === column ? (customSort.direction === "asc" ? "↑" : "↓") : "";

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
          <div className="grid gap-4 md:grid-cols-3">
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
            <label className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
              <input
                type="radio"
                name="mode"
                value="custom"
                checked={filterState.mode === "custom"}
                onChange={() => handleModeChange("custom")}
              />
              <div>
                <div className="font-medium text-slate-900">Personalizado</div>
                <p className="text-xs text-slate-500">Selecciona manualmente voluntarios individuales.</p>
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
          ) : filterState.mode === "all" ? (
            <p className="text-sm text-slate-500">
              Se enviará el mensaje a todos los voluntarios registrados con email válido.
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Podrás elegir voluntarios específicos en la siguiente etapa.
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
          <h2 className="text-lg font-semibold">
            {customModeActive ? "2. Selecciona voluntarios específicos" : "2. Previsualización rápida"}
          </h2>
          <p className="text-sm text-slate-500">{selectionSummary}</p>
        </header>

        {customModeActive ? (
          total === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-slate-400">
              No hay voluntarios disponibles para seleccionar con los filtros actuales.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium text-slate-500">Buscar por nombre, email o RUT</span>
                  <input
                    type="text"
                    value={customSearch}
                    onChange={(event) => setCustomSearch(event.target.value)}
                    placeholder="Ej: Camila, @gmail.com, 12.345"
                    className="w-full rounded-md border px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium text-slate-500">Profesión</span>
                  <select
                    value={customProfession}
                    onChange={(event) => setCustomProfession(event.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option value="all">Todos los perfiles</option>
                    {professionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium text-slate-500">Experiencia en operativos</span>
                  <select
                    value={customActivity}
                    onChange={(event) => setCustomActivity(event.target.value as "any" | "1plus" | "3plus")}
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option value="any">Cualquier experiencia</option>
                    <option value="1plus">1 operativo o más</option>
                    <option value="3plus">3 operativos o más</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Coincidencias: {filteredCustomRecipients.length} de {total}
                  </span>
                  <span>Seleccionados: {selectedIds.length}</span>
                  {filteredCustomRecipients.length ? (
                    <span>En esta vista: {visibleSelectedCount}</span>
                  ) : null}
                </div>
                {selectedIds.length ? (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Quitar selección
                  </button>
                ) : null}
              </div>

              {filteredCustomRecipients.length ? (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="max-h-[420px] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2">
                            <input
                              ref={bulkCheckboxRef}
                              type="checkbox"
                              checked={filteredCustomRecipients.length > 0 && allVisibleSelected}
                              onChange={(event) => handleToggleAllVisible(event.target.checked)}
                            />
                          </th>
                          <th className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => handleSort("name")}
                              className="flex items-center gap-1 font-semibold text-slate-600"
                            >
                              Nombre
                              <span className="text-[11px] text-slate-400">{sortArrow("name")}</span>
                            </button>
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-600">Profesión</th>
                          <th className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => handleSort("operativos")}
                              className="flex items-center gap-1 font-semibold text-slate-600"
                            >
                              Operativos
                              <span className="text-[11px] text-slate-400">{sortArrow("operativos")}</span>
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCustomRecipients.map((vol) => (
                          <tr key={vol.id} className="align-top">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedSet.has(vol.id)}
                                onChange={(event) => handleToggleRecipient(vol.id, event.target.checked)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-medium text-slate-800">{displayNombre(vol)}</div>
                              <div className="text-xs text-slate-500">{vol.email}</div>
                              {vol.rut ? (
                                <div className="text-xs text-slate-400">RUT: {vol.rut}</div>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{vol.profesion || "—"}</td>
                            <td className="px-3 py-2 text-slate-600">{vol.operativosRealizados}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-slate-400">
                  No hay voluntarios que coincidan con estos filtros locales.
                </div>
              )}
            </div>
          )
        ) : preview.length ? (
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
          {filters.mode === "custom"
            ? selectedIds.map((id) => <input key={id} type="hidden" name="selectedIds" value={id} />)
            : null}

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
