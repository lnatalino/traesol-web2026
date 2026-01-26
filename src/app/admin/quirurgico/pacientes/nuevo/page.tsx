import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { OperativoQuirurgicoSummary } from "@/lib/quirurgico";
import { SurgicalPatientForm } from "../_components/SurgicalPatientForm";

function getPortalBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
}

export const dynamic = "force-dynamic";

export default async function NewSurgicalPatientPage() {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/quirurgico/pacientes/nuevo");
  }

  const { data, error } = await supabaseService
    .from("operativos_quirurgicos")
    .select("id,titulo,slug,ciudad,lugar")
    .order("titulo", { ascending: true });

  if (error) {
    throw error;
  }

  const operativos = (data as OperativoQuirurgicoSummary[] | null) ?? [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/quirurgico/pacientes"
        className="inline-flex items-center gap-2 text-sm text-blue-600 transition hover:text-blue-800"
      >
        ← Volver al listado
      </Link>
      <h1 className="text-3xl font-semibold text-slate-900">Nuevo paciente quirúrgico</h1>
      <SurgicalPatientForm mode="create" operativos={operativos} portalBaseUrl={getPortalBaseUrl()} />
    </div>
  );
}
