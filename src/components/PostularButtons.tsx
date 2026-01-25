// src/components/PostularButtons.tsx
// Botones de postulación condicionales según estado de sesión
"use client";

import { useState } from "react";
import Link from "next/link";
import { useUserSession } from "@/lib/hooks/useUserSession";
import PostularConCuentaModal from "@/components/PostularConCuentaModal";

interface PostularButtonsProps {
  operativoId: string;
  operativoSlug: string;
  operativoTitulo: string;
  /** Si true, muestra opciones de postulación. Si false, muestra "ver próximos" */
  puedePostular: boolean;
}

export default function PostularButtons({
  operativoId,
  operativoSlug,
  operativoTitulo,
  puedePostular,
}: PostularButtonsProps) {
  const { user, loading } = useUserSession();
  const [modalOpen, setModalOpen] = useState(false);

  // Si no puede postular, mostrar botones alternativos
  if (!puedePostular) {
    return (
      <>
        <p className="mt-2 text-sm text-slate-600">
          Este operativo ya no está aceptando postulaciones. Visita nuestra página de operativos para ver las próximas oportunidades.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/operativos"
            className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Ver próximos operativos
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-2xl border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-white"
          >
            Volver al inicio
          </Link>
        </div>
      </>
    );
  }

  // Mientras carga, mostrar el botón default
  if (loading) {
    return (
      <>
        <p className="mt-2 text-sm text-slate-600">
          Postula para sumarte a este operativo o vuelve al inicio para conocer más iniciativas de Traesol.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-2xl bg-slate-300 px-5 py-2 text-sm font-semibold text-slate-500">
            Cargando...
          </span>
        </div>
      </>
    );
  }

  // Usuario logueado: mostrar opción de postular con cuenta
  if (user) {
    return (
      <>
        <p className="mt-2 text-sm text-slate-600">
          Postula usando tu cuenta o completa el formulario completo si prefieres.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Postular con mi cuenta
          </button>
          <Link
            href={`/postular?operativo=${encodeURIComponent(operativoSlug)}`}
            className="inline-flex items-center rounded-2xl border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-white"
          >
            Formulario completo
          </Link>
        </div>
        <p className="mt-3 text-xs text-blue-700/70">* La postulación requiere aprobación manual.</p>

        <PostularConCuentaModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          operativoId={operativoId}
          operativoSlug={operativoSlug}
          operativoTitulo={operativoTitulo}
        />
      </>
    );
  }

  // Usuario no logueado: flujo original
  return (
    <>
      <p className="mt-2 text-sm text-slate-600">
        Postula para sumarte a este operativo o vuelve al inicio para conocer más iniciativas de Traesol.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/postular?operativo=${encodeURIComponent(operativoSlug)}`}
          className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          Postular aquí
        </Link>
        <Link
          href="/mi-cuenta/login"
          className="inline-flex items-center rounded-2xl border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-white"
        >
          Tengo cuenta
        </Link>
      </div>
      <p className="mt-3 text-xs text-blue-700/70">* La postulación requiere aprobación manual.</p>
    </>
  );
}
