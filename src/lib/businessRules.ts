// src/lib/businessRules.ts
// =========================================================================
// REGLAS DE NEGOCIO — Fundación Traesol
// =========================================================================
//
// Este archivo es la fuente de verdad para las definiciones de entidades,
// listados y reglas de consistencia del sistema.
//
// Definiciones principales:
//
//   VOLUNTARIO — Persona registrada como voluntaria. Puede existir:
//     • Con cuenta (auth user + user_profiles + user_roles + voluntarios)
//     • Sin cuenta (solo registro en tabla `voluntarios`, p.ej. postulación
//       anónima, encuesta, importación).
//     Tabla principal: `voluntarios` (legacy, sin user_id).
//     Tabla de cuenta: `user_profiles` (FK → auth.users).
//     Relación: por coincidencia de `email` entre ambas tablas.
//
//   USUARIO — Persona con cuenta en el sistema (auth.users + user_profiles
//     + user_roles). Permite login, postular con cuenta, gestionar perfil.
//     Roles posibles: 'volunteer', 'admin', 'superadmin'.
//
//   SUPERADMIN — Rol especial otorgado por script de servidor o env var
//     SUPERADMIN_EMAILS. NO debe aparecer en listado de voluntarios ni
//     contaminar sus métricas.
//
// Reglas de listados:
//
//   /admin/voluntarios:
//     Muestra TODAS las personas voluntarias, incluyendo:
//       • Voluntarios sin cuenta (tabla `voluntarios` únicamente)
//       • Voluntarios con cuenta (tabla `voluntarios` + email match en auth)
//       • Usuarios con rol volunteer sin registro en `voluntarios` → "Perfil pendiente"
//     Excluye: superadmins.
//     Badges: "Con cuenta", "Sin cuenta", "Perfil pendiente".
//
//   /admin/usuarios:
//     Muestra usuarios del sistema (auth + roles).
//     Filtrable por rol. Solo accesible por superadmin.
//
// Regla clave de consistencia:
//   Todo usuario con rol 'volunteer' o 'admin' (excepto superadmin) DEBE
//   tener un registro correspondiente en la tabla `voluntarios`.
//   Este registro se crea automáticamente al:
//     • Registrar cuenta (/api/auth/register)
//     • Crear admin desde panel (/api/admin/users POST)
//   Si por algún motivo no existe, el listado de voluntarios lo muestra
//   como "Perfil pendiente" con datos mínimos.
//
// Regla de perfil completo para operativos:
//   Antes de postular o aceptar una invitación, el usuario debe tener
//   todos los CAMPOS_OBLIGATORIOS_OPERATIVO completados en user_profiles.
//   Si faltan campos, se bloquea la acción y se redirige al formulario
//   de edición de perfil, preservando el contexto de retorno.
//
// =========================================================================

/**
 * Campos obligatorios para participar en un operativo (postular o aceptar invitación).
 * Aplicables a user_profiles (usuarios con cuenta).
 */
export const CAMPOS_OBLIGATORIOS_OPERATIVO = [
  { key: "first_name", label: "Nombre" },
  { key: "last_name", label: "Apellido" },
  { key: "phone", label: "Teléfono" },
  { key: "rut", label: "RUT", conditionalKey: "extranjero", alternateKey: "id_nacional", alternateLabel: "ID Nacional" },
  { key: "nacionalidad", label: "Nacionalidad" },
  { key: "genero", label: "Género" },
  { key: "birthdate", label: "Fecha de nacimiento" },
  { key: "profesion", label: "Profesión" },
  { key: "talla_polera", label: "Talla de polera" },
  { key: "restricciones_alimentarias", label: "Restricciones alimentarias" },
  { key: "nombre_credencial", label: "Nombre para credencial" },
] as const;

/**
 * Campos que se traen de user_profiles para validar completitud.
 * Debe incluir todos los key de CAMPOS_OBLIGATORIOS_OPERATIVO + campos condicionales.
 */
export const PROFILE_FIELDS_FOR_VALIDATION =
  "id, first_name, last_name, rut, extranjero, id_nacional, phone, birthdate, nacionalidad, genero, profesion, profesion_otro, talla_polera, talla_pantalon, restricciones_alimentarias, alimentarias_veg, nombre_credencial, direccion, comuna, instagram, motivacion";

/**
 * Tipo mínimo del perfil para validación de completitud.
 */
export type ProfileForValidation = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  rut: string | null;
  extranjero: boolean | null;
  id_nacional: string | null;
  phone: string | null;
  birthdate: string | null;
  nacionalidad: string | null;
  genero: string | null;
  profesion: string | null;
  profesion_otro: string | null;
  talla_polera: string | null;
  talla_pantalon: string | null;
  restricciones_alimentarias: string | null;
  alimentarias_veg: boolean | null;
  nombre_credencial: string | null;
  direccion: string | null;
  comuna: string | null;
  instagram: string | null;
  motivacion: string | null;
};

export interface ProfileCompletenessResult {
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Verifica si un perfil de user_profiles tiene todos los campos obligatorios
 * para participar en un operativo (postular o aceptar invitación).
 *
 * Esta es la función central — usada por PostularConCuentaModal,
 * /api/invitaciones/aceptar, y cualquier otro punto de validación.
 */
export function isProfileCompleteForOperativo(
  profile: ProfileForValidation | null
): ProfileCompletenessResult {
  if (!profile) {
    return { isComplete: false, missingFields: ["Perfil no encontrado"] };
  }

  const missing: string[] = [];

  const isEmpty = (val: unknown): boolean =>
    val === null || val === undefined || (typeof val === "string" && !val.trim());

  // first_name, last_name, phone, nacionalidad, genero, birthdate, profesion,
  // talla_polera, restricciones_alimentarias, nombre_credencial
  for (const campo of CAMPOS_OBLIGATORIOS_OPERATIVO) {
    // Campos condicionales (RUT vs ID nacional)
    if (campo.key === "rut") {
      const isExtranjero = profile.extranjero === true;
      if (isExtranjero) {
        if (isEmpty(profile.id_nacional)) {
          missing.push(campo.alternateLabel ?? "ID Nacional");
        }
      } else {
        if (isEmpty(profile.rut)) {
          missing.push(campo.label);
        }
      }
      continue;
    }

    const value = profile[campo.key as keyof ProfileForValidation];
    if (isEmpty(value)) {
      missing.push(campo.label);
    }
  }

  return { isComplete: missing.length === 0, missingFields: missing };
}

/**
 * Roles que NO deben aparecer en el listado de voluntarios.
 */
export const ROLES_EXCLUIDOS_VOLUNTARIOS = ["superadmin"] as const;

/**
 * Roles permitidos para acceder al panel admin.
 */
export const ROLES_ADMIN = ["admin", "superadmin", "editor"] as const;
