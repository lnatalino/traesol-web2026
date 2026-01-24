"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import { AdminSectionCard, EmptyState, StatTile, StatTileGrid } from "@/components/admin/ui";
import { OperativoSelector, type OperativoOption } from "./OperativoSelector";
import { InvitacionesHistorial, type InvitacionHistorialRow } from "./InvitacionesHistorial";

export type InviteVolunteer = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  profesion: string | null;
  especialidad: string | null;
};

export type InviteOperativo = OperativoOption;

type Props = {
  volunteers: InviteVolunteer[];
  operativos: InviteOperativo[];
  invitacionesPorOperativo: Map<string, InvitacionHistorialRow[]>;
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

function buildUniqueOptions(values: Array<string | null>): string[] {
  return Array.from(new Set(values.map((value) => (value || "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

export default function InviteManager({ volunteers, operativos, invitacionesPorOperativo, errorMessage }: Props) {
  const searchParams = useSearchParams();
  const initialOperativo = searchParams.get("operativo") || "";
  
  const [selectedOperativo, setSelectedOperativo] = useState(initialOperativo);
  const [search, setSearch] = useState("");
  const [profesionFilter, setProfesionFilter] = useState("");
  const [especialidadFilter, setEspecialidadFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback>({ success: "", warning: "", error: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Limpiar selección al cambiar de operativo
  useEffect(() => {
    setSelectedIds(new Set());
    setFeedback({ success: "", warning: "", error: "" });
  }, [selectedOperativo]);

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

  // Historial de invitaciones para el operativo seleccionado
  const invitacionesHistorial = selectedOperativo 
    ? invitacionesPorOperativo.get(selectedOperativo) || []
    : [];

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
    if (!selectedOperativo) {
      setFeedback({ success: "", warning: "", error: "Debes seleccionar un operativo primero." });
      return;
    }
    if (selectedIds.size === 0) {
      setFeedback({ success: "", warning: "", error: "Debes seleccionar al menos un voluntario." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ success: "", warning: "", error: "" });

    try {
      const response = await fetch("/api/admin/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operativoId: selectedOperativo, voluntarioIds: Array.from(selectedIds) }),
      });

      type InviteApiResult = {
        error?: string;
        message?: string;
        supabaseError?: { message?: string; code?: string; details?: string };
        summary?: Record<string, unknown> | null;
        results?: Array<{ id: string; ok: boolean; status: string; message?: string }>;
      };

      let payload: InviteApiResult | null = null;
      try {
        payload = (await response.json()) as InviteApiResult;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const baseMessage = payload?.error || payload?.message || "No se pudieron enviar las invitaciones.";
        const supabaseError = payload?.supabaseError;
        const detailParts: string[] = [];
        if (supabaseError?.message) detailParts.push(`Supabase: ${supabaseError.message}`);
        if (supabaseError?.code) detailParts.push(`Código ${supabaseError.code}`);
        if (supabaseError?.details) detailParts.push(supabaseError.details);
        const detail = detailParts.length ? ` (${detailParts.join(" · ")})` : "";
        throw new Error(`${baseMessage}${detail}`);
      }

      const summary = (payload?.summary ?? {}) as Record<string, unknown>;
      const summaryNumber = (key: string): number => {
        const value = summary[key];
        if (typeof value === "number") return value;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      };
      const resultsArray: Array<{ id: string; ok: boolean; status: string; message?: string }> = Array.isArray(
        payload?.results
      ) ? payload.results : [];

      const invited = summaryNumber("INVITACION_ENVIADA");
      const resent = summaryNumber("INVITACION_REENVIADA");
      const alreadyPostulado = summaryNumber("YA_POSTULO");
      const alreadyInscrito = summaryNumber("YA_INSCRITO");
      const failures = summaryNumber("ERROR");

      const successParts: string[] = [];
      if (invited > 0) {
        successParts.push(invited === 1 ? "Se envió 1 invitación nueva." : `Se enviaron ${invited} invitaciones nuevas.`);
      }
      if (resent > 0) {
        successParts.push(resent === 1 ? "Se reenvió 1 invitación." : `Se reenviaron ${resent} invitaciones.`);
      }

      const warningParts: string[] = [];
      if (alreadyInscrito > 0) {
        warningParts.push(alreadyInscrito === 1 ? "1 persona ya estaba inscrita." : `${alreadyInscrito} personas ya estaban inscritas.`);
      }
      if (alreadyPostulado > 0) {
        warningParts.push(alreadyPostulado === 1 ? "1 persona ya había postulado." : `${alreadyPostulado} personas ya habían postulado.`);
      }

      const errorParts: string[] = [];
      if (failures > 0) {
        const firstError = resultsArray.find((item) => !item.ok && item.status === "ERROR");
        const detail = firstError?.message ? ` (${firstError.message})` : "";
        errorParts.push(failures === 1 ? `1 invitación falló${detail}.` : `${failures} invitaciones fallaron.`);
      }

      setFeedback({ success: successParts.join(" "), warning: warningParts.join(" "), error: errorParts.join(" ") });

      if (invited > 0 || resent > 0) {
        setSelectedIds(new Set());
        // Recargar la página para actualizar el historial
        window.location.reload();
      }
    } catch (error: unknown) {
      setFeedback({
        success: "",
        warning: "",
        error: getErrorMessage(error, "No se pudieron enviar las invitaciones."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const operativoNoSeleccionado = !selectedOperativo;
  const disableSubmit = isSubmitting || operativoNoSeleccionado || selectedIds.size === 0;

  return (
    <div className="space-y-6">
      {/* Error global de carga */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* PASO 1: Selector de Operativo */}
      <AdminSectionCard
        title="1. Selecciona el operativo"
        hint="Solo aparecen operativos publicados con fechas vigentes"
        icon={<span className="text-lg font-bold text-blue-600">1</span>}
      >
        <OperativoSelector
          operativos={operativos}
          selectedId={selectedOperativo}
          onSelect={setSelectedOperativo}
        />
      </AdminSectionCard>

      {/* Stats del operativo seleccionado */}
      {selectedOperativo && (
        <StatTileGrid>
          <StatTile
            icon={<Users className="h-4 w-4" />}
            label="Voluntarios seleccionados"
            value={totalSelected}
            highlight={totalSelected > 0}
            highlightVariant="blue"
          />
          <StatTile
            icon={<Send className="h-4 w-4" />}
            label="Invitaciones enviadas"
            value={invitacionesHistorial.length}
            highlight={invitacionesHistorial.length > 0}
            highlightVariant="emerald"
          />
        </StatTileGrid>
      )}

      {/* PASO 2: Selección de voluntarios (solo si hay operativo) */}
      {operativoNoSeleccionado ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-600">
            Selecciona un operativo arriba para ver y seleccionar voluntarios.
          </p>
        </div>
      ) : (
        <AdminSectionCard
          title="2. Selecciona los voluntarios"
          hint="Marca a las personas que quieras invitar"
          icon={<span className="text-lg font-bold text-blue-600">2</span>}
        >
          {/* Filtros */}
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">Buscar</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o email"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">Profesión</span>
              <select
                value={profesionFilter}
                onChange={(e) => setProfesionFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Todas</option>
                {professionOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">Especialidad</span>
              <select
                value={especialidadFilter}
                onChange={(e) => setEspecialidadFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Todas</option>
                {specialtyOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Seleccionar todos */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="inline-flex items-center gap-2 font-medium text-slate-600">
              <input
                type="checkbox"
                ref={selectAllRef}
                checked={allFilteredSelected}
                onChange={toggleAllFiltered}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                disabled={filteredIds.length === 0}
              />
              Seleccionar todos ({filteredIds.length})
            </label>
            <span className="text-slate-500">
              Seleccionados: <span className="font-semibold text-slate-900">{totalSelected}</span>
            </span>
          </div>

          {/* Tabla de voluntarios */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="max-h-[350px] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-50/95 backdrop-blur">
                  <tr>
                    <th className="w-10 px-3 py-2.5"></th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Profesión</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Especialidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVolunteers.length > 0 ? (
                    filteredVolunteers.map((vol) => (
                      <tr 
                        key={vol.id} 
                        className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(vol.id) ? "bg-blue-50/50" : ""}`}
                        onClick={() => toggleVolunteer(vol.id)}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                            checked={selectedIds.has(vol.id)}
                            onChange={() => toggleVolunteer(vol.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">{formatNombre(vol)}</td>
                        <td className="px-3 py-2.5 text-slate-600">{vol.email || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600">{vol.profesion || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600">{vol.especialidad || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        {volunteers.length === 0 
                          ? "No hay voluntarios registrados." 
                          : "No hay voluntarios con los filtros actuales."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AdminSectionCard>
      )}

      {/* Feedback de envío */}
      {feedback.success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
          {feedback.success}
        </div>
      )}
      {feedback.warning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {feedback.warning}
        </div>
      )}
      {feedback.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {feedback.error}
        </div>
      )}

      {/* Botón de enviar */}
      {!operativoNoSeleccionado && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disableSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Enviando..." : `Enviar ${totalSelected > 0 ? totalSelected : ""} invitación${totalSelected !== 1 ? "es" : ""}`}
          </button>
        </div>
      )}

      {/* PASO 3: Historial de invitaciones */}
      {selectedOperativo && (
        <AdminSectionCard
          title="3. Invitaciones enviadas"
          hint="Historial de invitaciones para este operativo"
          icon={<span className="text-lg font-bold text-blue-600">3</span>}
        >
          <InvitacionesHistorial invitaciones={invitacionesHistorial} />
        </AdminSectionCard>
      )}
    </div>
  );
}
