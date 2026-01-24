"use client";

// src/app/paciente/portal/_components/PortalCliente.tsx
// Componente cliente interactivo del portal del paciente

import { useState, useRef } from "react";
import { Calendar, Clock, MapPin, FileText, Upload, Phone, User, CheckCircle, AlertCircle } from "lucide-react";
import type { PortalPacienteData } from "@/lib/quirurgico/types";

interface PortalClienteProps {
  initialData: PortalPacienteData;
}

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  weekday: "long",
  day: "numeric",
  month: "long",
});

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_FORMAT.format(date);
}

function formatTime(value?: string | null) {
  if (!value) return null;
  // Handle both full timestamp and time-only strings
  const timePart = value.includes("T") ? value.split("T")[1].slice(0, 5) : value.slice(0, 5);
  return `${timePart} hrs`;
}

export function PortalCliente({ initialData }: PortalClienteProps) {
  const [data] = useState(initialData);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentReqId, setCurrentReqId] = useState<string | null>(null);

  const fechaCirugia = formatDate(data.fecha_cirugia);
  const horaCirugia = formatTime(data.hora_cirugia);
  const fechaLlegada = formatDate(data.fecha_llegada_ciudad);
  const fechaRegreso = formatDate(data.fecha_regreso_ciudad);

  const handleUploadClick = (reqId: string) => {
    setCurrentReqId(reqId);
    setUploadError(null);
    setUploadSuccess(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentReqId) return;

    setUploading(currentReqId);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("requerimiento_id", currentReqId);

      const response = await fetch("/api/paciente/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al subir archivo");
      }

      setUploadSuccess(currentReqId);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Error al subir archivo");
    } finally {
      setUploading(null);
      setCurrentReqId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
          Fundación Traesol
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Portal del Paciente
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Aquí encontrarás la información más reciente sobre tu operativo.
        </p>
      </header>

      {/* Bienvenida */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
        <h2 className="text-xl font-semibold text-slate-900">
          Hola, {data.nombres}
        </h2>
        {data.operativo && (
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-medium text-blue-600">{data.operativo.titulo}</span>
            {data.operativo.ciudad && ` · ${data.operativo.ciudad}`}
          </p>
        )}
      </section>

      {/* Información de la cirugía */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
          Tu cirugía
        </h3>
        
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Diagnóstico
            </p>
            <p className="mt-2 text-base text-slate-900">
              {data.diagnostico || "A definir con el equipo médico"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Procedimiento
            </p>
            <p className="mt-2 text-base text-slate-900">
              {data.cirugia_planificada || "Pronto te informaremos"}
            </p>
          </div>
        </div>

        {/* Fecha y hora */}
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Calendar className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
              Fecha programada
            </p>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {fechaCirugia || "A coordinar"}
            {horaCirugia && (
              <span className="ml-2 text-sm font-normal text-slate-600">
                <Clock className="inline h-3.5 w-3.5 mr-1" />
                {horaCirugia}
              </span>
            )}
          </p>
        </div>

        {/* Fechas de viaje */}
        {(fechaLlegada || fechaRegreso) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fechaLlegada && (
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">Llegada</p>
                  <p className="text-sm text-slate-900">{fechaLlegada}</p>
                </div>
              </div>
            )}
            {fechaRegreso && (
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">Regreso</p>
                  <p className="text-sm text-slate-900">{fechaRegreso}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Requerimientos / Documentos */}
      {data.requerimientos.length > 0 && (
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Documentos requeridos
            </h3>
            {data.requerimientos_pendientes > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {data.requerimientos_pendientes} pendiente{data.requerimientos_pendientes > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
          />

          {uploadError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {uploadError}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {data.requerimientos.map((req) => {
              const isUploading = uploading === req.id;
              const isSuccess = uploadSuccess === req.id;
              const isPendiente = req.estado === "pendiente";
              const isRecibido = req.estado === "recibido";
              const isAprobado = req.estado === "aprobado";

              return (
                <div
                  key={req.id}
                  className={`flex items-center justify-between rounded-xl border p-4 ${
                    isAprobado
                      ? "border-emerald-200 bg-emerald-50/50"
                      : isRecibido
                      ? "border-blue-200 bg-blue-50/50"
                      : "border-slate-100 bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        isAprobado
                          ? "bg-emerald-100 text-emerald-600"
                          : isRecibido
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isAprobado ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{req.titulo}</p>
                      {req.descripcion && (
                        <p className="mt-0.5 text-xs text-slate-500">{req.descripcion}</p>
                      )}
                      <p className="mt-1 text-xs">
                        {isAprobado && (
                          <span className="text-emerald-600">✓ Aprobado</span>
                        )}
                        {isRecibido && (
                          <span className="text-blue-600">En revisión</span>
                        )}
                        {isPendiente && req.archivos_count > 0 && (
                          <span className="text-slate-500">{req.archivos_count} archivo(s) subido(s)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {(isPendiente || isRecibido) && (
                    <button
                      onClick={() => handleUploadClick(req.id)}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUploading ? (
                        "Subiendo..."
                      ) : isSuccess ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Subido
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          Subir
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Contacto de emergencia */}
      {data.contacto_emergencia && (
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Contacto de emergencia registrado
          </h3>
          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-full bg-slate-100 p-2.5">
              <User className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{data.contacto_emergencia.nombre}</p>
              <a
                href={`tel:${data.contacto_emergencia.telefono}`}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                {data.contacto_emergencia.telefono}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center text-sm text-slate-500">
        <p>
          ¿Tienes dudas? Escríbenos a{" "}
          <a
            href="mailto:quirurgicos@fundaciontraesol.cl"
            className="font-medium text-blue-600 hover:underline"
          >
            quirurgicos@fundaciontraesol.cl
          </a>
        </p>
      </footer>
    </div>
  );
}
