"use client";

// src/app/paciente/portal/_components/PortalCliente.tsx
// Componente cliente interactivo del portal del paciente

import { useState, useRef } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Upload,
  Phone,
  User,
  CheckCircle,
  AlertCircle,
  Mail,
  Home,
  Heart,
  Plane,
  Building,
  UserCircle,
  FileCheck,
} from "lucide-react";
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

const DATE_SHORT_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_FORMAT.format(date);
}

function formatDateShort(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_SHORT_FORMAT.format(date);
}

function formatTime(value?: string | null) {
  if (!value) return null;
  // Handle both full timestamp and time-only strings
  const timePart = value.includes("T") ? value.split("T")[1].slice(0, 5) : value.slice(0, 5);
  return `${timePart} hrs`;
}

function calculateAge(fechaNacimiento?: string | null): number | null {
  if (!fechaNacimiento) return null;
  const birthDate = new Date(fechaNacimiento);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatRut(rut?: string | null): string {
  if (!rut) return "—";
  return rut;
}

function formatGenero(genero?: string | null): string {
  if (!genero) return "—";
  const map: Record<string, string> = { M: "Masculino", F: "Femenino", Otro: "Otro" };
  return map[genero] || genero;
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
  const edad = calculateAge(data.fecha_nacimiento);

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
      {/* Header con bienvenida */}
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
          Fundación Traesol
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Portal del Paciente
        </h1>
      </header>

      {/* Bienvenida personalizada */}
      <section className="rounded-3xl border border-slate-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg shadow-blue-900/5">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-100 p-3">
            <Heart className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              ¡Hola, {data.nombres}!
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Bienvenido/a a tu portal personal. Aquí encontrarás toda la información actualizada 
              sobre tu operativo quirúrgico, tus datos médicos y los documentos requeridos.
            </p>
            {data.operativo && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                <Calendar className="h-4 w-4" />
                {data.operativo.titulo}
                {data.operativo.ciudad && ` · ${data.operativo.ciudad}`}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* SECCIÓN: TU CIRUGÍA */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
          <FileCheck className="h-4 w-4" />
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

        {/* Logística de viaje */}
        {(data.requiere_vuelo || data.requiere_hospedaje || fechaLlegada || fechaRegreso) && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Logística de viaje
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.requiere_vuelo && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <Plane className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">Vuelo coordinado por Traesol</span>
                </div>
              )}
              {data.requiere_hospedaje && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <Building className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">Hospedaje coordinado</span>
                </div>
              )}
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
          </div>
        )}
      </section>

      {/* SECCIÓN: TUS DATOS */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
          <UserCircle className="h-4 w-4" />
          Tus datos
        </h3>
        
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-xs font-medium text-slate-400 mb-1">Nombre completo</p>
            <p className="text-sm text-slate-900">{data.nombre_completo}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-xs font-medium text-slate-400 mb-1">RUT</p>
            <p className="text-sm text-slate-900">{formatRut(data.rut)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-xs font-medium text-slate-400 mb-1">Fecha de nacimiento</p>
            <p className="text-sm text-slate-900">
              {formatDateShort(data.fecha_nacimiento) || "—"}
              {edad && <span className="text-slate-500 font-normal ml-1">({edad} años)</span>}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-xs font-medium text-slate-400 mb-1">Género</p>
            <p className="text-sm text-slate-900">{formatGenero(data.genero)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-xs font-medium text-slate-400 mb-1">Ciudad de origen</p>
            <p className="text-sm text-slate-900 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {data.ciudad_origen || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-xs font-medium text-slate-400 mb-1">Dirección</p>
            <p className="text-sm text-slate-900 flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-slate-400" />
              {data.direccion || "—"}
            </p>
          </div>
        </div>

        {/* Contacto */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
            Datos de contacto
          </p>
          <div className="flex flex-wrap gap-4">
            {data.telefono && (
              <a
                href={`tel:${data.telefono}`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 transition"
              >
                <Phone className="h-4 w-4 text-slate-500" />
                {data.telefono}
              </a>
            )}
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 transition"
              >
                <Mail className="h-4 w-4 text-slate-500" />
                {data.email}
              </a>
            )}
            {!data.telefono && !data.email && (
              <p className="text-sm text-slate-400 italic">Sin datos de contacto registrados</p>
            )}
          </div>
        </div>
      </section>

      {/* SECCIÓN: CONTACTOS DE EMERGENCIA */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
          <Phone className="h-4 w-4" />
          Contactos de emergencia
        </h3>

        {data.contactos_emergencia && data.contactos_emergencia.length > 0 ? (
          <div className="mt-4 space-y-3">
            {data.contactos_emergencia.map((contacto) => (
              <div
                key={contacto.id}
                className={`flex items-center justify-between rounded-2xl border p-4 ${
                  contacto.es_principal
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-slate-100 bg-slate-50/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2.5 ${
                    contacto.es_principal ? "bg-blue-100" : "bg-slate-200"
                  }`}>
                    <User className={`h-5 w-5 ${
                      contacto.es_principal ? "text-blue-600" : "text-slate-500"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {contacto.nombre}
                      {contacto.es_principal && (
                        <span className="ml-2 text-xs font-semibold text-blue-600">(Principal)</span>
                      )}
                    </p>
                    {contacto.relacion && (
                      <p className="text-xs text-slate-500">{contacto.relacion}</p>
                    )}
                  </div>
                </div>
                <a
                  href={`tel:${contacto.telefono}`}
                  className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {contacto.telefono}
                </a>
              </div>
            ))}
          </div>
        ) : data.contacto_emergencia ? (
          <div className="mt-4">
            <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2.5">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{data.contacto_emergencia.nombre}</p>
                </div>
              </div>
              <a
                href={`tel:${data.contacto_emergencia.telefono}`}
                className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                <Phone className="h-3.5 w-3.5" />
                {data.contacto_emergencia.telefono}
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Sin contactos de emergencia</p>
                <p className="mt-1 text-sm text-amber-700">
                  Es importante tener al menos un contacto de emergencia registrado. 
                  Comunícate con el equipo de Traesol para agregarlo.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN: DOCUMENTOS / EXÁMENES */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            <FileText className="h-4 w-4" />
            Documentos y exámenes
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

        {data.requerimientos.length > 0 ? (
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
        ) : (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-center">
            <p className="text-sm text-slate-500">No hay documentos requeridos por el momento</p>
          </div>
        )}
      </section>

      {/* Footer de ayuda */}
      <footer className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6 text-center">
        <p className="text-sm text-slate-600">
          ¿Tienes dudas sobre tu operativo o necesitas actualizar tus datos?
        </p>
        <p className="mt-2">
          Escríbenos a{" "}
          <a
            href="mailto:contacto@fundaciontraesol.cl"
            className="font-medium text-blue-600 hover:underline"
          >
            contacto@fundaciontraesol.cl
          </a>
        </p>
        <p className="mt-4 text-xs text-slate-400">
          Este portal es personal e intransferible. No compartas el enlace con terceros.
        </p>
      </footer>
    </div>
  );
}
