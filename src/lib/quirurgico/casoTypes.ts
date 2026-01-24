// src/lib/quirurgico/casoTypes.ts
// Tipos TypeScript para casos quirúrgicos (paciente-operativo)

import type { PacienteContacto, PacienteRequerimiento, PacienteArchivo, PacientePortalTokenInfo } from "./types";

// =====================================================
// CASO QUIRÚRGICO (participación en un operativo)
// =====================================================

export type CasoEstado = "activo" | "operado" | "alta" | "cancelado";

export interface CasoQuirurgico {
  id: string;
  
  // Relaciones
  paciente_id: string;
  operativo_quirurgico_id: string;
  
  // Datos médicos del caso
  diagnostico: string | null;
  cirugia_planificada: string | null;
  fecha_cirugia: string | null;
  hora_cirugia: string | null;
  alta_hospitalaria_estimada: string | null;
  
  // Logística del caso
  requiere_vuelo: boolean;
  requiere_hospedaje: boolean;
  fecha_llegada_ciudad: string | null;
  fecha_regreso_ciudad: string | null;
  
  // Info vuelo
  vuelo_ida_fecha: string | null;
  vuelo_ida_numero: string | null;
  vuelo_ida_origen: string | null;
  vuelo_ida_destino: string | null;
  vuelo_regreso_fecha: string | null;
  vuelo_regreso_numero: string | null;
  vuelo_regreso_origen: string | null;
  vuelo_regreso_destino: string | null;
  
  // Info hotel
  hotel_nombre: string | null;
  hotel_direccion: string | null;
  hotel_checkin: string | null;
  hotel_checkout: string | null;
  
  // Admin/estado
  notes_admin: string | null;
  estado: string;
  patient_can_edit: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string | null;
}

export type CasoQuirurgicoInsert = Omit<CasoQuirurgico, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CasoQuirurgicoUpdate = Partial<Omit<CasoQuirurgico, "id" | "paciente_id" | "operativo_quirurgico_id" | "created_at">>;

// =====================================================
// VISTAS CON RELACIONES
// =====================================================

export interface PacienteResumen {
  id: string;
  nombres: string;
  apellidos: string;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  ciudad_origen: string | null;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  direccion?: string | null;
}

export interface OperativoResumen {
  id: string;
  titulo: string;
  slug: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ciudad: string | null;
  lugar?: string | null;
  estado: string;
}

export interface CasoQuirurgicoWithPaciente extends CasoQuirurgico {
  paciente?: PacienteResumen | null;
  operativo?: OperativoResumen | null;
}

export interface CasoQuirurgicoAdminDetail extends CasoQuirurgico {
  paciente?: PacienteResumen | null;
  operativo?: OperativoResumen | null;
  contactos?: PacienteContacto[];
  requerimientos?: PacienteRequerimiento[];
  archivos?: PacienteArchivo[];
  portal_token?: PacientePortalTokenInfo | null;
}

// =====================================================
// LISTADOS
// =====================================================

export interface CasoListItem {
  id: string;
  paciente_id: string;
  operativo_quirurgico_id: string;
  
  // Del paciente
  paciente_nombres?: string;
  paciente_apellidos?: string;
  paciente_rut?: string | null;
  paciente_email?: string | null;
  
  // Del caso
  diagnostico: string | null;
  fecha_cirugia: string | null;
  estado: string;
  requiere_vuelo: boolean;
  requiere_hospedaje: boolean;
  
  created_at: string;
}

// =====================================================
// PARA EL PORTAL DEL PACIENTE
// =====================================================

export interface PortalCasoData {
  id: string;
  
  // Paciente (perfil global)
  paciente: {
    id: string;
    nombres: string;
    apellidos: string;
    rut: string | null;
    fecha_nacimiento: string | null;
    genero: string | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    ciudad_origen: string | null;
  };
  
  // Operativo
  operativo: {
    id: string;
    titulo: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    ciudad: string | null;
    lugar: string | null;
  };
  
  // Caso (datos específicos de esta participación)
  diagnostico: string | null;
  cirugia_planificada: string | null;
  fecha_cirugia: string | null;
  hora_cirugia: string | null;
  alta_hospitalaria_estimada: string | null;
  
  // Logística
  requiere_vuelo: boolean;
  requiere_hospedaje: boolean;
  vuelo_ida_fecha: string | null;
  vuelo_ida_numero: string | null;
  vuelo_ida_origen: string | null;
  vuelo_ida_destino: string | null;
  vuelo_regreso_fecha: string | null;
  vuelo_regreso_numero: string | null;
  hotel_nombre: string | null;
  hotel_direccion: string | null;
  hotel_checkin: string | null;
  hotel_checkout: string | null;
  
  // Estado
  estado: string;
  patient_can_edit: boolean;
  
  // Relacionados
  contactos: PacienteContacto[];
  requerimientos: Array<{
    id: string;
    titulo: string;
    descripcion: string | null;
    tipo: string;
    estado: string;
    fecha_limite: string | null;
  }>;
  archivos: Array<{
    id: string;
    filename: string;
    mimetype: string | null;
    size_bytes: number | null;
    requerimiento_id: string | null;
    created_at: string;
  }>;
}
