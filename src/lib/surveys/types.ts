// src/lib/surveys/types.ts
// Tipos TypeScript para el sistema de encuestas de satisfacción

// =====================================================
// ENUMS
// =====================================================

export type SurveyTipo = "VOLUNTARIOS_OPERATIVO" | "PACIENTES_QUIRURGICO";
export type QuestionTipo = "rating" | "texto_libre" | "opcion_multiple";
export type AssignmentEstado = "pendiente" | "enviado" | "abierto" | "completado" | "expirado";

// =====================================================
// TEMPLATES DE ENCUESTA
// =====================================================

export interface SurveyTemplate {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: SurveyTipo;
  delay_days: number;
  activo: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export type SurveyTemplateInsert = Omit<SurveyTemplate, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SurveyTemplateUpdate = Partial<Omit<SurveyTemplate, "id" | "created_at">>;

export interface SurveyTemplateWithQuestions extends SurveyTemplate {
  questions: SurveyQuestion[];
}

// =====================================================
// PREGUNTAS
// =====================================================

export interface RatingLabels {
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
}

export const DEFAULT_RATING_LABELS: RatingLabels = {
  "1": "Muy insuficiente",
  "2": "Insuficiente",
  "3": "Regular",
  "4": "Bueno",
  "5": "Sobresaliente"
};

export interface SurveyQuestion {
  id: string;
  template_id: string;
  texto: string;
  tipo: QuestionTipo;
  rating_labels: RatingLabels | null;
  opciones: string[] | null;
  requerida: boolean;
  orden: number;
  activa: boolean;
  created_at: string;
}

export type SurveyQuestionInsert = Omit<SurveyQuestion, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type SurveyQuestionUpdate = Partial<Omit<SurveyQuestion, "id" | "template_id" | "created_at">>;

// =====================================================
// ASIGNACIONES (envíos)
// =====================================================

export interface SurveyAssignment {
  id: string;
  template_id: string;
  
  // Referencias
  operativo_id: string | null;
  operativo_quirurgico_id: string | null;
  voluntario_id: string | null;
  caso_id: string | null;
  
  // Destinatario
  email_destinatario: string;
  nombre_destinatario: string;
  
  // Token
  token: string;
  token_hash: string;
  
  // Estado
  estado: AssignmentEstado;
  
  // Fechas
  fecha_programada: string;
  fecha_enviado: string | null;
  fecha_abierto: string | null;
  fecha_completado: string | null;
  expires_at: string | null;
  
  created_at: string;
}

export type SurveyAssignmentInsert = Omit<SurveyAssignment, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export interface SurveyAssignmentWithTemplate extends SurveyAssignment {
  template?: SurveyTemplate;
  operativo_nombre?: string;
}

// =====================================================
// RESPUESTAS
// =====================================================

export interface SurveyResponse {
  id: string;
  assignment_id: string;
  question_id: string;
  rating_value: number | null;
  texto_value: string | null;
  opcion_value: string | null;
  created_at: string;
}

export type SurveyResponseInsert = Omit<SurveyResponse, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

// =====================================================
// VISTAS PARA UI
// =====================================================

// Para el admin: lista de templates
export interface SurveyTemplateListItem {
  id: string;
  nombre: string;
  tipo: SurveyTipo;
  delay_days: number;
  activo: boolean;
  questions_count: number;
  assignments_count: number;
  completados_count: number;
  created_at: string;
}

// Para el admin: detalle de asignaciones
export interface SurveyAssignmentListItem {
  id: string;
  template_nombre: string;
  nombre_destinatario: string;
  email_destinatario: string;
  estado: AssignmentEstado;
  operativo_nombre: string | null;
  fecha_programada: string;
  fecha_enviado: string | null;
  fecha_completado: string | null;
}

// Para el portal público de encuesta
export interface SurveyPublicData {
  assignment_id: string;
  template_nombre: string;
  template_descripcion: string | null;
  operativo_nombre: string;
  operativo_fecha: string | null;
  nombre_destinatario: string;
  questions: Array<{
    id: string;
    texto: string;
    tipo: QuestionTipo;
    rating_labels: RatingLabels | null;
    opciones: string[] | null;
    requerida: boolean;
    orden: number;
  }>;
  ya_completada: boolean;
  expirada: boolean;
}

// Para enviar respuestas
export interface SurveySubmission {
  assignment_id: string;
  responses: Array<{
    question_id: string;
    rating_value?: number;
    texto_value?: string;
    opcion_value?: string;
  }>;
}

// Estadísticas de una encuesta
export interface SurveyStats {
  template_id: string;
  template_nombre: string;
  total_enviados: number;
  total_completados: number;
  tasa_respuesta: number;
  promedio_rating: number | null;
  respuestas_por_pregunta: Array<{
    question_id: string;
    question_texto: string;
    question_tipo: QuestionTipo;
    promedio_rating?: number;
    respuestas_texto?: string[];
    distribucion_opciones?: Record<string, number>;
  }>;
}
