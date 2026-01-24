// src/app/admin/quirurgico/operativos/[id]/pacientes/[pacienteId]/page.tsx
// Página de detalle de un paciente dentro de un operativo quirúrgico

import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/adminSession";
import { getOperativoQuirurgico } from "@/lib/quirurgico";
import { PacienteDetalle } from "./_components/PacienteDetalle";

interface Props {
  params: Promise<{ id: string; pacienteId: string }>;
}

export default async function PacienteDetallePage({ params }: Props) {
  const { id: operativoId, pacienteId } = await params;

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
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
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
        <span className="text-slate-900">Detalle</span>
      </nav>

      {/* Componente cliente con toda la funcionalidad */}
      <PacienteDetalle operativo={operativo} pacienteId={pacienteId} />
    </div>
  );
}
