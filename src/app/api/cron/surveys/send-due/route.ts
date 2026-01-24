// src/app/api/cron/surveys/send-due/route.ts
// Endpoint para enviar encuestas programadas
// Diseñado para ser llamado por Vercel Cron, Supabase scheduler o GitHub Action

import { NextRequest, NextResponse } from "next/server";
import * as surveysService from "@/lib/surveys/surveysService";
import { sendSurveyEmail } from "@/lib/surveys/emails";
import { supabaseService } from "@/lib/supabaseService";

// Token secreto para autorizar el cron (configurable vía env)
const CRON_SECRET = process.env.CRON_SECRET || "cron-secret-traesol";

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización
    const authHeader = request.headers.get("authorization");
    const cronSecret = request.headers.get("x-cron-secret");
    
    const isAuthorized = 
      authHeader === `Bearer ${CRON_SECRET}` ||
      cronSecret === CRON_SECRET ||
      process.env.NODE_ENV === "development";

    if (!isAuthorized) {
      console.warn("[cron/surveys/send-due] Unauthorized request");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];
    console.log(`[cron/surveys/send-due] Ejecutando para fecha: ${today}`);

    // 1. Obtener asignaciones pendientes para hoy o antes
    const pendingAssignments = await surveysService.getPendingAssignments(today);
    console.log(`[cron/surveys/send-due] Encontradas ${pendingAssignments.length} asignaciones pendientes`);

    if (pendingAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay encuestas pendientes para enviar",
        sent: 0,
        errors: 0
      });
    }

    let sent = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    // 2. Procesar cada asignación
    for (const assignment of pendingAssignments) {
      try {
        // Obtener datos del operativo para el email
        let operativoNombre = "";
        let operativoFecha: string | null = null;
        let tipoEncuesta: "VOLUNTARIOS_OPERATIVO" | "PACIENTES_QUIRURGICO" = "VOLUNTARIOS_OPERATIVO";

        if (assignment.operativo_id) {
          const { data } = await supabaseService
            .from("operativos")
            .select("titulo, fecha_inicio")
            .eq("id", assignment.operativo_id)
            .single();
          const operativoData = data as { titulo: string; fecha_inicio: string } | null;
          if (operativoData) {
            operativoNombre = operativoData.titulo;
            operativoFecha = operativoData.fecha_inicio;
          }
        } else if (assignment.operativo_quirurgico_id) {
          tipoEncuesta = "PACIENTES_QUIRURGICO";
          const { data } = await supabaseService
            .from("operativos_quirurgicos")
            .select("titulo, fecha_inicio")
            .eq("id", assignment.operativo_quirurgico_id)
            .single();
          const quirurgicoData = data as { titulo: string; fecha_inicio: string } | null;
          if (quirurgicoData) {
            operativoNombre = quirurgicoData.titulo;
            operativoFecha = quirurgicoData.fecha_inicio;
          }
        }

        // Enviar email
        const emailResult = await sendSurveyEmail({
          to: assignment.email_destinatario,
          nombreDestinatario: assignment.nombre_destinatario,
          operativoNombre: operativoNombre || "Operativo Traesol",
          operativoFecha,
          surveyToken: assignment.token,
          tipoEncuesta
        });

        if (emailResult.success) {
          // Marcar como enviado
          await surveysService.markAssignmentAsSent(assignment.id);
          sent++;
          console.log(`[cron/surveys/send-due] Email enviado a ${assignment.email_destinatario}`);
        } else {
          errors++;
          errorDetails.push(`${assignment.email_destinatario}: ${emailResult.error}`);
          console.error(`[cron/surveys/send-due] Error enviando a ${assignment.email_destinatario}: ${emailResult.error}`);
        }
      } catch (err) {
        errors++;
        errorDetails.push(`${assignment.email_destinatario}: ${String(err)}`);
        console.error(`[cron/surveys/send-due] Error procesando asignación:`, err);
      }
    }

    console.log(`[cron/surveys/send-due] Completado: ${sent} enviados, ${errors} errores`);

    return NextResponse.json({
      success: true,
      message: `Procesadas ${pendingAssignments.length} asignaciones`,
      sent,
      errors,
      errorDetails: errors > 0 ? errorDetails : undefined
    });
  } catch (error) {
    console.error("[cron/surveys/send-due] Error general:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Error interno del servidor",
        details: String(error)
      },
      { status: 500 }
    );
  }
}

// También permitir GET para pruebas manuales en desarrollo
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "GET solo disponible en desarrollo. Usar POST en producción." },
      { status: 405 }
    );
  }
  return POST(request);
}
