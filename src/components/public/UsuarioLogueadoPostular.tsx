// src/components/public/UsuarioLogueadoPostular.tsx
// Componente que se muestra en /postular cuando el usuario YA está logueado
// Le ofrece ir a operativos o desplegar formulario para postular a otra persona
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";

interface UsuarioLogueadoPostularProps {
  /** Callback para mostrar el formulario largo (postular a otra persona) */
  onMostrarFormulario: () => void;
}

export default function UsuarioLogueadoPostular({ onMostrarFormulario }: UsuarioLogueadoPostularProps) {
  const { user } = useSession();
  const [expandido, setExpandido] = useState(false);

  if (!user) return null;

  // Si expandió "postular a otra persona", no mostrar este componente
  if (expandido) return null;

  const firstName = user.user_metadata?.first_name || user.email?.split("@")[0] || "voluntario/a";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 shadow-lg">
        {/* Icono check */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
          ¡Hola, {firstName}!
        </h2>
        <p className="text-center text-slate-600 mb-6">
          Ya estás registrado/a en Traesol. Tu cuenta te permite postular a operativos con un solo clic.
        </p>

        {/* Botón principal: Ver operativos */}
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/operativos"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-3 text-white font-semibold shadow-lg hover:bg-blue-700 transition-colors w-full max-w-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Ver operativos y postular con mi cuenta
          </Link>

          <Link
            href="/mi-cuenta/perfil"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-6 py-2.5 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Ver mi perfil
          </Link>
        </div>

        {/* Separador */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 uppercase tracking-wider">o bien</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Opción secundaria: Postular a otra persona */}
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-3">
            ¿Quieres inscribir a alguien más que no tiene cuenta?
          </p>
          <button
            type="button"
            onClick={() => {
              setExpandido(true);
              onMostrarFormulario();
            }}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium underline underline-offset-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Postular a otra persona / de otra manera
          </button>
        </div>
      </div>

      {/* Nota informativa */}
      <p className="mt-4 text-center text-xs text-slate-500">
        Si postulas a otra persona, sus datos quedarán registrados sin afectar tu perfil.
      </p>
    </div>
  );
}
