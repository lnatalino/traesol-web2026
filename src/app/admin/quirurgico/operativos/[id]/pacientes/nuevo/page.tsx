// src/app/admin/quirurgico/operativos/[id]/pacientes/nuevo/page.tsx
// Página para crear un nuevo paciente dentro de un operativo quirúrgico

import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/adminSession";
import { getOperativoQuirurgico } from "@/lib/quirurgico";
import { PacienteForm } from "../_components/PacienteForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NuevoPacientePage({ params }: Props) {
  const { id: operativoId } = await params;

  // Verificar autenticación
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/quirurgico/operativos");
  }

  // Obtener operativo
  const operativo = await getOperativoQuirurgico(operativoId);
  
  if (!operativo) {
    redirect("/admin/quirurgico/operativos");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="text-sm text-slate-500 mb-2">
          <Link href="/admin/quirurgico/operativos" className="hover:text-blue-600">
            Operativos
          </Link>
          {" / "}
          <Link href={`/admin/quirurgico/operativos/${operativoId}`} className="hover:text-blue-600">
            {operativo.titulo}
          </Link>
          {" / "}
          <Link href={`/admin/quirurgico/operativos/${operativoId}/pacientes`} className="hover:text-blue-600">
            Pacientes
          </Link>
          {" / "}
          <span className="text-slate-900">Nuevo</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo paciente</h1>
        <p className="text-slate-600 mt-1">
          Agregar un nuevo paciente al operativo{" "}
          <span className="font-medium text-slate-900">{operativo.titulo}</span>
        </p>
      </div>

      {/* Formulario */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PacienteForm operativo={operativo} />
      </div>
    </div>
  );
}
