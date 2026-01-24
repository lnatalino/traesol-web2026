// src/app/admin/encuestas/[id]/page.tsx
// Página de detalle y edición de encuesta

import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseService } from "@/lib/supabaseService";
import { ArrowLeft, Users, Heart, BarChart3 } from "lucide-react";
import EncuestaEditor from "./_components/EncuestaEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EncuestaDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Tipo para el template con preguntas
  interface SurveyTemplateWithQuestions {
    id: string;
    nombre: string;
    descripcion: string | null;
    tipo: string;
    delay_days: number;
    activo: boolean;
    created_at: string;
    updated_at: string;
    questions: Array<{
      id: string;
      template_id: string;
      texto: string;
      tipo: string;
      rating_labels: Record<string, string> | null;
      opciones: string[] | null;
      requerida: boolean;
      orden: number;
      activa: boolean;
      created_at: string;
    }>;
  }

  // Obtener template con preguntas
  const { data, error } = await supabaseService
    .from("survey_templates")
    .select(`
      *,
      questions:survey_questions(*)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const template = data as unknown as SurveyTemplateWithQuestions;

  // Ordenar preguntas
  const questions = (template.questions || []).sort((a, b) => a.orden - b.orden);

  // Obtener estadísticas
  const { count: totalEnviados } = await supabaseService
    .from("survey_assignments")
    .select("*", { count: "exact", head: true })
    .eq("template_id", id);

  const { count: completados } = await supabaseService
    .from("survey_assignments")
    .select("*", { count: "exact", head: true })
    .eq("template_id", id)
    .eq("estado", "completado");

  const tasaRespuesta = totalEnviados && totalEnviados > 0 
    ? Math.round(((completados || 0) / totalEnviados) * 100) 
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/encuestas"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Encuestas
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              template.tipo === "VOLUNTARIOS_OPERATIVO" 
                ? "bg-green-100 text-green-600" 
                : "bg-pink-100 text-pink-600"
            }`}>
              {template.tipo === "VOLUNTARIOS_OPERATIVO" 
                ? <Users className="w-7 h-7" />
                : <Heart className="w-7 h-7" />
              }
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{template.nombre}</h1>
              <p className="text-gray-600">
                {template.tipo === "VOLUNTARIOS_OPERATIVO" ? "Voluntarios" : "Pacientes Quirúrgicos"}
                {" · "}
                Envío {template.delay_days} día{template.delay_days > 1 ? "s" : ""} después
              </p>
            </div>
          </div>
          
          <span className={`px-3 py-1 text-sm rounded-full font-medium ${
            template.activo 
              ? "bg-green-100 text-green-700" 
              : "bg-gray-100 text-gray-600"
          }`}>
            {template.activo ? "Activa" : "Inactiva"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Preguntas</p>
          <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Enviadas</p>
          <p className="text-2xl font-bold text-gray-900">{totalEnviados || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Tasa de Respuesta</p>
          <p className="text-2xl font-bold text-gray-900">{tasaRespuesta}%</p>
        </div>
      </div>

      {/* Editor de encuesta (client component) */}
      <EncuestaEditor
        templateId={id}
        initialTemplate={{
          nombre: template.nombre,
          descripcion: template.descripcion || "",
          tipo: template.tipo as "VOLUNTARIOS_OPERATIVO" | "PACIENTES_QUIRURGICO",
          delay_days: template.delay_days,
          activo: template.activo
        }}
        initialQuestions={questions.map(q => ({
          id: q.id,
          texto: q.texto,
          tipo: q.tipo as "rating" | "texto_libre" | "opcion_multiple",
          rating_labels: q.rating_labels as Record<string, string> | null,
          opciones: q.opciones,
          requerida: q.requerida,
          orden: q.orden,
          activa: q.activa
        }))}
      />

      {/* Link a estadísticas */}
      {(totalEnviados || 0) > 0 && (
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Ver Resultados Detallados</h3>
              <p className="text-sm text-gray-600">
                Analiza las respuestas y estadísticas de esta encuesta
              </p>
            </div>
            <Link
              href={`/admin/encuestas/${id}/resultados`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ver Resultados
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
