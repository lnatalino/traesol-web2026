"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
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
  const [form, setForm] = useState<FormState>({
    q: filters.q,
    profesion: filters.profesion,
    especialidad: filters.especialidad,
    veg: filters.veg,
  });

  useEffect(() => {
    setForm({
      q: filters.q,
      profesion: filters.profesion,
      especialidad: filters.especialidad,
      veg: filters.veg,
    });
  }, [filters.q, filters.profesion, filters.especialidad, filters.veg]);

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
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-500" htmlFor="vol-search">
              Buscar
            </label>
            <input
              id="vol-search"
              type="text"
              value={form.q}
              onChange={(event) => updateForm({ q: event.target.value })}
              placeholder="Nombre, email, RUT, Instagram..."
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500" htmlFor="vol-profesion">
              Profesión
            </label>
            <select
              id="vol-profesion"
              value={form.profesion}
              onChange={(event) => updateForm({ profesion: event.target.value })}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
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
            <label className="block text-xs font-medium text-slate-500" htmlFor="vol-especialidad">
              Especialidad
            </label>
            <select
              id="vol-especialidad"
              value={form.especialidad}
              onChange={(event) => updateForm({ especialidad: event.target.value })}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
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
            <label className="block text-xs font-medium text-slate-500" htmlFor="vol-veg">
              Restricción alimentaria
            </label>
            <select
              id="vol-veg"
              value={form.veg}
              onChange={(event) => updateForm({ veg: event.target.value as FormState["veg"] })}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="true">Vegetarianos</option>
              <option value="false">Omnívoros</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {isPending
              ? "Aplicando filtros..."
              : `Mostrando ${showing} de ${total} voluntarios${truncated ? " (muestra limitada a 200)." : "."}`}
            {truncated ? " Ajusta filtros o usa la exportación CSV para ver la lista completa." : ""}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border px-3 py-1.5 hover:bg-slate-50"
              disabled={isPending}
            >
              Limpiar filtros
            </button>
            <button
              type="submit"
              className="rounded-md border border-blue-600 px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
            >
              Aplicar filtros
            </button>
            <a
              href={csvHref}
              className="inline-flex items-center rounded-md border border-emerald-600 px-3 py-1.5 font-medium text-emerald-600 hover:bg-emerald-50"
            >
              Exportar CSV
            </a>
          </div>
        </div>
      </form>

      {errorMessage ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold">Contacto</th>
              <th className="px-4 py-3 text-left font-semibold">Identificación</th>
              <th className="px-4 py-3 text-left font-semibold">Profesión</th>
              <th className="px-4 py-3 text-left font-semibold">Alimentación</th>
              <th className="px-4 py-3 text-left font-semibold">Tallas</th>
              <th className="px-4 py-3 text-left font-semibold">Registrado</th>
              <th className="px-4 py-3 text-left font-semibold">Acciones</th>
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
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{nombre}</div>
                      <div className="text-xs text-slate-500">
                        {row.nacionalidad ? `${row.nacionalidad} · ` : ""}
                        {row.genero || "Sin género"}
                      </div>
                      <div className="text-xs text-slate-400">Nacimiento: {row.birthLabel}</div>
                    </td>
                    <td className="px-4 py-3 space-y-1">
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
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                      <div>{displayProfesion(row)}</div>
                      <div className="text-xs text-slate-500">Especialidad: {displayEspecialidad(row)}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{displayAlimentacion(row)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{displayTallas(row)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{row.createdLabel}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 text-xs">
                        <Link
                          href={`/admin/voluntarios/${row.id}`}
                          className="inline-flex items-center justify-center rounded-md border px-3 py-1 hover:bg-slate-50"
                        >
                          Ver perfil
                        </Link>
                        {row.email ? (
                          <a
                            href={`mailto:${row.email}`}
                            className="inline-flex items-center justify-center rounded-md border px-3 py-1 hover:bg-slate-50"
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
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                  No se encontraron voluntarios con los criterios actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
