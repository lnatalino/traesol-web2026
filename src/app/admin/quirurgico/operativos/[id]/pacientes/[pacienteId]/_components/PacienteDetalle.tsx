"use client";

// src/app/admin/quirurgico/operativos/[id]/pacientes/[pacienteId]/_components/PacienteDetalle.tsx
// Componente cliente principal para la página de detalle del paciente

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PacienteForm } from "../../_components/PacienteForm";
import { ContactosEmergencia } from "./ContactosEmergencia";
import { RequerimientosPaciente } from "./RequerimientosPaciente";
import { ArchivosPaciente } from "./ArchivosPaciente";
import { PortalTokenManager } from "./PortalTokenManager";
import type { 
  Paciente, 
  PacienteContacto, 
  PacienteRequerimiento, 
  PacienteArchivo,
  PacientePortalToken,
  OperativoQuirurgicoSummary 
} from "@/lib/quirurgico/types";

interface PacienteDetalleData {
  paciente: Paciente;
  contactos: PacienteContacto[];
  requerimientos: PacienteRequerimiento[];
  archivos: PacienteArchivo[];
  portalToken: PacientePortalToken | null;
}

interface Props {
  operativo: OperativoQuirurgicoSummary;
  pacienteId: string;
}

type Tab = "datos" | "contactos" | "requerimientos" | "archivos" | "portal";

const TABS: { id: Tab; label: string }[] = [
  { id: "datos", label: "Datos" },
  { id: "contactos", label: "Contactos" },
  { id: "requerimientos", label: "Requerimientos" },
  { id: "archivos", label: "Archivos" },
  { id: "portal", label: "Portal" },
];

const ESTADO_COLORS: Record<string, string> = {
  activo: "bg-green-100 text-green-700",
  operado: "bg-blue-100 text-blue-700",
  alta: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-rose-100 text-rose-700",
};

export function PacienteDetalle({ operativo, pacienteId }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("datos");
  const [data, setData] = useState<PacienteDetalleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Paciente no encontrado");
        } else {
          setError("Error al cargar los datos");
        }
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pacienteId]);

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este paciente? Esta acción no se puede deshacer.")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/quirurgico/pacientes-v2/${pacienteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push(`/admin/quirurgico/operativos/${operativo.id}/pacientes`);
      } else {
        alert("Error al eliminar el paciente");
      }
    } catch (error) {
      alert("Error al eliminar el paciente");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-center">
        <p className="text-rose-700">{error || "No se encontraron datos"}</p>
        <Link
          href={`/admin/quirurgico/operativos/${operativo.id}/pacientes`}
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          Volver a la lista
        </Link>
      </div>
    );
  }

  const { paciente, contactos, requerimientos, archivos, portalToken } = data;

  // Mapear archivos a requerimientos para calcular stats
  const reqConArchivos = new Set(archivos.filter(a => a.requerimiento_id).map(a => a.requerimiento_id));
  
  // Calcular stats de requerimientos
  const reqPendientes = requerimientos.filter(r => r.estado === "pendiente" && !reqConArchivos.has(r.id)).length;
  const reqRecibidos = requerimientos.filter(r => r.estado === "recibido" || (r.estado === "pendiente" && reqConArchivos.has(r.id))).length;
  const reqAprobados = requerimientos.filter(r => r.estado === "aprobado").length;

  return (
    <div className="space-y-6">
      {/* Header con info del paciente */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">
                {paciente.nombres} {paciente.apellidos}
              </h1>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${ESTADO_COLORS[paciente.estado] || "bg-slate-100 text-slate-700"}`}>
                {paciente.estado}
              </span>
            </div>
            
            <div className="mt-2 flex items-center gap-4 text-sm text-slate-600 flex-wrap">
              {paciente.rut && <span>RUT: {paciente.rut}</span>}
              {paciente.telefono && <span>Tel: {paciente.telefono}</span>}
              {paciente.email && <span>{paciente.email}</span>}
            </div>

            {paciente.fecha_cirugia && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Cirugía: {new Date(paciente.fecha_cirugia).toLocaleDateString("es-CL")}
                {paciente.hora_cirugia && ` a las ${paciente.hora_cirugia.substring(0, 5)}`}
              </div>
            )}

            {/* Logística */}
            {(paciente.requiere_vuelo || paciente.requiere_hospedaje) && (
              <div className="mt-2 flex gap-2">
                {paciente.requiere_vuelo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700">
                    ✈️ Vuelo
                  </span>
                )}
                {paciente.requiere_hospedaje && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-700">
                    🏨 Hospedaje
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              {deleting ? "..." : "Eliminar"}
            </button>
          </div>
        </div>

        {/* Mini stats de requerimientos */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{requerimientos.length}</p>
            <p className="text-xs text-slate-500">Requerimientos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-rose-600">{reqPendientes}</p>
            <p className="text-xs text-slate-500">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{reqRecibidos}</p>
            <p className="text-xs text-slate-500">Por revisar</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{reqAprobados}</p>
            <p className="text-xs text-slate-500">Aprobados</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.id === "requerimientos" && reqPendientes > 0 && (
                <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-xs text-rose-700">
                  {reqPendientes}
                </span>
              )}
              {tab.id === "archivos" && archivos.length > 0 && (
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                  {archivos.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {activeTab === "datos" && (
          <PacienteForm 
            paciente={paciente} 
            operativo={operativo}
            onSuccess={fetchData}
          />
        )}
        
        {activeTab === "contactos" && (
          <ContactosEmergencia 
            pacienteId={pacienteId} 
            contactos={contactos} 
            onRefresh={fetchData}
          />
        )}
        
        {activeTab === "requerimientos" && (
          <RequerimientosPaciente 
            pacienteId={pacienteId} 
            requerimientos={requerimientos}
            archivos={archivos}
            onRefresh={fetchData}
          />
        )}
        
        {activeTab === "archivos" && (
          <ArchivosPaciente archivos={archivos} />
        )}
        
        {activeTab === "portal" && (
          <PortalTokenManager 
            pacienteId={pacienteId} 
            token={portalToken}
            pacienteNombre={`${paciente.nombres} ${paciente.apellidos}`}
            pacienteEmail={paciente.email}
            patientCanEdit={paciente.patient_can_edit ?? false}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
}
