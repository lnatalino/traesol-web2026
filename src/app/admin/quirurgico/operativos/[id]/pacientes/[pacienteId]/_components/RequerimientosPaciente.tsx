"use client";

// src/app/admin/quirurgico/operativos/[id]/pacientes/[pacienteId]/_components/RequerimientosPaciente.tsx
// Sección para gestionar requerimientos (exámenes, documentos) del paciente

import { useState } from "react";
import type { PacienteRequerimiento, PacienteArchivo } from "@/lib/quirurgico/types";

interface Props {
  pacienteId: string;
  requerimientos: PacienteRequerimiento[];
  archivos: PacienteArchivo[];
  onRefresh: () => void;
}

const TIPO_COLORS: Record<string, string> = {
  examen: "bg-violet-100 text-violet-700",
  documento: "bg-amber-100 text-amber-700",
  consentimiento: "bg-teal-100 text-teal-700",
  otro: "bg-slate-100 text-slate-700",
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-rose-100 text-rose-700",
  recibido: "bg-amber-100 text-amber-700",
  aprobado: "bg-green-100 text-green-700",
  rechazado: "bg-red-100 text-red-700",
};

export function RequerimientosPaciente({ pacienteId, requerimientos, archivos, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [newReq, setNewReq] = useState({
    tipo: "examen",
    titulo: "",
    descripcion: "",
    fecha_limite: "",
  });

  // Mapear archivos a requerimientos
  const archivosConRequerimiento = archivos.filter(a => a.requerimiento_id);
  const archivosPorRequerimiento: Record<string, PacienteArchivo[]> = {};
  archivosConRequerimiento.forEach(archivo => {
    if (archivo.requerimiento_id) {
      if (!archivosPorRequerimiento[archivo.requerimiento_id]) {
        archivosPorRequerimiento[archivo.requerimiento_id] = [];
      }
      archivosPorRequerimiento[archivo.requerimiento_id].push(archivo);
    }
  });

  // Generar URL pública para Supabase Storage
  const getStorageUrl = (storagePath: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/paciente-archivos/${storagePath}`;
  };

  const handleAdd = async () => {
    if (!newReq.titulo) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}/requerimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReq),
      });

      if (response.ok) {
        setNewReq({
          tipo: "examen",
          titulo: "",
          descripcion: "",
          fecha_limite: "",
        });
        setAdding(false);
        onRefresh();
      }
    } catch (error) {
      console.error("Error al agregar requerimiento:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEstado = async (reqId: string, estado: string) => {
    setUpdatingId(reqId);
    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}/requerimientos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requerimiento_id: reqId, estado }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (reqId: string) => {
    if (!confirm("¿Eliminar este requerimiento?")) return;

    setUpdatingId(reqId);
    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}/requerimientos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requerimiento_id: reqId }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error al eliminar requerimiento:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Separar por tipo
  const examenes = requerimientos.filter(r => r.tipo === "examen");
  const documentos = requerimientos.filter(r => r.tipo === "documento");
  const consentimientos = requerimientos.filter(r => r.tipo === "consentimiento");
  const otros = requerimientos.filter(r => !["examen", "documento", "consentimiento"].includes(r.tipo));

  const renderRequerimiento = (req: PacienteRequerimiento) => {
    const archivosReq = archivosPorRequerimiento[req.id] || [];
    const tieneArchivos = archivosReq.length > 0;
    
    return (
      <div
        key={req.id}
        className="flex items-start justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900">{req.titulo}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLORS[req.estado] || "bg-slate-100 text-slate-700"}`}>
              {req.estado}
            </span>
          </div>
          {req.descripcion && (
            <p className="mt-1 text-sm text-slate-600">{req.descripcion}</p>
          )}
          {req.fecha_limite && (
            <p className="mt-1 text-xs text-slate-500">
              Fecha límite: {new Date(req.fecha_limite).toLocaleDateString("es-CL")}
            </p>
          )}
          {req.notas_admin && (
            <p className="mt-1 text-xs text-amber-600 italic">
              Nota: {req.notas_admin}
            </p>
          )}
          {/* Archivos asociados */}
          {tieneArchivos && (
            <div className="mt-2 space-y-1">
              {archivosReq.map(archivo => (
                <a
                  key={archivo.id}
                  href={getStorageUrl(archivo.storage_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mr-3"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {archivo.filename}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {/* Botones de estado */}
          {tieneArchivos && req.estado === "recibido" && (
            <>
              <button
                onClick={() => handleUpdateEstado(req.id, "aprobado")}
                disabled={updatingId === req.id}
                className="text-xs font-medium text-green-600 hover:text-green-800 disabled:opacity-50"
              >
                Aprobar
              </button>
              <button
                onClick={() => handleUpdateEstado(req.id, "rechazado")}
                disabled={updatingId === req.id}
                className="text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50"
              >
                Rechazar
              </button>
            </>
          )}
          <button
            onClick={() => handleDelete(req.id)}
            disabled={updatingId === req.id}
            className="text-xs text-slate-500 hover:text-rose-600 disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </div>
    );
  };

  const renderSeccion = (items: PacienteRequerimiento[], tipo: string, label: string) => {
    if (items.length === 0) return null;
    
    return (
      <div>
        <h4 className="text-xs font-medium uppercase text-slate-500 mb-2 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 ${TIPO_COLORS[tipo] || TIPO_COLORS.otro}`}>{label}</span>
          <span className="text-slate-400">{items.length}</span>
        </h4>
        <div className="space-y-2">
          {items.map(renderRequerimiento)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Requerimientos
        </h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            + Agregar requerimiento
          </button>
        )}
      </div>

      {/* Formulario para agregar */}
      {adding && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={newReq.tipo}
              onChange={(e) => setNewReq({ ...newReq, tipo: e.target.value })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="examen">Examen</option>
              <option value="documento">Documento</option>
              <option value="consentimiento">Consentimiento</option>
              <option value="otro">Otro</option>
            </select>
            <input
              type="text"
              placeholder="Título del requerimiento *"
              value={newReq.titulo}
              onChange={(e) => setNewReq({ ...newReq, titulo: e.target.value })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={newReq.descripcion}
              onChange={(e) => setNewReq({ ...newReq, descripcion: e.target.value })}
              rows={2}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none md:col-span-2"
            />
            <div>
              <label className="block text-sm text-slate-700 mb-1">Fecha límite</label>
              <input
                type="date"
                value={newReq.fecha_limite}
                onChange={(e) => setNewReq({ ...newReq, fecha_limite: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !newReq.titulo}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Agregar"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {requerimientos.length === 0 && !adding ? (
        <p className="text-sm text-slate-500">No hay requerimientos definidos para este paciente.</p>
      ) : (
        <div className="space-y-4">
          {renderSeccion(examenes, "examen", "Exámenes")}
          {renderSeccion(documentos, "documento", "Documentos")}
          {renderSeccion(consentimientos, "consentimiento", "Consentimientos")}
          {renderSeccion(otros, "otro", "Otros")}
        </div>
      )}
    </div>
  );
}
