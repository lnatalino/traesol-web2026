// src/lib/schemas/profile.ts
// Schema unificado para perfiles de voluntarios y staff
// Reutilizable en: Mi perfil, Confirmar datos, Registro, Admin

import { z } from "zod";

// =========================================================================
// CONSTANTES
// =========================================================================

export const PROFESIONES = [
  "Estudiante",
  "Médico",
  "Enfermero/a",
  "Técnico en enfermería",
  "Kinesiólogo/a",
  "Nutricionista",
  "Psicólogo/a",
  "Trabajador/a social",
  "Fonoaudiólogo/a",
  "Terapeuta ocupacional",
  "Odontólogo/a",
  "Paramédico",
  "Administrativo/a",
  "Logística",
  "Comunicaciones",
  "Otro",
] as const;

export const TALLAS_POLERA = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export const TALLAS_PANTALON = ["36", "38", "40", "42", "44", "46", "48", "50"] as const;

export const GENEROS = ["Masculino", "Femenino", "Otro"] as const;

// =========================================================================
// HELPERS DE VALIDACIÓN
// =========================================================================

function normalizeRut(raw: string): string {
  return raw.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toUpperCase();
}

function isValidRut(rut: string): boolean {
  const normalized = normalizeRut(rut);
  if (normalized.length < 8 || normalized.length > 9) return false;
  
  const dv = normalized.slice(-1);
  const num = normalized.slice(0, -1);
  
  if (!/^\d+$/.test(num)) return false;
  if (!/^[0-9K]$/.test(dv)) return false;
  
  // Cálculo del dígito verificador
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = num.length - 1; i >= 0; i--) {
    suma += parseInt(num[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = resto === 0 ? "0" : resto === 1 ? "K" : String(11 - resto);
  
  return dv === dvCalculado;
}

// =========================================================================
// SCHEMA BASE (todos los campos posibles)
// =========================================================================

export const profileSchemaBase = z.object({
  // === Identificación ===
  first_name: z.string().min(1, "El nombre es obligatorio").max(100),
  last_name: z.string().min(1, "El apellido es obligatorio").max(100),
  rut: z.string().optional().nullable(),
  extranjero: z.boolean().default(false),
  id_nacional: z.string().optional().nullable(),
  pasaporte: z.string().optional().nullable(),
  
  // === Datos personales ===
  nacionalidad: z.string().optional().nullable(),
  genero: z.enum(GENEROS).optional().nullable(),
  birthdate: z.string().optional().nullable(), // YYYY-MM-DD
  
  // === Contacto ===
  phone: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  comuna: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  
  // === Profesión ===
  profesion: z.string().optional().nullable(),
  profesion_otro: z.string().optional().nullable(),
  especialidad: z.string().optional().nullable(),
  
  // === Logística ===
  talla_polera: z.enum(TALLAS_POLERA).optional().nullable(),
  talla_pantalon: z.enum(TALLAS_PANTALON).optional().nullable(),
  
  // === Alimentación ===
  restricciones_alimentarias: z.string().optional().nullable(),
  alimentarias_veg: z.boolean().default(false),
  
  // === Credencial ===
  nombre_credencial: z.string().optional().nullable(),
  
  // === Voluntario específico ===
  disponibilidad_anual: z.string().optional().nullable(),
  motivacion: z.string().optional().nullable(),
  
  // === Staff específico ===
  cargo_interno: z.string().optional().nullable(),
  profile_type: z.enum(["volunteer", "staff"]).default("volunteer"),
});

export type ProfileFormData = z.infer<typeof profileSchemaBase>;

// =========================================================================
// SCHEMAS POR CONTEXTO
// =========================================================================

/**
 * Schema para REGISTRO MÍNIMO (crear cuenta)
 * Solo nombre, apellido, email (email viene de auth)
 */
export const profileSchemaRegister = profileSchemaBase.pick({
  first_name: true,
  last_name: true,
}).required();

/**
 * Schema para POSTULAR A OPERATIVO (voluntario)
 * Todos los campos de logística son obligatorios
 */
export const profileSchemaApplyVolunteer = profileSchemaBase
  .extend({
    // Hacer obligatorios los campos de logística
    phone: z.string().min(1, "El teléfono es obligatorio"),
    talla_polera: z.enum(TALLAS_POLERA).catch("M"), // Default a M si no se selecciona
    restricciones_alimentarias: z.string().min(1, "Indica tus restricciones alimentarias (o 'Ninguna')"),
  })
  .refine(
    (data) => {
      // Validar que talla_polera no sea undefined/null
      return data.talla_polera && TALLAS_POLERA.includes(data.talla_polera as typeof TALLAS_POLERA[number]);
    },
    {
      message: "La talla de polera es obligatoria",
      path: ["talla_polera"],
    }
  )
  .refine(
    (data) => {
      // Si no es extranjero, RUT es obligatorio
      if (!data.extranjero) {
        return data.rut && data.rut.trim().length > 0;
      }
      // Si es extranjero, ID nacional es obligatorio
      return data.id_nacional && data.id_nacional.trim().length > 0;
    },
    {
      message: "RUT es obligatorio (o marca 'Soy extranjero/a' e indica tu ID nacional)",
      path: ["rut"],
    }
  )
  .refine(
    (data) => {
      // Validar formato RUT si se proporciona
      if (data.rut && !data.extranjero) {
        return isValidRut(data.rut);
      }
      return true;
    },
    {
      message: "El RUT no es válido",
      path: ["rut"],
    }
  );

/**
 * Schema para PERFIL STAFF (admin/superadmin)
 * Similar a voluntario pero sin disponibilidad_anual
 */
export const profileSchemaStaff = profileSchemaBase
  .omit({ disponibilidad_anual: true })
  .extend({
    phone: z.string().min(1, "El teléfono es obligatorio"),
    talla_polera: z.enum(TALLAS_POLERA).catch("M"), // Default a M si no se selecciona
    restricciones_alimentarias: z.string().min(1, "Indica tus restricciones alimentarias (o 'Ninguna')"),
    cargo_interno: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // Validar que talla_polera no sea undefined/null
      return data.talla_polera && TALLAS_POLERA.includes(data.talla_polera as typeof TALLAS_POLERA[number]);
    },
    {
      message: "La talla de polera es obligatoria",
      path: ["talla_polera"],
    }
  )
  .refine(
    (data) => {
      if (!data.extranjero) {
        return data.rut && data.rut.trim().length > 0;
      }
      return data.id_nacional && data.id_nacional.trim().length > 0;
    },
    {
      message: "RUT es obligatorio (o marca 'Soy extranjero/a' e indica tu ID nacional)",
      path: ["rut"],
    }
  );

/**
 * Schema para EDITAR PERFIL (Mi cuenta)
 * Similar a Apply pero algunos campos opcionales
 */
export const profileSchemaEdit = profileSchemaBase;

// =========================================================================
// HELPER: Validar perfil para postulación
// =========================================================================

export interface ProfileValidationResult {
  isComplete: boolean;
  missingFields: string[];
  errors: Record<string, string>;
}

/**
 * Verifica si un perfil tiene todos los campos obligatorios para postular
 */
export function validateProfileForApplication(
  profile: Partial<ProfileFormData> | null,
  isStaff: boolean = false
): ProfileValidationResult {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: ["Perfil no encontrado"],
      errors: {},
    };
  }

  const missing: string[] = [];
  const errors: Record<string, string> = {};

  // Campos obligatorios para todos
  if (!profile.first_name?.trim()) {
    missing.push("Nombre");
    errors.first_name = "El nombre es obligatorio";
  }
  if (!profile.last_name?.trim()) {
    missing.push("Apellido");
    errors.last_name = "El apellido es obligatorio";
  }
  if (!profile.phone?.trim()) {
    missing.push("Teléfono");
    errors.phone = "El teléfono es obligatorio";
  }
  if (!profile.talla_polera) {
    missing.push("Talla de polera");
    errors.talla_polera = "La talla de polera es obligatoria";
  }
  if (!profile.restricciones_alimentarias?.trim()) {
    missing.push("Restricciones alimentarias");
    errors.restricciones_alimentarias = "Indica tus restricciones (o 'Ninguna')";
  }

  // RUT o ID nacional
  if (!profile.extranjero) {
    if (!profile.rut?.trim()) {
      missing.push("RUT");
      errors.rut = "El RUT es obligatorio";
    } else if (!isValidRut(profile.rut)) {
      missing.push("RUT válido");
      errors.rut = "El RUT no es válido";
    }
  } else {
    if (!profile.id_nacional?.trim()) {
      missing.push("ID Nacional");
      errors.id_nacional = "El ID nacional es obligatorio para extranjeros";
    }
  }

  // Campos solo para voluntarios (no staff)
  if (!isStaff) {
    // Disponibilidad anual es opcional pero recomendada
    // No lo hacemos obligatorio por ahora
  }

  return {
    isComplete: missing.length === 0,
    missingFields: missing,
    errors,
  };
}

// =========================================================================
// HELPER: Formatear RUT
// =========================================================================

export function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9Kk]/g, "").toUpperCase();
  if (!clean) return "";
  const dv = clean.slice(-1);
  let num = clean.slice(0, -1);
  let out = "";
  while (num.length > 3) {
    out = "." + num.slice(-3) + out;
    num = num.slice(0, -3);
  }
  out = num + out;
  return `${out}-${dv}`;
}

export { normalizeRut, isValidRut };
