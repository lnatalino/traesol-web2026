// src/app/admin/quirurgico/operativos/nuevo/page.tsx
// Página para crear nuevo operativo quirúrgico

import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminSession } from "@/lib/adminSession";
import { OperativoForm } from "../_components/OperativoForm";

export default async function NuevoOperativoPage() {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/quirurgico/operativos/nuevo");
  }

  return (
    <section className="space-y-6 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
      <div>
        <Link
          href="/admin/quirurgico/operativos"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a operativos
        </Link>
        <h2 className="text-2xl font-semibold text-slate-900">Nuevo Operativo Quirúrgico</h2>
        <p className="mt-1 text-sm text-slate-500">
          Completa los datos del operativo. Podrás agregar pacientes después de crearlo.
        </p>
      </div>

      <OperativoForm />
    </section>
  );
}
