import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type {
  QuirurgicoPacienteWithOperativo,
  OperativoQuirurgicoSummary,
  QuirurgicoComunicacion,
} from "@/lib/quirurgico";
import { SurgicalPatientForm } from "../_components/SurgicalPatientForm";

const PATIENT_DETAIL_COLUMNS = [
  "id",
  "nombre_completo",
  "rut",
  "rut_ultimos4",
  "email",
  "telefono",
  "telefono_emergencia",
  "nombre_contacto_emergencia",
  "ciudad_origen",
  "operativo_quirurgico_id",
  "requiere_vuelo",
  "requiere_hospedaje",
  "diagnostico",
  "cirugia_planificada",
  "fecha_cirugia",
  "hora_cirugia",
  "fecha_llegada_ciudad",
  "fecha_regreso_ciudad",
  "alta_hospitalaria_estimada",
  "vuelo_ida_fecha",
  "vuelo_ida_numero",
  "vuelo_ida_hora_salida",
  "vuelo_ida_hora_llegada",
  "vuelo_regreso_fecha",
  "vuelo_regreso_hora_salida",
  "vuelo_regreso_hora_llegada",
  "hotel_nombre",
  "hotel_direccion",
  "hotel_checkin_inicial",
  "hotel_checkout_inicial",
  "hotel_checkin_post_cirugia",
  "hotel_checkout_final",
  "visita_enfermera_fecha",
  "primera_kine_fecha",
  "segunda_kine_fecha",
  "curacion_fecha",
  "dias_estimados_santiago",
  "portal_token",
  "portal_is_active",
  "portal_last_access_at",
  "comentarios_paciente",
  "created_at",
].join(",");

function getPortalBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
}

export const dynamic = "force-dynamic";

type PageParams = Promise<{ id: string }>;

export default async function SurgicalPatientDetailPage({ params }: { params: PageParams }) {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/quirurgico/pacientes");
  }

  const resolved = await params;
  const patientId = resolved?.id;
  if (!patientId) {
    notFound();
  }

  const [
    { data: patientData, error: patientError },
    { data: operativosData, error: operativosError },
    { data: comunicacionesData, error: comunicacionesError },
  ] = await Promise.all([
    supabaseService
      .from("quirurgico_pacientes")
      .select(PATIENT_DETAIL_COLUMNS)
      .eq("id", patientId)
      .maybeSingle<QuirurgicoPacienteWithOperativo>(),
    supabaseService
      .from("operativos_quirurgicos")
      .select("id,titulo,slug,ciudad,lugar")
      .order("titulo", { ascending: true })
      .returns<OperativoQuirurgicoSummary[]>(),
    supabaseService
      .from("quirurgico_comunicaciones")
      .select("id,tipo,to_email,subject,body_preview,enviado_at,metadata")
      .eq("paciente_id", patientId)
      .order("enviado_at", { ascending: false })
      .limit(20)
      .returns<QuirurgicoComunicacion[]>(),
  ]);

  if (patientError) {
    throw patientError;
  }
  if (operativosError) {
    throw operativosError;
  }

  if (!patientData) {
    notFound();
  }

  const initialData = patientData;
  const operativos = operativosData ?? [];
  if (comunicacionesError) {
    console.error("[quirurgico] load comunicaciones paciente", comunicacionesError);
  }
  const comunicaciones = comunicacionesError ? [] : comunicacionesData ?? [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/quirurgico/pacientes"
        className="inline-flex items-center gap-2 text-sm text-blue-600 transition hover:text-blue-800"
      >
        ← Volver al listado
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Paciente</p>
        <h1 className="text-3xl font-semibold text-slate-900">{initialData.nombre_completo}</h1>
        <p className="text-sm text-slate-500">Revisa y actualiza la información clínica y logística del paciente.</p>
      </div>
      <SurgicalPatientForm
        mode="edit"
        initialData={initialData}
        operativos={operativos}
        portalBaseUrl={getPortalBaseUrl()}
        comunicaciones={comunicaciones}
      />
    </div>
  );
}
