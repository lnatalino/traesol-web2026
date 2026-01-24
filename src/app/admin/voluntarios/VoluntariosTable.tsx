"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { VoluntarioAdminRow, VoluntarioFilters } from "@/lib/voluntariosAdmin";
import { EMPTY_OPTION_VALUE } from "@/lib/voluntariosAdmin";

type OptionLists = {
  profesiones: string[];
  especialidades: string[];
  includeEmptyProfesion: boolean;
  includeEmptyEspecialidad: boolean;
};

type DisplayRow = VoluntarioAdminRow & {
  createdLabel: string;
  birthLabel: string;
};

type Props = {
  items: DisplayRow[];
  total: number;
  limit: number;
  filters: VoluntarioFilters;
  options: OptionLists;
  errorMessage: string;
};

type FormState = {
  q: string;
  profesion: string;
  especialidad: string;
  veg: "" | "true" | "false";
};

function displayNombre(row: DisplayRow): string {
  const partes = [row.nombres, row.apellidos].filter(Boolean);
  return partes.length ? partes.join(" ") : "Sin nombre";
}

function displayProfesion(row: DisplayRow): string {
  const base = row.profesion ? row.profesion.trim() : "";
  if (base === "Otro" && row.profesion_otro) return row.profesion_otro;
  if (base) return base;
  if (row.profesion_otro) return row.profesion_otro;
  return "—";
}

function displayEspecialidad(row: DisplayRow): string {
  return row.especialidad ? row.especialidad : "—";
}

function displayAlimentacion(row: DisplayRow): string {
  const parts: string[] = [];
  if (row.alimentarias_veg === true) parts.push("Vegetariano/a");
  if (row.alimentarias_veg === false) parts.push("Omnívoro/a");
  if (row.alimentarias_alergias) parts.push(`Alergias: ${row.alimentarias_alergias}`);
  if (row.alimentarias_otro) parts.push(row.alimentarias_otro);
  return parts.length ? parts.join(" · ") : "—";
}

function displayTallas(row: DisplayRow): string {
  const parts: string[] = [];
  if (row.talla_polera) parts.push(`Polera: ${row.talla_polera}`);
  if (row.talla_pantalon) parts.push(`Pantalón: ${row.talla_pantalon}`);
  return parts.length ? parts.join(" · ") : "—";
}

function buildCsvHref(filters: VoluntarioFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.profesion) params.set("profesion", filters.profesion);
  if (filters.especialidad) params.set("especialidad", filters.especialidad);
  if (filters.veg) params.set("veg", filters.veg);
  const query = params.toString();
  return query ? `/api/admin/voluntarios/export?${query}` : "/api/admin/voluntarios/export";
}

function buildQueryString(form: FormState): string {
  const params = new URLSearchParams();
  if (form.q.trim()) params.set("q", form.q.trim());
  if (form.profesion) params.set("profesion", form.profesion);
  if (form.especialidad) params.set("especialidad", form.especialidad);
  if (form.veg) params.set("veg", form.veg);
  return params.toString();
}

export default function VoluntariosTable({ items, total, limit, filters, options, errorMessage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() => ({
    q: filters.q,
    profesion: filters.profesion,
    especialidad: filters.especialidad,
    veg: filters.veg,
  }));

  const csvHref = useMemo(() => buildCsvHref(filters), [filters]);
  const showing = items.length;
  const truncated = total > limit;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = buildQueryString(form);
    const url = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.push(url);
    });
  };

  const handleReset = () => {
    setForm({ q: "", profesion: "", especialidad: "", veg: "" });
    startTransition(() => {
      router.push(pathname);
    });
  };

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-[30px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5"
      >
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="vol-search">
              Buscar
            </label>
            <input
              id="vol-search"
              type="text"
              value={form.q}
              onChange={(event) => updateForm({ q: event.target.value })}
              placeholder="Nombre, email, RUT, Instagram..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="vol-profesion">
              Profesión
            </label>
            <select
              id="vol-profesion"
              value={form.profesion}
              onChange={(event) => updateForm({ profesion: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas</option>
              {options.includeEmptyProfesion ? (
                <option value={EMPTY_OPTION_VALUE}>Sin dato</option>
              ) : null}
              {options.profesiones.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="vol-especialidad">
              Especialidad
            </label>
            <select
              id="vol-especialidad"
              value={form.especialidad}
              onChange={(event) => updateForm({ especialidad: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas</option>
              {options.includeEmptyEspecialidad ? (
                <option value={EMPTY_OPTION_VALUE}>Sin dato</option>
              ) : null}
              {options.especialidades.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="vol-veg">
              Restricción alimentaria
            </label>
            <select
              id="vol-veg"
              value={form.veg}
              onChange={(event) => updateForm({ veg: event.target.value as FormState["veg"] })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas</option>
              <option value="true">Vegetarianos</option>
              <option value="false">Omnívoros</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-medium text-slate-500">
            {isPending
              ? "Actualizando resultados..."
              : `Mostrando ${showing} de ${total} voluntarios${truncated ? " (muestra limitada a 200)." : "."}`}
            {truncated ? " Usa la exportación CSV para obtener la lista completa." : ""}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              disabled={isPending}
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
            >
              Aplicar filtros
            </button>
            <a
              href={csvHref}
              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Exportar CSV
            </a>
          </div>
        </div>
      </form>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[30px] border border-slate-100 bg-white/95 shadow-xl shadow-blue-900/5">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/80 text-slate-600">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Nombre</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Contacto</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Identificación</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Profesión</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Alimentación</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Tallas</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Registrado</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length ? (
              items.map((row) => {
                const nombre = displayNombre(row);
                const identificaciones: string[] = [];
                if (row.rut) identificaciones.push(`RUT: ${row.rut}`);
                if (row.id_nacional) identificaciones.push(`ID: ${row.id_nacional}`);
                if (row.pasaporte) identificaciones.push(`Pasaporte: ${row.pasaporte}`);
                if (row.nombre_credencial) identificaciones.push(`Credencial: ${row.nombre_credencial}`);

                return (
                  <tr key={row.id} className="align-top hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{nombre}</div>
                      <div className="text-xs text-slate-500">
                        {row.nacionalidad ? `${row.nacionalidad} · ` : ""}
                        {row.genero || "Sin género"}
                      </div>
                      <div className="text-xs text-slate-400">Nacimiento: {row.birthLabel}</div>
                    </td>
                    <td className="px-5 py-4 space-y-1">
                      {row.email ? (
                        <a href={`mailto:${row.email}`} className="text-blue-600 hover:underline">
                          {row.email}
                        </a>
                      ) : (
                        <div>—</div>
                      )}
                      {row.telefono ? <div>{row.telefono}</div> : null}
                      {row.instagram ? <div className="text-xs text-slate-500">IG: {row.instagram}</div> : null}
                    </td>
                    <td className="px-5 py-4">
                      {identificaciones.length ? (
                        <ul className="space-y-1 text-xs text-slate-600">
                          {identificaciones.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <div>—</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div>{displayProfesion(row)}</div>
                      <div className="text-xs text-slate-500">Especialidad: {displayEspecialidad(row)}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">{displayAlimentacion(row)}</td>
                    <td className="px-5 py-4 text-xs text-slate-600">{displayTallas(row)}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{row.createdLabel}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2 text-xs">
                        <Link
                          href={`/admin/voluntarios/${row.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Ver perfil
                        </Link>
                        {row.email ? (
                          <a
                            href={`mailto:${row.email}`}
                            className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Enviar email
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">
                  {errorMessage
                    ? errorMessage
                    : (filters.q || filters.profesion || filters.especialidad || filters.veg)
                      ? "No se encontraron voluntarios con los filtros aplicados. Intenta limpiar los filtros."
                      : "Todavía no hay voluntarios registrados en la plataforma."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
