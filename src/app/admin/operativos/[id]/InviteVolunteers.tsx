"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { EMPTY_OPTION_VALUE } from "@/lib/voluntariosAdmin";

type OptionLists = {
  profesiones: string[];
  especialidades: string[];
  includeEmptyProfesion: boolean;
  includeEmptyEspecialidad: boolean;
};

type VolunteerRow = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  profesion: string | null;
  profesion_otro: string | null;
  especialidad: string | null;
};

type Props = {
  operativoId: string;
  redirectTo: string;
  options: OptionLists;
};

type Filters = {
  q: string;
  profesion: string;
  especialidad: string;
};

type FetchState = {
  loading: boolean;
  error: string;
};

type SearchResponse = {
  ok: boolean;
  total: number;
  volunteers: VolunteerRow[];
  error?: string;
};

const DEFAULT_LIMIT = 50;

function displayNombre(vol: VolunteerRow): string {
  const parts = [vol.nombres, vol.apellidos].filter(Boolean);
  return parts.length ? parts.join(" ") : "Sin nombre";
}

function displayProfesion(vol: VolunteerRow): string {
  if (vol.profesion === "Otro" && vol.profesion_otro) return vol.profesion_otro;
  if (vol.profesion) return vol.profesion;
  if (vol.profesion_otro) return vol.profesion_otro;
  return "—";
}

function buildQuery(filters: Filters, operativoId: string): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.profesion) params.set("profesion", filters.profesion);
  if (filters.especialidad) params.set("especialidad", filters.especialidad);
  params.set("limit", String(DEFAULT_LIMIT));
  params.set("excludeOperativoId", operativoId);
  return params.toString();
}

export default function InviteVolunteers({ operativoId, redirectTo, options }: Props) {
  const [filters, setFilters] = useState<Filters>({ q: "", profesion: "", especialidad: "" });
  const [fetchState, setFetchState] = useState<FetchState>({ loading: false, error: "" });
  const [results, setResults] = useState<VolunteerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const selectedCount = selected.size;
  const allSelected = results.length > 0 && selectedCount === results.length;
  const someSelected = selectedCount > 0 && selectedCount < results.length;

  const fetchVolunteers = useCallback(async () => {
    setFetchState({ loading: true, error: "" });
    try {
      const query = buildQuery(filters, operativoId);
      const res = await fetch(`/api/admin/voluntarios/search?${query}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }
      const data = (await res.json()) as SearchResponse;
      if (!data.ok) {
        throw new Error(data.error || "No se pudo cargar la búsqueda.");
      }
      setResults(data.volunteers);
      setTotal(data.total ?? data.volunteers.length);
      setSelected((prev) => {
        const next = new Set<string>();
        data.volunteers.forEach((vol) => {
          if (prev.has(vol.id)) {
            next.add(vol.id);
          }
        });
        if (next.size === 0) {
          return new Set(data.volunteers.map((vol) => vol.id));
        }
        return next;
      });
      setFetchState({ loading: false, error: "" });
    } catch (error: unknown) {
      setFetchState({
        loading: false,
        error: getErrorMessage(error, "No se pudo cargar la búsqueda."),
      });
      setResults([]);
      setTotal(0);
      setSelected(new Set());
    }
  }, [filters, operativoId]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const toggleVolunteer = useCallback((volId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(volId)) next.delete(volId);
      else next.add(volId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      if (results.length === 0) return new Set();
      if (prev.size === results.length) return new Set();
      return new Set(results.map((row) => row.id));
    });
  }, [results]);

  const disableSubmit = selectedCount === 0 || isSubmitting;

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
  }, []);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected, allSelected]);

  const selectedPreview = useMemo(() => {
    if (!selectedCount) return "";
    if (selectedCount === 1) return "1 voluntario seleccionado";
    return `${selectedCount} voluntarios seleccionados`;
  }, [selectedCount]);

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          fetchVolunteers();
        }}
      >
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-500" htmlFor="invite-search">
            Buscar
          </label>
          <input
            id="invite-search"
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            placeholder="Nombre, email, RUT…"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500" htmlFor="invite-profesion">
            Profesión
          </label>
          <select
            id="invite-profesion"
            value={filters.profesion}
            onChange={(event) => setFilters((prev) => ({ ...prev, profesion: event.target.value }))}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {options.includeEmptyProfesion ? <option value={EMPTY_OPTION_VALUE}>Sin dato</option> : null}
            {options.profesiones.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500" htmlFor="invite-especialidad">
            Especialidad
          </label>
          <select
            id="invite-especialidad"
            value={filters.especialidad}
            onChange={(event) => setFilters((prev) => ({ ...prev, especialidad: event.target.value }))}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {options.includeEmptyEspecialidad ? <option value={EMPTY_OPTION_VALUE}>Sin dato</option> : null}
            {options.especialidades.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 flex flex-wrap items-center gap-3 text-sm">
          <button
            type="submit"
            className="rounded-md border border-blue-600 px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={fetchState.loading}
          >
            {fetchState.loading ? "Buscando…" : "Buscar"}
          </button>
          <span className="text-xs text-slate-500">
            {fetchState.loading
              ? "Cargando resultados"
              : total
              ? `Resultados totales: ${total}. Mostrando ${results.length} registros.`
              : "Sin resultados para estos filtros."}
          </span>
        </div>
      </form>

      {fetchState.error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchState.error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={selectAllRef}
                    onChange={toggleSelectAll}
                  />
                  Seleccionar todos
                </label>
              </th>
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Profesión</th>
              <th className="px-4 py-3 text-left font-semibold">Especialidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.length ? (
              results.map((vol) => {
                const checked = selected.has(vol.id);
                return (
                  <tr key={vol.id} className="align-middle hover:bg-slate-50/50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleVolunteer(vol.id)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-slate-900">{displayNombre(vol)}</div>
                    </td>
                    <td className="px-4 py-2">{vol.email || "—"}</td>
                    <td className="px-4 py-2">{displayProfesion(vol)}</td>
                    <td className="px-4 py-2">{vol.especialidad || "—"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  {fetchState.loading ? "Buscando voluntarios…" : "No se encontraron voluntarios."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        action="/api/admin/inscripciones/invitar"
        method="post"
        className="flex flex-wrap items-center justify-between gap-3"
        onSubmit={handleSubmit}
      >
        <div className="text-xs text-slate-500">{selectedPreview || "Selecciona al menos un voluntario."}</div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="operativo_id" value={operativoId} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          {Array.from(selected).map((volId) => (
            <input key={volId} type="hidden" name="voluntario_id" value={volId} />
          ))}
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disableSubmit}
          >
            {isSubmitting ? "Enviando invitaciones…" : "Enviar invitaciones"}
          </button>
        </div>
      </form>
    </div>
  );
}
