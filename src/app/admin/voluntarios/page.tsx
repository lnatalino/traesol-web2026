import { redirect } from "next/navigation";
import { AdminPageHeader, StatTile, StatTileGrid } from "@/components/admin/ui";
import { getAdminSession } from "@/lib/adminSession";
import { getErrorMessage } from "@/lib/errors";
import { supabaseService } from "@/lib/supabaseService";
import type { VoluntarioAdminRow } from "@/lib/voluntariosAdmin";
import {
  applyVolunteerFilters,
  buildEspecialidadOptions,
  buildProfesionOptions,
  parseVolunteerFilters,
  VOLUNTARIO_COLUMNS,
} from "@/lib/voluntariosAdmin";
import { ROLES_EXCLUIDOS_VOLUNTARIOS } from "@/lib/businessRules";
import { Users, UserCheck, Briefcase } from "lucide-react";
import VoluntariosTable from "./VoluntariosTable";

export const dynamic = "force-dynamic";

const LIMIT = 200;

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type OptionLists = {
  profesiones: string[];
  especialidades: string[];
  includeEmptyProfesion: boolean;
  includeEmptyEspecialidad: boolean;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_TIME_FORMAT.format(date);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMAT.format(date);
}

export default async function AdminVoluntariosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/voluntarios");
  }

  const filters = parseVolunteerFilters(params);

  let rows: VoluntarioAdminRow[] = [];
  let total = 0;
  let errorMessage = "";
  let options: OptionLists = {
    profesiones: [],
    especialidades: [],
    includeEmptyProfesion: false,
    includeEmptyEspecialidad: false,
  };
  // Mapa de emails con cuenta de usuario (para badges)
  let emailsConCuenta = new Set<string>();

  try {
    const listQuery = applyVolunteerFilters(
      supabaseService
        .from("voluntarios")
        .select(VOLUNTARIO_COLUMNS, { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(LIMIT),
      filters
    );

    // Ejecutar las queries en paralelo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listRes = await (listQuery as any);

    // Queries paralelas: opciones de filtro + emails con cuenta + usuarios faltantes
    const [profesionRes, especialidadRes, authProfilesRes, rolesRes] = await Promise.all([
      supabaseService.from("voluntarios").select("profesion"),
      supabaseService.from("voluntarios").select("especialidad"),
      // Traer todos los user_profiles con su email de auth para cross-reference
      supabaseService
        .from("user_profiles")
        .select("id, first_name, last_name, rut, phone, birthdate"),
      supabaseService
        .from("user_roles")
        .select("user_id, role"),
    ]);

    if (listRes.error) {
      throw listRes.error;
    }

    rows = (listRes.data ?? []) as VoluntarioAdminRow[];
    total = typeof listRes.count === "number" ? listRes.count : rows.length;

    // Construir mapa de roles por user_id
    const roleMap = new Map<string, string>();
    const roleRows = (rolesRes.data ?? []) as Array<{ user_id: string; role: string }>;
    for (const r of roleRows) {
      roleMap.set(r.user_id, r.role);
    }

    // Obtener emails de auth.users para identificar cuentas
    // Usamos admin.listUsers porque user_profiles no tiene email directamente
    try {
      const { data: authUsers } = await supabaseService.auth.admin.listUsers({ perPage: 1000 });
      if (authUsers?.users) {
        // Mapa de auth_id → email
        const authIdEmail = new Map<string, string>();
        for (const u of authUsers.users) {
          if (u.email) {
            authIdEmail.set(u.id, u.email.toLowerCase());
          }
        }

        // Emails que tienen cuenta (excluyendo superadmins)
        for (const [uid, email] of authIdEmail) {
          const role = roleMap.get(uid);
          if (role && !(ROLES_EXCLUIDOS_VOLUNTARIOS as readonly string[]).includes(role)) {
            emailsConCuenta.add(email);
          }
        }

        // ── Merge: usuarios con cuenta SIN registro en voluntarios ──
        // Regla de negocio: todo usuario (excepto superadmin) debe aparecer
        const voluntarioEmails = new Set(
          rows.map(r => r.email?.toLowerCase()).filter(Boolean) as string[]
        );

        const profiles = (authProfilesRes.data ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null; rut: string | null; phone: string | null; birthdate: string | null }>;
        const profileMap = new Map<string, (typeof profiles)[number]>();
        for (const p of profiles) profileMap.set(p.id, p);

        // Solo agregar si NO hay filtro de texto activo (los merge-rows no están en la query original)
        const hasTextFilter = filters.q || filters.profesion || filters.especialidad || filters.veg;

        if (!hasTextFilter) {
          for (const [uid, email] of authIdEmail) {
            const role = roleMap.get(uid);
            // Excluir superadmins
            if (role && (ROLES_EXCLUIDOS_VOLUNTARIOS as readonly string[]).includes(role)) continue;
            // Si ya está en voluntarios, no duplicar
            if (voluntarioEmails.has(email)) continue;

            const prof = profileMap.get(uid);
            // Crear fila sintética de "voluntario pendiente de perfil"
            const syntheticRow: VoluntarioAdminRow = {
              id: `user_${uid}`,
              nombres: prof?.first_name || null,
              apellidos: prof?.last_name || null,
              nacionalidad: null,
              ciudad: null,
              region: null,
              pais: null,
              genero: null,
              fecha_nacimiento: prof?.birthdate || null,
              rut: prof?.rut || null,
              id_nacional: null,
              pasaporte: null,
              email: email,
              telefono: prof?.phone || null,
              direccion: null,
              instagram: null,
              profesion: null,
              profesion_otro: null,
              especialidad: null,
              talla_polera: null,
              talla_pantalon: null,
              alimentarias_alergias: null,
              alimentarias_veg: null,
              alimentarias_otro: null,
              nombre_credencial: null,
              tipo_usuario: role || "volunteer",
              created_at: null,
              operativos_asistidos: 0,
              uniformes_entregados: 0,
              ultima_entrega_uniforme_en: null,
              nota_inventario: null,
            };
            rows.push(syntheticRow);
            total += 1;
          }
        }
      }
    } catch (authErr) {
      console.error("[Admin/Voluntarios] Error cargando auth users:", authErr);
    }

    const profesionRows = (profesionRes.data as Array<{ profesion?: string | null }> | null) ?? [];
    const especialidadRows = (especialidadRes.data as Array<{ especialidad?: string | null }> | null) ?? [];

    const profesionOptions = buildProfesionOptions(profesionRows);
    const especialidadOptions = buildEspecialidadOptions(especialidadRows);

    options = {
      profesiones: profesionOptions.values,
      especialidades: especialidadOptions.values,
      includeEmptyProfesion: profesionOptions.includeEmpty,
      includeEmptyEspecialidad: especialidadOptions.includeEmpty,
    };

    if (profesionRes.error) {
      console.error("[Admin/Voluntarios] Error cargando profesiones", profesionRes.error);
      if (!errorMessage) {
        errorMessage = "No se pudieron cargar las profesiones.";
      }
    }
    if (especialidadRes.error) {
      console.error("[Admin/Voluntarios] Error cargando especialidades", especialidadRes.error);
      if (!errorMessage) {
        errorMessage = "No se pudieron cargar las especialidades.";
      }
    }
  } catch (error: unknown) {
    const debug = getErrorMessage(error);
    console.error("[Admin/Voluntarios] Error cargando listado", debug, error);
    errorMessage = "No se pudieron cargar los voluntarios.";
  }

  const items = rows.map((row) => ({
    ...row,
    createdLabel: formatDateTime(row.created_at),
    birthLabel: formatDate(row.fecha_nacimiento),
    // Determinar el estado de cuenta para badges
    accountStatus: row.id.startsWith("user_")
      ? ("pending" as const)           // Fila sintética: usuario con cuenta pero sin registro en voluntarios
      : row.email && emailsConCuenta.has(row.email.toLowerCase())
        ? ("has_account" as const)      // Voluntario CON cuenta
        : ("no_account" as const),      // Voluntario SIN cuenta
  }));

  const filterKey = JSON.stringify(filters);

  // Stats
  const totalVoluntarios = total;
  const uniqueProfesiones = options.profesiones.length;
  const conCuenta = items.filter((i) => i.accountStatus === "has_account" || i.accountStatus === "pending").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref="/admin"
        eyebrow="Voluntariado"
        title="Gestión de voluntarios"
        description="Base completa de voluntarios registrados. Incluye personas con y sin cuenta en el sistema."
      />

      {/* Stats */}
      <StatTileGrid>
        <StatTile 
          icon={<Users className="h-4 w-4" />}
          label="Total voluntarios"
          value={totalVoluntarios}
        />
        <StatTile
          icon={<UserCheck className="h-4 w-4" />}
          label="Con cuenta"
          value={conCuenta}
          highlight
          highlightVariant="emerald"
        />
        <StatTile 
          icon={<Briefcase className="h-4 w-4" />}
          label="Profesiones distintas"
          value={uniqueProfesiones}
          highlight
          highlightVariant="blue"
        />
      </StatTileGrid>

      <VoluntariosTable
        key={filterKey}
        items={items}
        total={total}
        limit={LIMIT}
        filters={filters}
        options={options}
        errorMessage={errorMessage}
      />
    </div>
  );
}
