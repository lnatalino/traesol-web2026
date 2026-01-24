"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, User } from "lucide-react";

type RowData = {
  raw: { id: string };
  voluntario?: {
    id: string;
    rut: string | null;
  };
  nombre: string;
  email: string;
  profesion: string;
  origen: "postulacion" | "invitacion";
};

type Props = {
  rows: RowData[];
};

function originBadgeClass(origin: "postulacion" | "invitacion"): string {
  if (origin === "invitacion")
    return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

export function ConfirmadosTableWithSearch({ rows }: Props) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.toLowerCase().trim();
    return rows.filter((row) => {
      const nombre = row.nombre.toLowerCase();
      const email = row.email.toLowerCase();
      const rut = (row.voluntario?.rut ?? "").toLowerCase().replace(/[.\-]/g, "");
      const queryNormalized = query.replace(/[.\-]/g, "");
      return (
        nombre.includes(query) ||
        email.includes(query) ||
        rut.includes(queryNormalized) ||
        row.profesion.toLowerCase().includes(query)
      );
    });
  }, [rows, search]);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email, RUT o profesión..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      {search && (
        <p className="text-xs text-slate-500">
          Mostrando {filteredRows.length} de {rows.length} voluntarios
        </p>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Profesión</th>
              <th className="px-4 py-3 text-left">Origen</th>
              <th className="px-4 py-3 text-center">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {search
                    ? "No se encontraron voluntarios con ese criterio."
                    : "No hay voluntarios confirmados."}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.raw.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {row.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.email ? (
                      <a
                        href={`mailto:${row.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {row.email}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.profesion}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${originBadgeClass(
                        row.origen
                      )}`}
                    >
                      {row.origen === "invitacion" ? "Invitación" : "Postulación"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.voluntario?.id ? (
                      <Link
                        href={`/admin/voluntarios/${row.voluntario.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <User className="h-3.5 w-3.5" />
                        Ver ficha
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
