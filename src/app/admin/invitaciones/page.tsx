import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import InviteManager, { type InviteOperativo, type InviteVolunteer } from "./InviteManager";

export const dynamic = "force-dynamic";

async function fetchVolunteers(): Promise<InviteVolunteer[]> {
  const { data, error } = await supabaseService
    .from("voluntarios")
    .select("id,nombres,apellidos,email,profesion,especialidad")
    .order("nombres", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as InviteVolunteer[];
}

async function fetchOperativos(): Promise<InviteOperativo[]> {
  const { data, error } = await supabaseService
    .from("operativos")
    .select("id,titulo,fecha_inicio,fecha_fin,lugar,estado")
    .eq("estado", "publicado")
    .order("fecha_inicio", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as InviteOperativo[];
}

export default async function AdminInvitacionesPage() {
  const session = await getAdminSession();

  if (!session.allowed) {
    redirect("/login?next=/admin/invitaciones");
  }

  let volunteers: InviteVolunteer[] = [];
  let operativos: InviteOperativo[] = [];
  let errorMessage = "";

  try {
    [volunteers, operativos] = await Promise.all([fetchVolunteers(), fetchOperativos()]);
  } catch (error: any) {
    errorMessage = error?.message ? String(error.message) : "No se pudieron cargar los datos iniciales.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Invitaciones</p>
        <h1 className="text-3xl font-semibold text-slate-900">Convocatorias masivas</h1>
        <p className="text-sm text-slate-500 max-w-3xl">
          Selecciona voluntarios por nombre, profesión o especialidad y envíalos a un operativo en un solo paso.
        </p>
      </section>

      <InviteManager volunteers={volunteers} operativos={operativos} errorMessage={errorMessage} />
    </div>
  );
}
