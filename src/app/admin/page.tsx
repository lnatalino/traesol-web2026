// src/app/admin/page.tsx
import type { ComponentType } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader, StatTile, StatTileGrid } from "@/components/admin/ui";
import { getAdminSession } from "@/lib/adminSession";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { getComputedEstado, getNowInChile, toChileDateString, type OperativoState } from "@/lib/operativosShared";
import {
  Boxes,
  BriefcaseBusiness,
  Calendar,
  ClipboardList,
  Clock,
  HeartPulse,
  Mail,
  Megaphone,
  Send,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";

type ShortcutCard = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const SECTIONS: ShortcutCard[] = [
  {
    title: "Operativos médicos",
    description: "Crea, publica y cierra operativos en terreno con sus estados y equipos.",
    href: "/admin/operativos",
    icon: Stethoscope,
  },
  {
    title: "Gestión de voluntarios",
    description: "Revisa perfiles, filtros y participación de voluntariado activo.",
    href: "/admin/voluntarios",
    icon: Users,
  },
  {
    title: "Inscripciones y cupos",
    description: "Aprueba postulaciones y monitorea cupos pendientes en cada operativo.",
    href: "/admin/inscripciones",
    icon: ClipboardList,
  },
  {
    title: "Invitaciones segmentadas",
    description: "Envía convocatorias dirigidas a grupos clave por operativo.",
    href: "/admin/invitaciones",
    icon: Send,
  },
  {
    title: "Mensajería interna",
    description: "Comunica novedades a toda la base o por operativo de forma centralizada.",
    href: "/admin/mensajeria",
    icon: Mail,
  },
  {
    title: "Novedades públicas",
    description: "Publica historias y decide qué se muestra en el listado y carrusel.",
    href: "/admin/novedades",
    icon: Megaphone,
  },
  {
    title: "Alianzas con empresas",
    description: "Actualiza productos, packs y métricas para partners corporativos.",
    href: "/admin/empresas/productos",
    icon: BriefcaseBusiness,
  },
  {
    title: "Inventario clínico",
    description: "Gestiona categorías, ítems y stock entregado en cada operativo.",
    href: "/admin/inventario",
    icon: Boxes,
  },
  {
    title: "Quirúrgico · Pacientes",
    description: "Administra pacientes, logística y comunicaciones pre y post operatorias.",
    href: "/admin/quirurgico/pacientes",
    icon: HeartPulse,
  },
];

export default async function AdminHome() {
  const session = await getAdminSession();
  
  if (!session.allowed) {
    // Si no hay sesión, ir a login de Mi Cuenta
    if (!session.email) {
      redirect("/mi-cuenta/login?next=/admin");
    }
    // Si hay sesión pero no es admin, mostrar error o ir a Mi Cuenta
    redirect("/mi-cuenta?error=no_admin");
  }

  const { email, effectiveRole } = session;

  // Fetch live stats
  const supabase = createSupabaseServer();
  const hoy = toChileDateString();
  const now = getNowInChile();
  
  // Fetch operativos para calcular estado computed correctamente
  type OperativoRow = { id: string; estado: string | null; fecha_inicio: string | null; fecha_fin: string | null };
  
  const [
    { data: operativosData },
    { count: voluntariosActivos },
    { count: pendientes },
    { count: novedadesPublicadas },
  ] = await Promise.all([
    supabase
      .from("operativos")
      .select("id,estado,fecha_inicio,fecha_fin")
      .returns<OperativoRow[]>(),
    supabase.from("voluntarios").select("*", { count: "exact", head: true }).eq("activo", true) as any,
    supabase.from("inscripciones").select("*", { count: "exact", head: true }).eq("estado", "pendiente") as any,
    supabase.from("novedades").select("*", { count: "exact", head: true }).eq("status", "publicado") as any,
  ]);

  // Calcular operativos activos usando el estado computed
  // Activos = publicados + fecha futura (aún no finalizado por fecha)
  const operativos = operativosData ?? [];
  const operativosActivos = operativos.filter((op) => {
    const computed = getComputedEstado(op as OperativoState, now);
    // Solo contar como "activo" si está publicado Y la fecha de inicio es >= hoy
    if (computed !== "publicado") return false;
    if (!op.fecha_inicio) return false;
    const inicioDate = op.fecha_inicio.slice(0, 10);
    return inicioDate >= hoy;
  }).length;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Panel de administración"
        title="¡Hola, Admin!"
        description="Resumen de la actividad de Traesol. Accede a cada módulo desde las cards de abajo."
        actions={
          <form action="/api/auth/simple-logout" method="POST">
            <button className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100">
              Cerrar sesión
            </button>
          </form>
        }
      />

      {/* Live Stats */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-500">Estado actual</h2>
        <StatTileGrid>
          <StatTile 
            icon={<Calendar className="h-4 w-4" />}
            label="Operativos activos"
            value={operativosActivos}
            highlight
            highlightVariant="blue"
          />
          <StatTile 
            icon={<UserCheck className="h-4 w-4" />}
            label="Voluntarios activos"
            value={voluntariosActivos ?? 0}
            highlight
            highlightVariant="emerald"
          />
          <StatTile 
            icon={<Clock className="h-4 w-4" />}
            label="Postulaciones pendientes"
            value={pendientes ?? 0}
            highlight={pendientes != null && pendientes > 0}
            highlightVariant="amber"
          />
          <StatTile 
            icon={<Megaphone className="h-4 w-4" />}
            label="Novedades publicadas"
            value={novedadesPublicadas ?? 0}
          />
        </StatTileGrid>
      </section>

      {/* Session Info */}
      <section className="grid gap-4 text-sm sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-100 bg-white/95 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rol asignado</p>
          <p className="mt-2 text-lg font-semibold capitalize text-slate-900">{effectiveRole || "—"}</p>
        </article>
        <article className="rounded-2xl border border-slate-100 bg-white/95 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sesión activa</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{email || "—"}</p>
        </article>
      </section>

      {/* Module Cards */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-slate-500">Módulos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ icon: Icon, ...section }) => (
            <article
              key={section.href}
              className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/5"
            >
              <div className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-slate-900">{section.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{section.description}</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Link
                  href={section.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition group-hover:gap-2.5"
                >
                  Ingresar
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
