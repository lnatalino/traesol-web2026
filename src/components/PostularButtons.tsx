// src/components/PostularButtons.tsx
// Botones de postulación condicionales según estado de sesión
// - Usuario logueado: muestra "Postular con mi cuenta" directo
// - Usuario NO logueado: muestra "Postular aquí" y "Tengo cuenta"
// - Admin/superadmin: no deberían ver estos botones (la página de operativo debería ocultarlos)
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
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
  const { user, loading, isAdmin } = useSession();
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

  // Mientras carga (solo si no hay datos SSR), mostrar placeholder mínimo
  if (loading && !user) {
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

  // Admin/superadmin: NO deberían postular (solo para voluntarios)
  // Mostrar mensaje informativo y link al panel
  if (user && isAdmin) {
    return (
      <>
        <p className="mt-2 text-sm text-slate-600">
          Como administrador, puedes gestionar este operativo desde el panel de administración.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/operativos"
            className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Ir al panel admin
          </Link>
          <Link
            href="/operativos"
            className="inline-flex items-center rounded-2xl border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-white"
          >
            Ver todos los operativos
          </Link>
        </div>
      </>
    );
  }

  // Voluntario logueado: mostrar SOLO "Postular con mi cuenta"
  // El usuario ya tiene sesión, no necesita ver "Tengo cuenta"
  if (user) {
    return (
      <>
        <p className="mt-2 text-sm text-slate-600">
          Estás logueado. Confirma tus datos para postular a este operativo.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Postular con mi cuenta
          </button>
          <Link
            href={`/postular?operativo=${encodeURIComponent(operativoSlug)}&otra_persona=1`}
            className="inline-flex items-center rounded-2xl border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-white"
          >
            Postular a otra persona
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

  // Usuario NO logueado: flujo de registro/login
  return (
    <>
      <p className="mt-2 text-sm text-slate-600">
        Postula para sumarte a este operativo o inicia sesión si ya tienes cuenta.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/postular?operativo=${encodeURIComponent(operativoSlug)}`}
          className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          Postular aquí
        </Link>
        <Link
          href={`/mi-cuenta/login?next=${encodeURIComponent(`/operativos/${operativoSlug}`)}`}
          className="inline-flex items-center rounded-2xl border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-white"
        >
          Tengo cuenta
        </Link>
      </div>
      <p className="mt-3 text-xs text-blue-700/70">* La postulación requiere aprobación manual.</p>
    </>
  );
}
