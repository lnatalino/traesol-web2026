// src/lib/surveys/surveysService.ts
// Servicio para gestionar encuestas de satisfacción
// NOTA: Requiere ejecutar la migración 20260124_casos_quirurgicos_y_encuestas.sql

import { supabaseService } from "@/lib/supabaseService";
import crypto from "crypto";
import type {
  SurveyTemplate,
  SurveyTemplateInsert,
  SurveyTemplateUpdate,
  SurveyTemplateWithQuestions,
  SurveyTemplateListItem,
  SurveyQuestion,
  SurveyQuestionInsert,
  SurveyQuestionUpdate,
  SurveyAssignment,
  SurveyAssignmentListItem,
  SurveyResponse,
  SurveyResponseInsert,
  SurveyPublicData,
  SurveySubmission,
  SurveyStats,
  DEFAULT_RATING_LABELS
} from "./types";

// Tipo helper para hacer cast de las respuestas de Supabase
// mientras la migración no está en producción
type SupabaseAny = unknown;

// Tipo intermedio para datos de template con agregados
interface TemplateWithAggregates {
  id: string;
  nombre: string;
  tipo: string;
  delay_days: number;
  activo: boolean;
  created_at: string;
  survey_questions: Array<{ count: number }>;
  survey_assignments: Array<{ count: number }>;
}

// =====================================================
// TEMPLATES
// =====================================================

export async function getTemplates(): Promise<SurveyTemplateListItem[]> {
  const { data, error } = await supabaseService
    .from("survey_templates")
    .select(`
      id, nombre, tipo, delay_days, activo, created_at,
      survey_questions(count),
      survey_assignments(count)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[surveysService] getTemplates error:", error);
    return [];
  }

  const templates = (data || []) as SupabaseAny as TemplateWithAggregates[];

  // Obtener completados count por separado
  const templatesWithCounts = await Promise.all(
    templates.map(async (t) => {
      const { count } = await supabaseService
        .from("survey_assignments")
        .select("*", { count: "exact", head: true })
        .eq("template_id", t.id)
        .eq("estado", "completado");

      return {
        id: t.id,
        nombre: t.nombre,
        tipo: t.tipo,
        delay_days: t.delay_days,
        activo: t.activo,
        created_at: t.created_at,
        questions_count: t.survey_questions?.[0]?.count || 0,
        assignments_count: t.survey_assignments?.[0]?.count || 0,
        completados_count: count || 0
      } as SurveyTemplateListItem;
    })
  );

  return templatesWithCounts;
}

export async function getTemplateById(id: string): Promise<SurveyTemplate | null> {
  const { data, error } = await supabaseService
    .from("survey_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[surveysService] getTemplateById error:", error);
    return null;
  }

  return data as SupabaseAny as SurveyTemplate;
}

export async function getTemplateWithQuestions(id: string): Promise<SurveyTemplateWithQuestions | null> {
  const { data, error } = await supabaseService
    .from("survey_templates")
    .select(`
      *,
      questions:survey_questions(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[surveysService] getTemplateWithQuestions error:", error);
    return null;
  }

  // Ordenar preguntas
  const template = data as unknown as SurveyTemplateWithQuestions;
  if (template.questions) {
    template.questions.sort((a, b) => a.orden - b.orden);
  }

  return template;
}

export async function createTemplate(data: SurveyTemplateInsert): Promise<SurveyTemplate | null> {
  const { data: created, error } = await supabaseService
    .from("survey_templates")
    // @ts-expect-error - tabla survey_templates será creada por migración SQL
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("[surveysService] createTemplate error:", error);
    return null;
  }

  return created as SupabaseAny as SurveyTemplate;
}

export async function updateTemplate(id: string, data: SurveyTemplateUpdate): Promise<SurveyTemplate | null> {
  const { data: updated, error } = await supabaseService
    .from("survey_templates")
    // @ts-expect-error - tabla survey_templates será creada por migración SQL
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[surveysService] updateTemplate error:", error);
    return null;
  }

  return updated as SupabaseAny as SurveyTemplate;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const { error } = await supabaseService
    .from("survey_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[surveysService] deleteTemplate error:", error);
    return false;
  }

  return true;
}

// =====================================================
// QUESTIONS
// =====================================================

export async function getQuestionsByTemplate(templateId: string): Promise<SurveyQuestion[]> {
  const { data, error } = await supabaseService
    .from("survey_questions")
    .select("*")
    .eq("template_id", templateId)
    .order("orden", { ascending: true });

  if (error) {
    console.error("[surveysService] getQuestionsByTemplate error:", error);
    return [];
  }

  return data as SurveyQuestion[];
}

export async function createQuestion(data: SurveyQuestionInsert): Promise<SurveyQuestion | null> {
  // Si no tiene orden, asignar el siguiente
  if (data.orden === undefined) {
    const { count } = await supabaseService
      .from("survey_questions")
      .select("*", { count: "exact", head: true })
      .eq("template_id", data.template_id);
    data.orden = (count || 0) + 1;
  }

  const { data: created, error } = await supabaseService
    .from("survey_questions")
    // @ts-expect-error - tabla survey_questions será creada por migración SQL
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("[surveysService] createQuestion error:", error);
    return null;
  }

  return created as SupabaseAny as SurveyQuestion;
}

export async function updateQuestion(id: string, data: SurveyQuestionUpdate): Promise<SurveyQuestion | null> {
  const { data: updated, error } = await supabaseService
    .from("survey_questions")
    // @ts-expect-error - tabla survey_questions será creada por migración SQL
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[surveysService] updateQuestion error:", error);
    return null;
  }

  return updated as SupabaseAny as SurveyQuestion;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const { error } = await supabaseService
    .from("survey_questions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[surveysService] deleteQuestion error:", error);
    return false;
  }

  return true;
}

export async function reorderQuestions(templateId: string, questionIds: string[]): Promise<boolean> {
  try {
    for (let i = 0; i < questionIds.length; i++) {
      await supabaseService
        .from("survey_questions")
        // @ts-expect-error - tabla survey_questions será creada por migración SQL
        .update({ orden: i + 1 })
        .eq("id", questionIds[i])
        .eq("template_id", templateId);
    }
    return true;
  } catch (error) {
    console.error("[surveysService] reorderQuestions error:", error);
    return false;
  }
}

// =====================================================
// ASSIGNMENTS
// =====================================================

function generateToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export async function getAssignments(filters?: {
  template_id?: string;
  estado?: string;
  limit?: number;
}): Promise<SurveyAssignmentListItem[]> {
  let query = supabaseService
    .from("survey_assignments")
    .select(`
      id, nombre_destinatario, email_destinatario, estado,
      fecha_programada, fecha_enviado, fecha_completado,
      template:survey_templates(nombre),
      operativo:operativos(titulo),
      operativo_quirurgico:operativos_quirurgicos(titulo)
    `)
    .order("fecha_programada", { ascending: false });

  if (filters?.template_id) {
    query = query.eq("template_id", filters.template_id);
  }
  if (filters?.estado) {
    query = query.eq("estado", filters.estado);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[surveysService] getAssignments error:", error);
    return [];
  }

  // Tipo para las asignaciones crudas
  type AssignmentRaw = {
    id: string;
    nombre_destinatario: string;
    email_destinatario: string;
    estado: string;
    fecha_programada: string;
    fecha_enviado: string | null;
    fecha_completado: string | null;
    template: { nombre: string } | null;
    operativo: { titulo: string } | null;
    operativo_quirurgico: { titulo: string } | null;
  };

  const assignments = (data || []) as SupabaseAny as AssignmentRaw[];

  return assignments.map((a) => ({
    id: a.id,
    template_nombre: a.template?.nombre || "",
    nombre_destinatario: a.nombre_destinatario,
    email_destinatario: a.email_destinatario,
    estado: a.estado,
    operativo_nombre: a.operativo?.titulo || a.operativo_quirurgico?.titulo || null,
    fecha_programada: a.fecha_programada,
    fecha_enviado: a.fecha_enviado,
    fecha_completado: a.fecha_completado
  })) as SurveyAssignmentListItem[];
}

export async function getPendingAssignments(date: string): Promise<SurveyAssignment[]> {
  const { data, error } = await supabaseService
    .from("survey_assignments")
    .select("*")
    .eq("estado", "pendiente")
    .lte("fecha_programada", date)
    .order("fecha_programada", { ascending: true });

  if (error) {
    console.error("[surveysService] getPendingAssignments error:", error);
    return [];
  }

  return (data || []) as SupabaseAny as SurveyAssignment[];
}

export async function markAssignmentAsSent(id: string): Promise<boolean> {
  const { error } = await supabaseService
    .from("survey_assignments")
    // @ts-expect-error - tabla survey_assignments será creada por migración SQL
    .update({
      estado: "enviado",
      fecha_enviado: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error("[surveysService] markAssignmentAsSent error:", error);
    return false;
  }

  return true;
}

export async function markAssignmentAsOpened(id: string): Promise<boolean> {
  const { error } = await supabaseService
    .from("survey_assignments")
    // @ts-expect-error - tabla survey_assignments será creada por migración SQL
    .update({
      estado: "abierto",
      fecha_abierto: new Date().toISOString()
    })
    .eq("id", id)
    .in("estado", ["enviado", "pendiente"]); // Solo si no está ya completado

  if (error) {
    console.error("[surveysService] markAssignmentAsOpened error:", error);
    return false;
  }

  return true;
}

export async function markAssignmentAsCompleted(id: string): Promise<boolean> {
  const { error } = await supabaseService
    .from("survey_assignments")
    // @ts-expect-error - tabla survey_assignments será creada por migración SQL
    .update({
      estado: "completado",
      fecha_completado: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error("[surveysService] markAssignmentAsCompleted error:", error);
    return false;
  }

  return true;
}

// =====================================================
// PORTAL PÚBLICO
// =====================================================

export async function getAssignmentByToken(token: string): Promise<SurveyAssignment | null> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const { data, error } = await supabaseService
    .from("survey_assignments")
    .select("*")
    .eq("token_hash", tokenHash)
    .single();

  if (error) {
    console.error("[surveysService] getAssignmentByToken error:", error);
    return null;
  }

  return data as SurveyAssignment;
}

export async function getSurveyPublicData(token: string): Promise<SurveyPublicData | null> {
  const assignment = await getAssignmentByToken(token);
  if (!assignment) {
    return null;
  }

  // Verificar si ya completada o expirada
  const yaCompletada = assignment.estado === "completado";
  const expirada = assignment.expires_at ? new Date(assignment.expires_at) < new Date() : false;

  // Obtener template con preguntas
  const template = await getTemplateWithQuestions(assignment.template_id);
  if (!template) {
    return null;
  }

  // Obtener nombre del operativo
  let operativoNombre = "";
  let operativoFecha: string | null = null;

  if (assignment.operativo_id) {
    const { data } = await supabaseService
      .from("operativos")
      .select("titulo, fecha_inicio")
      .eq("id", assignment.operativo_id)
      .single();
    const operativo = data as SupabaseAny as { titulo: string; fecha_inicio: string } | null;
    if (operativo) {
      operativoNombre = operativo.titulo;
      operativoFecha = operativo.fecha_inicio;
    }
  } else if (assignment.operativo_quirurgico_id) {
    const { data } = await supabaseService
      .from("operativos_quirurgicos")
      .select("titulo, fecha_inicio")
      .eq("id", assignment.operativo_quirurgico_id)
      .single();
    const quirurgico = data as SupabaseAny as { titulo: string; fecha_inicio: string } | null;
    if (quirurgico) {
      operativoNombre = quirurgico.titulo;
      operativoFecha = quirurgico.fecha_inicio;
    }
  }

  // Marcar como abierto si estaba enviado
  if (assignment.estado === "enviado") {
    await markAssignmentAsOpened(assignment.id);
  }

  return {
    assignment_id: assignment.id,
    template_nombre: template.nombre,
    template_descripcion: template.descripcion,
    operativo_nombre: operativoNombre,
    operativo_fecha: operativoFecha,
    nombre_destinatario: assignment.nombre_destinatario,
    questions: template.questions
      .filter(q => q.activa)
      .map(q => ({
        id: q.id,
        texto: q.texto,
        tipo: q.tipo,
        rating_labels: q.rating_labels,
        opciones: q.opciones,
        requerida: q.requerida,
        orden: q.orden
      })),
    ya_completada: yaCompletada,
    expirada
  };
}

// =====================================================
// RESPUESTAS
// =====================================================

export async function submitSurveyResponses(submission: SurveySubmission): Promise<boolean> {
  const { assignment_id, responses } = submission;

  // Verificar que la asignación existe y no está completada
  const { data: assignmentData } = await supabaseService
    .from("survey_assignments")
    .select("id, estado")
    .eq("id", assignment_id)
    .single();

  const assignment = assignmentData as SupabaseAny as { id: string; estado: string } | null;

  if (!assignment || assignment.estado === "completado") {
    console.error("[surveysService] submitSurveyResponses: assignment not found or already completed");
    return false;
  }

  // Insertar respuestas
  const responsesToInsert: SurveyResponseInsert[] = responses.map(r => ({
    assignment_id,
    question_id: r.question_id,
    rating_value: r.rating_value || null,
    texto_value: r.texto_value || null,
    opcion_value: r.opcion_value || null
  }));

  const { error } = await supabaseService
    .from("survey_responses")
    // @ts-expect-error - tabla survey_responses será creada por migración SQL
    .upsert(responsesToInsert, {
      onConflict: "assignment_id,question_id"
    });

  if (error) {
    console.error("[surveysService] submitSurveyResponses error:", error);
    return false;
  }

  // Marcar como completada
  await markAssignmentAsCompleted(assignment_id);

  return true;
}

// =====================================================
// ESTADÍSTICAS
// =====================================================

export async function getTemplateStats(templateId: string): Promise<SurveyStats | null> {
  const template = await getTemplateWithQuestions(templateId);
  if (!template) return null;

  // Tipos para las consultas
  type AssignmentBasic = { id: string; estado: string };
  type ResponseBasic = { question_id: string; rating_value: number | null; texto_value: string | null; opcion_value: string | null };

  // Obtener asignaciones
  const { data: assignmentsData } = await supabaseService
    .from("survey_assignments")
    .select("id, estado")
    .eq("template_id", templateId);

  const assignments = (assignmentsData || []) as SupabaseAny as AssignmentBasic[];

  const totalEnviados = assignments.length;
  const totalCompletados = assignments.filter(a => a.estado === "completado").length;

  // Obtener todas las respuestas de esta encuesta
  const assignmentIds = assignments.map(a => a.id);
  const { data: responsesData } = await supabaseService
    .from("survey_responses")
    .select("question_id, rating_value, texto_value, opcion_value")
    .in("assignment_id", assignmentIds);

  const responses = (responsesData || []) as SupabaseAny as ResponseBasic[];

  // Calcular promedio general de ratings
  const ratingsGenerales = responses.filter(r => r.rating_value !== null).map(r => r.rating_value!);
  const promedioRating = ratingsGenerales.length > 0
    ? ratingsGenerales.reduce((a, b) => a + b, 0) / ratingsGenerales.length
    : null;

  // Estadísticas por pregunta
  const respuestasPorPregunta = template.questions.map(q => {
    const respuestasQ = responses.filter(r => r.question_id === q.id);

    if (q.tipo === "rating") {
      const ratings = respuestasQ.filter(r => r.rating_value !== null).map(r => r.rating_value!);
      return {
        question_id: q.id,
        question_texto: q.texto,
        question_tipo: q.tipo,
        promedio_rating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : undefined
      };
    } else if (q.tipo === "texto_libre") {
      return {
        question_id: q.id,
        question_texto: q.texto,
        question_tipo: q.tipo,
        respuestas_texto: respuestasQ.filter(r => r.texto_value).map(r => r.texto_value!)
      };
    } else if (q.tipo === "opcion_multiple") {
      const distribucion: Record<string, number> = {};
      respuestasQ.forEach(r => {
        if (r.opcion_value) {
          distribucion[r.opcion_value] = (distribucion[r.opcion_value] || 0) + 1;
        }
      });
      return {
        question_id: q.id,
        question_texto: q.texto,
        question_tipo: q.tipo,
        distribucion_opciones: distribucion
      };
    }

    return {
      question_id: q.id,
      question_texto: q.texto,
      question_tipo: q.tipo
    };
  });

  return {
    template_id: templateId,
    template_nombre: template.nombre,
    total_enviados: totalEnviados,
    total_completados: totalCompletados,
    tasa_respuesta: totalEnviados > 0 ? (totalCompletados / totalEnviados) * 100 : 0,
    promedio_rating: promedioRating,
    respuestas_por_pregunta: respuestasPorPregunta
  };
}

// =====================================================
// PROGRAMACIÓN DE ENCUESTAS
// =====================================================

interface ScheduleSurveysResult {
  created: number;
  errors: string[];
}

export async function scheduleVoluntariosSurveys(
  operativoId: string,
  fechaFin: string
): Promise<ScheduleSurveysResult> {
  const result: ScheduleSurveysResult = { created: 0, errors: [] };

  // Tipos para las consultas
  type TemplateBasic = { id: string; delay_days: number };
  type InscripcionWithVoluntario = { 
    voluntario_id: string; 
    voluntario: { id: string; nombre: string; apellido: string; email: string | null } | null 
  };

  // Obtener templates activos para voluntarios
  const { data: templatesData } = await supabaseService
    .from("survey_templates")
    .select("*")
    .eq("tipo", "VOLUNTARIOS_OPERATIVO")
    .eq("activo", true);

  const templates = (templatesData || []) as SupabaseAny as TemplateBasic[];

  if (!templates.length) {
    return result;
  }

  // Obtener voluntarios confirmados
  const { data: inscripcionesData } = await supabaseService
    .from("inscripciones")
    .select(`
      voluntario_id,
      voluntario:voluntarios(id, nombre, apellido, email)
    `)
    .eq("operativo_id", operativoId)
    .eq("estado", "confirmado");

  const inscripciones = (inscripcionesData || []) as SupabaseAny as InscripcionWithVoluntario[];

  if (!inscripciones.length) {
    return result;
  }

  const fechaFinDate = new Date(fechaFin);

  for (const template of templates) {
    for (const inscripcion of inscripciones) {
      const voluntario = inscripcion.voluntario;
      if (!voluntario?.email) continue;

      const { token, tokenHash } = generateToken();
      const fechaProgramada = new Date(fechaFinDate);
      fechaProgramada.setDate(fechaProgramada.getDate() + template.delay_days);

      const expiresAt = new Date(fechaProgramada);
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabaseService
        .from("survey_assignments")
        // @ts-expect-error - tabla survey_assignments será creada por migración SQL
        .insert({
          template_id: template.id,
          operativo_id: operativoId,
          voluntario_id: voluntario.id,
          email_destinatario: voluntario.email,
          nombre_destinatario: `${voluntario.nombre} ${voluntario.apellido}`,
          token,
          token_hash: tokenHash,
          fecha_programada: fechaProgramada.toISOString().split("T")[0],
          expires_at: expiresAt.toISOString(),
          estado: "pendiente"
        });

      if (error) {
        result.errors.push(`Error creando asignación para ${voluntario.email}: ${error.message}`);
      } else {
        result.created++;
      }
    }
  }

  return result;
}

export async function schedulePacientesSurveys(
  operativoQuirurgicoId: string,
  fechaFin: string
): Promise<ScheduleSurveysResult> {
  const result: ScheduleSurveysResult = { created: 0, errors: [] };

  // Tipos para las consultas
  type TemplateBasic = { id: string; delay_days: number };
  type CasoWithPaciente = { 
    id: string; 
    paciente: { id: string; nombres: string; apellidos: string; email: string | null } | null 
  };

  // Obtener templates activos para pacientes quirúrgicos
  const { data: templatesData } = await supabaseService
    .from("survey_templates")
    .select("*")
    .eq("tipo", "PACIENTES_QUIRURGICO")
    .eq("activo", true);

  const templates = (templatesData || []) as SupabaseAny as TemplateBasic[];

  if (!templates.length) {
    return result;
  }

  // Obtener casos (pacientes) del operativo
  const { data: casosData } = await supabaseService
    .from("casos_quirurgicos")
    .select(`
      id,
      paciente:pacientes(id, nombres, apellidos, email)
    `)
    .eq("operativo_quirurgico_id", operativoQuirurgicoId)
    .in("estado", ["operado", "alta"]);

  const casos = (casosData || []) as SupabaseAny as CasoWithPaciente[];

  if (!casos.length) {
    return result;
  }

  const fechaFinDate = new Date(fechaFin);

  for (const template of templates) {
    for (const caso of casos) {
      const paciente = caso.paciente;
      if (!paciente?.email) continue;

      const { token, tokenHash } = generateToken();
      const fechaProgramada = new Date(fechaFinDate);
      fechaProgramada.setDate(fechaProgramada.getDate() + template.delay_days);

      const expiresAt = new Date(fechaProgramada);
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabaseService
        .from("survey_assignments")
        // @ts-expect-error - tabla survey_assignments será creada por migración SQL
        .insert({
          template_id: template.id,
          operativo_quirurgico_id: operativoQuirurgicoId,
          caso_id: caso.id,
          email_destinatario: paciente.email,
          nombre_destinatario: `${paciente.nombres} ${paciente.apellidos}`,
          token,
          token_hash: tokenHash,
          fecha_programada: fechaProgramada.toISOString().split("T")[0],
          expires_at: expiresAt.toISOString(),
          estado: "pendiente"
        });

      if (error) {
        result.errors.push(`Error creando asignación para ${paciente.email}: ${error.message}`);
      } else {
        result.created++;
      }
    }
  }

  return result;
}
