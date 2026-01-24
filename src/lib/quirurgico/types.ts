// src/lib/quirurgico/types.ts
// Tipos TypeScript para el módulo quirúrgico reestructurado

import type { Json } from "../database.types";

// =====================================================
// OPERATIVOS QUIRÚRGICOS
// =====================================================

export type OperativoQuirurgicoEstado = "draft" | "publicado" | "cerrado" | "finalizado";

export interface OperativoQuirurgico {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ciudad: string | null;
  lugar: string | null;
  imagen_cabecera_url: string | null;
  publicado: boolean;
  estado: string;
  created_at: string;
  updated_at: string | null;
}

export type OperativoQuirurgicoInsert = Omit<OperativoQuirurgico, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type OperativoQuirurgicoUpdate = Partial<Omit<OperativoQuirurgico, "id" | "created_at">>;

export type OperativoQuirurgicoSummary = Pick<
  OperativoQuirurgico,
  "id" | "titulo" | "slug" | "ciudad" | "lugar" | "fecha_inicio" | "publicado" | "estado"
>;

export interface OperativoQuirurgicoPublic {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ciudad: string | null;
  lugar: string | null;
  imagen_cabecera_url: string | null;
}

// =====================================================
// PACIENTES (nueva estructura)
// =====================================================

export type PacienteEstado = "activo" | "operado" | "alta" | "cancelado";
export type PacienteGenero = "M" | "F" | "Otro";

export interface Paciente {
  id: string;
  operativo_quirurgico_id: string | null;
  
  // Datos personales
  rut: string | null;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  genero: string | null;
  
  // Contacto
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad_origen: string | null;
  
  // Médico
  diagnostico: string | null;
  cirugia_planificada: string | null;
  fecha_cirugia: string | null;
  hora_cirugia: string | null;
  alta_hospitalaria_estimada: string | null;
  
  // Logística
  requiere_vuelo: boolean;
  requiere_hospedaje: boolean;
  fecha_llegada_ciudad: string | null;
  fecha_regreso_ciudad: string | null;
  
  // Admin
  notes_admin: string | null;
  estado: string;
  
  // Timestamps
  created_at: string;
  updated_at: string | null;
}

export type PacienteInsert = Omit<Paciente, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PacienteUpdate = Partial<Omit<Paciente, "id" | "created_at">>;

export interface PacienteWithOperativo extends Paciente {
  operativo?: OperativoQuirurgicoSummary | null;
}

export interface PacienteListItem {
  id: string;
  nombres: string;
  apellidos: string;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  ciudad_origen: string | null;
  fecha_cirugia: string | null;
  estado: string;
  requiere_vuelo: boolean;
  requiere_hospedaje: boolean;
  operativo_quirurgico_id: string | null;
}

// Vista completa del paciente para admin
export interface PacienteAdminDetail extends Paciente {
  operativo?: OperativoQuirurgicoSummary | null;
  contactos?: PacienteContacto[];
  requerimientos?: PacienteRequerimiento[];
  archivos?: PacienteArchivo[];
  portal_token?: PacientePortalTokenInfo | null;
}

// =====================================================
// CONTACTOS DE EMERGENCIA
// =====================================================

export interface PacienteContacto {
  id: string;
  paciente_id: string;
  nombre: string;
  relacion: string | null;
  telefono: string;
  email: string | null;
  es_principal: boolean;
  created_at: string;
}

export type PacienteContactoInsert = Omit<PacienteContacto, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type PacienteContactoUpdate = Partial<Omit<PacienteContacto, "id" | "paciente_id" | "created_at">>;

// =====================================================
// REQUERIMIENTOS (exámenes, documentos)
// =====================================================

export type RequerimientoTipo = "examen" | "documento" | "consentimiento";
export type RequerimientoEstado = "pendiente" | "recibido" | "aprobado" | "rechazado";

export interface PacienteRequerimiento {
  id: string;
  paciente_id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  estado: string;
  fecha_limite: string | null;
  notas_admin: string | null;
  created_at: string;
  updated_at: string | null;
}

export type PacienteRequerimientoInsert = Omit<PacienteRequerimiento, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PacienteRequerimientoUpdate = Partial<Omit<PacienteRequerimiento, "id" | "paciente_id" | "created_at">>;

export interface PacienteRequerimientoWithArchivos extends PacienteRequerimiento {
  archivos?: PacienteArchivo[];
}

// =====================================================
// ARCHIVOS
// =====================================================

export type ArchivoUploadedBy = "paciente" | "admin";

export interface PacienteArchivo {
  id: string;
  paciente_id: string;
  requerimiento_id: string | null;
  storage_path: string;
  filename: string;
  mimetype: string | null;
  size_bytes: number | null;
  uploaded_by: string;
  notas: string | null;
  created_at: string;
}

export type PacienteArchivoInsert = Omit<PacienteArchivo, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

// =====================================================
// PORTAL TOKENS (seguridad)
// =====================================================

export interface PacientePortalToken {
  id: string;
  paciente_id: string;
  token_hash: string;
  expires_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  created_by: string | null;
}

// Info del token para admin (sin hash)
export interface PacientePortalTokenInfo {
  id: string;
  expires_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  is_active: boolean;
  is_expired: boolean;
  created_at: string;
}

// =====================================================
// POSTULACIONES EQUIPO CLÍNICO
// =====================================================

export type PostulacionEquipoEstado = "pendiente" | "aprobado" | "rechazado" | "confirmado";

export interface PostulacionEquipoQuirurgico {
  id: string;
  operativo_quirurgico_id: string;
  
  // Datos personales
  nombres: string;
  apellidos: string;
  rut: string | null;
  email: string;
  telefono: string | null;
  
  // Profesión
  profesion: string;
  especialidad: string | null;
  registro_superint: string | null;
  anos_experiencia: number | null;
  
  // Experiencia
  experiencia_pabellon: string | null;
  certificaciones: string | null;
  
  // Disponibilidad
  disponibilidad_completa: boolean;
  notas_disponibilidad: string | null;
  
  // Admin
  estado: string;
  notas_admin: string | null;
  
  created_at: string;
  updated_at: string | null;
}

export type PostulacionEquipoInsert = Omit<PostulacionEquipoQuirurgico, "id" | "created_at" | "updated_at" | "estado" | "notas_admin"> & {
  id?: string;
  created_at?: string;
};

export type PostulacionEquipoUpdate = Partial<Omit<PostulacionEquipoQuirurgico, "id" | "operativo_quirurgico_id" | "created_at">>;

export interface PostulacionEquipoListItem {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  profesion: string;
  especialidad: string | null;
  estado: string;
  created_at: string;
}

// =====================================================
// PORTAL DEL PACIENTE (vista pública)
// =====================================================

export interface PortalPacienteData {
  id: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  
  // Info del operativo
  operativo?: {
    titulo: string;
    ciudad: string | null;
    lugar: string | null;
  } | null;
  
  // Médico
  diagnostico: string | null;
  cirugia_planificada: string | null;
  fecha_cirugia: string | null;
  hora_cirugia: string | null;
  
  // Logística visible
  fecha_llegada_ciudad: string | null;
  fecha_regreso_ciudad: string | null;
  
  // Requerimientos pendientes
  requerimientos_pendientes: number;
  requerimientos: {
    id: string;
    titulo: string;
    descripcion: string | null;
    estado: string;
    archivos_count: number;
  }[];
  
  // Contacto emergencia principal
  contacto_emergencia?: {
    nombre: string;
    telefono: string;
  } | null;
}

// =====================================================
// API RESPONSES
// =====================================================

export interface PortalVerifyResponse {
  success: boolean;
  error?: string;
  patient_id?: string;
}

export interface PortalSessionData {
  paciente_id: string;
  expires_at: number;
}

// =====================================================
// HELPERS
// =====================================================

export function getNombreCompleto(paciente: Pick<Paciente, "nombres" | "apellidos">): string {
  return `${paciente.nombres} ${paciente.apellidos}`.trim();
}

export function isTokenActive(token: PacientePortalTokenInfo): boolean {
  if (token.revoked_at) return false;
  const now = new Date();
  const expires = new Date(token.expires_at);
  return expires > now;
}
