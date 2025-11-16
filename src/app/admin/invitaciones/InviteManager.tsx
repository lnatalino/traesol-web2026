"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type InviteVolunteer = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  profesion: string | null;
  especialidad: string | null;
};

export type InviteOperativo = {
  id: string;
  titulo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  estado: string | null;
};

type Props = {
  volunteers: InviteVolunteer[];
  operativos: InviteOperativo[];
  errorMessage: string;
};

type Feedback = {
  success: string;
  warning: string;
  error: string;
};

function formatNombre(vol: InviteVolunteer): string {
  const parts = [vol.nombres, vol.apellidos].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (vol.email) return vol.email;
  return "Voluntario sin nombre";
}

function formatIsoDate(iso: string | null): string {
  if (!iso) return "";
  const datePart = iso.split("T")[0];
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return datePart;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

function formatOperativoOption(op: InviteOperativo): string {
  const titulo = op.titulo || "Operativo sin título";
  const fecha = formatIsoDate(op.fecha_inicio);
  const lugar = op.lugar ? ` · ${op.lugar}` : "";
  const fechaLabel = fecha ? ` — ${fecha}` : "";
  return `${titulo}${fechaLabel}${lugar}`;
}

function buildUniqueOptions(values: Array<string | null>): string[] {
  return Array.from(new Set(values.map((value) => (value || "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

export default function InviteManager({ volunteers, operativos, errorMessage }: Props) {
  const [search, setSearch] = useState("");
  const [profesionFilter, setProfesionFilter] = useState("");
  const [especialidadFilter, setEspecialidadFilter] = useState("");
  const [selectedOperativo, setSelectedOperativo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback>({ success: "", warning: "", error: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const professionOptions = useMemo(() => buildUniqueOptions(volunteers.map((vol) => vol.profesion)), [volunteers]);
  const specialtyOptions = useMemo(() => buildUniqueOptions(volunteers.map((vol) => vol.especialidad)), [volunteers]);

  const filteredVolunteers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return volunteers.filter((vol) => {
      if (!vol.email) return false;
      if (profesionFilter && (vol.profesion || "") !== profesionFilter) return false;
      if (especialidadFilter && (vol.especialidad || "") !== especialidadFilter) return false;
      if (!term) return true;
      const nombre = formatNombre(vol).toLowerCase();
      return nombre.includes(term) || vol.email.toLowerCase().includes(term);
    });
  }, [volunteers, search, profesionFilter, especialidadFilter]);

  const selectAllRef = useRef<HTMLInputElement>(null);
  const filteredIds = useMemo(() => filteredVolunteers.map((vol) => vol.id), [filteredVolunteers]);
  const filteredSelectedCount = filteredIds.filter((id) => selectedIds.has(id)).length;
  const allFilteredSelected = filteredIds.length > 0 && filteredSelectedCount === filteredIds.length;

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = filteredSelectedCount > 0 && filteredSelectedCount < filteredIds.length;
  }, [filteredSelectedCount, filteredIds.length]);

  const totalSelected = selectedIds.size;

  const toggleVolunteer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedOperativo || selectedIds.size === 0) return;
    setIsSubmitting(true);
    setFeedback({ success: "", warning: "", error: "" });

    try {
      const response = await fetch("/api/admin/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operativoId: selectedOperativo, voluntarioIds: Array.from(selectedIds) }),
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch (error) {
        // ignore JSON parse errors for non-2xx
      }

      if (!response.ok) {
        const baseMessage = payload?.error || payload?.message || "No se pudieron enviar las invitaciones.";
        const supabaseError = payload?.supabaseError;
        const detailParts: string[] = [];
        if (supabaseError?.message) {
          detailParts.push(`Supabase: ${supabaseError.message}`);
        }
        if (supabaseError?.code) {
          detailParts.push(`Código ${supabaseError.code}`);
        }
        if (supabaseError?.details) {
          detailParts.push(supabaseError.details);
        }
        const detail = detailParts.length ? ` (${detailParts.join(" · ")})` : "";
        throw new Error(`${baseMessage}${detail}`);
      }

      const summary = (payload?.summary && typeof payload.summary === "object") ? payload.summary : {};
      const resultsArray: Array<{ id: string; ok: boolean; status: string; message?: string }> = Array.isArray(
        payload?.results
      )
        ? payload.results
        : [];

      const invited = Number(summary?.INVITACION_ENVIADA || 0);
      const resent = Number(summary?.INVITACION_REENVIADA || 0);
      const alreadyPostulado = Number(summary?.YA_POSTULO || 0);
      const alreadyInscrito = Number(summary?.YA_INSCRITO || 0);
      const failures = Number(summary?.ERROR || 0);

      const successParts: string[] = [];
      if (invited > 0) {
        successParts.push(
          invited === 1 ? "Se envió 1 invitación nueva." : `Se enviaron ${invited} invitaciones nuevas.`
        );
      }
      if (resent > 0) {
        successParts.push(
          resent === 1 ? "Se reenvió 1 invitación." : `Se reenviaron ${resent} invitaciones.`
        );
      }

      const warningParts: string[] = [];
      if (alreadyInscrito > 0) {
        warningParts.push(
          alreadyInscrito === 1
            ? "1 persona ya estaba inscrita."
            : `${alreadyInscrito} personas ya estaban inscritas.`
        );
      }
      if (alreadyPostulado > 0) {
        warningParts.push(
          alreadyPostulado === 1
            ? "1 persona ya había postulado."
            : `${alreadyPostulado} personas ya habían postulado.`
        );
      }

      const errorParts: string[] = [];
      if (failures > 0) {
        const firstError = resultsArray.find((item) => !item.ok && item.status === "ERROR");
        const detail = firstError?.message ? ` (${firstError.message})` : "";
        errorParts.push(
          failures === 1
            ? `1 invitación falló${detail}.`
            : `${failures} invitaciones fallaron. Revisa los registros.`
        );
      }

      setFeedback({ success: successParts.join(" "), warning: warningParts.join(" "), error: errorParts.join(" ") });

      if (invited > 0 || resent > 0) {
        setSelectedIds(new Set());
      }
    } catch (error: any) {
      setFeedback({ success: "", warning: "", error: error?.message || "No se pudieron enviar las invitaciones." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const disableSubmit = isSubmitting || !selectedOperativo || selectedIds.size === 0;
  const noDataLoaded = volunteers.length === 0 || operativos.length === 0;

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {feedback.success ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback.success}
        </div>
      ) : null}
      {feedback.warning ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {feedback.warning}
        </div>
      ) : null}
      {feedback.error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {feedback.error}
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Paso 1</p>
          <h2 className="text-xl font-semibold">Selecciona los voluntarios</h2>
          <p className="text-sm text-slate-500">
            Marca a las personas que quieras invitar. Puedes buscar por nombre, email, profesión o especialidad.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm md:col-span-1">
            <span className="text-xs font-medium text-slate-500">Buscar</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre o email"
              className="w-full rounded-md border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium text-slate-500">Profesión</span>
            <select
              value={profesionFilter}
              onChange={(event) => setProfesionFilter(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Todas</option>
              {professionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium text-slate-500">Especialidad</span>
            <select
              value={especialidadFilter}
              onChange={(event) => setEspecialidadFilter(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Todas</option>
              {specialtyOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              ref={selectAllRef}
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              className="h-4 w-4 rounded border-slate-300"
              disabled={filteredIds.length === 0}
            />
            Seleccionar todos ({filteredIds.length})
          </label>
          <div>
            Seleccionados: <span className="font-semibold text-slate-900">{totalSelected}</span>
            {filteredIds.length !== volunteers.length ? (
              <span className="text-xs text-slate-400"> · filtrados: {filteredIds.length}</span>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Seleccionar</th>
                  <th className="px-4 py-3 text-left">Voluntario</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Profesión</th>
                  <th className="px-4 py-3 text-left">Especialidad</th>
                </tr>
              </thead>
              <tbody>
                {filteredVolunteers.length ? (
                  filteredVolunteers.map((vol) => (
                    <tr key={vol.id} className="border-t align-middle">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300"
                          checked={selectedIds.has(vol.id)}
                          onChange={() => toggleVolunteer(vol.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{formatNombre(vol)}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{vol.email}</td>
                      <td className="px-4 py-3 text-slate-600">{vol.profesion || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{vol.especialidad || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      {noDataLoaded
                        ? "Aún no hay datos para mostrar."
                        : "No hay voluntarios con los filtros actuales."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Paso 2</p>
          <h2 className="text-xl font-semibold">Selecciona el operativo</h2>
          <p className="text-sm text-slate-500">
            El correo reutiliza la misma plantilla que usas desde la ficha del voluntario.
          </p>
        </header>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-slate-500">Operativo al que quieres invitar</span>
          <select
            value={selectedOperativo}
            onChange={(event) => setSelectedOperativo(event.target.value)}
            className="w-full rounded-md border px-3 py-2"
            disabled={operativos.length === 0}
          >
            <option value="">Selecciona un operativo</option>
            {operativos.map((op) => (
              <option key={op.id} value={op.id}>
                {formatOperativoOption(op)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disableSubmit || noDataLoaded}
        >
          {isSubmitting ? "Enviando invitaciones…" : "Enviar invitaciones"}
        </button>

        <p className="text-xs text-slate-500">
          El botón se habilita cuando tienes al menos un voluntario seleccionado y un operativo elegido.
        </p>
      </section>
    </div>
  );
}
