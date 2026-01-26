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
  ClipboardCheck,
  ClipboardList,
  Clock,
  HeartPulse,
  Mail,
  Megaphone,
  Send,
  Settings,
  Stethoscope,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";

type ModuleCard = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  superadminOnly?: boolean;
};

type ModuleSection = {
  title: string;
  description: string;
  modules: ModuleCard[];
};

// Módulos organizados por secciones
const SECTIONS: ModuleSection[] = [
  {
    title: "Operativos y voluntariado",
    description: "Gestión de actividades en terreno y personas participantes",
    modules: [
      {
        title: "Operativos médicos",
        description: "Crea, publica y cierra operativos con sus estados y equipos.",
        href: "/admin/operativos",
        icon: Stethoscope,
      },
      {
        title: "Voluntarios",
        description: "Perfiles, filtros y participación de voluntariado activo.",
        href: "/admin/voluntarios",
        icon: Users,
      },
      {
        title: "Inscripciones",
        description: "Aprueba postulaciones y monitorea cupos pendientes.",
        href: "/admin/inscripciones",
        icon: ClipboardList,
      },
      {
        title: "Invitaciones",
        description: "Convocatorias dirigidas a grupos clave por operativo.",
        href: "/admin/invitaciones",
        icon: Send,
      },
    ],
  },
  {
    title: "Comunicación y contenido",
    description: "Mensajes, noticias y presencia pública de la fundación",
    modules: [
      {
        title: "Mensajería",
        description: "Comunica novedades a toda la base o por operativo.",
        href: "/admin/mensajeria",
        icon: Mail,
      },
      {
        title: "Novedades",
        description: "Publica historias para el sitio web y carrusel.",
        href: "/admin/novedades",
        icon: Megaphone,
      },
      {
        title: "Encuestas",
        description: "Recopila feedback post operativo de voluntarios.",
        href: "/admin/encuestas",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: "Recursos e inventario",
    description: "Materiales, proveedores y alianzas estratégicas",
    modules: [
      {
        title: "Alianzas empresas",
        description: "Productos, packs y métricas para partners corporativos.",
        href: "/admin/empresas/productos",
        icon: BriefcaseBusiness,
      },
      {
        title: "Inventario clínico",
        description: "Categorías, ítems y stock entregado en cada operativo.",
        href: "/admin/inventario",
        icon: Boxes,
      },
    ],
  },
  {
    title: "Quirúrgico",
    description: "Gestión especializada de operativos quirúrgicos",
    modules: [
      {
        title: "Pacientes quirúrgicos",
        description: "Pacientes, logística y comunicaciones pre/post operatorias.",
        href: "/admin/quirurgico/pacientes",
        icon: HeartPulse,
      },
    ],
  },
  {
    title: "Administración",
    description: "Configuración del sistema y gestión de accesos",
    modules: [
      {
        title: "Usuarios del sistema",
        description: "Administra voluntarios, admins y permisos de acceso.",
        href: "/admin/usuarios",
        icon: UserCog,
        superadminOnly: true,
      },
    ],
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

      {/* Module Cards - Organized by Sections */}
      <section className="space-y-8">
        {SECTIONS.map((section) => {
          // Filtrar módulos según permisos
          const visibleModules = section.modules.filter(
            (mod) => !mod.superadminOnly || session.isSuperAdmin
          );
          
          // No mostrar sección vacía
          if (visibleModules.length === 0) return null;
          
          return (
            <div key={section.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                  <p className="text-sm text-slate-500">{section.description}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleModules.map(({ icon: Icon, superadminOnly, ...mod }) => (
                  <article
                    key={mod.href}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        {superadminOnly && (
                          <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            Superadmin
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-slate-900">{mod.title}</h3>
                        <p className="text-xs leading-relaxed text-slate-600">{mod.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Link
                        href={mod.href}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition group-hover:gap-2"
                      >
                        Abrir
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
