// src/app/admin/encuestas/page.tsx
// Página principal de administración de encuestas

import { Suspense } from "react";
import Link from "next/link";
import { supabaseService } from "@/lib/supabaseService";
import { Plus, FileText, Users, Heart, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

// Tipos para las tablas de encuestas (mientras se ejecuta la migración)
interface SurveyTemplateRow {
  id: string;
  nombre: string;
  tipo: string;
  delay_days: number;
  activo: boolean;
  created_at: string;
  survey_questions: Array<{ count: number }>;
  survey_assignments: Array<{ count: number }>;
}

export default async function EncuestasPage() {
  // Obtener templates con counts
  const { data: templatesData } = await supabaseService
    .from("survey_templates")
    .select(`
      id, nombre, tipo, delay_days, activo, created_at,
      survey_questions(count),
      survey_assignments(count)
    `)
    .order("created_at", { ascending: false });

  const templates = (templatesData || []) as unknown as SurveyTemplateRow[];

  // Obtener conteo de completados por template
  const templatesWithStats = await Promise.all(
    templates.map(async (t) => {
      const { count: completados } = await supabaseService
        .from("survey_assignments")
        .select("*", { count: "exact", head: true })
        .eq("template_id", t.id)
        .eq("estado", "completado");

      const questionsCount = t.survey_questions?.[0]?.count || 0;
      const assignmentsCount = t.survey_assignments?.[0]?.count || 0;

      return {
        ...t,
        questions_count: questionsCount,
        assignments_count: assignmentsCount,
        completados_count: completados || 0,
        tasa_respuesta: assignmentsCount > 0 
          ? Math.round((completados || 0) / assignmentsCount * 100) 
          : 0
      };
    })
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encuestas de Satisfacción</h1>
          <p className="text-gray-600 mt-1">
            Gestiona encuestas para voluntarios y pacientes
          </p>
        </div>
        <Link
          href="/admin/encuestas/nueva"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Encuesta
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<FileText className="w-6 h-6" />}
          label="Total Encuestas"
          value={templatesWithStats.length}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Para Voluntarios"
          value={templatesWithStats.filter(t => t.tipo === "VOLUNTARIOS_OPERATIVO").length}
          color="green"
        />
        <StatCard
          icon={<Heart className="w-6 h-6" />}
          label="Para Pacientes"
          value={templatesWithStats.filter(t => t.tipo === "PACIENTES_QUIRURGICO").length}
          color="pink"
        />
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="Respuestas Totales"
          value={templatesWithStats.reduce((sum, t) => sum + t.completados_count, 0)}
          color="purple"
        />
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Templates de Encuestas</h2>
        </div>

        {templatesWithStats.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay encuestas creadas</p>
            <Link
              href="/admin/encuestas/nueva"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Crear primera encuesta
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {templatesWithStats.map((template) => (
              <Link
                key={template.id}
                href={`/admin/encuestas/${template.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    template.tipo === "VOLUNTARIOS_OPERATIVO" 
                      ? "bg-green-100 text-green-600" 
                      : "bg-pink-100 text-pink-600"
                  }`}>
                    {template.tipo === "VOLUNTARIOS_OPERATIVO" 
                      ? <Users className="w-5 h-5" />
                      : <Heart className="w-5 h-5" />
                    }
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{template.nombre}</h3>
                    <p className="text-sm text-gray-500">
                      {template.tipo === "VOLUNTARIOS_OPERATIVO" ? "Voluntarios" : "Pacientes"} 
                      {" · "}
                      {template.delay_days} día{template.delay_days > 1 ? "s" : ""} después
                      {" · "}
                      {template.questions_count} pregunta{template.questions_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {template.completados_count}/{template.assignments_count}
                    </p>
                    <p className="text-xs text-gray-500">
                      {template.tasa_respuesta}% respuesta
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    template.activo 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {template.activo ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Assignments */}
      <Suspense fallback={<div className="mt-8 text-gray-500">Cargando envíos recientes...</div>}>
        <RecentAssignments />
      </Suspense>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: "blue" | "green" | "pink" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    pink: "bg-pink-50 text-pink-600",
    purple: "bg-purple-50 text-purple-600"
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

// Tipo para las asignaciones recientes
interface RecentAssignment {
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
}

async function RecentAssignments() {
  const { data: assignmentsData } = await supabaseService
    .from("survey_assignments")
    .select(`
      id, nombre_destinatario, email_destinatario, estado, 
      fecha_programada, fecha_enviado, fecha_completado,
      template:survey_templates(nombre),
      operativo:operativos(titulo),
      operativo_quirurgico:operativos_quirurgicos(titulo)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  const assignments = (assignmentsData || []) as unknown as RecentAssignment[];

  if (!assignments.length) return null;

  const estadoColors: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-700",
    enviado: "bg-blue-100 text-blue-700",
    abierto: "bg-purple-100 text-purple-700",
    completado: "bg-green-100 text-green-700",
    expirado: "bg-gray-100 text-gray-600"
  };

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Envíos Recientes</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Encuesta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operativo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{a.nombre_destinatario}</p>
                  <p className="text-xs text-gray-500">{a.email_destinatario}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {(a.template as { nombre: string } | null)?.nombre || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {(a.operativo as { titulo: string } | null)?.titulo || 
                   (a.operativo_quirurgico as { titulo: string } | null)?.titulo || "-"}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${estadoColors[a.estado] || "bg-gray-100"}`}>
                    {a.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {a.fecha_completado 
                    ? new Date(a.fecha_completado).toLocaleDateString("es-CL")
                    : a.fecha_enviado 
                      ? new Date(a.fecha_enviado).toLocaleDateString("es-CL")
                      : new Date(a.fecha_programada).toLocaleDateString("es-CL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
