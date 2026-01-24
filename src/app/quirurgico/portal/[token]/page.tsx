import { Suspense } from "react";
import { supabaseService } from "@/lib/supabaseService";
import { SURGICAL_PORTAL_SELECT, type SurgicalPortalPatient } from "@/lib/quirurgico";
import { SurgicalPortalClient } from "./SurgicalPortalClient";

type PageParams = Promise<{ token: string }>;

type PortalPageProps = {
  params: PageParams;
};

export const dynamic = "force-dynamic";

function PortalUnavailable() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Portal no disponible</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">El enlace que abriste ya no está activo</h1>
        <p className="mt-3 text-base text-slate-600">
          Escríbenos a <a className="font-semibold text-blue-600" href="mailto:contacto@fundaciontraesol.cl">contacto@fundaciontraesol.cl</a> para obtener nueva información.
        </p>
      </div>
    </main>
  );
}

export default async function SurgicalPortalPage({ params }: PortalPageProps) {
  const resolvedParams = await params;
  const token = resolvedParams?.token;
  if (!token) {
    return <PortalUnavailable />;
  }

  const { data, error } = await supabaseService
    .from("quirurgico_pacientes")
    .select(SURGICAL_PORTAL_SELECT)
    .eq("portal_token", token)
    .maybeSingle();

  if (error) {
    console.error("[quirurgico] portal fetch", error);
    return <PortalUnavailable />;
  }

  if (!data) {
    return <PortalUnavailable />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patientData = data as any;
  if (!patientData.portal_is_active) {
    return <PortalUnavailable />;
  }

  const patient: SurgicalPortalPatient = patientData;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-14">
        <Suspense fallback={<div className="rounded-3xl border border-slate-100 bg-white p-8 shadow">Cargando portal…</div>}>
          <SurgicalPortalClient patient={patient} portalToken={token} />
        </Suspense>
      </div>
    </main>
  );
}
