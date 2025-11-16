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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Invitaciones masivas</h1>
          <p className="text-sm text-slate-500">
            Selecciona varios voluntarios y envíalos a un operativo en un solo paso.
          </p>
        </div>
      </div>

      <InviteManager
        volunteers={volunteers}
        operativos={operativos}
        errorMessage={errorMessage}
      />
    </div>
  );
}
