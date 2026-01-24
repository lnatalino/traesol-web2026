// src/app/paciente/portal/_components/PortalInvalido.tsx
// Componente para mostrar cuando el token es inválido o expirado

import Link from "next/link";

interface PortalInvalidoProps {
  mensaje?: string;
}

export function PortalInvalido({ mensaje }: PortalInvalidoProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-lg shadow-blue-900/5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600">
            Acceso no disponible
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            El enlace que abriste ya no está activo
          </h1>
          <p className="mt-4 text-base text-slate-600">
            {mensaje || "Este enlace ha expirado o ha sido revocado."}
          </p>
          
          <div className="mt-8 space-y-4">
            <p className="text-sm text-slate-500">
              Si necesitas acceder a tu información, por favor contacta al equipo de Traesol:
            </p>
            
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="mailto:quirurgicos@fundaciontraesol.cl"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
              >
                Solicitar nuevo enlace
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Ir al inicio
              </Link>
            </div>
          </div>
          
          <p className="mt-8 text-xs text-slate-400">
            Email: <a href="mailto:quirurgicos@fundaciontraesol.cl" className="text-blue-600 hover:underline">quirurgicos@fundaciontraesol.cl</a>
          </p>
        </div>
      </div>
    </main>
  );
}
