// src/app/api/paciente/upload/route.ts
// Endpoint para subir archivos desde el portal del paciente

import { NextRequest, NextResponse } from "next/server";
import { verifyPortalSessionOrToken } from "@/lib/quirurgico/portalSession";
import { supabaseService } from "@/lib/supabaseService";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const BUCKET_NAME = "pacientes-archivos";

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión del portal (cookie o token en header)
    const pacienteId = await verifyPortalSessionOrToken();

    if (!pacienteId) {
      return NextResponse.json(
        { error: "Sesión no válida" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requerimientoId = formData.get("requerimiento_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WebP) y PDF." },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo de 10MB" },
        { status: 400 }
      );
    }

    // Si hay requerimiento, verificar que pertenezca al paciente
    if (requerimientoId) {
      const { data: req } = await supabaseService
        .from("paciente_requerimientos")
        .select("id")
        .eq("id", requerimientoId)
        .eq("paciente_id", pacienteId)
        .single();

      if (!req) {
        return NextResponse.json(
          { error: "Requerimiento no encontrado" },
          { status: 404 }
        );
      }
    }

    // Generar nombre único para el archivo
    const fileId = randomUUID();
    const extension = file.name.split(".").pop() || "bin";
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .slice(0, 50);
    const storagePath = `${pacienteId}/${fileId}-${sanitizedName}`;

    // Subir a Supabase Storage
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseService.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[api/paciente/upload] storage error:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo" },
        { status: 500 }
      );
    }

    // Registrar en la base de datos - cast temporal para tablas no generadas
    const { data: archivo, error: dbError } = await supabaseService
      .from("paciente_archivos")
      .insert({
        paciente_id: pacienteId,
        requerimiento_id: requerimientoId || null,
        storage_path: storagePath,
        filename: file.name,
        mimetype: file.type,
        size_bytes: file.size,
        uploaded_by: "paciente",
      } as unknown as never)
      .select("id, filename, created_at")
      .single() as { data: { id: string; filename: string; created_at: string } | null; error: unknown };

    if (dbError) {
      console.error("[api/paciente/upload] db error:", dbError);
      // Intentar eliminar el archivo subido
      await supabaseService.storage.from(BUCKET_NAME).remove([storagePath]);
      return NextResponse.json(
        { error: "Error al registrar el archivo" },
        { status: 500 }
      );
    }

    // Si es para un requerimiento, actualizar estado a "recibido"
    if (requerimientoId) {
      await supabaseService
        .from("paciente_requerimientos")
        .update({ 
          estado: "recibido",
          updated_at: new Date().toISOString(),
        } as unknown as never)
        .eq("id", requerimientoId)
        .eq("paciente_id", pacienteId)
        .eq("estado", "pendiente"); // Solo si estaba pendiente
    }

    return NextResponse.json({
      success: true,
      archivo: archivo ? {
        id: archivo.id,
        filename: archivo.filename,
        created_at: archivo.created_at,
      } : null,
    });
  } catch (error) {
    console.error("[api/paciente/upload] error:", error);
    return NextResponse.json(
      { error: "Error al procesar la subida" },
      { status: 500 }
    );
  }
}

// NOTA: La configuración de bodyParser ya no es necesaria en App Router.
// Next.js 13+ maneja automáticamente el parsing del body.
