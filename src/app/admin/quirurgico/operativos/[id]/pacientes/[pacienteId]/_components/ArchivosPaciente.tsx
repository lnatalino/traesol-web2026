"use client";

// src/app/admin/quirurgico/operativos/[id]/pacientes/[pacienteId]/_components/ArchivosPaciente.tsx
// Componente para ver los archivos subidos por el paciente

import type { PacienteArchivo } from "@/lib/quirurgico/types";

interface Props {
  archivos: PacienteArchivo[];
}

export function ArchivosPaciente({ archivos }: Props) {
  if (archivos.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Archivos subidos
        </h3>
        <p className="text-sm text-slate-500">El paciente aún no ha subido archivos.</p>
      </div>
    );
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Generar URL pública para Supabase Storage
  const getPublicUrl = (storagePath: string) => {
    // Asumimos que el storage_path es relativo al bucket
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/paciente-archivos/${storagePath}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Archivos subidos
        </h3>
        <span className="text-sm text-slate-500">{archivos.length} archivo(s)</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {archivos.map((archivo) => (
          <div
            key={archivo.id}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            {/* Icono */}
            <div className="flex-shrink-0">
              {archivo.mimetype?.startsWith("image/") ? (
                <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              ) : archivo.mimetype?.includes("pdf") ? (
                <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              ) : (
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate" title={archivo.filename}>
                {archivo.filename}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {archivo.uploaded_by === "paciente" ? "Subido por paciente" : "Admin"}
                </span>
                <span className="text-xs text-slate-500">{formatFileSize(archivo.size_bytes)}</span>
              </div>
              {archivo.notas && (
                <p className="text-xs text-slate-500 mt-1 truncate" title={archivo.notas}>
                  {archivo.notas}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {new Date(archivo.created_at).toLocaleString("es-CL")}
              </p>
            </div>

            {/* Acciones */}
            <a
              href={getPublicUrl(archivo.storage_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 rounded-full bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
              title="Ver/Descargar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
