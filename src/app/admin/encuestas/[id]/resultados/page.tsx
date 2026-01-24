// src/app/admin/encuestas/[id]/resultados/page.tsx
// Página de resultados y estadísticas de una encuesta

import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseService } from "@/lib/supabaseService";
import { ArrowLeft, Star, TrendingUp, Users, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

// Tipos para las tablas de encuestas (mientras se ejecuta la migración)
interface SurveyTemplateWithQuestions {
  id: string;
  nombre: string;
  tipo: string;
  questions: Array<{
    id: string;
    texto: string;
    tipo: string;
    rating_labels: Record<string, string> | null;
  }>;
}

interface SurveyAssignment {
  id: string;
  estado: string;
}

interface SurveyResponse {
  question_id: string;
  rating_value: number | null;
  texto_value: string | null;
  opcion_value: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultadosEncuestaPage({ params }: PageProps) {
  const { id } = await params;

  // Obtener template con preguntas
  const { data: templateData } = await supabaseService
    .from("survey_templates")
    .select(`
      id, nombre, tipo,
      questions:survey_questions(id, texto, tipo, rating_labels)
    `)
    .eq("id", id)
    .single();

  if (!templateData) {
    notFound();
  }

  const template = templateData as unknown as SurveyTemplateWithQuestions;

  // Obtener asignaciones
  const { data: assignmentsData } = await supabaseService
    .from("survey_assignments")
    .select("id, estado")
    .eq("template_id", id);

  const assignments = (assignmentsData || []) as unknown as SurveyAssignment[];

  const totalEnviados = assignments.length;
  const completados = assignments.filter(a => a.estado === "completado").length;
  const tasaRespuesta = totalEnviados > 0 ? Math.round((completados / totalEnviados) * 100) : 0;

  // Obtener respuestas
  const assignmentIds = assignments.map(a => a.id);
  const { data: responsesData } = assignmentIds.length > 0 
    ? await supabaseService
        .from("survey_responses")
        .select("question_id, rating_value, texto_value, opcion_value")
        .in("assignment_id", assignmentIds)
    : { data: [] };

  const responses = (responsesData || []) as unknown as SurveyResponse[];

  // Ordenar preguntas
  const questions = template.questions || [];

  // Calcular stats por pregunta
  const questionStats = questions.map(q => {
    const qResponses = responses.filter(r => r.question_id === q.id);
    
    if (q.tipo === "rating") {
      const ratings = qResponses.filter(r => r.rating_value !== null).map(r => r.rating_value!);
      const promedio = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
      const distribucion = [1, 2, 3, 4, 5].map(v => ratings.filter(r => r === v).length);
      return { ...q, tipo: "rating" as const, promedio, distribucion, total: ratings.length };
    } else if (q.tipo === "texto_libre") {
      const textos = qResponses.filter(r => r.texto_value).map(r => r.texto_value!);
      return { ...q, tipo: "texto_libre" as const, textos, total: textos.length };
    } else {
      const opciones: Record<string, number> = {};
      qResponses.forEach(r => {
        if (r.opcion_value) {
          opciones[r.opcion_value] = (opciones[r.opcion_value] || 0) + 1;
        }
      });
      return { ...q, tipo: "opcion_multiple" as const, opciones, total: qResponses.length };
    }
  });

  // Promedio general de ratings
  const allRatings = responses.filter(r => r.rating_value !== null).map(r => r.rating_value!);
  const promedioGeneral = allRatings.length > 0 
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/encuestas/${id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Encuesta
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Resultados: {template.nombre}</h1>
      </div>

      {/* Stats generales */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm">Enviadas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalEnviados}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm">Completadas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completados}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Tasa Respuesta</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{tasaRespuesta}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Star className="w-5 h-5" />
            <span className="text-sm">Promedio General</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {promedioGeneral ? `${promedioGeneral}/5` : "-"}
          </p>
        </div>
      </div>

      {/* Resultados por pregunta */}
      <div className="space-y-6">
        {questionStats.map((q, index) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-medium text-gray-900">{q.texto}</h3>
                  <p className="text-sm text-gray-500">{q.total} respuestas</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {q.tipo === "rating" && q.promedio !== null && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-4xl font-bold text-gray-900">{q.promedio.toFixed(1)}</div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= Math.round(q.promedio!) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Distribución */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating, i) => {
                      const count = q.distribucion[rating - 1];
                      const pct = q.total > 0 ? (count / q.total) * 100 : 0;
                      const label = q.rating_labels?.[rating.toString()] || rating.toString();
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-gray-600">{label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-12 text-sm text-gray-500 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {q.tipo === "texto_libre" && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {q.textos.length === 0 ? (
                    <p className="text-gray-500 text-sm">Sin respuestas de texto</p>
                  ) : (
                    q.textos.map((texto, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-700 text-sm">&ldquo;{texto}&rdquo;</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {q.tipo === "opcion_multiple" && (
                <div className="space-y-2">
                  {Object.entries(q.opciones).sort((a, b) => b[1] - a[1]).map(([opcion, count]) => {
                    const pct = q.total > 0 ? (count / q.total) * 100 : 0;
                    return (
                      <div key={opcion} className="flex items-center gap-3">
                        <span className="flex-1 text-sm text-gray-700">{opcion}</span>
                        <div className="w-48 bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 text-sm text-gray-500 text-right">
                          {count} ({Math.round(pct)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {questionStats.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 border border-gray-200">
          No hay preguntas en esta encuesta
        </div>
      )}
    </div>
  );
}
